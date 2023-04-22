import { Bot } from "grammy";
import appConfig from "./config";
import db from "./config/db";
import User from "./data/User";
import { messages } from "./shared/constants";

const bot = new Bot(appConfig.telegram_bot_token);
const users = new User(db);

bot.command("start", async (ctx) => {
  console.log(ctx.from);

  if (ctx.from?.id) {
    await users.add(ctx.from.id);
  }

  await ctx.reply(messages.WELCOME_MESSAGE);
});

bot.catch((error) => {
  console.log(error);
});

export default bot;
