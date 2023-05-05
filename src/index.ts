import schedule from "node-schedule";
import bot from "./config/bot";
import logger from "./config/logger";
import { startLoop } from "./functions/start";
import { GrammyError } from "grammy";

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
      schedule.scheduleJob("*/12 * * * * *", async () => {
        await startLoop();
      });
    } catch (error: unknown) {
      if (error instanceof GrammyError) {
        const errnum = error.error_code;
        const errmsg = error.description;
        const errmth = error.method;
        const errmprm = error.parameters;
        const bansec = errmprm.retry_after;
        if (errnum == 429) {
          logger.debug(
            `App blocked by Telegram API for spamming too many requests - ${bansec} seconds left ([${errnum}]: ${errmsg})`
          );
        } else {
          logger.debug(`Grammy Error [${errnum}]: ${errmsg} (Method: ${errmth}] | Parameters: ${errmprm}])`);
        }
      } else {
        logger.error(error);
      }
    }
  },
});
