import { markdownv2 as format } from "telegram-format";
import eth from "../config/eth";
import kapi from "../config/kapi";
import logger from "../config/logger";
import { notifyToAll } from "../services/notify";

export const startLoop = async () => {
  try {
    const kapiOperators = await kapi.getOperators();
    const rockLogicOperatorIndex = kapiOperators.find(
      (op) => op.name === "RockLogic"
    )?.index;

    if (!rockLogicOperatorIndex) return;

    const rockLogicKeys = await kapi.findOperatorKeys(rockLogicOperatorIndex);

    const slashed_validators = await eth.getStateValidators({
      stateId: "head",
      validatorIds: rockLogicKeys.map((ky) => ky.key),
      status: ["active_slashed", "exited_slashed"],
    });

    if (slashed_validators.data.length === 0) {
      logger.info(`All good, can't find any slashed validator.`);
      return;
    }

    const message = `${format.bold(
      "🚨 Slashing alert: "
    )} \nList of public keys:\n${slashed_validators.data
      .map((ky) => `${format.underline(ky.validator.pubkey)}`)
      .join("\n")}`;

    await notifyToAll(message);
  } catch (error) {
    logger.error(error);
  }
};
