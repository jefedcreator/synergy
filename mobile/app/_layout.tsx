import { sepolia } from "@/constants/sepolia";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Slot, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import Toast, {
  BaseToast,
  ErrorToast,
  InfoToast,
  ToastConfig,
} from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome";
import { ThirdwebProvider } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";

LogBox.ignoreLogs([new RegExp("TypeError:.*")]);

const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "green",
        backgroundColor: "#21202E",
      }}
      text1Style={{ color: "white", fontWeight: "bold", fontSize: 16 }}
      text2Style={{ color: "white" }}
    />
  ),
  info: (props) => (
    <InfoToast
      {...props}
      style={{ borderLeftColor: "blue", backgroundColor: "#21202E" }}
      text1Style={{ color: "white", fontWeight: "bold", fontSize: 16 }}
      text2Style={{ color: "white" }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: "red", backgroundColor: "#21202E" }}
      text1Style={{ color: "white", fontWeight: "bold", fontSize: 16 }}
      text2Style={{ color: "#53516C" }}
    />
  ),
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const wallet = inAppWallet({
    smartAccount: {
      chain: sepolia,
      sponsorGas: true,
    },
    hidePrivateKeyExport: true,
  });

  return (
    <ThirdwebProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <PaperProvider
          settings={{
            icon: (props) => <Icon {...props} />,
          }}
        >
          <Slot />
        </PaperProvider>
        <Toast
          config={toastConfig}
          position="top"
          topOffset={60}
          visibilityTime={2500}
        />
      </ThemeProvider>
    </ThirdwebProvider>
  );
}
