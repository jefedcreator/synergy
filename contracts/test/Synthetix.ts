import {
  loadFixture,
  time,
  impersonateAccount
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther, parseUnits } from "viem";

describe("Synthetix contracts", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploySythetix() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const [ownerAddress] = await owner.getAddresses();
    console.log("ownerAddress", ownerAddress);

    const mintAmount = parseEther("1");
    const fusdc = await hre.viem.getContractAt(
      "IERC20",
      "0xc43708f8987Df3f3681801e5e640667D86Ce3C30"
    );
    const usdc = await hre.viem.getContractAt(
      "IERC20",
      "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
    );
    const token1 = await hre.viem.deployContract("USDT");
    const token2 = await hre.viem.deployContract("DAI");
    const sythetixCore = "0x764F4C95FDA0D6f8114faC54f6709b1B45f919a1";
    const sythetixSpot = "0xaD2fE7cd224c58871f541DAE01202F93928FEF72";
    const vault = await hre.viem.deployContract("Vault", [usdc.address]);
    const sythetix = await hre.viem.deployContract("Synthetix", [
      sythetixCore,
      sythetixSpot,
      vault.address,
    ]);

    const publicClient = await hre.viem.getPublicClient();
    const collateralAmount = parseEther("10000000");
    const collateralAmount2 = parseEther("500");

    return {
      usdc,
      token1,
      token2,
      owner,
      otherAccount,
      publicClient,
      mintAmount,
      ownerAddress,
      collateralAmount,
      collateralAmount2,
      sythetix,
      vault,
      fusdc,
    };
  }

  describe("invest in synergy vault succesfully", () => {
    it("deposit token to vault, and delegate collateral", async () => {
      const {
        usdc,
        token1,
        token2,
        ownerAddress,
        sythetix,
        collateralAmount,
        vault,
        fusdc
      } = await loadFixture(deploySythetix);
      //   const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
      //   const deadline = BigInt((await time.latest()) + ONE_YEAR_IN_SECS);
      //   console.log("deadline", deadline);
      const usdcValue = parseUnits("0.0001", 6);
      await fusdc.write.approve([vault.address, collateralAmount]);
      console.log("done 1");

      console.log("fusdc balance", await fusdc.read.balanceOf([ownerAddress]));

      await vault.write.deposit([usdcValue, ownerAddress]);
      console.log("done 2");

      await vault.write.invest([ownerAddress]);
      console.log("done 3");
    });
  });
});

