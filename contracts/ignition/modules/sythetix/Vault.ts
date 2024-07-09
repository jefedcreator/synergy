import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VaultModule = buildModule("vault", (m) => {
  const fusdc = "0xc43708f8987Df3f3681801e5e640667D86Ce3C30";
  const snxUSD = "0x682f0d17feDC62b2a0B91f8992243Bf44cAfeaaE";
  const usdc = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  const vault = m.contract("Vault", [usdc]);

  return { vault };
});

export default VaultModule;
