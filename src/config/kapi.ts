import appConfig from ".";
import KApi from "../services/kapi";

const kapi = new KApi(appConfig.kapiUrl);

export default kapi;
