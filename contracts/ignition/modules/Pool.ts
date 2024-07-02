import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PoolModule = buildModule("pool", (m) => {
  const pool = m.contract("Pool");

  return { pool };
});

export default PoolModule;
