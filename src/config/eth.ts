import appConfig from ".";
import ETH from "../services/eth";

const eth = new ETH(appConfig.ethUrl);

export default eth;
