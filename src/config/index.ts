import dotenv from "dotenv";

dotenv.config({ path: `${__dirname}/../../.env` });

interface AppConfig {
  telegramBotToken: string;
  ethUrl: string;
  kapiUrl: string;
}

const { TELEGRAM_BOT_TOKEN, ETH_URL, KAPI_URL } = process.env;

const appConfig: AppConfig = {
  telegramBotToken: TELEGRAM_BOT_TOKEN as string,
  ethUrl: ETH_URL as string,
  kapiUrl: KAPI_URL as string,
};

export default appConfig;
