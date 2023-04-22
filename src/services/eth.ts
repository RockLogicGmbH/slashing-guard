import axios, { AxiosInstance } from "axios";

interface GetStateValidatorsResponse {
  execution_optimistic: boolean;
  finalized: boolean;
  data: Array<{
    index: string;
    balance: string;
    status: string;
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
    status: string[];
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
