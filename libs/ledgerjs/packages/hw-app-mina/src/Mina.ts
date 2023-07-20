/********************************************************************************
 *   Ledger Node JS API
 *   (c) 2017-2018 Ledger
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
import type Transport from "@ledgerhq/hw-transport";
import { StatusCodes } from "@ledgerhq/errors";

import BIPPath from "bip32-path";

const CHUNK_SIZE = 250;
const CLA = 0xe0;
const APP_KEY = "CSM";
const INS_GET_CONF = 0x01;
const INS_GET_ADDR = 0x02;
const INS_SIGN_TX = 0x03;
/**
 * Cosmos API
 *
 * @example
 * import Cosmos from "@ledgerhq/hw-app-cosmos";
 * const cosmos = new Cosmos(transport)
 */

// At a later stage, I found that a big part of the code here can be reused from there
// https://github.com/nerdvibe/mina-ledger-js/blob/98f4258dba73c9f75d7b6d17ac91bf276b28ef7e/src/lib.ts

export default class Mina {
  transport: Transport;

  constructor(transport: Transport, scrambleKey: string = APP_KEY) {
    this.transport = transport;
    transport.decorateAppAPIMethods(this, ["getAppConfiguration"], scrambleKey);
  }

  async getAppConfiguration(): Promise<{
    version: string;
  }> {
    const response = await this.transport.send(CLA, INS_GET_CONF, 0, 0);
    return {
      version: "" + response[0] + "." + response[1] + "." + response[2],
    };
  }

  serializePath(path: Array<number>): Buffer {
    const buf = Buffer.alloc(20);
    buf.writeUInt32LE(path[0], 0);
    buf.writeUInt32LE(path[1], 4);
    buf.writeUInt32LE(path[2], 8);
    buf.writeUInt32LE(path[3], 12);
    buf.writeUInt32LE(path[4], 16);
    return buf;
  }

  // in MINA public key and address are the same
  async getAddress(
    path: string,
    verify?: boolean,
  ): Promise<{
    address: string;
  }> {
    // TOOD: Get account from path and use it here
    // Not sure what verify is
    const account = 1;
    const accountHex = account.toString(16).padStart(8, "0");
    const apduBuffer = Buffer.concat([Buffer.from(accountHex, "hex")]);

    const response = await this.transport.send(CLA, INS_GET_ADDR, 0, 0, apduBuffer);
    const publicKey = response.slice(0, response.length - 3).toString();
    const returnCode = response.slice(response.length - 2, response.length).toString("hex");

    // TODO: Returns some weird symbol at the end of the address
    return {
      address: publicKey,
    };
  }

  // TODO: Mina has payment and delegation transactions, so maybe we'll need a signing func for both
  // Check other chains for examples, there should be some
  //
  // on a side not this is Auro wallets implementatin of signing tx
  // https://github.com/aurowallet/auro-wallet-browser-extension/blob/3a5fe2b5370bbf18293cb7de48b33bb96b7b4730/src/popup/pages/SignTransaction/index.js#L189
  // https://github.com/aurowallet/auro-wallet-browser-extension/blob/master/src/utils/ledger.js#L187
  // this might also help https://github.com/nerdvibe/mina-ledger-js/blob/98f4258dba73c9f75d7b6d17ac91bf276b28ef7e/src/lib.ts#L189
  async signTransaction(
    path: string,
    rawTxHex: string,
    tokenSignatures: string[],
  ): Promise<{ signature: string; returnCode: string }> {
    // TOOD: apduBuffer should be constructed outside here and then just passed
    const txType = 0x00; // payment type
    const senderAccount = 0;
    const senderAddress = "B62qrXpVzwMtxnh3Evf3h2nZMp5T5U4Ku9P1aVr9yByXe2Sd7SvmdRX"; // my auro wallet acc
    const receiverAddress = "B62qmujzxrMURqcyqbERpyZC7ci5Kfh1JGt6jcPuRXkrsgvxbNZXLbV"; // the Address I generated with this code
    const amount = 1000000000; // so 1000000000 (a billion) should be one mina
    const fee = 1000000000;
    const nonce = 16;
    const validUntil = 4294967295; // got that from lib.ts auro wallet default param value
    const memo = "Test Eiger";
    const networkId = 0x00; // testnet
    const apdu = this.createTXApdu({
      txType,
      senderAccount,
      senderAddress,
      receiverAddress,
      amount,
      fee,
      nonce,
      validUntil,
      memo,
      networkId,
    });
    console.log("APDU", apdu);

    const apduBuffer = Buffer.from(apdu, "hex");
    console.log("APDU BUFFER", apduBuffer);

    const response = await this.transport.send(CLA, INS_SIGN_TX, 0, 0, apduBuffer);
    const signature = response.slice(0, response.length - 2).toString("hex");
    const returnCode = response.slice(response.length - 2, response.length).toString("hex");

    console.log("RETURN CODE ", returnCode);
    console.log("STRING SIGNATURE", signature);

    return {
      signature,
      returnCode,
    };
  }

  // Taken from
  //https://github.com/nerdvibe/mina-ledger-js/blob/98f4258dba73c9f75d7b6d17ac91bf276b28ef7e/src/lib.ts
  pad(n: number | string, width: number = 3, paddingValue: number | string = 0) {
    return (String(paddingValue).repeat(width) + String(n)).slice(String(n).length);
  }

  // tx_type - TX_TYPE, seem to be TX_TYPE_PAYMENT = 0x00 and TX_TYPE_DELEGATION = 0x04
  // sender_account - number, e.g. 1
  // sender_address - Mina address, e.g. B62qnzbXmRNo9q32n4SNu2mpB8e7FYYLH8NmaX6oFCBYjjQ8SbD7uzV
  // receiver - Mina address, e.g. B62qnzbXmRNo9q32n4SNu2mpB8e7FYYLH8NmaX6oFCBYjjQ8SbD7uzV
  // amount - amount in ... nanomina (1 billion units)?
  // fee - amoun in ... nanomina (1 billion units)?
  // nonce - in the embedded app tests, the number 16 is used
  // valid_until - in the embedded app tests, the number 271828 is used
  // memo - some string
  // network_id - mainnet or testnet id (TESTNET_ID = 0x00, MAINNET_ID = 0x01)
  // Taken from
  // https://github.com/nerdvibe/mina-ledger-js/blob/98f4258dba73c9f75d7b6d17ac91bf276b28ef7e/src/lib.ts
  createTXApdu({
    txType,
    senderAccount,
    senderAddress,
    receiverAddress,
    amount,
    fee,
    nonce,
    validUntil = 4294967295,
    memo = "",
    networkId,
  }: SignTransactionArgs) {
    const senderBip44AccountHex = this.pad(senderAccount.toString(16), 8);
    const senderAddressHex = this.asciiToHex(senderAddress);
    const receiverHex = this.asciiToHex(receiverAddress);
    const amountHex = this.pad(amount.toString(16), 16);
    const feeHex = this.pad(fee.toString(16), 16);
    const nonceHex = this.pad(Number(nonce).toString(16).toUpperCase(), 8);
    const validUntilHex = this.pad(validUntil.toString(16), 8);
    const memoHex = this.convertMemo(memo);
    const tagHex = this.pad(txType.toString(16), 2);
    const networkIdHex = this.pad(networkId, 2);

    // Uncomment for debug
    // console.log("senderBip44AccountHex", senderBip44AccountHex);
    // console.log("senderAddressHex", senderAddressHex);
    // console.log("receiverHex", receiverHex);
    // console.log("amountHex", amountHex);
    // console.log("feeHex", feeHex);
    // console.log("nonceHex", nonceHex);
    // console.log("validUntilHex", validUntilHex);
    // console.log("memoHex", memoHex);
    // console.log("tagHex", tagHex);
    // console.log("networkIdHex", networkIdHex);

    const apduMessage =
      senderBip44AccountHex +
      senderAddressHex +
      receiverHex +
      amountHex +
      feeHex +
      nonceHex +
      validUntilHex +
      memoHex +
      tagHex +
      networkIdHex;

    // Uncomment for debug
    // console.log(apduMessage);
    // console.log('length: ', apduMessage.length);

    return apduMessage;
  }

  // Taken from
  //https://github.com/nerdvibe/mina-ledger-js/blob/98f4258dba73c9f75d7b6d17ac91bf276b28ef7e/src/lib.ts
  asciiToHex(str: string) {
    return Buffer.from(str, "ascii").toString("hex");
  }

  // Taken from
  //https://github.com/nerdvibe/mina-ledger-js/blob/98f4258dba73c9f75d7b6d17ac91bf276b28ef7e/src/lib.ts
  convertMemo(memo: string) {
    const length = 32;
    let charToAdd = length - memo.length;
    let stringToReturn = memo;
    while (charToAdd > 0) {
      stringToReturn += "\x00";
      charToAdd--;
    }
    return Buffer.from(stringToReturn, "utf8").toString("hex");
  }
}

// Taken from
//https://github.com/nerdvibe/mina-ledger-js/blob/98f4258dba73c9f75d7b6d17ac91bf276b28ef7e/src/lib.ts
interface SignTransactionArgs {
  txType: number;
  senderAccount: number;
  senderAddress: string;
  receiverAddress: string;
  amount: number;
  fee: number;
  nonce: number;
  validUntil?: number;
  memo?: string;
  networkId: number;
}
