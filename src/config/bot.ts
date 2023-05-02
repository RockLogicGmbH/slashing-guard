import { Bot } from "grammy";
import { markdownv2 as format } from "telegram-format";
import appConfig from ".";
import Group from "../data/Group";
import User from "../data/User";
import { messages } from "../shared/constants";
import db from "./db";
import kapi from "./kapi";
import logger from "./logger";
import FailedMessage from "../data/FailedMessage";
import eth from "./eth";

const bot = new Bot(appConfig.telegramBotToken);
const users = new User(db);
const groups = new Group(db);
const operatorName = appConfig.operatorName;
const validatorChains = appConfig.validatorChains;
const FailedMessagesDB = new FailedMessage(db);
const fakeKeys = appConfig.fakeKeys;

bot.command("start", async (ctx) => {
  logger.debug(`Bot command /start incoming`);
  if (!ctx.message) return;

  switch (ctx.message.chat.type) {
    case "group":
      const chatId = ctx.message.chat.id;
      await groups.add(chatId);
      logger.info(`Group ${chatId} subscribed to the bot`);
      break;
    case "private":
      const userId = ctx.message.from.id;
      await users.add(userId);
      logger.info(`User ${userId} subscribed to the bot`);
      break;
    default:
      break;
  }

  await ctx.reply(messages.WELCOME_MESSAGE);
});

bot.command("status", async (ctx) => {
  logger.debug(`Bot command /status incoming`);
  await ctx.replyWithChatAction("typing");

  const kapiStatus = await kapi.getStatus();
  const kapiOperators = await kapi.getOperators();
  const operator = kapiOperators.find((op) => op.name === operatorName);
  const operatorIndex = operator?.index;
  if (!operatorIndex) {
    await ctx.reply(
      `Unknown operator ${format.bold(format.escape(operatorName))}`,
      {
        parse_mode: "MarkdownV2",
      }
    );
    return;
  }
  const operatorKeys = await kapi.findOperatorKeys(operatorIndex);
  const validatorChain = validatorChains.find(
    (e) => e.key == kapiStatus.chainId
  );
  let chainName = validatorChain?.dsc;
  if (chainName == undefined) {
    chainName = "unknown";
  }
  const numUsers = (await users.find()).length;
  const numGroups = (await groups.find()).length;
  const fails = await FailedMessagesDB.find();
  const numFailsOpen = Object.values(fails).reduce(
    (acc, arr) => acc + arr.length,
    0
  );
  const currentSlashedValidators = await eth.getStateValidators({
    stateId: "head",
    validatorIds: operatorKeys.map((ky) => ky.key),
    status: fakeKeys ? [] : ["active_slashed", "exited_slashed"],
  });
  if (fakeKeys) {
    currentSlashedValidators["data"] = currentSlashedValidators.data.filter(
      (item) => fakeKeys.includes(item.validator.pubkey)
    );
  }
  const numSlashedValidators = currentSlashedValidators.data.length;

  const message = [
    //`${format.bold("Date")}: ${format.italic(new Date().toLocaleString())}`,
    `${format.bold("Bot")}: ${format.escape(ctx.me.username)}`,
    `${format.bold("Operator")}: ${format.escape(operatorName)}`,
    `${format.bold("Index")}: ${operatorIndex}`,
    `${format.bold("Chain")}: ${format.escape(chainName)}`,
    `${format.bold("Slashed Validators")}: ${numSlashedValidators}`,
    `${format.bold("Subscribed Users")}: ${numUsers}`,
    `${format.bold("Subscribed Groups")}: ${numGroups}`,
    `${format.bold("Failed Messages")}: ${numFailsOpen}`,
    `${format.escape("**********")}`,
    `${format.bold("Epoch")}: ${kapiStatus.clBlockSnapshot.epoch}`,
    `${format.bold("Root")}: ${kapiStatus.clBlockSnapshot.root}`,
    `${format.bold("Slot")}: ${kapiStatus.clBlockSnapshot.slot}`,
    `${format.bold("Block Number")}: ${kapiStatus.clBlockSnapshot.blockNumber}`,
    `${format.bold("Block Hash")}: ${kapiStatus.clBlockSnapshot.blockHash}`,
  ].join("\n");

  await ctx.reply(message, { parse_mode: "MarkdownV2" });
});

bot.command("operator", async (ctx) => {
  logger.debug(`Bot command /operator incoming`);
  await ctx.replyWithChatAction("typing");
  const kapiStatus = await kapi.getStatus();
  const kapiOperators = await kapi.getOperators();
  const operator = kapiOperators.find((op) => op.name === operatorName);
  const operatorIndex = operator?.index;
  if (!operatorIndex) {
    await ctx.reply(
      `Unknown operator ${format.bold(format.escape(operatorName))}`,
      {
        parse_mode: "MarkdownV2",
      }
    );
    return;
  }
  const validatorChain = validatorChains.find(
    (e) => e.key == kapiStatus.chainId
  );
  let chainName = validatorChain?.dsc;
  if (chainName == undefined) {
    chainName = "unknown";
  }

  const message = [
    `${format.bold("Operator")}: ${format.escape(operator.name)}`,
    `${format.bold("Index")}: ${operator.index}`,
    `${format.bold("Active")}: ${operator.active}`,
    `${format.bold("Reward Address")}: ${operator.rewardAddress}`,
    `${format.bold("Staking Limit")}: ${operator.stakingLimit}`,
    `${format.bold("Stopped Validators")}: ${operator.stoppedValidators}`,
    `${format.bold("Total SigningKeys")}: ${operator.totalSigningKeys}`,
    `${format.bold("Used SigningKeys")}: ${operator.usedSigningKeys}`,
    `${format.bold("Chain")}: ${format.escape(chainName)}`,
  ].join("\n");

  await ctx.reply(message, { parse_mode: "MarkdownV2" });
});

bot.command("stop", async (ctx) => {
  logger.debug(`Bot command /stop incoming`);
  if (!ctx.message) return;

  switch (ctx.message.chat.type) {
    case "group":
      const chatId = ctx.message.chat.id;
      await groups.delete(chatId);
      logger.info(`Group ${chatId} unsubscribed from the bot`);
      break;
    case "private":
      const userId = ctx.message.from.id;
      await users.delete(userId);
      logger.info(`User ${userId} unsubscribed from the bot`);
      break;
    default:
      break;
  }

  await ctx.reply(messages.QUIT_MESSAGE);
});

bot.catch((error) => logger.error(error));

export default bot;
