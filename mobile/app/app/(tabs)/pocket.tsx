import { aavePoolContract, vaultContract } from "../../../constants/sepolia";
import { useUserStore } from "../../../store";
import { Redirect, router, useNavigation } from "expo-router";
import { useEffect } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Appbar } from "react-native-paper";
import Icon from "react-native-vector-icons/FontAwesome";
import { useReadContract } from "thirdweb/react";
import { formatUnits } from "viem";

export default function Pocket() {
  const user = useUserStore((state) => state.user);
  const {
    data: userData,
    isLoading,
    refetch,
  } = useReadContract({
    contract: aavePoolContract,
    method: "getUserAccountData",
    params: [user?.address!],
  });

  const {
    data: userVaultBalance,
    isLoading: isTotalAssetLoading,
    refetch: refetchVaultBalance,
  } = useReadContract({
    contract: vaultContract,
    method: "totalAssetsOfUser",
    params: [user?.address!],
  });

  const vaultBalance = userVaultBalance
    ? parseFloat(formatUnits(userVaultBalance, 18))
    : 0;

  const aaveLendingBalance = userData
    ? parseFloat(formatUnits(userData[0], 8))
    : 0;
  const navigation = useNavigation();

  useEffect(() => {
    const refresh = () => {
      refetch();
      refetchVaultBalance();
    };

    navigation.addListener("focus", refresh);

    return () => {
      navigation.removeListener("focus", refresh);
    };
  }, []);

  if (!user) {
    return <Redirect href={"/"} />;
  }

  return (
    <>
      <Appbar.Header className="bg-[#0052FF] text-white">
        <Appbar.BackAction
          onPress={() => router.back()}
          color="#fff"
          size={20}
        />
        <Appbar.Content
          title="Pocket"
          color="#fff"
          titleStyle={{ fontWeight: "bold" }}
        />
        <Appbar.Action
          icon={() => <Icon name="info-circle" size={24} color="#FFF" />}
          onPress={() => router.push("/app/pocket-info-modal")}
        />
      </Appbar.Header>
      <View className="flex-1 flex-col items-center w-full px-4 bg-[#0052FF]">
        <View className="px-14">
          <View className="flex flex-col space-y-4 pb-8 pt-4">
            <Text className="text-white font-semibold text-center">
              Pocket balance
            </Text>
            <Text className="text-white font-bold text-center text-5xl">
              ${(vaultBalance + aaveLendingBalance).toFixed(2)}
            </Text>
          </View>
        </View>
        <Pressable
          className="border-2 border-[#C9B3F9] w-full p-3 rounded-lg flex flex-row items-center justify-between mt-4"
          onPress={() => router.push("/app/aave-lending-modal")}
        >
          <View className="flex flex-row space-x-2 items-center">
            <Image
              source={require("../../../assets/images/ghost.png")}
              className="h-14 w-14"
            />
            <View className="flex flex-col items-start">
              <Text className="text-white text-lg font-black text-center">
                AAVE Lending
              </Text>
              <Text className="text-white/80 font-semibold">
                ${aaveLendingBalance.toFixed(2)}
              </Text>
            </View>
          </View>
          <View className="flex flex-row items-center space-x-4 justify-between">
            <View className="flex flex-col mr-6 items-end">
              <Text className="text-lg text-emerald-500 font-semibold">
                1.50%
              </Text>
              <Text className="text-[#FFF]">APY</Text>
            </View>
            <Icon name="chevron-right" size={16} color="#C9B3F9" />
          </View>
        </Pressable>
        <Pressable
          className="border-2 border-[#C9B3F9] w-full p-3 rounded-lg flex flex-row items-center justify-between mt-4"
          onPress={() => router.push("/app/vault-modal")}
        >
          <View className="flex flex-row space-x-2 items-center">
            <Image
              source={require("../../../assets/images/ghost.png")}
              className="h-14 w-14"
            />
            <View className="flex flex-col items-start">
              <Text className="text-white text-lg font-black text-center">
                USDC Vault
              </Text>
              <Text className="text-white/80 font-semibold">
                ${vaultBalance.toFixed(2)}
              </Text>
            </View>
          </View>
          <View className="flex flex-row items-center space-x-4 justify-between">
            <View className="flex flex-col mr-6 items-end">
              <Text className="text-lg text-emerald-500 font-semibold">
                3.00%
              </Text>
              <Text className="text-[#FFF]">APY</Text>
            </View>
            <Icon name="chevron-right" size={16} color="#C9B3F9" />
          </View>
        </Pressable>
        {/* <View className="my-8 flex items-center w-full">
          <View className="px-14">
            <View className="flex flex-col space-y-4 pb-8 pt-4">
              <Text className="text-white font-semibold text-center">
                Borrow balance
              </Text>
              <Text className="text-white font-bold text-center text-5xl">
                $
                {userData && userData[1]
                  ? parseFloat(
                      userData[1].div(GHO_ASSET_PRICE).toString()
                    ).toFixed(2)
                  : "0.00"}
              </Text>
            </View>
          </View>
          <View className="w-full">
            <AppButton
              text="Borrow USDC"
              onPress={() => router.push("/app/borrow-modal")}
            />
          </View>
        </View> */}
      </View>
    </>
  );
}
