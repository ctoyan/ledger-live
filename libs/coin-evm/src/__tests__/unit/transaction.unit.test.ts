import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { transactionToEthersTransaction } from "../../adapters";
import { Transaction as EvmTransaction } from "../../types";
import * as rpcAPI from "../../api/rpc/rpc.common";
import {
  account,
  eip1559Tx,
  erc1155Transaction,
  erc1155TransactionNonFinite,
  erc721Transaction,
  legacyTx,
  nftEip1559tx,
  nftLegacyTx,
  nftRawLegacyTx,
  rawEip1559Tx,
  rawLegacyTx,
  rawNftEip1559Tx,
  testData,
  tokenTransaction,
} from "../fixtures/transaction.fixtures";
import {
  fromTransactionRaw,
  getSerializedTransaction,
  getTransactionData,
  toTransactionRaw,
} from "../../transaction";

describe("EVM Family", () => {
  describe("transaction.ts", () => {
    describe("fromTransactionRaw", () => {
      it("should deserialize a raw EIP1559 transaction into a ledger live transaction", () => {
        expect(fromTransactionRaw(rawEip1559Tx)).toEqual(eip1559Tx);
      });

      it("should deserialize a raw legacy transaction into a ledger live transaction", () => {
        expect(fromTransactionRaw(rawLegacyTx)).toEqual(legacyTx);
      });

      it("should deserialize a raw legacy transaction without type into a ledger live transaction", () => {
        expect(
          fromTransactionRaw({
            ...rawLegacyTx,
            type: undefined,
          }),
        ).toEqual(legacyTx);
      });

      it("should deserialize an nft legacy transaction into a ledger live transaction", () => {
        expect(fromTransactionRaw(nftRawLegacyTx)).toEqual(nftLegacyTx);
      });

      it("should deserialize an nft EIP1559 transaction into a ledger live transaction", () => {
        expect(fromTransactionRaw(rawNftEip1559Tx)).toEqual(nftEip1559tx);
      });
    });

    describe("toTransactionRaw", () => {
      it("should serialize a ledger live EIP1559 transaction into a raw transaction", () => {
        expect(toTransactionRaw(eip1559Tx)).toEqual(rawEip1559Tx);
      });

      it("should serialize a ledger live legacy transaction into a raw transaction", () => {
        expect(toTransactionRaw(legacyTx)).toEqual(rawLegacyTx);
      });

      it("should serialize an nft ledger live transaction without type into a raw live transaction", () => {
        expect(toTransactionRaw(nftLegacyTx)).toEqual(nftRawLegacyTx);
      });
    });

    describe("getTransactionData", () => {
      it("should return the data for an ERC20 transaction", () => {
        expect(getTransactionData(account, tokenTransaction)).toEqual(
          Buffer.from(
            // using transfer method to 0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168 & value is 0x64 (100)
            "a9059cbb00000000000000000000000051df0af74a0dbae16cb845b46daf2a35cb1d41680000000000000000000000000000000000000000000000000000000000000064",
            "hex",
          ),
        );
      });

      it("should return the data for an ERC721 transaction", () => {
        expect(getTransactionData(account, erc721Transaction)).toEqual(
          Buffer.from(
            // using safeTransferFrom method from 0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d to 0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168 & tokenId is 1 (0x01)
            "b88d4fde0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d00000000000000000000000051df0af74a0dbae16cb845b46daf2a35cb1d4168000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000",
            "hex",
          ),
        );
      });

      it("should return the data for an ERC1155 transaction", () => {
        expect(getTransactionData(account, erc1155Transaction)).toEqual(
          Buffer.from(
            // using safeTransferFrom method from 0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d to 0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168, tokenId is 1 (0x01) & quantity is 10 (0x0a)
            "f242432a0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d00000000000000000000000051df0af74a0dbae16cb845b46daf2a35cb1d41680000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000",
            "hex",
          ),
        );
      });

      it("should return the data for an ERC1155 transaction even if the quantity is Infinity or NaN", () => {
        expect(getTransactionData(account, erc1155TransactionNonFinite)).toEqual(
          Buffer.from(
            // using safeTransferFrom method from 0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d to 0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168, tokenId is 1 (0x01) & quantity is 0 (0x00)
            "f242432a0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d00000000000000000000000051df0af74a0dbae16cb845b46daf2a35cb1d41680000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000",
            "hex",
          ),
        );
      });
    });

    describe("transactionToEthersTransaction", () => {
      it("should build convert an EIP1559 ledger live transaction to an ethers transaction", () => {
        const ethers1559Tx: ethers.Transaction = {
          to: "0xkvn",
          nonce: 0,
          gasLimit: ethers.BigNumber.from(21000),
          data: "0x" + testData,
          value: ethers.BigNumber.from(100),
          chainId: 1,
          type: 2,
          maxFeePerGas: ethers.BigNumber.from(10000),
          maxPriorityFeePerGas: ethers.BigNumber.from(10000),
        };

        expect(transactionToEthersTransaction(eip1559Tx)).toEqual(ethers1559Tx);
      });

      it("should build convert an legacy ledger live transaction to an ethers transaction", () => {
        const legacyEthersTx: ethers.Transaction = {
          to: "0xkvn",
          nonce: 0,
          gasLimit: ethers.BigNumber.from(21000),
          data: "0x" + testData,
          value: ethers.BigNumber.from(100),
          chainId: 1,
          type: 0,
          gasPrice: ethers.BigNumber.from(10000),
        };

        expect(transactionToEthersTransaction(legacyTx)).toEqual(legacyEthersTx);
      });
    });

    describe("getSerializedTransaction", () => {
      beforeAll(() => {
        jest.spyOn(rpcAPI, "getTransactionCount").mockImplementation(() => Promise.resolve(0));
      });

      it("should serialize a type 0 transaction", async () => {
        const transactionLegacy: EvmTransaction = {
          amount: new BigNumber(100),
          useAllAmount: false,
          subAccountId: "id",
          recipient: "0x6775e49108cb77cda06Fc3BEF51bcD497602aD88", // obama.eth
          feesStrategy: "custom",
          family: "evm",
          mode: "send",
          nonce: 0,
          gasLimit: new BigNumber(21000),
          chainId: 1,
          gasPrice: new BigNumber(100),
          type: 0,
        };
        const serializedTx = await getSerializedTransaction(transactionLegacy);

        expect(serializedTx).toBe(
          "0xdf8064825208946775e49108cb77cda06fc3bef51bcd497602ad886480018080",
        );
      });

      it("should serialize a type 2 transaction", async () => {
        const transactionEIP1559: EvmTransaction = {
          amount: new BigNumber(100),
          useAllAmount: false,
          subAccountId: "id",
          recipient: "0x6775e49108cb77cda06Fc3BEF51bcD497602aD88", // obama.eth
          feesStrategy: "custom",
          family: "evm",
          mode: "send",
          nonce: 0,
          gasLimit: new BigNumber(21000),
          chainId: 1,
          maxFeePerGas: new BigNumber(100),
          maxPriorityFeePerGas: new BigNumber(100),
          type: 2,
        };
        const serializedTx = await getSerializedTransaction(transactionEIP1559);

        expect(serializedTx).toBe(
          "0x02df01806464825208946775e49108cb77cda06fc3bef51bcd497602ad886480c0",
        );
      });
    });
  });
});
