import Avatar from "@/components/avatar";
import CircularButton from "@/components/circular-button";
import TransactionsList from "@/components/transactions-list";
import { contract } from "@/constants/sepolia";
import { firebaseFirestore } from "@/firebaseConfig";
import { getUserTransactions } from "@/lib/firestore";
import { useUserStore } from "@/store";
import { DBTransaction } from "@/store/interfaces";
import { useTransactionsStore } from "@/store/use-transactions-store";
import { Link, Redirect, router, useNavigation } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import * as React from "react";
import { ImageBackground, SafeAreaView, Text, View } from "react-native";
import { ActivityIndicator, IconButton } from "react-native-paper";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome";
import { balanceOf } from "thirdweb/extensions/erc20";
import {
  useConnectedWallets,
  useReadContract
} from "thirdweb/react";
import { formatEther } from "viem";

export default function Home() {
  const signer = useConnectedWallets();
  const [refreshing, setRefreshing] = React.useState(false);
  const user = useUserStore((state) => state.user);
  const { data, isLoading, refetch } = useReadContract(balanceOf, {
    contract,
    address: user?.address!,
  });

  const transactions = useTransactionsStore((state) => state.transactions);
  const setTransactions = useTransactionsStore(
    (state) => state.setTransactions
  );

  const balance = formatEther(BigInt(data || 0n));

  const navigation = useNavigation();

  const onRefresh = async () => {
    setRefreshing(true);
    setTransactions([]);
    try {
      await Promise.all([refetch(), fetchTransactions()]);
      Toast.show({
        type: "success",
        text1: "Refreshed!",
        text2: "Your balance and transactions have been refreshed.",
      });
    } catch (error) {
      console.log(error);
    } finally {
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    // fetchTransactions();

    const refresh = async () => {
      await Promise.all([refetch(), fetchTransactions()]);
    };

    navigation.addListener("focus", refresh);

    return () => {
      navigation.removeListener("focus", refresh);
    };
  }, []);

  const fetchTransactions = async () => {
    setRefreshing(true);
    try {
      const toQ = query(
        collection(firebaseFirestore, "transactions"),
        where("to", "==", user?.address)
      );
      const fromQ = query(
        collection(firebaseFirestore, "transactions"),
        where("from", "==", user?.address)
      );

      const [toSnapshot, fromSnapshot] = await Promise.all([
        getDocs(toQ),
        getDocs(fromQ),
      ]);

      const toTransactions = toSnapshot.docs.map((doc) => {
        return { ...doc.data(), id: doc.id } as unknown as DBTransaction;
      });
      const fromTransactions = fromSnapshot.docs.map((doc) => {
        return { ...doc.data(), id: doc.id } as unknown as DBTransaction;
      });

      const transactions = [...toTransactions, ...fromTransactions].sort(
        (a, b) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
      );
      setTransactions(transactions);
    } catch (error) {
      console.log(error);
    } finally {
      setRefreshing(false);
    }
  };

  if (!signer || !user) {
    return <Redirect href={"/"} />;
  }

  return (
    <SafeAreaView className="bg-[#201F2D] flex-1">
      <View className="flex flex-col px-4 mt-2 bg-[#201F2D]">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center space-x-4 pl-2">
            <Link href={"./settings"}>
              <Avatar name={user.username.charAt(0).toUpperCase()} />
            </Link>
            <Text className="text-[#C9B3F9] font-black text-3xl italic">
              GHOst
            </Text>
          </View>
          <View className="flex flex-row items-center space-x-0">
            {!refreshing ? (
              <IconButton
                icon={() => <Icon name="refresh" color="#FFF" size={24} />}
                onPress={() => onRefresh()}
              />
            ) : (
              <View className="mr-4">
                <ActivityIndicator animating={true} color={"#FFF"} />
              </View>
            )}
            {/*<IconButton
                icon={() => <Icon name="qrcode" color="#FFF" size={24} />}
                onPress={() => router.push("/app/qrcode-modal")}
              />*/}
          </View>
        </View>
        <View className="p-14">
          <ImageBackground
            source={require("../../../assets/images/ghost.png")}
            className="flex flex-col space-y-4 py-8 bg-opacity-20"
            imageStyle={{ opacity: 0.1 }}
          >
            <Text className="text-white font-semibold text-center">
              Your balance
            </Text>
            <Text className="text-white font-bold text-center text-5xl">
              ${parseInt(balance).toFixed(2)}
            </Text>
            <View className="flex flex-row justify-evenly items-center">
              <CircularButton
                text="Add money"
                icon="plus"
                onPress={() => router.push("/app/add-money-modal")}
              />
              <CircularButton
                text="Send"
                icon="paper-plane"
                onPress={() => router.push("/app/send")}
              />
            </View>
          </ImageBackground>
        </View>
        <TransactionsList
          transactions={transactions}
          loading={refreshing}
          setLoading={setRefreshing}
          setTransactions={setTransactions}
          getTransactions={getUserTransactions}
        />
      </View>
    </SafeAreaView>
  );
}
