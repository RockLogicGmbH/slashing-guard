import schedule from "node-schedule";
import bot from "./config/bot";
import logger from "./config/logger";
import { startLoop } from "./functions/start";

schedule.scheduleJob("*/12 * * * * *", async () => {
  await startLoop();
});

bot.start({
  onStart: async (info) => {
    logger.info(`@${info.username} telegram bot is up and running...`);
    await bot.api.setMyCommands([
      { command: "start", description: "Start the bot" },
      { command: "status", description: "Show service status" },
    ]);
  },
});
