import { Link, router } from "expo-router";
import React, { useRef, useState } from "react";
import { Text, View } from "react-native";
import { Appbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome";
import { useReadContract } from "thirdweb/react";
import { formatEther, formatUnits } from "viem";
import LendingBorrow from "../../components/lending/borrow";
import LendingSupply from "../../components/lending/supply";
import LendingWithdraw from "../../components/lending/withdraw";
import { SegmentSlider } from "../../components/segment-slider";
import Spacer from "../../components/spacer";
import {
  aavePoolContract,
  contract
} from "../../constants/sepolia";
import { useUserStore } from "../../store";

type AAVELendingScreenOptions = "SUPPLY" | "WITHDRAW" | "BORROW";

export default function AAVELendingModal({
  option,
}: {
  option?: AAVELendingScreenOptions;
}) {
  const user = useUserStore((state) => state.user);
  const {
    data: balance,
    isLoading: balanceOfLoading,
    refetch: refetchBalance,
  } = useReadContract({
    contract,
    method: "balanceOf",
    params: [user?.address!],
  });

  const {
    data: userData,
    isLoading,
    refetch: refetchPoolBalance,
  } = useReadContract({
    contract: aavePoolContract,
    method: "getUserAccountData",
    params: [user?.address!],
  });

  const [tab, setTab] = useState<AAVELendingScreenOptions>(option || "BORROW");
  const tabs = useRef([
    "BORROW",
    "SUPPLY",
    "WITHDRAW",
  ] as AAVELendingScreenOptions[]).current;

  const readableUserBalance = userData
    ? parseFloat(formatUnits(userData[0], 8))
    : 0;

  const readableUserBorrowBalance = userData
    ? parseFloat(formatUnits(userData[1], 8))
    : 0;

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
          title="AAVE Lending"
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
            Your AAVE Pool balance
          </Text>
          <Text className="text-white font-bold text-center text-5xl">
            ${readableUserBalance.toFixed(2)}
          </Text>
        </View>
        <View className="flex flex-row items-center justify-around space-x-4">
          <View className="flex flex-col space-y-1 items-center w-48">
            <Text className="text-[#53516C] font-semibold">Balance</Text>
            <Text className="text-white text-2xl font-bold text-center">
              ${balance ? parseInt(formatEther(balance)).toFixed(2) : 0}
            </Text>
          </View>
          <View className="flex flex-col space-y-1 items-center w-48">
            <Text className="text-[#53516C] font-semibold">Borrowed</Text>
            <Text className="text-white text-2xl font-bold text-center">
              ${readableUserBorrowBalance.toFixed(2)}
            </Text>
          </View>
          <View className="flex flex-col space-y-1 items-center w-48">
            <Text className="text-[#53516C] font-semibold">APY</Text>
            <Text className="text-white text-2xl font-bold text-center">
              1.50%
            </Text>
          </View>
        </View>
        <Spacer h={24} />
        <SegmentSlider {...{ tabs, tab, setTab }} />
        {tab === "BORROW" && (
          <LendingBorrow
            balanceOfLoading={balanceOfLoading}
            refetchBalance={refetchBalance}
            refetchPoolBalance={refetchPoolBalance}
            ghoContract={contract}
            aavePoolContract={aavePoolContract}
          />
        )}
        {tab === "SUPPLY" && (
          <LendingSupply
            balanceData={balance || BigInt(0)}
            balanceOfLoading={balanceOfLoading}
            refetchBalance={refetchBalance}
            refetchPoolBalance={refetchPoolBalance}
            ghoContract={contract}
            aavePoolContract={aavePoolContract}
          />
        )}
        {tab === "WITHDRAW" && (
          <LendingWithdraw
            balanceData={balance || BigInt(0)}
            balanceOfLoading={balanceOfLoading}
            refetchBalance={refetchBalance}
            refetchPoolBalance={refetchPoolBalance}
            ghoContract={contract}
            aavePoolContract={aavePoolContract}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
