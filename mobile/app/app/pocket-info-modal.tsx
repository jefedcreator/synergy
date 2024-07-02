import { Link, router } from "expo-router";
import { ScrollView, Text } from "react-native";
import { Appbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome";

export default function PocketInfoModal() {
  const isPresented = router.canGoBack();
  return (
    <SafeAreaView
      className="flex-1 flex-col bg-[#0052FF] px-4"
      edges={{ top: "off" }}
    >
      {!isPresented && <Link href="../">Dismiss</Link>}
      <Appbar.Header
        elevated={false}
        statusBarHeight={0}
        className="bg-[#0052FF] text-white"
      >
        <Appbar.Content
          title="How does it work?"
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
      <ScrollView>
        <Text className="text-white text-justify text-lg leading-5">
          GHOst automatically performs some operations when you receive USDC,
          USDT or USDC tokens.
        </Text>
        <Text className="text-white text-justify text-lg leading-5 mt-4">
          <Text className="font-bold">USDC/USDT</Text>: when you receive some of
          these tokens (eg. 10.5 USDC), GHOst sets aside the remainder rounded
          to the nearest dollar into AAVE Lending contracts (eg. 0.5 USDC).
          What's left is automatically swapped into USDC 1:1 (eg. the 10 USDC
          left become 10 USDC) and sent to your wallet.
        </Text>
        <Text className="text-white text-justify text-lg leading-5 mt-4">
          <Text className="font-bold">USDC</Text>: when you receive some USDC
          (eg. 14.7 USDC), GHOst sets aside the remainder rounded to the nearest
          dollar into a USDC Vault contract (eg. 0.7 USDC). What's left is sent
          to your wallet (eg. 14 USDC).
        </Text>
        <Text className="text-white text-justify text-lg leading-5 mt-4">
          <Text className="font-bold">AAVE Lending</Text>: remainders from
          incoming USDC/DAI transactions are sent here. These tokens are lent to
          the AAVE Protocol, granting you a 1.5% APY (on average), and can be
          used to borrow USDC if needed.
        </Text>
        <Text className="text-white text-justify text-lg leading-5 mt-4">
          <Text className="font-bold">USDC Vault</Text>: remainders from
          incoming USDC transactions are sent there. It's a shared vault with
          all GHOst users, where the USDC are used as LP con Uniswap to provide
          liquidity and grant you a 3% APY (on average). You can deposit more
          tokens, or withdraw them whenever you want.
        </Text>
        <Text className="text-white text-justify text-lg leading-5 mt-4">
          <Text className="font-bold">Borrowing USDC</Text>: in case you find
          yourself in need of more USDC, you can borrow some from the AAVE
          Protocol. The total amount of borrowable USDC is calculated based on
          your AAVE Lending balance. You can borrow up to 75% of your AAVE
          Lending balance, and the maximum loan-to-value (LTV) is 80%.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
