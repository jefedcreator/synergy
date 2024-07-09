import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import GaugeFactoryModule from "./GaugeFactory";
import ManagedRewardsFactoryModule from "./ManagedRewardsFactory";
import PoolFactoryModule from "./PoolFactory";
import VotingRewardsFactoryModule from "./VotingRewardsFactory";

const FactoryRegistryModule = buildModule("factoryRegistry", (m) => {
  const { poolFactory } = m.useModule(PoolFactoryModule);
  const { votingRewardsFactory } = m.useModule(VotingRewardsFactoryModule);
  const { gaugeFactory } = m.useModule(GaugeFactoryModule);
  const { managedRewardsFactory } = m.useModule(ManagedRewardsFactoryModule);

  const factoryRegistry = m.contract("FactoryRegistry", [
    poolFactory,
    votingRewardsFactory,
    gaugeFactory,
    managedRewardsFactory,
  ]);

  return { factoryRegistry };
});

export default FactoryRegistryModule;
