import { markdownv2 as format } from "telegram-format";
import db from "../config/db";
import eth from "../config/eth";
import kapi from "../config/kapi";
import logger from "../config/logger";
import SlashedValidator from "../data/SlashedValidator";
import { notifyToAll } from "../services/notify";

const slashedValidatorsDB = new SlashedValidator(db);

export const startLoop = async () => {
  try {
    const kapiOperators = await kapi.getOperators();
    const rockLogicOperatorIndex = kapiOperators.find(
      (op) => op.name === "RockLogic"
    )?.index;

    if (!rockLogicOperatorIndex) return;

    const rockLogicKeys = await kapi.findOperatorKeys(rockLogicOperatorIndex);

    const currentSlashedValidators = await eth.getStateValidators({
      stateId: "head",
      validatorIds: rockLogicKeys.map((ky) => ky.key),
      status: ["active_slashed", "exited_slashed"],
    });

    const pastSlashedValidatorPubKeys = await slashedValidatorsDB.find();

    let pastSlashedValidators;
    if (pastSlashedValidatorPubKeys.length) {
      const pastSlashedValidatorsRes = await eth.getStateValidators({
        stateId: "head",
        validatorIds: pastSlashedValidatorPubKeys.map((ky) => ky),
        status: [],
      });

      pastSlashedValidators = pastSlashedValidatorsRes.data;
    }

    if (pastSlashedValidators) {
      for (const pastValidator of pastSlashedValidators) {
        if (pastValidator.validator.slashed === false) {
          await slashedValidatorsDB.delete(pastValidator.validator.pubkey);
        }
      }
    }

    const updatedPastSlashedPubKeys = await slashedValidatorsDB.find();
    const slashedValidatorsPubKeys = currentSlashedValidators.data
      .map((val) => val.validator.pubkey)
      .filter((key) => !updatedPastSlashedPubKeys.includes(key));

    if (slashedValidatorsPubKeys.length === 0) {
      logger.info(`All good, can't find any slashed validator.`);
      return;
    }

    for (const pubKey of slashedValidatorsPubKeys) {
      await slashedValidatorsDB.add(pubKey);
    }

    const message = `${format.bold(
      "🚨 Slashing alert: "
    )} \nList of public keys:\n${slashedValidatorsPubKeys
      .map((key) => `${format.underline(key)}`)
      .join("\n")}`;

    await notifyToAll(message);
  } catch (error) {
    logger.error(error);
  }
};
