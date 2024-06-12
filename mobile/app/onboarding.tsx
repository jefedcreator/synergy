import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Switch, Text, TextInput, View } from "react-native";
import { ActivityIndicator, Appbar } from "react-native-paper";
import Toast from "react-native-toast-message";
import { prepareContractCall } from "thirdweb";
import {
  useActiveAccount,
  useReadContract,
  useSendTransaction,
} from "thirdweb/react";
import { formatEther } from "viem";
import AppButton from "../components/app-button";
import {
  AAVE_POOL_ADDRESS,
  usdcContract,
  usdtContract
} from "../constants/sepolia";
import { firebaseAuth, firebaseFirestore } from "../firebaseConfig";
import { useUserStore } from "../store";

const generatePassword = () => {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const passwordLength = 12;
  let password = "";
  for (let i = 0; i <= passwordLength; i++) {
    const randomNumber = Math.floor(Math.random() * chars.length);
    password += chars.substring(randomNumber, randomNumber + 1);
  }
  return password;
};

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);
  const [creationStatus, setCreationStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const address = useActiveAccount();
  const setUser = useUserStore((state) => state.setUser);

  const { data: approvalData } = useReadContract({
    contract: usdcContract,
    method: "allowance",
    params: [address?.address!, AAVE_POOL_ADDRESS],
  });

  const { mutateAsync: approveUSDC } = useSendTransaction();
  const { mutateAsync: approveUSDT } = useSendTransaction();

  const { data: approvalData2 } = useReadContract({
    contract: usdtContract,
    method: "allowance",
    params: [address?.address!, AAVE_POOL_ADDRESS],
  });

  useEffect(() => {
    if (address && approvalData && approvalData2) {
      step === 0 && createAccount(address.address);
    }
  }, [step, address, approvalData, approvalData2]);

  const createAccount = async (address: string) => {
    setCreationStatus("Creating user...");
    let password = await SecureStore.getItemAsync(`password-${address}`);
    if (!password) {
      password = generatePassword();
    }
    await SecureStore.setItemAsync(`password-${address}`, password);

    if (!firebaseAuth.currentUser) {
      try {
        await createUserWithEmailAndPassword(
          firebaseAuth,
          `${address}@ghost.app`,
          password
        );
      } catch (error) {
        await signInWithEmailAndPassword(
          firebaseAuth,
          `${address}@ghost.app`,
          password
        );
      }
    }

    if (approvalData && parseInt(formatEther(approvalData)) == 0) {
      setCreationStatus("Setting USDC approval...");
      const transaction: any = prepareContractCall({
        contract: usdcContract,
        method: "approve",
        params: [AAVE_POOL_ADDRESS, BigInt(100)],
        // gasLimit: 69322 * 1.5,
        maxFeePerGas: BigInt(4),
      });

      approveUSDC(transaction);
      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Approved USDC spending.",
      });
    }

    if (approvalData2 && parseInt(formatEther(approvalData2)) == 0) {
      setCreationStatus("Setting USDT approval...");
      const transaction: any = prepareContractCall({
        contract: usdtContract,
        method: "approve",
        params: [AAVE_POOL_ADDRESS, BigInt(100)],
        // gasLimit: 69322 * 1.5,
        maxFeePerGas: BigInt(4),
      });

      approveUSDT(transaction);
      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Approved USDT spending.",
      });
    }

    setCreationStatus("Approvals done.");

    setTimeout(() => {
      setStep(step + 1);
      setLoading(false);
    }, 1500);
  };

  const setFirebaseUsername = async () => {
    if (!address || loading) return;
    setLoading(true);
    try {
      const user = {
        address: address.address as `0x${string}`,
        username,
        rounding: isEnabled,
        createdAt: new Date().toISOString(),
        // smartWalletAddress: smartWalletAddresses![0],
      };
      await setDoc(
        doc(firebaseFirestore, "users", firebaseAuth.currentUser!.uid),
        user
      );
      setUser(user);
      setStep(step + 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const finishOnboarding = async () => {
    await setFirebaseUsername();
    await SecureStore.setItemAsync(`onboarding-${address}`, "true");
    router.push("/app/home");
  };

  return (
    <View className="flex-1 ">
      <Appbar.Header className="bg-[#201F2D] text-white">
        <Appbar.Content
          title="Onboarding"
          color="#fff"
          titleStyle={{ fontWeight: "bold" }}
        />
      </Appbar.Header>
      {step === 0 && (
        <View className="flex-1 flex-col items-center justify-center space-y-2 mx-4">
          <Text className="text-white font-semibold text-lg text-center">
            Creating your account, this might{"\n"} take a while.
          </Text>
          <Text className="text-[#53516C] text-center font-medium">
            {creationStatus}
          </Text>
          <ActivityIndicator animating={loading} color={"#C9B3F9"} />
        </View>
      )}
      {step === 1 && (
        <View className="flex flex-col flex-grow px-4 justify-between mb-12">
          {/* <Text className="text-white font-semibold text-xl">
            Choose your preferences
          </Text> */}
          <View className="w-full">
            <View>
              <Text className="text-[#C9B3F9] font-semibold my-2">
                Username
              </Text>
              <Text className="text-white mb-2">
                Other users will be able to find you via this name.
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                className="mb-2 text-white border-2 border-[#C9B3F9] px-2 py-3 rounded-md placeholder-white"
              />
              <View className="flex flex-row justify-between mt-8 mb-4">
                <Text className="max-w-[300px] text-white">
                  Set aside the remainder of each received transaction rounded
                  to the nearest dollar (if you receive $1.30 set aside $0.30).
                  This option is enabled by default.
                </Text>
                <Switch
                  trackColor={{ false: "black", true: "#C9B3F9" }}
                  thumbColor={"#201F2D"}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={toggleSwitch}
                  value={isEnabled}
                  disabled
                />
              </View>
            </View>
          </View>
          <AppButton
            text="Complete onboarding"
            variant={username.length > 3 ? "primary" : "disabled"}
            onPress={() => finishOnboarding()}
          />
        </View>
      )}
      {step === 2 && (
        <View className="flex-1 flex-col items-center justify-center space-y-2">
          <Text className="text-white font-semibold text-xl">
            Your account has been created!
          </Text>
          {/* <View className="w-full max-w-[300px]">
            <AppButton text="Enable notifications" onPress={() => {}} />
          </View> */}
          <View className="w-full max-w-[300px]">
            <AppButton
              text="Continue"
              variant="ghost"
              onPress={() => finishOnboarding()}
            />
          </View>
        </View>
      )}
    </View>
  );
}
