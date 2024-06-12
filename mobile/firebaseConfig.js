import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC9Wkp95aLG62RQUMZcpHiAguSfz-CK_pE",
  authDomain: "synergy-7377a.firebaseapp.com",
  projectId: "synergy-7377a",
  storageBucket: "synergy-7377a.appspot.com",
  messagingSenderId: "249197664482",
  appId: "1:249197664482:web:6cf49c48dcaf0604b8e6bb",
  measurementId: "G-QN0521N2RR",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const firebaseAuth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const firebaseFirestore = getFirestore(app);
