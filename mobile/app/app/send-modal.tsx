import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { ActivityIndicator, Appbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome";
import {
  PreparedTransaction,
  prepareContractCall,
  sendTransaction,
  waitForReceipt,
} from "thirdweb";
import {
  useActiveAccount,
  useReadContract,
  useSendTransaction,
} from "thirdweb/react";
import { shortenAddress } from "thirdweb/utils";
import { formatEther, formatUnits, parseEther, parseUnits } from "viem";
import Select from "../../components/Select";
import { AmountChooser } from "../../components/amount-chooser";
import AppButton from "../../components/app-button";
import Avatar from "../../components/avatar";
import { InfoBox } from "../../components/infobox";
import Spacer from "../../components/spacer";
import {
  USDC_BRIDGE_ADDRESS,
  aavePoolContract,
  arbSelector,
  avaxSelector,
  opSelector,
  sepoliaSelector,
  usdcBridgeContract,
  usdcContract,
  baseSelector,
} from "../../constants/sepolia";
import { useSendStore, useUserStore } from "../../store";
import { doc, setDoc } from "firebase/firestore";
import { firebaseFirestore } from "../../firebaseConfig";
import Toast from "react-native-toast-message";

export default function SendModal() {
  const params = useLocalSearchParams<{
    recipient?: string;
    username?: string;
  }>();

  const [selectedValue, setSelectedValue] = useState("Sepolia");

  const options = [
    { label: "Arbitrum", value: arbSelector },
    { label: "Avax", value: avaxSelector },
    { label: "Optimism", value: opSelector },
    { label: "Sepolia", value: sepoliaSelector },
    { label: "Base", value: baseSelector },
  ];

  const isPresented = router.canGoBack();
  const sendUser = useSendStore((state) => state.user);
  const setSendUser = useSendStore((state) => state.setSendUser);
  const user = useUserStore((state) => state.user);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const smartAccount = useActiveAccount();

  const {
    data: balanceData,
    isLoading: balanceOfLoading,
    refetch: refetchBalance,
  } = useReadContract({
    contract: usdcContract,
    method: "balanceOf",
    params: [user?.address!],
  });

  const { data: allowanceData } = useReadContract({
    contract: usdcContract,
    method: "allowance",
    params: [user?.address!, USDC_BRIDGE_ADDRESS],
  });

  const balance = balanceData ? parseFloat(formatUnits(balanceData, 6)) : 0;
  const allowance = allowanceData ? parseFloat(formatEther(allowanceData)) : 0;

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

  // const sendTokens = async () => {
  //   if (transferLoading || loading || !sendUser) return;
  //   setLoading(true);
  //   try {
  //     if (needToBorrow && canBorrow && user?.address) {
  //       console.log("Borrowing...");
  //       const transaction: any = prepareContractCall({
  //         contract: aavePoolContract,
  //         method: "borrow",
  //         params: [
  //           GHO_SEPOLIA_ADDRESS,
  //           BigInt(`${(Number(amount) - Number(balance)) * 10 ** 18}`),
  //           BigInt(2),
  //           0,
  //           user?.address,
  //         ],
  //       });

  //       borrow(transaction);

  //       console.log("Borrowed!");
  //       refetchBalance();
  //     }

  //     if (isCrossChain) {
  //       // APPROVE
  //       // if (parseInt(formatEther(allowanceData || 0n)) == 0) {
  //       //   const { receipt } = await approve({
  //       //     args: [GHOST_PORTAL_LOCK_ADDRESS, ethers.constants.MaxUint256],
  //       //   });
  //       // }
  //       // SEND
  //       // const { receipt } = await sendCrossChain({
  //       //   args: [sendUser?.address, toBigInt(amount).mul(toBigInt(10).pow(18))],
  //       // });

  //       const transaction = {
  //         txHash: "",
  //         blockNumber: "",
  //         from: user?.address,
  //         fromUsername: user?.username,
  //         to: sendUser.address,
  //         toUsername: sendUser?.username,
  //         amount,
  //         createdAt: new Date().toISOString(),
  //       };
  //       await setDoc(doc(firebaseFirestore, "transactions", ""), transaction);
  //     } else {
  //       console.log("Sending...");
  //       console.log({ balanceData });
  //       const trx: any = prepareContractCall({
  //         contract,
  //         method: "transfer",
  //         params: [
  //           sendUser!.address,
  //           needToBorrow && canBorrow && balanceData
  //             ? balanceData
  //             : parseEther(amount.toString()),
  //         ],
  //       });

  //       const receipt = await transfer(trx);

  //       const transaction = {
  //         txHash: receipt.transactionHash,
  //         blockNumber: receipt.maxBlocksWaitTime,
  //         from: user?.address,
  //         fromUsername: user?.username,
  //         to: sendUser.address,
  //         toUsername: sendUser?.username,
  //         amount,
  //         createdAt: new Date().toISOString(),
  //       };
  //       await setDoc(
  //         doc(firebaseFirestore, "transactions", receipt.transactionHash),
  //         transaction
  //       );
  //       console.log("Sent!");
  //     }

  //     Toast.show({
  //       type: "success",
  //       text1: "Success!",
  //       text2: "USDC sent successfully.",
  //     });
  //     router.back();
  //   } catch (error) {
  //     console.error(error);
  //     Toast.show({
  //       type: "error",
  //       text1: "Error!",
  //       text2: "An error has occurred. Try again.",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const chainSelector = options.find(
    (chain) => chain.label == selectedValue
  )?.value;

  const sendTokens = async () => {
    if (!sendUser?.address || !smartAccount) return;
    setLoading(true);
    try {
      if (allowance < amount) {
        const trx: PreparedTransaction<any> = prepareContractCall({
          contract: usdcContract,
          method: "approve",
          params: [USDC_BRIDGE_ADDRESS, parseEther(amount.toString())],
        });

        const { chain, client, transactionHash } = await sendTransaction({
          transaction: trx,
          account: smartAccount,
        });

        await waitForReceipt({
          client,
          chain,
          transactionHash,
        });
      }

      if (chainSelector == baseSelector) {
        const trx: PreparedTransaction<any> = prepareContractCall({
          contract: usdcContract,
          method: "transfer",
          params: [sendUser.address, parseUnits(amount.toString(), 6)],
        });

        const { chain, client, transactionHash } = await sendTransaction({
          transaction: trx,
          account: smartAccount,
        });
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
          to: sendUser.address,
          toUsername: sendUser.username ?? "",
          amount,
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
          text2: "USDC Transfer successful",
        });
        router.navigate("/app/home");
      } else {
        const trx: PreparedTransaction<any> = prepareContractCall({
          contract: usdcBridgeContract,
          method: "sendMessagePayLINK",
          params: [
            chainSelector,
            sendUser?.address,
            parseUnits(amount.toString(), 6),
          ],
        });

        const { chain, client, transactionHash } = await sendTransaction({
          transaction: trx,
          account: smartAccount,
        });

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
          to: sendUser.address,
          toUsername: sendUser.username ?? "",
          amount,
          createdAt: new Date().toISOString(),
          crossChain: true,
        };
        await setDoc(
          doc(firebaseFirestore, "transactions", txreceipt.transactionHash),
          transaction
        );
        console.log("Sent!");
        Toast.show({
          type: "success",
          text1: "Success!",
          text2: "USDC Transfer successful",
        });
        router.navigate("/app/home");
      }
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
          title="Send USDC"
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
        <View className="flex flex-row gap-2 items-center">
          <Text className="text-[#FFF] text-ellipsis">
            {shortenAddress(sendUser?.address ?? "")}
          </Text>
          <Text className="text-[#FFF] text-ellipsis">•</Text>
          <Select
            options={options}
            selectedValue={selectedValue}
            onValueChange={setSelectedValue}
          />
        </View>
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
        {chainSelector !== baseSelector && (
          <>
            <Spacer h={16} />
            <InfoBox
              title="Cross-chain Transaction"
              subtitle={`${sendUser.username} is on a different chain (${selectedValue}), so the transaction will take a little longer.`}
              variant="info"
            ></InfoBox>
          </>
        )}
        {!loading && needToBorrow && (
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
        {
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
          )
        }
      </SafeAreaView>
    </View>
  );
}
function formatEthers(allowanceData: bigint): string {
  throw new Error("Function not implemented.");
}
