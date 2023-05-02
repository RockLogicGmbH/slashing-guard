import bot from "../config/bot";
import db from "../config/db";
import logger from "../config/logger";
import Group from "../data/Group";
import User from "../data/User";
import { GrammyError } from "grammy";
import FailedMessage from "../data/FailedMessage";
import { markdownv2 as format } from "telegram-format";

const users = new User(db);
const groups = new Group(db);
const failedMessages = new FailedMessage(db);

export const notify = async (
  publicKeys: string[],
  text: string,
  subscribers: number | number[] | null = null
) => {
  const telegramUsers = await users.find();
  const telegramGroups = await groups.find();
  if (subscribers == null) {
    subscribers = [...telegramUsers, ...telegramGroups];
  }
  if (!Array.isArray(subscribers)) {
    subscribers = [subscribers];
  }
  if (subscribers.length < 1) {
    logger.warn(`Currently nobody subscribed to the bot - no alert sent`);
    return;
  }
  let logTxt = false;
  let failedTelegramIds = [];
  for (const telegramId of subscribers) {
    try {
      await bot.api.sendMessage(telegramId, text, {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
      });
      logger.trace(`Sent message with slashed validator(s) to ${telegramId}`);
      logTxt = true;
    } catch (error: unknown) {
      if (error instanceof GrammyError) {
        let errnum = error.error_code;
        let errmsg = error.description;
        if (errnum == 403) {
          if (telegramId < 0) {
            groups.delete(telegramId);
          } else {
            users.delete(telegramId);
          }
          logger.debug(
            `Unsubscribed ${telegramId} because the bot is blocked ([${errnum}]: ${errmsg})`
          );
        } else {
          failedTelegramIds.push(telegramId);
          logger.error(
            `Failed to send message with slashed validator(s) to ${telegramId} ([${errnum}]: ${errmsg})`
          );
        }
      } else {
        logger.error(error);
      }
    }
  }
  if (failedTelegramIds.length > 0) {
    await failedMessages.add(failedTelegramIds, publicKeys, text);
    logger.trace(
      `Added or updated alert messages that failed to send to db for re-attempt on next run`
    );
  }
  if (logTxt) {
    logger.trace(`Text for all messages was:\n${text}`);
  }
};

export const notifyToFailed = async () => {
  const uts = Math.floor(Date.now() / 1000);
  const fails = await failedMessages.find();
  if (Object.keys(fails).length < 1) {
    logger.trace(`No alert messages required to re-send`);
    return;
  }
  const numFailsOpen = Object.values(fails).reduce(
    (acc, arr) => acc + arr.length,
    0
  );
  logger.debug(
    `There are ${numFailsOpen} alert messages required to re-send (because they failed previously)`
  );
  const telegramUsers = await users.find();
  const telegramGroups = await groups.find();
  const subscribers = [...telegramUsers, ...telegramGroups];
  if (subscribers.length < 1) {
    logger.debug(
      `Currently nobody subscribed to the bot - clear alert messages that failed previously`
    );
    await failedMessages.clear();
    return;
  }
  for (const telegramId in fails) {
    for (const msg of fails[telegramId]) {
      const elapsedSecondsSinceFirstAttempt = uts - msg.time;
      if (msg.totalAttempts > 5 || elapsedSecondsSinceFirstAttempt > 3600) {
        await failedMessages.delete(msg.hash);
        logger.debug(
          `Deleted alert message ${msg.hash} for ${telegramId} (Maximum re-send attempts reached)`
        );
        continue;
      }
      logger.debug(
        `Re-send alert message ${msg.hash} for ${telegramId} (Attempt: ${msg.totalAttempts})`
      );
      await notify(msg.publicKeys, msg.text, Number(telegramId));
    }
  }
};

export const notifyToAll = async (
  publicKeys: string[],
  validatorUrl: string
) => {
  const text = `${format.bold(
    "🚨 SLASHING ALERT"
  )}\nList of slashed public keys:\n${publicKeys
    .map((key) => `\\- ${format.url(key.substring(0, 10), validatorUrl + key)}`)
    .join("\n")}`;
  await notify(publicKeys, text);
};
