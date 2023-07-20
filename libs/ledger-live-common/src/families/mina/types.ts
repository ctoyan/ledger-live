import type { BigNumber } from "bignumber.js";
import {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type Transaction = TransactionCommon & {
  family: "mina";
  mode: string;
  fees?: BigNumber;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "mina";
  mode: string;
  fees?: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
