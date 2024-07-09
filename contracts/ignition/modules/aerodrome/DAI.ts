import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DAIModule = buildModule("DAI", (m) => {
  const dai = m.contract("DAI");
  
  return { dai };
});

export default DAIModule;
