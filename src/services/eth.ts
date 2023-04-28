import axios, { AxiosInstance } from "axios";

type EthValidatorStatus =
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
    const res = await this.agent.get<GetStateValidatorsResponse>(
      `/eth/v1/beacon/states/${stateId}/validators`,
      {
        params: {
          id: validatorIds.join(","),
          status: status.join(","),
        },
      }
    );

    return res.data;
  }
}

export default ETH;
