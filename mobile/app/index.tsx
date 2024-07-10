import { ThemedButton } from "../components/ThemedButton";
import { ThemedInput } from "../components/ThemedInput";
import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { chain, client } from "../constants/thirdweb";
import { firebaseAuth, firebaseFirestore } from "../firebaseConfig";
import { useThemeColor } from "../hooks/useThemeColor";
import { useUserStore } from "../store";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import {
  useActiveAccount,
  useActiveWallet,
  useActiveWalletConnectionStatus,
  useAutoConnect,
  useConnect,
  useConnectedWallets,
  useDisconnect,
  useSetActiveWallet,
  useWalletBalance,
} from "thirdweb/react";
import { shortenAddress } from "thirdweb/utils";
import {
  InAppWalletSocialAuth,
  Wallet,
  createWallet,
  getWalletInfo,
} from "thirdweb/wallets";
import {
  getUserEmail,
  inAppWallet,
  preAuthenticate,
} from "thirdweb/wallets/in-app";


const factoryAddress = "0x6EAD4854775384B9A675557Dd96391Ad8e0489Ac";
// const factoryAddress = process.env.EXPO_PUBLIC_TW_FACTORY_ADMIN_ADDRESS,

const wallets = [
  inAppWallet({
    smartAccount: {
      chain,
      factoryAddress,
      sponsorGas: true,
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
];

const externalWallets = wallets.slice(1);

// const chain = defineChain(84532);

// First, connect the personal wallet, which can be any wallet (metamask, embedded, etc.)
// const personalWallet = embeddedWallet();
// const peronalAccount = await personalWallet.connect({
//   client,
//   chain,
//   strategy: "google",
// });
const oAuthOptions: InAppWalletSocialAuth[] = ["google", "facebook", "apple"];

export default function Home() {
  const status = useActiveWalletConnectionStatus();
  const address = useActiveAccount();
  const setUser = useUserStore((state) => state.setUser);
  // const theme = darkTheme({
  //   colors: {
  //     primaryButtonBg: "transparent",
  //     primaryButtonText: "#C9B3F9",
  //     borderColor: "#C9B3F9",
  //   },
  // });
  console.log("status", status);
  console.log("address", address?.address);

  useEffect(() => {
    if (address?.address && status == "connected") {
      handleConnection();
    }
  }, [status, address]);

  const handleConnection = async () => {
    // await SecureStore.deleteItemAsync(`onboarding-${address}`);
    const onboarding = await SecureStore.getItemAsync(
      `onboarding-${address?.address}`
    );
    console.log("onboarding!!", onboarding);
    if (!onboarding) {
      return router.push("/onboarding");
    }
    const password = await SecureStore.getItemAsync(
      `password-${address?.address}`
    );
    const email = `${address?.address}@synergy.app`;
    console.log("email", email);
    console.log("password", password);

    await signInWithEmailAndPassword(firebaseAuth, email, password!);
    console.log("error??");

    // get user and set it in the store
    const document = await getDoc(
      doc(firebaseFirestore, "users", firebaseAuth.currentUser!.uid)
    );
    if (document.exists()) {
      const { address, createdAt, username, rounding } = document.data();
      const user = {
        address,
        createdAt,
        username,
        rounding,
      };
      setUser(user);
      router.push("/app/home");
    } else {
      router.push("/onboarding");
    }
  };

  const wallet = useActiveWallet();
  const autoConnect = useAutoConnect({
    client,
    wallets,
  });
  const autoConnecting = autoConnect.isLoading;

  const { disconnect } = useDisconnect();
  const account = useActiveAccount();
  const activeWallet = useActiveWallet();
  const setActive = useSetActiveWallet();
  const connectedWallets = useConnectedWallets();
  const balanceQuery = useWalletBalance({
    address: account?.address,
    chain: activeWallet?.getChain(),
    client,
  });

  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchEmail = async () => {
      if (activeWallet?.id === "inApp") {
        try {
          const email = await getUserEmail({
            client,
          });
          if (email) {
            setEmail(email);
          }
        } catch (e) {
          // no email
        }
      } else {
        setEmail("");
      }
    };
    fetchEmail();
  }, [account]);

  const switchWallet = async () => {
    const activeIndex = connectedWallets.findIndex(
      (w) => w.id === activeWallet?.id
    );
    const nextWallet =
      connectedWallets[(activeIndex + 1) % connectedWallets.length];
    if (nextWallet) {
      await setActive(nextWallet);
    }
  };

  const bgColor = useThemeColor({}, "tint");

  const { connect, isConnecting } = useConnect({
    client,
    accountAbstraction: {
      chain,
      factoryAddress,
      sponsorGas: true,
    },
  });

  const connectToSmartAccount = async () => {
    // 2. connect with the admin wallet of the smart account
    connect(async () => {
      const wallet = inAppWallet(); // or any other wallet
      await wallet.connect({
        client,
        chain,
        strategy: "google",
        redirectUrl: "com.thirdweb.demo://",
      });
      return wallet;
    });
  };

  return (
    <View className="flex-1 flex-col pt-10 bg-[#0052FF] justify-between">
      {isConnecting || autoConnecting ? (
        <View className="flex-1 flex-col bg-[#0052FF] items-center justify-center">
          <ActivityIndicator animating={true} color={"#FFF"} />
        </View>
      ) : (
        <>
          <View className="flex items-center justify-center">
            <Text className="text-[#C9B3F9] font-black text-xl italic">
              SYNERGY ⚡️
            </Text>
          </View>
          <View style={styles.stepContainer}>
            {wallet ? (
              <>
                {account ? (
                  <>
                    <ThemedText>Connected Wallets: </ThemedText>
                    <ThemedView style={{ gap: 2 }}>
                      {connectedWallets.map((w, i) => (
                        <ThemedText key={w.id + i} type="defaultSemiBold">
                          - {w.id} {w.id === activeWallet?.id ? "✅" : ""}
                        </ThemedText>
                      ))}
                    </ThemedView>
                    <ThemedView style={{ height: 12 }} />
                    {email && activeWallet?.id === "inApp" && (
                      <ThemedText>
                        Email:{" "}
                        <ThemedText type="defaultSemiBold">{email}</ThemedText>
                      </ThemedText>
                    )}
                    <ThemedText>
                      Address:{" "}
                      <ThemedText type="defaultSemiBold">
                        {shortenAddress(account.address)}
                      </ThemedText>
                    </ThemedText>
                    <ThemedText>
                      Chain:{" "}
                      <ThemedText type="defaultSemiBold">
                        {activeWallet?.getChain()?.name || "Unknown"}
                      </ThemedText>
                    </ThemedText>
                    <ThemedText>
                      Balance:{" "}
                      {balanceQuery.data && (
                        <ThemedText type="defaultSemiBold">
                          {`${balanceQuery.data?.displayValue.slice(0, 8)} ${
                            balanceQuery.data?.symbol
                          }`}
                        </ThemedText>
                      )}
                    </ThemedText>
                    <ThemedView style={{ height: 12 }} />
                    {connectedWallets.length > 1 && (
                      <ThemedButton
                        variant="secondary"
                        title="Switch Wallet"
                        onPress={switchWallet}
                      />
                    )}
                    <ThemedButton
                      title="Sign message"
                      variant="secondary"
                      onPress={async () => {
                        if (account) {
                          account.signMessage({ message: "hello world" });
                        }
                      }}
                    />
                    <ThemedButton
                      title="Disconnect"
                      variant="secondary"
                      onPress={async () => {
                        if (activeWallet) {
                          disconnect(activeWallet);
                        }
                      }}
                    />
                    <ThemedView style={{ height: 12 }} />
                    <ThemedText type="defaultSemiBold">
                      Connect another wallet
                    </ThemedText>
                    <ThemedView style={styles.rowContainer}>
                      {externalWallets
                        .filter(
                          (w) =>
                            !connectedWallets.map((cw) => cw.id).includes(w.id)
                        )
                        .map((w, i) => (
                          <ConnectExternalWallet key={w.id + i} {...w} />
                        ))}
                    </ThemedView>
                  </>
                ) : (
                  <>
                    <ThemedText>Connect to mint an NFT.</ThemedText>
                  </>
                )}
              </>
            ) : (
              <ThemedView style={{ gap: 16, padding: 10 }}>
                <ThemedText type="defaultSemiBold">In-app wallet</ThemedText>
                <>
                  <ThemedView style={[styles.rowContainer]}>
                    {oAuthOptions.map((auth) => (
                      <ThemedView
                        key={auth}
                        style={{
                          flex: 1,
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          borderStyle: "solid",
                          borderWidth: 1,
                          borderColor: bgColor,
                          borderRadius: 6,
                          height: 60,
                        }}
                      >
                        {isConnecting ? (
                          <ActivityIndicator
                            animating={true}
                            color={"#0052FF"}
                          />
                        ) : (
                          <TouchableOpacity
                            key={auth}
                            onPress={connectToSmartAccount}
                            // onPress={connectInAppWallet}
                            disabled={isConnecting}
                          >
                            <Image
                              source={getSocialIcon(auth)}
                              style={{
                                width: 38,
                                height: 38,
                              }}
                            />
                          </TouchableOpacity>
                        )}
                      </ThemedView>
                    ))}
                  </ThemedView>
                  <ConnectWithPhoneNumber />
                </>
                <ThemedView style={{ height: 12 }} />
                <ThemedText type="defaultSemiBold">External wallet</ThemedText>
                <ThemedView style={styles.rowContainer}>
                  {externalWallets.map((w) => (
                    <ConnectExternalWallet key={w.id} {...w} />
                  ))}
                </ThemedView>
              </ThemedView>
            )}
          </View>
        </>
      )}
      {/* <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Connecting Wallets</ThemedText>
      </ThemedView> */}
    </View>
  );
}

function ConnectWithPhoneNumber() {
  const [screen, setScreen] = useState<"phone" | "code">("phone");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const { connect, isConnecting } = useConnect();

  const sendSmsCode = async () => {
    if (!phoneNumber) return;
    setSendingOtp(true);
    await preAuthenticate({
      client,
      strategy: "phone",
      phoneNumber,
    });
    setSendingOtp(false);
    setScreen("code");
  };

  const connectInAppWallet = async () => {
    if (!verificationCode || !phoneNumber) return;
    await connect(async () => {
      const wallet = inAppWallet({
        smartAccount: {
          chain,
          factoryAddress,
          sponsorGas: true,
        },
      });

      await wallet.connect({
        client,
        strategy: "phone",
        phoneNumber,
        verificationCode,
      });
      return wallet;
    });
  };

  if (screen === "phone") {
    return (
      <ThemedInput
        placeholder="Enter phone number"
        onChangeText={setPhoneNumber}
        value={phoneNumber}
        keyboardType="phone-pad"
        onSubmit={sendSmsCode}
        isSubmitting={sendingOtp}
      />
    );
  }

  return (
    <>
      <ThemedInput
        placeholder="Enter verification code"
        onChangeText={setVerificationCode}
        value={verificationCode}
        keyboardType="numeric"
        onSubmit={connectInAppWallet}
        isSubmitting={isConnecting}
      />
    </>
  );
}

function ConnectExternalWallet(wallet: Wallet) {
  const { connect, isConnecting, error } = useConnect();
  const [walletName, setWalletName] = useState<string | null>(null);
  const [walletImage, setWalletImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalletName = async () => {
      const [name, image] = await Promise.all([
        getWalletInfo(wallet.id).then((info) => info.name),
        getWalletInfo(wallet.id, true),
      ]);
      setWalletName(name);
      setWalletImage(image);
    };
    fetchWalletName();
  }, [wallet]);

  const connectExternalWallet = async () => {
    await connect(async () => {
      await wallet.connect({
        client,
      });
      return wallet;
    });
  };

  return (
    walletImage &&
    walletName && (
      <ThemedView
        style={{
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {isConnecting && !error ? (
          <ActivityIndicator style={{ width: 60, height: 60 }} />
        ) : (
          <>
            <Pressable onPress={connectExternalWallet} disabled={isConnecting}>
              <Image
                source={{ uri: walletImage ?? "" }}
                style={{ width: 60, height: 60, borderRadius: 6 }}
              />
            </Pressable>
            <ThemedText style={{ fontSize: 11 }} type="defaultSemiBold">
              {walletName.split(" ")[0]}
            </ThemedText>
          </>
        )}
      </ThemedView>
    )
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 1,
  },
  reactLogo: {
    height: "100%",
    width: "100%",
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  rowContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "space-evenly",
  },
});

function getSocialIcon(strategy: string) {
  switch (strategy) {
    case "google":
      return require("../assets/images/google.png");
    case "facebook":
      return require("../assets/images/facebook.png");
    case "apple":
      return require("../assets/images/apple.png");
  }
}
