import schedule from "node-schedule";
import bot from "./config/bot";
import logger from "./config/logger";
import { startLoop } from "./functions/start";

logger.info(`Starting Slashing Guard (with log level: ${logger.level})`);

bot.start({
  onStart: async (info) => {
    logger.info(`Starting Telegram bot @${info.username}`);
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
  },
});
