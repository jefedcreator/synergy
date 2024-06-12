import React, { ReactNode, useEffect } from "react";
import { Image, View } from "react-native";
import { useUserStore } from "../store/use-user-store";
import QRCode  from "react-native-qrcode-svg";

export default function QRcode({ children }: { children: ReactNode }) {
  const user = useUserStore((state) => state.user);
  // const [qrText, setQRText] = React.useState("");

  // useEffect(() => {
  //   if (user) {
  //     RNQRGenerator.generate({
  //       value: user?.address,
  //       height: 400,
  //       width: 400,
  //       correctionLevel: "H",
  //       base64: true,
  //     })
  //       .then((response) => {
  //         const { base64 } = response;
  //         base64 && setQRText(base64);
  //       })
  //       .catch((error) => console.error(error));
  //   }
  // }, [user]);

  if (!user?.address) return <></>;

  return (
    <View className="flex flex-col items-center justify-center mt-8 space-y-8">
      {/* <Image
        className="h-[300px] w-[300px] rounded-lg"
        source={{ uri: `data:image/png;base64,${qrText}` }}
      /> */}
      <QRCode
        value={user?.address as string}
        size={200}
        color="black"
        backgroundColor="white"
      />
      {children}
    </View>
  );
}
