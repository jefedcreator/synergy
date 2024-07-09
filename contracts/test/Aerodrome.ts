import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("Aerodrome contracts", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployAerodrome() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const [ownerAddress] = await owner.getAddresses();
    const mintAmount = parseEther("1");

    const token1 = await hre.viem.deployContract("USDT");
    const token2 = await hre.viem.deployContract("DAI");
    const weth = "0x1BDD24840e119DC2602dCC587Dd182812427A5Cc";
    const pool = await hre.viem.deployContract("Pool");
    const poolFactory = await hre.viem.deployContract("PoolFactory", [
      pool.address,
    ]);
    const votingRewardsFactory = await hre.viem.deployContract(
      "VotingRewardsFactory"
    );
    const gaugeFactory = await hre.viem.deployContract("GaugeFactory");
    const managedRewardsFactory = await hre.viem.deployContract(
      "ManagedRewardsFactory"
    );
    const factoryRegistry = await hre.viem.deployContract("FactoryRegistry", [
      poolFactory.address,
      votingRewardsFactory.address,
      gaugeFactory.address,
      managedRewardsFactory.address,
    ]);

    const router = await hre.viem.deployContract("Router", [
      ownerAddress,
      factoryRegistry.address,
      poolFactory.address,
      ownerAddress,
      weth,
    ]);

    const publicClient = await hre.viem.getPublicClient();
    const collateralAmount = parseEther("10000000");
    const collateralAmount2 = parseEther("500");

    return {
      token1,
      token2,
      owner,
      otherAccount,
      publicClient,
      mintAmount,
      ownerAddress,
      collateralAmount,
      collateralAmount2,
      router,
      poolFactory,
    };
  }

  describe("create pool succesfully", () => {
    it("create pool and provide liquidity and swap", async () => {
      const {
        token1,
        token2,
        ownerAddress,
        poolFactory,
        router,
        collateralAmount,
      } = await loadFixture(deployAerodrome);
      const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
      const deadline = BigInt((await time.latest()) + ONE_YEAR_IN_SECS);
      console.log("deadline", deadline);

      const createPool = await poolFactory.write.createPool([
        token1.address,
        token2.address,
        1,
      ]);

      //   console.log("created pool", createPool);
      console.log("token 1", token1.address);
      console.log("token 2", token2.address);
      console.log("router", router.address);

      const getPool = await poolFactory.read.getPool([
        token1.address,
        token2.address,
        1,
      ]);

      const deployedPool = await hre.viem.getContractAt("Pool", getPool);
      console.log("deployedPool", await deployedPool.read.stable());

      console.log("getPool", getPool);

      const poolFor = await router.read.poolFor([
        token1.address,
        token2.address,
        true,
        poolFactory.address,
      ]);

      console.log("poolFor", poolFor);

      console.log("ownerAddress", ownerAddress);

      await token1.write.mint([ownerAddress, collateralAmount]);
      await token2.write.mint([ownerAddress, collateralAmount]);

      await token1.write.approve([router.address, collateralAmount]);
      await token2.write.approve([router.address, collateralAmount]);

      const token1Allowance = await token1.read.allowance([
        ownerAddress,
        router.address,
      ]);
      const token2Allowance = await token2.read.allowance([
        ownerAddress,
        router.address,
      ]);

      console.log("token1Allowance", token1Allowance);

      console.log("token2Allowance", token2Allowance);

      const addLiquidity = await router.write.addLiquidity([
        token1.address,
        token2.address,
        true,
        parseEther("100"),
        parseEther("100"),
        BigInt("10"),
        BigInt("10"),
        ownerAddress,
        deadline,
      ]);

      console.log("addLiquidity", addLiquidity);

      const reserve = await router.read.getReserves([
        token1.address,
        token2.address,
        true,
        poolFactory.address,
      ]);

      console.log("reserve before", reserve);

      const token1Balance = await token1.read.balanceOf([ownerAddress]);
      const token2Balance = await token2.read.balanceOf([ownerAddress]);

      console.log("token1Balance before", token1Balance);
      console.log("token2Balance before", token2Balance);

      const swap = await router.write.swapExactTokensForTokens([
        parseEther("10"),
        parseEther("9"),
        [
          {
            from: token1.address,
            to: token2.address,
            stable: true,
            factory: poolFactory.address,
          },
        ],
        ownerAddress,
        deadline,
      ]);

      const reserveAfter = await router.read.getReserves([
        token1.address,
        token2.address,
        true,
        poolFactory.address,
      ]);
      console.log("reserve after", reserveAfter);

      const token1BalanceAfter = await token1.read.balanceOf([ownerAddress]);
      const token2BalanceAfter = await token2.read.balanceOf([ownerAddress]);

      console.log("token1Balance after", token1BalanceAfter);
      console.log("token2Balance after", token2BalanceAfter);

      // console.log("swap", swap);

      //   await expect(createPool).to.not.be.rejected;
    });
  });
});
