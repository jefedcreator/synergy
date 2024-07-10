import TimeAgo from "@andordavoti/react-native-timeago";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Pressable, Text, View } from "react-native";
import { Divider } from "react-native-paper";
import { isAddress, shortenAddress } from "thirdweb/utils";
import { basesepolia } from "../constants/sepolia";
import { DBTransaction } from "../store/interfaces";
import { useProfileStore } from "../store/use-profile-store";
import { useUserStore } from "../store/use-user-store";
import Avatar from "./avatar";

export default function TransactionItem({
  transaction,
  index,
}: {
  transaction: DBTransaction;
  index: number;
}) {
  const user = useUserStore((state) => state.user);
  const setProfileUser = useProfileStore((state) => state.setProfileUser);
  const setProfileUserTransactions = useProfileStore(
    (state) => state.setProfileUserTransactions
  );
  const { from, to, toUsername, fromUsername, createdAt, txHash, crossChain } =
    transaction;
  const amount = parseFloat(transaction.amount);
  const isFrom = from === user?.address;

  return (
    <View key={`transaction-${index}`}>
      <View className="flex flex-row items-center justify-between py-4">
        <View className="flex flex-row items-center space-x-4">
          <Pressable
            key={`profile-event-${index}`}
            onPress={async () => {
              setProfileUser({
                address: isFrom ? to : from,
                username: isFrom ? toUsername : fromUsername,
              });
              setProfileUserTransactions([]);
              router.push("/app/profile-modal");
            }}
          >
            <Avatar
              name={
                (isFrom ? toUsername : fromUsername).charAt(0).toUpperCase() ||
                user?.address
              }
            />
          </Pressable>

          <View className="flex flex-col">
            {/* <Text className="text-white font-semibold text-lg">
              {isFrom
                ? isAddress(toUsername)
                  ? shortenAddress(toUsername)
                  : toUsername
                : isAddress(fromUsername)
                ? shortenAddress(fromUsername)
                : fromUsername}
            </Text> */}
            <Text className="text-white font-semibold text-lg">
              {isAddress(to) ? shortenAddress(to) : to}
            </Text>
            <Pressable
              key={`event-${index}`}
              onPress={async () => {
                crossChain
                  ? await WebBrowser.openBrowserAsync(
                      `https://ccip.chain.link/tx/${txHash}`
                    )
                  : await WebBrowser.openBrowserAsync(
                      `${basesepolia.explorers[0].url}/tx/${txHash}`
                    );
              }}
            >
              <Text className="text-[#FFF]">Click to view detail</Text>
            </Pressable>
          </View>
        </View>
        <View className="flex flex-col items-end justify-center">
          <Text
            className={`${
              !isFrom ? "text-emerald-500" : "text-red-500"
            } font-semibold text-lg`}
          >
            {!isFrom ? "+" : "-"} ${amount.toFixed(2)}
          </Text>
          <Text className="text-[#FFF]">
            <TimeAgo dateTo={new Date(createdAt)} />
          </Text>
        </View>
      </View>
      <Divider />
    </View>
  );
}
