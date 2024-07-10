import { TransactionReceipt } from "thirdweb/dist/types/transaction/types";

export interface SimpleUser {
  address: string;
  username: string;
}

export interface DBUser {
  address: `0x${string}`;
  // smartWalletAddress: string;
  createdAt: string;
  rounding: boolean;
  username: string;
}

export interface DBTransaction {
  receipt: TransactionReceipt;
  from: string;
  fromUsername: string;
  to: string;
  toUsername: string;
  amount: string;
  createdAt: string;
  txHash: string;
  crossChain?: boolean;
}
