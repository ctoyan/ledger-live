import type { Resolver } from "../../hw/getAddress/types";

import Mina from "@ledgerhq/hw-app-mina";

const resolver: Resolver = async (transport, { path, verify }) => {
  const mina = new Mina(transport);

  const r = await mina.getAddress(path, verify);

  return {
    address: r.address,
    publicKey: r.address,
    path,
  };
};

export default resolver;
