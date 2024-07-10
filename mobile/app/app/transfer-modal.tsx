import { Link, router, useLocalSearchParams } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { ActivityIndicator, Appbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome";
import {
  PreparedTransaction,
  prepareContractCall,
  sendTransaction,
  waitForReceipt,
} from "thirdweb";
import {
  useActiveAccount,
  useReadContract,
  useSendTransaction,
} from "thirdweb/react";
import { shortenAddress } from "thirdweb/utils";
import { formatEther, formatUnits, parseEther, parseUnits } from "viem";
import { AmountChooser } from "../../components/amount-chooser";
import AppButton from "../../components/app-button";
import { usdcContract } from "../../constants/sepolia";
import { firebaseFirestore } from "../../firebaseConfig";
import { useUserStore } from "../../store";

const EXAMPLE_CROSS_CHAIN_ADDRESS =
  "0x1358155a15930f89eBc787a34Eb4ccfd9720bC62";

export default function TransferModal() {
  const isPresented = router.canGoBack();
  router.canDismiss();
  console.log("canDismiss", router.canDismiss());
  const user = useUserStore((state) => state.user);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams<{ recipient?: string }>();

  const { mutateAsync: transfer, isPending: transferLoading } =
    useSendTransaction();
  console.log("params", params.recipient);
  console.log("isPresented", isPresented);
  const smartAccount = useActiveAccount();
  console.log("smartAccount", smartAccount?.address);

  const {
    data: balanceData,
    isLoading: balanceOfLoading,
    refetch: refetchBalance,
  } = useReadContract({
    contract: usdcContract,
    method: "balanceOf",
    params: [user?.address!],
  });

  const balance = balanceData ? parseFloat(formatUnits(balanceData, 6)) : 0;

  const canSend = Number(amount) <= Number(balance) && Number(amount) > 0;

  useEffect(() => {
    if (!params.recipient) router.push("/app/qrcode-modal");
  }, [params]);

  const TransferUSDC = async () => {
    const { recipient } = params;
    if (!recipient || !smartAccount) return;
    setLoading(true);

    try {
      const trx: PreparedTransaction<any> = prepareContractCall({
        contract: usdcContract,
        method: "transfer",
        params: [recipient, parseUnits(amount.toString(), 6)],
      });

      const { chain, client, transactionHash } = await sendTransaction({
        transaction: trx,
        account: smartAccount,
      });

      // const { chain, client, transactionHash } = await transfer(trx);
      const txreceipt = await waitForReceipt({
        client,
        chain,
        transactionHash,
      });
      const transaction = {
        txHash: txreceipt.transactionHash as string,
        blockNumber: txreceipt?.blockNumber?.toString(),
        from: user?.address as string,
        fromUsername: user?.username,
        to: recipient,
        toUsername: "",
        amount,
        createdAt: new Date().toISOString(),
      };
      await setDoc(
        doc(firebaseFirestore, "transactions", txreceipt.transactionHash),
        transaction
      );
      console.log("Sent!");
      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "USDC Transfer successful",
      });
      router.navigate("/app/home");
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error!",
        text2: "An error has occurred. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 flex-col px-4 bg-[#0052FF]">
      {!isPresented && <Link href="../">Dismiss</Link>}
      <Appbar.Header
        elevated={false}
        statusBarHeight={0}
        className="bg-[#0052FF] text-white"
      >
        <Appbar.Content
          title="Send USDC"
          color="#fff"
          titleStyle={{ fontWeight: "bold" }}
        />
        <Appbar.Action
          icon={() => <Icon name="close" size={24} color="#FFF" />}
          onPress={() => {
            console.log("Click??");

            router.dismiss();
          }}
          color="#fff"
          size={20}
        />
      </Appbar.Header>
      <View className="flex flex-col items-center mt-4 space-y-2">
        {/* <Avatar name={sendUser?.username.charAt(0).toUpperCase()} />
        <Text className="text-white text-lg text-center font-semibold">
          {sendUser?.username}
        </Text> */}
        <Text className="text-[#FFF] text-ellipsis">
          {shortenAddress(params.recipient || "")}
          {/* {isCrossChain && ` • ${sendUser?.chain}`} */}
          {` • Base sepolia`}
        </Text>

        <AmountChooser
          dollars={amount}
          onSetDollars={setAmount}
          showAmountAvailable
          autoFocus={false}
          lagAutoFocus={false}
        />
        {balanceOfLoading ? (
          <ActivityIndicator animating={true} color={"#C9B3F9"} />
        ) : (
          <Text className="text-[#FFF] font-semibold">
            ${balance.toFixed(2)} available
          </Text>
        )}
      </View>
      <SafeAreaView className="mt-auto">
        {transferLoading ||
        // isApproveLoading ||
        // isSendCrossChainLoading ||
        loading ? (
          <ActivityIndicator animating={true} color={"#C9B3F9"} />
        ) : (
          <View className="flex flex-row justify-between">
            <View className="flex-1 mx-2">
              <AppButton
                text="Cancel"
                onPress={() => {
                  router.dismiss();
                }}
                variant="ghost"
              />
            </View>
            <View className="flex-1 mx-2">
              <AppButton
                text={"Send"}
                onPress={TransferUSDC}
                variant={canSend ? "primary" : "disabled"}
              />
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
