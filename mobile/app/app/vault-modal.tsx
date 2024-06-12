import { Link, router } from "expo-router";
import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { Appbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome";
import { useReadContract } from "thirdweb/react";
import { formatEther } from "viem";
import { SegmentSlider } from "../../components/segment-slider";
import Spacer from "../../components/spacer";
import VaultDeposit from "../../components/vault/deposit";
import VaultWithdraw from "../../components/vault/withdraw";
import {
  contract,
  vaultContract
} from "../../constants/sepolia";
import { useUserStore } from "../../store";

type VaultScreenOptions = "DEPOSIT" | "WITHDRAW";

export default function VaultModal({
  option,
}: {
  option?: VaultScreenOptions;
}) {
  const user = useUserStore((state) => state.user);

  const {
    data: balanceData,
    isLoading: balanceOfLoading,
    refetch: refetchBalance,
  } = useReadContract({
    contract,
    method: "balanceOf",
    params: [user?.address!],
  });

  // const { contract: vaultContract } = useContract(VAULT_ADDRESS, VAULT_ABI);

  const [tab, setTab] = useState<VaultScreenOptions>(option || "DEPOSIT");
  const tabs = useRef(["DEPOSIT", "WITHDRAW"] as VaultScreenOptions[]).current;

  const { data: totalShares } = useReadContract({
    contract: vaultContract,
    method: "totalAssets",
  });

  const { data: userBalance, refetch: refetchVaultBalance } = useReadContract({
    contract: vaultContract,
    method: "totalAssetsOfUser",
    params: [user?.address!],
  });



  const isPresented = router.canGoBack();
  return (
    <SafeAreaView
      className="flex-1 flex-col bg-[#201F2D]"
      edges={{ top: "off" }}
    >
      {!isPresented && <Link href="../">Dismiss</Link>}
      <Appbar.Header
        elevated={false}
        statusBarHeight={0}
        className="bg-[#201F2D] text-white"
      >
        <Appbar.Content
          title="GHO Vault"
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
      <View className="flex flex-col px-4 mt-2 bg-[#201F2D]">
        <View className="px-14 pb-8">
          <Text className="text-white font-semibold text-center mb-4">
            Your Vault balance
          </Text>
          <Text className="text-white font-bold text-center text-5xl">
            ${userBalance ? parseFloat(formatEther(userBalance)).toFixed(2) : 0}
          </Text>
        </View>
        <View className="flex flex-row items-center justify-around space-x-4">
          <View className="flex flex-col space-y-1 items-center w-48">
            <Text className="text-[#53516C] font-semibold">Balance</Text>
            <Text className="text-white text-2xl font-bold text-center">
              $
              {balanceData
                ? parseFloat(formatEther(balanceData)).toFixed(2)
                : 0}
            </Text>
          </View>
          <View className="flex flex-col space-y-1 items-center text-center w-48">
            <Text className="text-[#53516C] font-semibold text-center">
              Vault Balance
            </Text>
            <Text className="text-white text-2xl font-bold text-center">
              $
              {totalShares
                ? parseFloat(formatEther(totalShares)).toFixed(2)
                : 0}
            </Text>
          </View>
          <View className="flex flex-col space-y-1 items-center w-48">
            <Text className="text-[#53516C] font-semibold">APY</Text>
            <Text className="text-white text-2xl font-bold text-center">
              3.00%
            </Text>
          </View>
        </View>
        <Spacer h={24} />
        <SegmentSlider {...{ tabs, tab, setTab }} />
        {tab === "DEPOSIT" && (
          <VaultDeposit
            balanceData={balanceData || BigInt(0)}
            balanceOfLoading={balanceOfLoading}
            refetchBalance={refetchBalance}
            refetchVaultBalance={refetchVaultBalance}
            ghoContract={contract}
            vaultContract={vaultContract}
          />
        )}
        {tab === "WITHDRAW" && (
          <VaultWithdraw
            balanceData={balanceData || BigInt(0)}
            balanceOfLoading={balanceOfLoading}
            refetchBalance={refetchBalance}
            refetchVaultBalance={refetchVaultBalance}
            ghoContract={contract}
            vaultContract={vaultContract}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
