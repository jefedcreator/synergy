import { contract, sepolia } from "@/constants/sepolia";
import { firebaseFirestore } from "@/firebaseConfig";
import { BarCodeScannedCallback } from "expo-barcode-scanner";
import { Link, router } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import { useRef, useState } from "react";
import { Pressable, Share, Text, View } from "react-native";
import { ActivityIndicator, Appbar } from "react-native-paper";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { shortenAddress } from "thirdweb/utils";
import { parseEther } from "viem";
import QRcode from "../../components/qrcode";
import { Scanner } from "../../components/scanner";
import { SegmentSlider } from "../../components/segment-slider";
import { useUserStore } from "../../store/use-user-store";

type QRScreenOptions = "PAY ME" | "SCAN";

export default function QRCodeModal({ option }: { option?: QRScreenOptions }) {
  const isPresented = router.canGoBack();
  const user = useUserStore((state) => state.user);
  const [tab, setTab] = useState<QRScreenOptions>(option || "PAY ME");
  const tabs = useRef(["PAY ME", "SCAN"] as QRScreenOptions[]).current;
  const title = tab === "PAY ME" ? "Display QR Code" : "Scan QR Code";
  return (
    <View className="flex-1 flex-col px-4 bg-[#201F2D]">
      {!isPresented && <Link href="../">Dismiss</Link>}
      <Appbar.Header className="bg-[#201F2D] text-white">
        <Appbar.Content
          title={title}
          color="#fff"
          titleStyle={{ fontWeight: "bold" }}
        />
        <Appbar.Action
          icon={() => <Icon name="close" size={24} color="#FFF" />}
          onPress={() => {
            router.back();
          }}
          color="#fff"
          size={20}
        />
      </Appbar.Header>
      <SegmentSlider {...{ tabs, tab, setTab }} />
      {tab === "PAY ME" && (
        <QRcode
          children={
            <View className="flex flex-row items-center space-x-4">
              <View className="flex flex-col items-center">
                <Text className="text-white font-semibold text-lg text-center">
                  {user?.username}
                </Text>
                <Text className="text-[#53516C] font-semibold text-md">
                  {shortenAddress(user?.address || "")}
                </Text>
              </View>
              <Pressable
                onPress={async () => {
                  await Share.share({
                    message: user!.address,
                  });
                }}
              >
                <Icon
                  name="share-square-o"
                  size={24}
                  color="#FFFFFF"
                  className="ml-auto"
                ></Icon>
              </Pressable>
            </View>
          }
        />
      )}
      {tab === "SCAN" && <QRScan />}
    </View>
  );
}

function QRScan() {
  const user = useUserStore((state) => state.user);
  const [handled, setHandled] = useState(false);
  const { mutateAsync: transfer, isPending: transferLoading } =
    useSendTransaction();
  const [loading, setLoading] = useState(false);
  console.log("url", sepolia);

  const handleBarCodeScanned: BarCodeScannedCallback = async ({ data }) => {
    if (handled) return;
    setLoading(true);

    try {
      console.log("scanned data", data.split(":")[1]);
      const recipient = data.split(":")[1];
      
      const trx: any = prepareContractCall({
        contract,
        method: "transfer",
        params: [recipient, parseEther("0.01")],
      });
      const { chain, client, transactionHash } = await transfer(trx);
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
        amount: "0.01",
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
        text2: "GHO Transfer successful",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Transfer error!",
        text2: "GHO Transfer failed",
      });
      console.error("error", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <ActivityIndicator animating={transferLoading} color={"#FFF"} />;
  }
  return <Scanner handleBarCodeScanned={handleBarCodeScanned} />;
}
