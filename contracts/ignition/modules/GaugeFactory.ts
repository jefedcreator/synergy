import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GaugeFactoryModule = buildModule("gaugeFactory", (m) => {
  const gaugeFactory = m.contract("GaugeFactory");

  return { gaugeFactory };
});

export default GaugeFactoryModule;
