import hre from "hardhat";
import {
  formatEther,
  parseEther,
  parseUnits
} from "viem";
import SenderModule from "../ignition/modules/ccip/BaseBridge";

async function main() {
  const [owner] = await hre.viem.getWalletClients();
  const [ownerAddress] = await owner.getAddresses();
  const collateralAmount = parseEther("100");
  const publicClient = await hre.viem.getPublicClient();
  const { sender } = await hre.ignition.deploy(SenderModule);

  const usdc = await hre.viem.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  );

  const link = await hre.viem.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    "0xE4aB69C077896252FAFBD49EFD26B5D171A32410"
  );

  const arbSelector: any = "3478487238524512106";
  const avaxSelector: any = "14767482510784806043";
  const sepoliaSelector: any = "16015286601757825753";
  const opSelector: any = "5224473277236331295";

  //not working
  const bnbSelector: any = "13264668187771770619";
  const amoySelector: any = "16281711391670634445";
  const celoSelector: any = "3552045678561919002";
  const gnosisSelector: any = "8871595565390010547";

  console.log(`ownerAddress: ${ownerAddress}`);
  console.log(`Base bridge deployed to: ${sender.address}`);
  //   console.log(`Arbitrum bridge deployed to: ${receiver.address}`);
  console.log(`usdc balance: ${await usdc.read.balanceOf([ownerAddress])}`);
  console.log(`link balance: ${await link.read.balanceOf([ownerAddress])}`);
  const receiver = "0xe85BbD739229FccD6eC650C8d439Fef6E0092c15";
  //   const tx1 = await owner.sendTransaction({
  //     account: ownerAddress,
  //     to: sender.address,
  //     value: parseEther("0.01"),
  //   });

  const tx1 = await link.write.transfer([sender.address, parseEther("1")]);
  await publicClient.waitForTransactionReceipt({ hash: tx1 });
  console.log("done 1");

  const balance = await publicClient.getBalance({
    address: sender.address,
  });

  const balanceAsEther = formatEther(balance);
  console.log("balanceAsEther", balanceAsEther);

  console.log(
    `sender link balance: ${formatEther(
      await link.read.balanceOf([sender.address])
    )}`
  );

  //   if (bridgeUSDCBalance < parseUnits("0.1")) {

  //   }
  const usdcValue = parseUnits("0.0001", 6);
  // const tx2 = await sender.write.setReceiverForDestinationChain([
  //   arbSelector,
  //   receiver,
  // ]);
  // await publicClient.waitForTransactionReceipt({ hash: tx2 });
  // console.log("done 2:", tx2);

  // const tx3 = await sender.read.getFee([arbSelector, ownerAddress, usdcValue]);

  const tx3 = await usdc.write.approve([sender.address, collateralAmount]);
  await publicClient.waitForTransactionReceipt({ hash: tx3 });
  console.log("done 3");

  // const tx4 = await sender.write.sendMessagePayLINK([
  //   arbSelector,
  //   ownerAddress,
  //   usdcValue,
  // ]);

  // await publicClient.waitForTransactionReceipt({ hash: tx4 });
  // console.log("done 4:", tx4);

  // const tx5 = await sender.write.sendMessagePayLINK([
  //   avaxSelector,
  //   ownerAddress,
  //   usdcValue,
  // ]);

  // await publicClient.waitForTransactionReceipt({ hash: tx5 });
  // console.log("done 5:", tx5);

  // const tx6 = await sender.write.sendMessagePayLINK([
  //   sepoliaSelector,
  //   ownerAddress,
  //   usdcValue,
  // ]);

  // await publicClient.waitForTransactionReceipt({ hash: tx6 });
  // console.log("done 6:", tx6);

  // const tx7 = await sender.write.sendMessagePayLINK([
  //   opSelector,
  //   ownerAddress,
  //   usdcValue,
  // ]);

  // await publicClient.waitForTransactionReceipt({ hash: tx7 });
  // console.log("done 7:", tx7);

  console.log(
    `sender link balance: ${formatEther(
      await link.read.balanceOf([sender.address])
    )}`
  );

  // const tx8 = await sender.write.sendMessagePayLINK([
  //   gnosisSelector,
  //   ownerAddress,
  //   usdcValue,
  // ]);

  // console.log("tx4", formatEther(tx4));
  // await publicClient.waitForTransactionReceipt({ hash: tx8 });
  // console.log("done 8:", tx8);
}

main().catch(console.error);
