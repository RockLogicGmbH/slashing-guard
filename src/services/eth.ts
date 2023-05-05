import axios, { AxiosInstance } from "axios";

export type EthValidatorStatus =
  | "pending_initialized"
  | "pending_queued"
  | "active_ongoing"
  | "active_exiting"
  | "active_slashed"
  | "exited_unslashed"
  | "exited_slashed"
  | "withdrawal_possible"
  | "withdrawal_done"
  | "active"
  | "pending"
  | "exited"
  | "withdrawal";

export interface GetStateValidatorsResponse {
  execution_optimistic: boolean;
  finalized: boolean;
  data: Array<{
    index: string;
    balance: string;
    status: EthValidatorStatus;
    validator: {
      pubkey: string;
      withdrawal_credentials: string;
      effective_balance: string;
      slashed: boolean;
      activation_eligibility_epoch: string;
      activation_epoch: string;
      exit_epoch: string;
      withdrawable_epoch: string;
    };
  }>;
}

class ETH {
  private agent: AxiosInstance;

  constructor(url: string) {
    this.agent = axios.create({ baseURL: url });
  }

  async getStateValidators({
    stateId,
    validatorIds,
    status,
  }: {
    stateId: string;
    validatorIds: string[];
    status: EthValidatorStatus[];
  }) {
    const params: any = {};

    if (validatorIds.length) params.id = validatorIds.join(",");

    if (status.length) params.status = status.join(",");

    const res = await this.agent.get<GetStateValidatorsResponse>(`/eth/v1/beacon/states/${stateId}/validators`, {
      params: params,
    });

    return res.data;
  }

  async getStateValidatorsChunked({
    stateId,
    validatorIds,
    status,
    chunkSize,
  }: {
    stateId: string;
    validatorIds: string[];
    status: EthValidatorStatus[];
    chunkSize: number;
  }) {
    const chunks = [];
    let keys: string[] = [];
    for (const key of validatorIds) {
      keys.push(key);
      if (keys.length == chunkSize) {
        chunks.push(keys);
        keys = [];
      }
    }
    if (keys.length) chunks.push(keys);
    let resultData: any[] = [];
    let result: GetStateValidatorsResponse = {
      execution_optimistic: false,
      finalized: false,
      data: [],
    };
    for (const chunk of chunks) {
      result = await this.getStateValidators({
        stateId: stateId,
        validatorIds: chunk,
        status: status,
      });
      resultData = resultData.concat(result.data);
    }
    result.data = resultData;
    return result;
  }
}

export default ETH;
