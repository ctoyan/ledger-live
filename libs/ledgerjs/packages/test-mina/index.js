import Transport from "@ledgerhq/hw-transport-node-hid";
import Mina from "@ledgerhq/hw-app-mina";

const test = async () => {
  const transport = await Transport.default.create();
  let minka = new Mina.default(transport);
  let config = await minka.getAppConfiguration();
  console.log(config);

  let addr = await minka.getAddress("m/44'/12586'/0'/0/0");
  console.log(addr);
};
test();
