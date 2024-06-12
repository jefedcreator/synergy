import { useState } from "react";
import { Text, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Toast from "react-native-toast-message";
import { ContractOptions, prepareContractCall } from "thirdweb";
import { useReadContract, useSendTransaction } from "thirdweb/react";
import { erc20Abi, formatEther, formatUnits, parseEther } from "viem";
import { VAULT_ABI, VAULT_ADDRESS } from "../../constants/sepolia";
import { useUserStore } from "../../store/use-user-store";
import { AmountChooser } from "../amount-chooser";
import AppButton from "../app-button";

export default function VaultDeposit({
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
  const [depositAmount, setDepositAmount] = useState(0);
  const { mutateAsync: deposit, isPending: isDepositing } =
    useSendTransaction();

  const { mutateAsync: approve, isPending: isApproving } = useSendTransaction();

  const { data: approvalData } = useReadContract({
    contract: ghoContract,
    method: "allowance",
    params: [user?.address!, VAULT_ADDRESS],
  });

  const balance = parseFloat(
    formatUnits(balanceData.toString() as any, 18)
  ).toFixed(2);
  const canDeposit =
    depositAmount && depositAmount > 0 && parseFloat(balance) >= depositAmount;
  const executeDeposit = async () => {
    try {
      const depositAmountInWei = parseEther(depositAmount.toString());

      if (approvalData && parseInt(formatEther(approvalData)) == 0) {
        console.log("approving spending");
        const transaction: any = prepareContractCall({
          contract: ghoContract,
          method: "approve",
          params: [VAULT_ADDRESS, BigInt(100)],
        });

        approve(transaction);
      }

      const transaction: any = prepareContractCall({
        contract: vaultContract,
        method: "deposit",
        params: [depositAmountInWei, user?.address!],
      });

      const receipt = deposit(transaction);

      if ((await receipt).transactionHash) {
        setDepositAmount(0);
      }
      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Deposited GHO successfully.",
      });
      refetchBalance();
      refetchVaultBalance();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error!",
        text2: "Error depositing GHO. Try again.",
      });
    }
  };
  return (
    <View className="flex flex-col">
      <Text className="text-white mt-4">
        This is the amount of GHO that you will deposit in the GHO Vault. The
        actual amount of deposited tokens can be lower than the input one
        because of liquidity provisioning conditions.
      </Text>
      <View className="mx-auto">
        <AmountChooser
          dollars={depositAmount}
          onSetDollars={setDepositAmount}
          showAmountAvailable
          autoFocus
          lagAutoFocus={false}
        />
      </View>
      {balanceOfLoading ? (
        <ActivityIndicator animating={true} color={"#C9B3F9"} />
      ) : (
        <Text className="text-[#53516C] font-semibold text-center">
          ${balance} available
        </Text>
      )}
      <View className="mt-8 w-full">
        {isDepositing || isApproving ? (
          <ActivityIndicator animating={true} color={"#C9B3F9"} />
        ) : (
          <AppButton
            text="Deposit"
            onPress={() => executeDeposit()}
            variant={canDeposit ? "primary" : "disabled"}
          />
        )}
      </View>
    </View>
  );
}
