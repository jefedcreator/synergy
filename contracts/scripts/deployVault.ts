import { time } from "@nomicfoundation/hardhat-network-helpers";
import hre from "hardhat";
import { parseEther, parseUnits } from "viem";
import SynthetixModule from "../ignition/modules/sythetix/Sythetix";
import VaultModule from "../ignition/modules/sythetix/Vault";

async function main() {
  //   const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  //   const deadline = BigInt((await time.latest()) + ONE_YEAR_IN_SECS);
  const [owner] = await hre.viem.getWalletClients();
  const [ownerAddress] = await owner.getAddresses();
  const collateralAmount = parseEther("100");
  const publicClient = await hre.viem.getPublicClient();

  const weth = "0x1BDD24840e119DC2602dCC587Dd182812427A5Cc";

  const { synthetix } = await hre.ignition.deploy(SynthetixModule);
  const { vault } = await hre.ignition.deploy(VaultModule);
  const snxUSD = await hre.viem.getContractAt(
    "IERC20",
    "0x682f0d17feDC62b2a0B91f8992243Bf44cAfeaaE"
  );
  const fusdc = await hre.viem.getContractAt(
    "IERC20",
    "0xc43708f8987Df3f3681801e5e640667D86Ce3C30"
  );
  const usdc = await hre.viem.getContractAt(
    "IERC20",
    "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  );

  console.log(`ownerAddress: ${ownerAddress}`);
  console.log(`synthetix deployed to: ${synthetix.address}`);
  console.log(`vault deployed to: ${vault.address}`);
  console.log(`usdc balance: ${await usdc.read.balanceOf([ownerAddress])}`);
  const usdcValue = parseUnits("0.0001", 6);
  const tx1 = await usdc.write.approve([vault.address, collateralAmount]);
  await publicClient.waitForTransactionReceipt({ hash: tx1 });
  console.log("done 1");

  const tx2 = await usdc.write.approve([synthetix.address, collateralAmount]);
  await publicClient.waitForTransactionReceipt({ hash: tx2 });
  console.log("done 2");

  const tx3 = await vault.write.deposit([usdcValue, ownerAddress]);
  await publicClient.waitForTransactionReceipt({ hash: tx3 });
  console.log("done 3");

  const tx4 = await vault.write.invest();
  await publicClient.waitForTransactionReceipt({ hash: tx4 });
  console.log("done 4");
}

main().catch(console.error);
