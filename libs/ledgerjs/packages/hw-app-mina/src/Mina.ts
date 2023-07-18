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
import BIPPath from "bip32-path";

const CHUNK_SIZE = 250;
const CLA = 0xe0;
const APP_KEY = "CSM";
const INS_GET_CONF = 0x01;
const INS_GET_ADDR = 0x02;
/**
 * Cosmos API
 *
 * @example
 * import Cosmos from "@ledgerhq/hw-app-cosmos";
 * const cosmos = new Cosmos(transport)
 */

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

  async getAddress(
    path: string,
    requireConfirmation = false,
  ): Promise<{
    test: string;
  }> {
    console.log("PATH", path);
    const bipPath = BIPPath.fromString(path).toPathArray();
    console.log("BIP PATH", bipPath);
    const bip44Path = this.serializePath(bipPath);
    console.log("BIP 44 PATH SERIALIZED", bipPath);
    return this.transport
      .send(CLA, INS_GET_ADDR, requireConfirmation ? 1 : 0, 0, bip44Path)
      .then(response => {
        console.log("RESPONSE", response);
        return {
          test: "test",
        };
      });
  }
}
