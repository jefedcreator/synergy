import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import FactoryRegistryModule from "./FactoryRegistry";
import PoolFactoryModule from "./PoolFactory";

const RouterModule = buildModule("router", (m) => {
  const { poolFactory } = m.useModule(PoolFactoryModule);
  const { factoryRegistry } = m.useModule(FactoryRegistryModule);
  // const ownerAddress = m.getParameter("ownerAddress");
  const ownerAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
  const weth = "0x1BDD24840e119DC2602dCC587Dd182812427A5Cc";
  const usdc = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  console.log("ownerAddress", ownerAddress);

  const router = m.contract("Router", [
    ownerAddress,
    factoryRegistry,
    poolFactory,
    ownerAddress,
    weth,
  ]);

  return { router };
});

export default RouterModule;
