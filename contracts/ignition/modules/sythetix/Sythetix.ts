import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import VaultModule from "./Vault";

const SynthetixModule = buildModule("synthetix", (m) => {
  const { vault } = m.useModule(VaultModule);

  const fusdc = "0xc43708f8987Df3f3681801e5e640667D86Ce3C30";
  const usdc = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const sythetixCore = "0x764F4C95FDA0D6f8114faC54f6709b1B45f919a1";
  const sythetixSpot = "0xaD2fE7cd224c58871f541DAE01202F93928FEF72";

  const synthetix = m.contract("Synthetix", [
    sythetixCore,
    sythetixSpot,
    vault,
  ]);

  return { synthetix };
});

export default SynthetixModule;
