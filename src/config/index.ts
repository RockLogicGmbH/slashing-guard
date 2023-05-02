import dotenv from "dotenv";

dotenv.config({ path: `${__dirname}/../../.env` });

interface ValidatorChain {
  key: number;
  url: string;
  dsc: string;
}

interface AppConfig {
  telegramBotToken: string;
  ethUrl: string;
  kapiUrl: string;
  operatorName: string;
  fakeKeys: Array<string>;
  validatorChains: Array<ValidatorChain>;
}

const { TELEGRAM_BOT_TOKEN, ETH_URL, KAPI_URL, OPERATOR_NAME, FAKE_KEYS } =
  process.env;

const appConfig: AppConfig = {
  telegramBotToken: TELEGRAM_BOT_TOKEN as string,
  ethUrl: ETH_URL as string,
  kapiUrl: KAPI_URL as string,
  operatorName: OPERATOR_NAME as string,
  fakeKeys: FAKE_KEYS?.split(",").map((s) => s.trim()) as Array<string>,
  validatorChains: [
    {
      key: 1,
      url: "https://beaconcha.in/validator/",
      dsc: "mainnet",
    },
    {
      key: 5,
      url: "https://goerli.beaconcha.in/validator/",
      dsc: "testnet",
    },
  ],
};

export default appConfig;
