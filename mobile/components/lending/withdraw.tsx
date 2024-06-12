import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { ContractOptions, prepareContractCall } from "thirdweb";
import { erc20Abi, formatUnits, formatEther, parseEther } from "viem";
import {
  AAVE_POOL_ABI,
  DAI_ADDRESS,
  GHO_SEPOLIA_ADDRESS,
  SUPPLY_ROUTER_ADDRESS,
  daiContract,
} from "../../constants/sepolia";
import { useUserStore } from "../../store";
import AppButton from "../app-button";
import { useReadContract, useSendTransaction } from "thirdweb/react";

export default function LendingWithdraw({
  balanceData,
  balanceOfLoading,
  refetchBalance,
  refetchPoolBalance,
  aavePoolContract,
  ghoContract,
}: {
  balanceData: BigInt;
  balanceOfLoading: boolean;
  refetchBalance: () => void;
  refetchPoolBalance: () => void;
  aavePoolContract: ContractOptions<typeof AAVE_POOL_ABI>;
  ghoContract: ContractOptions<typeof erc20Abi>;
}) {
  const user = useUserStore((state) => state.user);
  const progress = useSharedValue(0);
  const min = useSharedValue(0);
  const max = useSharedValue(100);

  const [withdrawPercentage, setWithdrawPercentage] = useState(0);

  const { mutateAsync: withdraw, isPending: isWithdrawing } =
    useSendTransaction();
  const { mutateAsync: approve, isPending: isApproving } = useSendTransaction();

  const { data: approvalData } = useReadContract({
    contract: daiContract,
    method: "allowance",
    params: [user?.address!, SUPPLY_ROUTER_ADDRESS],
  });

  // const { contract: supplyRouterContract } = useContract(SUPPLY_ROUTER_ADDRESS);
  // const { mutateAsync: swap, isLoading: isSwapping } = useContractWrite(
  //   supplyRouterContract,
  //   "swapExactTokensForTokens"
  // );

  const {
    data: userData,
    isLoading,
    refetch,
  } = useReadContract({
    contract: aavePoolContract!,
    method: "getUserAccountData",
    params: [user?.address!],
  });

  const canWithdraw = withdrawPercentage && withdrawPercentage > 0;
  //   const withdrawable = parseFloat(formatUnits(userData[0].sub(userData[1]), 8));

  const executeWithdraw = async () => {
    try {
      const percentage = BigInt(Math.floor(withdrawPercentage));
      //   const withdrawAmountInWei = userData[0]
      //     .sub(userData[1])
      //     .mul(percentage)
      //     .div(100)
      //     .mul(toBigInt(10).pow(10));
      console.log(userData?.[3].toString());

      // const withdrawAmountInWei =
      //   userData &&
      //   userData[0] &&
      //   userData[0]
      //     .sub(userData[1])
      //     .mul(percentage)
      //     .div(100)
      //     .mul(90)
      //     .div(100)
      //     .mul(BigInt(10).pow(10));

      const withdrawAmountInWei = userData?.[0]
        ? parseEther(userData[0].toString())
        : BigInt(0);

      console.log(formatUnits(withdrawAmountInWei, 18));

      const transaction: any = prepareContractCall({
        contract: aavePoolContract,
        method: "withdraw",
        params: [DAI_ADDRESS, withdrawAmountInWei, user?.address!],
      });
      approve(transaction);

      if (approvalData && parseInt(formatEther(approvalData)) < 0) {
        const transaction: any = prepareContractCall({
          contract: daiContract,
          method: "approve",
          params: [SUPPLY_ROUTER_ADDRESS, BigInt(100)],
        });
        approve(transaction);
      }

      // const { receipt: swapReceipt } = await swap({
      //   args: [
      //     withdrawAmountInWei,
      //     withdrawAmountInWei,
      //     [DAI_ADDRESS, GHO_SEPOLIA_ADDRESS],
      //     user?.address,
      //     0,
      //   ],
      // });

      // if (swapReceipt) {
      //   setWithdrawPercentage(0);
      // }

      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Withdrawn GHO successfully.",
      });
      refetchBalance();
      refetchPoolBalance();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error!",
        text2: "Error withdrawing GHO. Try again.",
      });
    }
  };
  return (
    <View className="flex flex-col">
      <Text className="text-white mt-4 mb-4">
        This is the % of tokens in the pool that you will withdraw. 100% will
        withdraw everything from the pool.
      </Text>
      <View className="mb-2 text-white px-2 py-3 rounded-md flex flex-row items-center justify-between">
        <Slider
          onValueChange={(value) => {
            setWithdrawPercentage(value);
          }}
          maximumValue={max}
          minimumValue={min}
          progress={progress}
          bubble={(s) => `${s.toFixed(0)}`}
          theme={{
            disableMinTrackTintColor: "#fff",
            maximumTrackTintColor: "#53516C",
            minimumTrackTintColor: "#C9B3F9",
            cacheTrackTintColor: "#333",
            bubbleBackgroundColor: "#666",
          }}
        />
      </View>
      <View className="mt-2">
        {isWithdrawing || isApproving ? (
          <ActivityIndicator animating={true} color={"#C9B3F9"} />
        ) : (
          <AppButton
            text="Withdraw"
            onPress={() => executeWithdraw()}
            variant={canWithdraw ? "primary" : "disabled"}
          />
        )}
      </View>
    </View>
  );
}
