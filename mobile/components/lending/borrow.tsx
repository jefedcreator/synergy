import { useState } from "react";
import { Text, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Toast from "react-native-toast-message";
import { ContractOptions, prepareContractCall } from "thirdweb";
import { useReadContract, useSendTransaction } from "thirdweb/react";
import { erc20Abi, formatUnits, parseEther } from "viem";
import { AAVE_POOL_ABI, GHO_SEPOLIA_ADDRESS } from "../../constants/sepolia";
import { useUserStore } from "../../store/use-user-store";
import { AmountChooser } from "../amount-chooser";
import AppButton from "../app-button";

export default function LendingBorrow({
  balanceOfLoading,
  refetchBalance,
  refetchPoolBalance,
  aavePoolContract,
  ghoContract,
}: {
  balanceOfLoading: boolean;
  refetchBalance: () => void;
  refetchPoolBalance: () => void;
  aavePoolContract: ContractOptions<typeof AAVE_POOL_ABI>;
  ghoContract: ContractOptions<typeof erc20Abi>;
}) {
  const user = useUserStore((state) => state.user);
  const [borrowAmount, setBorrowAmount] = useState(0);
  const {
    mutateAsync: borrow,
    data: borrowData,
    isPending: isBorrowing,
  } = useSendTransaction();

  const {
    mutateAsync: approve,
    data: approveData,
    isPending: isApproving,
  } = useSendTransaction();

  const {
    data: userData,
    isLoading,
    refetch,
  } = useReadContract({
    contract: aavePoolContract!,
    method: "getUserAccountData",
    params: [user?.address!],
  });

  const canBorrow =
    userData && userData[2]
      ? parseFloat(formatUnits(userData[2], 8).toString()) > 0
      : false;

  const executeBorrow = async () => {
    try {
      const borrowAmountInWei = parseEther(borrowAmount.toString());

      const transaction: any = prepareContractCall({
        contract: aavePoolContract!,
        method: "borrow",
        params: [
          GHO_SEPOLIA_ADDRESS,
          borrowAmountInWei,
          BigInt(2),
          0,
          user?.address!,
        ],
      });

      const tx = borrow(transaction);

      if ((await tx).transactionHash) {
        setBorrowAmount(0);
      }
      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Borrowed GHO successfully.",
      });
      refetchBalance();
      refetchPoolBalance();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error!",
        text2: "Error borrowing GHO. Try again.",
      });
    }
  };
  return (
    <View className="flex flex-col">
      <Text className="text-white mt-4">
        This is amount of GHO that you want to borrow.
      </Text>
      <View className="mx-auto">
        <AmountChooser
          dollars={borrowAmount}
          onSetDollars={setBorrowAmount}
          showAmountAvailable
          autoFocus
          lagAutoFocus={false}
        />
      </View>
      {balanceOfLoading ? (
        <ActivityIndicator animating={true} color={"#C9B3F9"} />
      ) : (
        <>
          <Text className="text-[#FFF] font-semibold text-center">
            $
            {userData && userData[2]
              ? parseFloat(formatUnits(userData[2], 8)).toFixed(2)
              : "0.00"}
            borrowable
          </Text>
          {/* 
          <Text className="text-[#FFF] font-semibold">
            ${formatUnits(userData[1], 8)} borrowed
          </Text> */}
        </>
      )}
      <View className="mt-8 w-full">
        {isBorrowing || isApproving ? (
          <ActivityIndicator animating={true} color={"#C9B3F9"} />
        ) : (
          <AppButton
            text="Borrow"
            onPress={() => executeBorrow()}
            variant={canBorrow ? "primary" : "disabled"}
          />
        )}
      </View>
    </View>
  );
}
