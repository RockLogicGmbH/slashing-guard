import appConfig from "../config";
import logger from "../config/logger";
import ETH from "../services/eth";
import KApi from "../services/kapi";
import { notifyToAll } from "../services/notify";
import { markdownv2 as format } from "telegram-format";

const kapi = new KApi(appConfig.kapiUrl);
const eth = new ETH(appConfig.ethUrl);

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
