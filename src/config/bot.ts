import { Bot } from "grammy";
import { markdownv2 as format } from "telegram-format";
import appConfig from ".";
import User from "../data/User";
import { messages } from "../shared/constants";
import db from "./db";
import kapi from "./kapi";
import logger from "./logger";

const bot = new Bot(appConfig.telegramBotToken);
const users = new User(db);

bot.command("start", async (ctx) => {
  if (ctx.from?.id) await users.add(ctx.from.id);

  await ctx.reply(messages.WELCOME_MESSAGE);
});

bot.command("status", async (ctx) => {
  await ctx.replyWithChatAction("typing");

  const status = await kapi.getStatus();

  const message = `${
    format.bold("Status ") + format.italic(new Date().toLocaleString())
  }\n${format.bold("Epoch: ")} ${status.clBlockSnapshot.epoch}\n${format.bold(
    "Root: "
  )} ${status.clBlockSnapshot.root}\n${format.bold("Slot: ")} ${
    status.clBlockSnapshot.slot
  }\n${format.bold("Block Number: ")} ${
    status.clBlockSnapshot.blockNumber
  }\n${format.bold("Block Hash: ")} ${status.clBlockSnapshot.blockHash}\n`;

  await ctx.reply(message, { parse_mode: "MarkdownV2" });
});

bot.catch((error) => logger.error(error));

export default bot;
