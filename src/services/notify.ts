import bot from "../config/bot";
import db from "../config/db";
import logger from "../config/logger";
import Group from "../data/Group";
import User from "../data/User";

const users = new User(db);
const groups = new Group(db);

export const notifyToAll = async (text: string) => {
  const telegramUsers = await users.find();
  const telegramGroups = await groups.find();

  for (const telegramId of [...telegramUsers, ...telegramGroups]) {
    try {
      await bot.api.sendMessage(telegramId, text, { parse_mode: "MarkdownV2" });
    } catch (error) {
      logger.error(error);
    }
  }
};
