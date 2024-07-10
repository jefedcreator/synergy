import React from "react";
import { View, Image, StyleSheet } from "react-native";
import makeBlockie from "ethereum-blockies-base64"; // or however you're generating the blockie

const Avatar = ({ name }: { name?: string }) => {
  return (
    <View style={styles.avatarContainer}>
      <Image
        style={styles.avatarImage}
        source={{ uri: makeBlockie(name || "synergy") }}
        alt="avatar"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    height: 48, // 12 * 4
    width: 48, // 12 * 4
    borderRadius: 24,
    borderColor: "#C9B3F9",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 24,
    borderColor: "#00BFFF", // Replace with your color
    borderWidth: 2,
  },
});

export default Avatar;
