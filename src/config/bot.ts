import { Bot } from "grammy";
import appConfig from ".";
import User from "../data/User";
import { messages } from "../shared/constants";
import db from "./db";
import logger from "./logger";

const bot = new Bot(appConfig.telegramBotToken);
const users = new User(db);

bot.command("start", async (ctx) => {
  if (ctx.from?.id) await users.add(ctx.from.id);

  await ctx.reply(messages.WELCOME_MESSAGE);
});

bot.catch((error) => logger.error(error));

export default bot;
