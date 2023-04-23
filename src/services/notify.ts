import bot from "../config/bot";
import db from "../config/db";
import User from "../data/User";

const users = new User(db);

export const notifyToAll = async (text: string) => {
  const telegramUsers = await users.find();

  for (const telegramId of telegramUsers) {
    try {
      await bot.api.sendMessage(telegramId, text, { parse_mode: "MarkdownV2" });
    } catch (error) {}
  }
};
