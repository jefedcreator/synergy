import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SenderModule = buildModule("sender", (m) => {
  const usdc = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const baseRouter = "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93";
  const link = "0xE4aB69C077896252FAFBD49EFD26B5D171A32410";
  const sender = m.contract("Sender", [baseRouter, usdc, link]);

  return { sender };
});

export default SenderModule;
