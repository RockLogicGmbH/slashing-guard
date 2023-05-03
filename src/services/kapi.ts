import axios, { AxiosInstance } from "axios";

interface KApiOperator {
  index: number;
  active: boolean;
  name: string;
  rewardAddress: string;
  stakingLimit: number;
  stoppedValidators: number;
  totalSigningKeys: number;
  usedSigningKeys: number;
}

interface KApiKey {
  key: string;
  depositSignature: string;
  operatorIndex: number;
  used: boolean;
  index: number;
}

interface GetStatusResponse {
  appVersion: string;
  chainId: number;
  elBlockSnapshot: {
    blockNumber: number;
    blockHash: string;
    timestamp: number;
  };
  clBlockSnapshot: {
    epoch: number;
    root: string;
    slot: number;
    blockNumber: number;
    timestamp: number;
    blockHash: number;
  };
}
interface GetOperatorsResponse {
  data: {
    operators: Array<KApiOperator>;
  };
}

interface GetOperatorKeysResponse {
  data: {
    operators: Array<KApiOperator>;
    keys: Array<KApiKey>;
  };
}

class KApi {
  private agent: AxiosInstance;

  constructor(url: string) {
    this.agent = axios.create({ baseURL: url });
  }

  async getStatus() {
    const res = await this.agent.get<GetStatusResponse>(`/v1/status`);

    return res.data;
  }

  async getOperators() {
    const res = await this.agent.get<GetOperatorsResponse>(`/v1/modules/1/operators`);

    return res.data.data.operators;
  }

  async findOperatorKeys(operatorIndex: number) {
    const res = await this.agent.get<GetOperatorKeysResponse>(`/v1/modules/1/operators/keys`, {
      params: {
        operatorIndex,
      },
    });

    return res.data.data.keys;
  }
}

export default KApi;
