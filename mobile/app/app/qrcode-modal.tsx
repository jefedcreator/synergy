import { BarcodeScanningResult, Camera, CameraView } from "expo-camera";
import { Link, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Dimensions,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Appbar } from "react-native-paper";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome";
import { shortenAddress } from "thirdweb/utils";
import QRcode from "../../components/qrcode";
import { SegmentSlider } from "../../components/segment-slider";
import { useUserStore } from "../../store/use-user-store";

type QRScreenOptions = "PAY ME" | "SCAN";

const { height } = Dimensions.get("window");

export default function QRCodeModal({ option }: { option?: QRScreenOptions }) {
  const isPresented = router.canGoBack();
  const user = useUserStore((state) => state.user);
  const [tab, setTab] = useState<QRScreenOptions>(option || "PAY ME");
  const tabs = useRef(["PAY ME", "SCAN"] as QRScreenOptions[]).current;
  const title = tab === "PAY ME" ? "Display QR Code" : "Scan QR Code";
  return (
    <View className="flex-1 flex-col px-4 bg-[#0052FF]">
      {!isPresented && <Link href="../">Dismiss</Link>}
      <Appbar.Header className="bg-[#0052FF] text-white">
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
    setScanned(true);
    // alert(`Bar code with type ${type} and data ${data} has been scanned!`);
    try {
      console.log("scanned data", data.split(":")[1]);
      const recipient = data.split(":")[1];
      if (recipient) {
        router.push({
          pathname: "/app/transfer-modal",
          params: {
            recipient,
          },
        });
        setDone(true);
      } else {
        throw new Error();
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Transfer error!",
        text2: "GHO Transfer failed",
      });
      console.error("error", error);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {!done && (
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "pdf417"],
          }}
          style={styles.cameraView}
        />
      )}
      {scanned && (
        <Button
          title={"Tap to Scan Again"}
          onPress={() => {
            setDone(false);
            setScanned(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  cameraView: {
    height: height / 2,
    width: "100%",
  },
});
