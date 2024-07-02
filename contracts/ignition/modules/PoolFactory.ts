import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";
import PoolModule from "./Pool";

const PoolFactoryModule = buildModule("poolFactory", (m) => {
  const { pool } = m.useModule(PoolModule);

  const poolFactory = m.contract("PoolFactory", [pool]);

  const usdc = hre.viem.getContractAt(
    "IERC20",
    "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  )

  return { poolFactory };
});

export default PoolFactoryModule;
