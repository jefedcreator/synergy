import { Modal, Portal } from "react-native-paper";
import { Text, View } from "react-native";
import AppButton from "../app-button";
import { firebaseAuth } from "../../firebaseConfig";
import Spacer from "../spacer";
import { useDisconnect, useActiveWallet } from "thirdweb/react";
import { router } from "expo-router";

export default function LogoutModal({
  visible,
  hideModal,
}: {
  visible: boolean;
  hideModal: () => void;
}) {
  const { disconnect } = useDisconnect();
  const wallet = useActiveWallet();

  return (
    <Portal>
      <Modal visible={visible} onDismiss={hideModal}>
        <View className="bg-[#0052FF] rounded-lg p-4 mx-4">
          <Text className="text-center text-white">
            Are you sure you want to logout?
          </Text>
          <Text className="text-center text-white mb-4">
            You will need to login again if confirmed.
          </Text>
          <AppButton
            text="CONFIRM LOGOUT"
            variant="ghost"
            onPress={async () => {
              await firebaseAuth.signOut();
              console.log("logged out!!");
              if (wallet) {
                disconnect(wallet);
              }
              router.push("../");
            }}
          />
          <Spacer h={16} />
          <AppButton
            text="CANCEL"
            variant="primary"
            onPress={() => {
              hideModal();
            }}
          />
        </View>
      </Modal>
    </Portal>
  );
}
