import {
  loadFixture,
  time,
  impersonateAccount,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther, parseUnits } from "viem";

describe("CCIP contracts", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploySythetix() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const [ownerAddress] = await owner.getAddresses();
    console.log("ownerAddress", ownerAddress);

    const mintAmount = parseEther("1");
   
    const usdc = await hre.viem.getContractAt(
      "IERC20",
      "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
    );


    const publicClient = await hre.viem.getPublicClient();
    const collateralAmount = parseEther("10000000");
    const collateralAmount2 = parseEther("500");

    return {
      usdc,
      owner,
      otherAccount,
      publicClient,
      mintAmount,
      ownerAddress,
      collateralAmount,
      collateralAmount2,
    };
  }

  describe("invest in synergy vault succesfully", () => {
    it("deposit token to vault, and delegate collateral", async () => {
      const {
        usdc,
        ownerAddress,
        collateralAmount,
      } = await loadFixture(deploySythetix);
      //   const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
      //   const deadline = BigInt((await time.latest()) + ONE_YEAR_IN_SECS);
      //   console.log("deadline", deadline);
      const usdcValue = parseUnits("0.0001", 6);
      await usdc.write.approve([vault.address, collateralAmount]);
      console.log("done 1");

      console.log("usdc balance", await usdc.read.balanceOf([ownerAddress]));

      await vault.write.deposit([usdcValue, ownerAddress]);
      console.log("done 2");

      await vault.write.invest();
      console.log("done 3");
    });
  });
});
