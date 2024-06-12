import { VAULT_ABI } from "@/constants/sepolia";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { ContractOptions, prepareContractCall } from "thirdweb";
import { useReadContract, useSendTransaction } from "thirdweb/react";
import { erc20Abi } from "viem";
import { useUserStore } from "../../store";
import AppButton from "../app-button";

export default function VaultWithdraw({
  balanceData,
  balanceOfLoading,
  refetchBalance,
  refetchVaultBalance,
  vaultContract,
  ghoContract,
}: {
  balanceData: bigint;
  balanceOfLoading: boolean;
  refetchBalance: () => void;
  refetchVaultBalance: () => void;
  vaultContract: ContractOptions<typeof VAULT_ABI>;
  ghoContract: ContractOptions<typeof erc20Abi>;
}) {
  const user = useUserStore((state) => state.user);
  const progress = useSharedValue(0);
  const min = useSharedValue(0);
  const max = useSharedValue(100);
  const { data: userShares } = useReadContract({
    contract: vaultContract,
    method: "balanceOf",
    params: [user?.address!],
  });

  const [withdrawPercentage, setWithdrawPercentage] = useState(0);

  const { mutateAsync: withdraw, isPending: isWithdrawing } =
    useSendTransaction();

  const canWithdraw = withdrawPercentage && withdrawPercentage > 0;

  const executeWithdraw = async () => {
    try {
      const percentage = BigInt(Math.floor(withdrawPercentage));
      const withdrawAmountInWei =
        userShares && percentage
          ? (userShares * percentage) / BigInt(100)
          : BigInt(0);

      const transaction: any = prepareContractCall({
        contract: vaultContract,
        method: "withdraw",
        params: [withdrawAmountInWei, user?.address!, user?.address!],
      });
      const receipt = withdraw(transaction);
      if ((await receipt).transactionHash) {
        setWithdrawPercentage(0);
      }
      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Withdrawn GHO successfully.",
      });
      refetchBalance();
      refetchVaultBalance();
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
        This is the % of GHO in the vault that you will withdraw. 100% will
        withdraw all of your GHO.
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
        {isWithdrawing ? (
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
