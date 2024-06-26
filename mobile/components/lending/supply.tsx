import { useState } from "react";
import { Text, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Toast from "react-native-toast-message";
import { ContractOptions, prepareContractCall } from "thirdweb";
import { useReadContract, useSendTransaction } from "thirdweb/react";
import { erc20Abi, formatEther, formatUnits, parseEther } from "viem";
import {
  AAVE_POOL_ABI,
  AAVE_POOL_ADDRESS,
  DAI_ADDRESS,
  SUPPLY_ROUTER_ADDRESS,
  daiContract,
} from "../../constants/sepolia";
import { useUserStore } from "../../store/use-user-store";
import { AmountChooser } from "../amount-chooser";
import AppButton from "../app-button";

export default function LendingSupply({
  balanceData,
  balanceOfLoading,
  refetchBalance,
  refetchPoolBalance,
  aavePoolContract,
  ghoContract,
}: {
  balanceData: bigint;
  balanceOfLoading: boolean;
  refetchBalance: () => void;
  refetchPoolBalance: () => void;
  aavePoolContract: ContractOptions<typeof AAVE_POOL_ABI>;
  ghoContract: ContractOptions<typeof erc20Abi>;
}) {
  const user = useUserStore((state) => state.user);
  const [supplyAmount, setSupplyAmount] = useState(0);
  const {
    mutateAsync: supply,
    data: borrowData,
    isPending: isSupplying,
  } = useSendTransaction();

  const {
    mutateAsync: ghoApprove,
    data: approveData,
    isPending: isApprovingGHO,
  } = useSendTransaction();

  const {
    data: daiBalanceData,
    isLoading: isTotalAssetLoading,
    refetch: refetchVaultBalance,
  } = useReadContract({
    contract: daiContract,
    method: "balanceOf",
    params: [user?.address!],
  });

  const { mutateAsync: approve, isPending: isApproving } = useSendTransaction();

  const { data: approvalData } = useReadContract({
    contract: daiContract,
    method: "allowance",
    params: [user?.address!, AAVE_POOL_ADDRESS],
  });

  const { data: ghoApprovalData } = useReadContract({
    contract: ghoContract,
    method: "allowance",
    params: [user?.address!, SUPPLY_ROUTER_ADDRESS],
  });

  // const { contract: supplyRouterContract } = useContract(SUPPLY_ROUTER_ADDRESS);
  // const { mutateAsync: swap, isLoading: isSwapping } = useContractWrite(
  //   supplyRouterContract,
  //   "swapExactTokensForTokens"
  // );

  const balance = parseFloat(formatUnits(balanceData.toString() as any, 18));

  const canSupply = supplyAmount && supplyAmount > 0 && balance >= supplyAmount;
  const executeSupply = async () => {
    try {
      const supplyAmountInWei = parseEther(supplyAmount.toString());

      if (ghoApprovalData && parseInt(formatEther(ghoApprovalData)) == 0) {
        console.log("approving GHO spending to router");

        const transaction: any = prepareContractCall({
          contract: ghoContract,
          method: "approve",
          params: [SUPPLY_ROUTER_ADDRESS, BigInt(100)],
        });

        ghoApprove(transaction);
      }

      if (approvalData && parseInt(formatEther(approvalData)) == 0) {
        console.log("approving spending");

        const transaction: any = prepareContractCall({
          contract: daiContract,
          method: "approve",
          params: [AAVE_POOL_ADDRESS, BigInt(100)],
        });

        ghoApprove(transaction);
      }

      if (
        daiBalanceData &&
        supplyAmountInWei &&
        parseInt(formatEther(daiBalanceData)) <
          parseInt(formatEther(supplyAmountInWei))
      ) {
        // const { receipt: swapReceipt } = await swap({
        //   args: [
        //     supplyAmountInWei - daiBalanceData,
        //     supplyAmountInWei - daiBalanceData,
        //     [GHO_SEPOLIA_ADDRESS, DAI_ADDRESS],
        //     user?.address,
        //     0,
        //   ],
        //   overrides: { maxFeePerGas: 4 },
        // });
      }

      const transaction: any = prepareContractCall({
        contract: aavePoolContract,
        method: "deposit",
        params: [DAI_ADDRESS, supplyAmountInWei, user?.address!, 0],
        maxFeePerGas: BigInt(4),
      });

      const tx = supply(transaction);

      if ((await tx).transactionHash) {
        setSupplyAmount(0);
      }
      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Supplied GHO successfully.",
      });
      refetchBalance();
      refetchPoolBalance();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error!",
        text2: "Error supplying GHO. Try again.",
      });
    }
  };
  return (
    <View className="flex flex-col">
      <Text className="text-white mt-4">
        This is the amount of GHO that you want to supply to the pool. It will
        be converted into DAI.
      </Text>
      <View className="mx-auto">
        <AmountChooser
          dollars={supplyAmount}
          onSetDollars={setSupplyAmount}
          showAmountAvailable
          autoFocus
          lagAutoFocus={false}
        />
      </View>
      {balanceOfLoading ? (
        <ActivityIndicator animating={true} color={"#C9B3F9"} />
      ) : (
        <Text className="text-[#FFF] font-semibold text-center">
          ${balance.toFixed(2)} available
        </Text>
      )}
      <View className="mt-8 w-full">
        {isSupplying || isApproving || isApprovingGHO ? (
          <ActivityIndicator animating={true} color={"#C9B3F9"} />
        ) : (
          <AppButton
            text="Supply"
            onPress={() => executeSupply()}
            variant={canSupply ? "primary" : "disabled"}
          />
        )}
      </View>
    </View>
  );
}
