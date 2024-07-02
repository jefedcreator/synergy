import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VotingRewardsFactoryModule = buildModule("votingRewardsFactory", (m) => {
  const votingRewardsFactory = m.contract("VotingRewardsFactory");

  return { votingRewardsFactory };
});

export default VotingRewardsFactoryModule;
