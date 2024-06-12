import { Link, router } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import { Text, View } from "react-native";
import { ActivityIndicator, Appbar } from "react-native-paper";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome";
import { prepareContractCall } from "thirdweb";
import { useReadContract, useSendTransaction } from "thirdweb/react";
import { formatUnits } from "viem";
import AppButton from "../../components/app-button";
import {
  GHO_SEPOLIA_ADDRESS,
  aavePoolContract
} from "../../constants/sepolia";
import { firebaseFirestore } from "../../firebaseConfig";
import { useUserStore } from "../../store";

export default function BorrowModal() {
  const isPresented = router.canGoBack();
  const user = useUserStore((state) => state.user);
  const {
    data: userData,
    isLoading,
    refetch: refetchPoolBalance,
  } = useReadContract({
    contract: aavePoolContract,
    method: "getUserAccountData",
    params: [user?.address!],
  });

  const {
    mutateAsync: repay,
    data: approveData,
    isPending: repayLoading,
  } = useSendTransaction();

  const { mutateAsync: borrow, isPending: borrowLoading } =
    useSendTransaction();

  const canBorrow =
    userData && userData[2] ? parseInt(formatUnits(userData[2], 8)) > 0 : false;

  const canRepay =
    userData && userData[1] ? parseFloat(userData[1].toString()) > 0 : false;

  // const progress = useSharedValue(0);
  // const min = useSharedValue(0);
  // const max = useSharedValue(
  //   userData && userData[4] ? parseFloat(formatUnits(userData[4], 4)) : 0
  // );

  const executeBorrow = async () => {
    try {
      if (!userData || !user?.address) return;

      const trx: any = prepareContractCall({
        contract: aavePoolContract,
        method: "borrow",
        params: [GHO_SEPOLIA_ADDRESS, userData[2], BigInt(2), 0, user?.address],
      });

      const receipt = await repay(trx);
      const transaction = {
        txHash: receipt.transactionHash,
        blockNumber: receipt.maxBlocksWaitTime,
        from: user?.address,
        action: "Borrow",
        amount: formatUnits(userData[2], 8),
        createdAt: new Date().toISOString(),
      };
      await setDoc(
        doc(firebaseFirestore, "pockets", receipt.transactionHash),
        transaction
      );
      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Borrowed GHO successfully.",
      });

      router.back();
    } catch (error) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Error!",
        text2: "Error borrowing GHO. Try again.",
      });
    }
  };

  const executeRepay = async () => {
    try {
      if (!userData || !user?.address) return;
      const trx: any = prepareContractCall({
        contract: aavePoolContract,
        method: "repay",
        params: [GHO_SEPOLIA_ADDRESS, userData[1], BigInt(2), user?.address],
      });

      const receipt = await repay(trx);

      const transaction = {
        txHash: receipt.transactionHash,
        blockNumber: receipt.maxBlocksWaitTime,
        from: user?.address,
        action: "Repay",
        amount: formatUnits(userData[1], 8),
        createdAt: new Date().toISOString(),
      };

      await setDoc(
        doc(firebaseFirestore, "pockets", receipt.transactionHash),
        transaction
      );
      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Repayed GHO successfully.",
      });
      router.back();
    } catch (error) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Error!",
        text2: "Error repaying GHO. Try again.",
      });
    }
  };

  return (
    <View className="flex-1 flex-col px-4 bg-[#201F2D]">
      {!isPresented && <Link href="../">Dismiss</Link>}
      <Appbar.Header
        elevated={false}
        statusBarHeight={0}
        className="bg-[#201F2D] text-white"
      >
        <Appbar.Content
          title="Borrow GHO"
          color="#fff"
          titleStyle={{ fontWeight: "bold" }}
        />
        <Appbar.Action
          icon={() => <Icon name="close" size={24} color="#FFF" />}
          onPress={() => router.back()}
          color="#fff"
          size={20}
        />
      </Appbar.Header>
      <Text className="text-white font-semibold mt-2 text-lg">
        Here you can borrow GHO using the collateral that was automatically
        deposited by GHOst.
      </Text>
      {isLoading || !userData ? (
        <View className="mt-4">
          <ActivityIndicator animating={true} color={"#C9B3F9"} />
        </View>
      ) : (
        <View>
          {/* <Text className="text-[#53516C] font-semibold mt-8">
            Total collateral base (USD)
          </Text>
          <Text className="text-white font-semibold mt-2">
            $
            {userData[0]
              ? parseFloat(userData[0].div(GHO_ASSET_PRICE).toString()).toFixed(
                  2
                )
              : "0.00"}
          </Text> */}
          <Text className="text-[#53516C] font-semibold mt-4">
            Borrowable GHO
          </Text>
          <Text className="text-white font-semibold mt-1 text-lg">
            {userData[2]
              ? parseFloat(formatUnits(userData[2], 8)).toFixed(2)
              : "0.00"}
            GHO
          </Text>
          {/* <Text className="text-[#53516C] font-semibold mt-4">
            Maximum LTV (loan-to-value)
          </Text>
          <Text className="text-white font-semibold mt-2">
            {formatUnits(userData[4], 4)}
          </Text>
          <Text className="text-[#53516C] font-semibold mt-4">
            Health Factor
          </Text>
          <Text className="text-white font-semibold mt-2">
            {parseFloat(formatUnits(userData[5], 18)).toFixed(2)}%
          </Text> */}
          {/* <Slider progress={progress} minimumValue={min} maximumValue={max} /> */}
          <View className="mt-4">
            {borrowLoading ? (
              <ActivityIndicator animating={true} color={"#C9B3F9"} />
            ) : (
              <AppButton
                text={
                  canBorrow
                    ? `Borrow ${formatUnits(userData[2], 8)} GHO`
                    : "Not enough collateral"
                }
                variant={canBorrow ? "primary" : "disabled"}
                onPress={() => executeBorrow()}
              />
            )}
          </View>
          <Text className="text-[#53516C] font-semibold mt-4">
            Amount borrowed
          </Text>
          <Text className="text-white font-semibold mt-1 text-lg">
            {userData[1]
              ? parseFloat(formatUnits(userData[1], 8)).toFixed(2)
              : "0.00"}{" "}
            GHO
          </Text>
          <View className="mt-4">
            {repayLoading ? (
              <ActivityIndicator animating={true} color={"#C9B3F9"} />
            ) : (
              <AppButton
                text={
                  canRepay
                    ? `Repay ${parseFloat(formatUnits(userData[1], 8)).toFixed(
                        2
                      )} GHO`
                    : "Not enough debt"
                }
                variant={canRepay ? "primary" : "disabled"}
                onPress={() => executeRepay()}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
}
