import dotenv from "dotenv";

dotenv.config({ path: `${__dirname}/../../.env` });

interface AppConfig {
  telegram_bot_token: string;
}

const { TELEGRAM_BOT_TOKEN } = process.env;

const appConfig: AppConfig = {
  telegram_bot_token: TELEGRAM_BOT_TOKEN as string,
};

export default appConfig;
