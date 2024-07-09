import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ManagedRewardsFactoryModule = buildModule(
  "managedRewardsFactory",
  (m) => {
    const managedRewardsFactory = m.contract("ManagedRewardsFactory");

    return { managedRewardsFactory };
  }
);

export default ManagedRewardsFactoryModule;
