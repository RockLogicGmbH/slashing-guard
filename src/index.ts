import schedule from "node-schedule";
import bot from "./config/bot";
import logger from "./config/logger";
import { startLoop } from "./functions/start";
import { GrammyError } from "grammy";
import VALIDATE from "./functions/validate";
import { core } from "./shared/constants";

logger.info(`Starting Slashing Guard (with log level: ${logger.level})`);

bot.start({
  onStart: async (info) => {
    logger.info(`Starting Telegram bot @${info.username}`);
    try {
      await bot.api.setMyCommands([
        {
          command: "start",
          description: `Start bot ${info.username}`,
        },
        { command: "status", description: `Show service status` },
        { command: "operator", description: `Show operator status` },
        {
          command: "stop",
          description: `Stop bot ${info.username}`,
        },
      ]);
      await startLoop(true);
      schedule.scheduleJob(`*/${VALIDATE.interval(core.MONITORING_INTERVAL)} * * * * *`, async () => {
        await startLoop();
      });
    } catch (error: unknown) {
      if (error instanceof GrammyError) {
        const errnum = error.error_code;
        const errmsg = error.description;
        const errmth = error.method;
        const errprm = error.parameters;
        const bansec = errprm.retry_after;
        if (errnum == 429) {
          logger.debug(
            `App blocked by Telegram API for spamming too many requests - ${bansec} seconds left ([${errnum}]: ${errmsg})`
          );
        } else {
          logger.debug(`Grammy Error [${errnum}]: ${errmsg} (Method: ${errmth}] | Parameters: ${errprm}])`);
        }
      } else {
        logger.error(error);
      }
    }
  },
});
