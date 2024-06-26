import { Link, router } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { ActivityIndicator, Appbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome";
import { prepareContractCall } from "thirdweb";
import { shortenAddress } from "thirdweb/utils";
import { useReadContract, useSendTransaction } from "thirdweb/react";
import { formatUnits, parseEther } from "viem";
import { AmountChooser } from "../../components/amount-chooser";
import AppButton from "../../components/app-button";
import Avatar from "../../components/avatar";
import { InfoBox } from "../../components/infobox";
import Spacer from "../../components/spacer";
import {
  GHOST_PORTAL_LOCK_ADDRESS,
  GHO_SEPOLIA_ADDRESS,
  aavePoolContract,
  contract,
} from "../../constants/sepolia";
import { firebaseFirestore } from "../../firebaseConfig";
import { useSendStore, useUserStore } from "../../store";

const EXAMPLE_CROSS_CHAIN_ADDRESS =
  "0x1358155a15930f89eBc787a34Eb4ccfd9720bC62";

export default function SendModal() {
  const isPresented = router.canGoBack();
  const sendUser = useSendStore((state) => state.user);
  const setSendUser = useSendStore((state) => state.setSendUser);
  const user = useUserStore((state) => state.user);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const { mutateAsync: transfer, isPending: transferLoading } =
    useSendTransaction();

  const {
    data: balanceData,
    isLoading: balanceOfLoading,
    refetch: refetchBalance,
  } = useReadContract({
    contract,
    method: "balanceOf",
    params: [user?.address!],
  });

  // const { contract: ghostPortal } = useContract(GHOST_PORTAL_LOCK_ADDRESS);

  const { data: allowanceData } = useReadContract({
    contract,
    method: "allowance",
    params: [user?.address!, GHOST_PORTAL_LOCK_ADDRESS],
  });

  // const { mutateAsync: approve, isLoading: isApproveLoading } =
  //   useContractWrite(contract, "approve");
  // const { mutateAsync: sendCrossChain, isLoading: isSendCrossChainLoading } =
  //   useContractWrite(ghostPortal, "sendCrossChain");

  const isCrossChain = sendUser?.username === "paolorollo";
  // const isCrossChain = sendUser?.chain !== user?.chain;

  const sendUserChain = isCrossChain ? "Mumbai" : "Sepolia";
  // const sendUserChain = sendUser?.chain;

  const balance = balanceData ? parseFloat(formatUnits(balanceData, 18)) : 0;

  console.log({
    balanceData,
    balance,
    float: balanceData
      ? parseFloat(formatUnits(balanceData, 18)).toFixed(2)
      : 0,
    b: Number(balanceData),
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

  const {
    mutateAsync: borrow,
    data: borrowData,
    isPending: borrowLoading,
  } = useSendTransaction();

  const [canBorrow, setCanBorrow] = useState(
    userData &&
      parseFloat(formatUnits(userData[2], 8)) >=
        Number(amount) - Number(balance)
  );

  const needToBorrow = Number(balance) < Number(amount);
  const canSend = Number(amount) <= Number(balance) && Number(amount) > 0;
  useEffect(() => {
    if (needToBorrow && userData) {
      3;
      setCanBorrow(
        parseFloat(formatUnits(userData[2], 8)) >=
          Number(amount) - Number(balance)
      );
    }
  }, [amount]);

  const sendTokens = async () => {
    if (transferLoading || loading || !sendUser) return;
    setLoading(true);
    try {
      if (needToBorrow && canBorrow && user?.address) {
        console.log("Borrowing...");
        const transaction: any = prepareContractCall({
          contract: aavePoolContract,
          method: "borrow",
          params: [
            GHO_SEPOLIA_ADDRESS,
            BigInt(`${(Number(amount) - Number(balance)) * 10 ** 18}`),
            BigInt(2),
            0,
            user?.address,
          ],
        });

        borrow(transaction);

        console.log("Borrowed!");
        refetchBalance();
      }

      if (isCrossChain) {
        // APPROVE
        // if (parseInt(formatEther(allowanceData || 0n)) == 0) {
        //   const { receipt } = await approve({
        //     args: [GHOST_PORTAL_LOCK_ADDRESS, ethers.constants.MaxUint256],
        //   });
        // }
        // SEND
        // const { receipt } = await sendCrossChain({
        //   args: [sendUser?.address, toBigInt(amount).mul(toBigInt(10).pow(18))],
        // });

        const transaction = {
          txHash: "",
          blockNumber: "",
          from: user?.address,
          fromUsername: user?.username,
          to: sendUser.address,
          toUsername: sendUser?.username,
          amount,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(firebaseFirestore, "transactions", ""), transaction);
      } else {
        console.log("Sending...");
        console.log({ balanceData });
        const trx: any = prepareContractCall({
          contract,
          method: "transfer",
          params: [
            sendUser!.address,
            needToBorrow && canBorrow && balanceData
              ? balanceData
              : parseEther(amount.toString()),
          ],
        });

        const receipt = await transfer(trx);

        const transaction = {
          txHash: receipt.transactionHash,
          blockNumber: receipt.maxBlocksWaitTime,
          from: user?.address,
          fromUsername: user?.username,
          to: sendUser.address,
          toUsername: sendUser?.username,
          amount,
          createdAt: new Date().toISOString(),
        };
        await setDoc(
          doc(firebaseFirestore, "transactions", receipt.transactionHash),
          transaction
        );
        console.log("Sent!");
      }

      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "GHO sent successfully.",
      });
      router.back();
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

  if (!sendUser) {
    return <View className="flex-1 flex-col px-4 bg-[#0052FF]"></View>;
  }

  return (
    <View className="flex-1 flex-col px-4 bg-[#0052FF]">
      {!isPresented && <Link href="../">Dismiss</Link>}
      <Appbar.Header
        elevated={false}
        statusBarHeight={0}
        className="bg-[#0052FF] text-white"
      >
        <Appbar.Content
          title="Send GHO"
          color="#fff"
          titleStyle={{ fontWeight: "bold" }}
        />
        <Appbar.Action
          icon={() => <Icon name="close" size={24} color="#FFF" />}
          onPress={() => {
            setSendUser(undefined);
            router.back();
          }}
          color="#fff"
          size={20}
        />
      </Appbar.Header>
      <View className="flex flex-col items-center mt-4 space-y-2">
        <Avatar name={sendUser?.username.charAt(0).toUpperCase()} />
        <Text className="text-white text-lg text-center font-semibold">
          {sendUser?.username}
        </Text>
        <Text className="text-[#FFF] text-ellipsis">
          {shortenAddress(sendUser?.address || "")}
          {isCrossChain && ` • ${sendUserChain}`}
          {/* {isCrossChain && ` • ${sendUser?.chain}`} */}
          {!isCrossChain && ` • Sepolia`}
        </Text>

        <AmountChooser
          dollars={amount}
          onSetDollars={setAmount}
          showAmountAvailable
          autoFocus
          lagAutoFocus={false}
        />
        {balanceOfLoading ? (
          <ActivityIndicator animating={true} color={"#C9B3F9"} />
        ) : (
          <Text className="text-[#FFF] font-semibold">
            ${balance.toFixed(2)} available
          </Text>
        )}
        {isCrossChain && (
          <>
            <Spacer h={16} />
            <InfoBox
              title="Cross-chain Transaction"
              subtitle={`${sendUser.username} is on a different chain (${sendUserChain}), so the transaction will take a little longer.`}
              variant="info"
            ></InfoBox>
          </>
        )}
        {!loading && !transferLoading && needToBorrow && (
          <>
            <Spacer h={16} />
            {canBorrow && (
              <InfoBox
                title="Insufficient balance, but..."
                subtitle={`You can still borrow $${(
                  Number(amount) - Number(balance)
                ).toFixed(2)} and proceed with the transaction.`}
                variant="info"
              ></InfoBox>
            )}
            {!canBorrow && (
              <InfoBox
                title="Insufficient balance, and..."
                subtitle={`You don't have enough collateral to borrow $${(
                  Number(amount) - Number(balance)
                ).toFixed(2)} and proceed with the transaction.`}
                variant="warning"
              ></InfoBox>
            )}
          </>
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
                  router.back();
                }}
                variant="ghost"
              />
            </View>
            <View className="flex-1 mx-2">
              <AppButton
                text={"Send"}
                onPress={() => sendTokens()}
                variant={canSend || canBorrow ? "primary" : "disabled"}
              />
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
