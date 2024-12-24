import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";

const CalculatorScreen = () => {
  const navigation = useNavigation();
  const [input, setInput] = useState("");

  const handlePress = (value) => {
    if (value === "=") {
      if (input === "1234") { // Replace "1234" with your desired password
        navigation.navigate("VaultScreen"); // Navigate to the Vault screen on success
      } else {
        Alert.alert("Incorrect Password", "Please try again.");
      }
    } else if (value === "C") {
      setInput("");
    } else {
      setInput((prev) => prev + value);
    }
  };

  const buttons = ["7", "8", "9", "C", "4", "5", "6", "/", "1", "2", "3", "-", "0", ".", "=", "+"];

  return (
    <View style={styles.container}>
      <View style={styles.display}>
        <Text style={styles.input}>{input}</Text>
      </View>
      <View style={styles.buttonsContainer}>
        {buttons.map((button) => (
          <TouchableOpacity
            key={button}
            style={styles.button}
            onPress={() => handlePress(button)}
          >
            <Text style={styles.buttonText}>{button}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default CalculatorScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", justifyContent: "center" },
  display: { height: "20%", justifyContent: "flex-end", alignItems: "flex-end", padding: 20 },
  input: { fontSize: 36, color: "white" },
  buttonsContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-evenly" },
  button: { width: "22%", padding: 20, margin: 5, backgroundColor: "#333", alignItems: "center", borderRadius: 10 },
  buttonText: { fontSize: 20, color: "white" },
});
