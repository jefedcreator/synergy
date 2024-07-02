import { time } from "@nomicfoundation/hardhat-network-helpers";
import hre from "hardhat";
import { parseEther } from "viem";
import DAIModule from "../ignition/modules/DAI";
import PoolFactoryModule from "../ignition/modules/PoolFactory";
import RouterModule from "../ignition/modules/Router";
import USDTModule from "../ignition/modules/USDT";

async function main() {
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const deadline = BigInt((await time.latest()) + ONE_YEAR_IN_SECS);
  const [owner] = await hre.viem.getWalletClients();
  const [ownerAddress] = await owner.getAddresses();
  const collateralAmount = parseEther("100");

  const weth = "0x1BDD24840e119DC2602dCC587Dd182812427A5Cc";

  const { dai } = await hre.ignition.deploy(DAIModule);
  const { usdt } = await hre.ignition.deploy(USDTModule);
  const { poolFactory } = await hre.ignition.deploy(PoolFactoryModule);
  const { router } = await hre.ignition.deploy(RouterModule, {
    parameters: {
      router: {
        ownerAddress,
      },
    },
  });

  console.log(`Dai deployed to: ${dai.address}`);
  console.log(`USDT deployed to: ${usdt.address}`);
  console.log(`USDT balance: ${await usdt.read.balanceOf([ownerAddress])}`);
  console.log(`DAI balance: ${await dai.read.balanceOf([ownerAddress])}`);
  await poolFactory.write.createPool([dai.address, usdt.address, 1]);
  await dai.write.approve([router.address, collateralAmount]);
  await usdt.write.approve([router.address, collateralAmount]);
  console.log(
    `router USDT allowance: ${await usdt.read.allowance([
      ownerAddress,
      router.address,
    ])}`
  );
  console.log(
    `router DAI allowance: ${await dai.read.allowance([
      ownerAddress,
      router.address,
    ])}`
  );

  await router.write.addLiquidity([
    dai.address,
    usdt.address,
    true,
    parseEther("100"),
    parseEther("100"),
    BigInt("10"),
    BigInt("10"),
    ownerAddress,
    deadline,
  ]);
}

main().catch(console.error);
