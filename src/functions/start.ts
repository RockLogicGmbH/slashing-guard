import appConfig from "../config";
import db from "../config/db";
import eth from "../config/eth";
import kapi from "../config/kapi";
import logger from "../config/logger";
import SlashedValidator from "../data/SlashedValidator";
import { notifyToAll } from "../services/notify";
import { notifyToFailed } from "../services/notify";

const operatorName = appConfig.operatorName;
const fakeKeys = appConfig.fakeKeys;
const validatorChains = appConfig.validatorChains;
const slashedValidatorsDB = new SlashedValidator(db);

export const startLoop = async (init = false) => {
  try {
    if (!operatorName) {
      logger.error(`No operator name given`);
      await new Promise((resolve) => setTimeout(resolve, 15000));
      return;
    }
    if (init) {
      logger.info(`System ready, listening for state changes of ${operatorName} validators...`);
    }
    const kapiStatus = await kapi.getStatus();
    const kapiOperators = await kapi.getOperators();
    const operatorIndex = kapiOperators.find((op) => op.name === operatorName)?.index;

    if (!operatorIndex) {
      logger.error(`Operator ${operatorName} unknown`);
      await new Promise((resolve) => setTimeout(resolve, 15000));
      return;
    }

    const validatorChain = validatorChains.find((e) => e.key == kapiStatus.chainId);
    const validatorUrl =
      validatorChain && validatorChain.hasOwnProperty("url") ? validatorChain.url : "https://beaconcha.in/validator/";

    const operatorKeys = await kapi.findOperatorKeys(operatorIndex);

    const currentSlashedValidators = await eth.getStateValidators({
      stateId: "head",
      validatorIds: operatorKeys.map((ky) => ky.key),
      status: fakeKeys ? [] : ["active_slashed", "exited_slashed"],
    });

    if (fakeKeys) {
      logger.trace("Fake keys specified:");
      for (const fakeKey of fakeKeys) {
        logger.trace(`- ${fakeKey}`);
      }
      currentSlashedValidators["data"] = currentSlashedValidators.data.filter((item) =>
        fakeKeys.includes(item.validator.pubkey)
      );
      for (const slashed of currentSlashedValidators.data) {
        logger.debug(`Fake validator as slashed: ${slashed.validator.pubkey}`);
      }
    }

    const pastSlashedValidatorPubKeys = await slashedValidatorsDB.find();

    let pastSlashedValidators;
    if (pastSlashedValidatorPubKeys.length) {
      const pastSlashedValidatorsRes = await eth.getStateValidators({
        stateId: "head",
        validatorIds: pastSlashedValidatorPubKeys.map((ky) => ky),
        status: [],
      });

      pastSlashedValidators = pastSlashedValidatorsRes.data;

      if (fakeKeys) {
        pastSlashedValidators = pastSlashedValidators.map((item) => {
          if (fakeKeys.includes(item.validator.pubkey)) {
            logger.debug(`Keep past validator fake slashed: ${item.validator.pubkey}`);
            const newValidator = { ...item.validator, slashed: true };
            return { ...item, validator: newValidator };
          }
          return item;
        });
      }
    }

    if (pastSlashedValidators) {
      for (const pastValidator of pastSlashedValidators) {
        if (pastValidator.validator.slashed === false) {
          await slashedValidatorsDB.delete(pastValidator.validator.pubkey);
          logger.info(`Removed past slashed validator from reporting db: ${pastValidator.validator.pubkey}`);
        }
      }
    }

    const updatedPastSlashedPubKeys = await slashedValidatorsDB.find();
    const slashedValidatorsPubKeys = currentSlashedValidators.data
      .map((val) => val.validator.pubkey)
      .filter((key) => !updatedPastSlashedPubKeys.includes(key));

    if (slashedValidatorsPubKeys.length === 0) {
      if (updatedPastSlashedPubKeys.length) {
        logger.debug(
          `Found slashed validator${updatedPastSlashedPubKeys.length > 1 ? "s" : ""} - subscribers are already pinged`
        );
        for (const pastkey of updatedPastSlashedPubKeys) {
          logger.debug(`Slashed validator already reported: ${pastkey}`);
        }
        await notifyToFailed();
      } else {
        logger.debug(`All good, can't find any unreported slashed validator`);
      }
      return;
    }

    logger.warn(
      `Found slashed validator${slashedValidatorsPubKeys.length > 1 ? "s" : ""} - sending alert to subscribers`
    );

    for (const pubKey of slashedValidatorsPubKeys) {
      logger.info(`Added slashed validator to reporting db: ${pubKey}`);
      await slashedValidatorsDB.add(pubKey);
    }

    await notifyToAll(slashedValidatorsPubKeys, validatorUrl);
  } catch (error) {
    logger.error(error);
  }
};
