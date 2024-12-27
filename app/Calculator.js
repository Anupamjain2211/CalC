import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";

const { width, height } = Dimensions.get("window");

const Calculator = () => {
  const navigation = useNavigation();
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [isScientific, setIsScientific] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [password, setPassword] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    const checkPassword = async () => {
      const savedPassword = await SecureStore.getItemAsync("userPassword");
      if (!savedPassword) {
        setIsSettingPassword(true); // Prompt user to set a password
      }
    };
    checkPassword();
  }, []);

  const handlePasswordSet = async () => {
    if (password.length < 4) {
      Alert.alert("Error", "Password must be at least 4 characters long.");
      return;
    }
    await SecureStore.setItemAsync("userPassword", password);
    Alert.alert("Success", "Password set successfully!");
    setIsSettingPassword(false);
    setPassword("");
  };

  // const handleVaultAccess = async () => {
  //   const savedPassword = await SecureStore.getItemAsync("userPassword");
  //   if (input === savedPassword) {
  //     navigation.navigate("VaultScreen");
  //   } else {
  //     Alert.alert("Access Denied", "Incorrect password.");
  //   }
  // };

  const handlePasswordChange = async () => {
    const savedPassword = await SecureStore.getItemAsync("userPassword");
    console.log("Saved Password:", savedPassword);
    console.log("Old Password:", oldPassword);

    if (oldPassword.trim() !== savedPassword.trim()) {
      Alert.alert("Error", "Old password is incorrect.");
      return;
    }

    if (newPassword.length < 4) {
      Alert.alert("Error", "New password must be at least 4 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    await SecureStore.setItemAsync("userPassword", newPassword);
    Alert.alert("Success", "Password changed successfully!");
    // Alert.alert("Success", "Password changed successfully!");

    setIsChangingPassword(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handlePress = (value) => {
    if (isSettingPassword) {
      if (value === "=") {
        handlePasswordSet(); // Call the function to set the password
      } else {
        setPassword((prev) => prev + value); // Accumulate password input
      }
    } else {
      if (value === "=") {
        SecureStore.getItemAsync("userPassword").then((savedPassword) => {
          if (input === savedPassword) {
            navigation.navigate("VaultScreen"); // Navigate to the vault
          } else {
            try {
              const evalResult = eval(input);
              setResult(evalResult); // Show the result
              setHistory((prev) => [...prev, `${input} = ${evalResult}`]); // Save the history
              // setInput(""); // Clear the input after calculation
            } catch (error) {
              Alert.alert("Error", "Invalid calculation."); // Show an error for invalid input
            }
          }
        });
      } else if (value === "C") {
        setInput(""); // Clear the input
        setResult(null); // Clear the result
      } else {
        setInput((prev) => prev + value); // Append the pressed button value to input
      }
    }
  };
  
  
  const toggleMode = () => {
    setIsScientific((prev) => !prev);
  };

  const buttons = isScientific
    ? [
        "sin",
        "cos",
        "tan",
        "log",
        "^",
        "√",
        "π",
        "e",
        "!",
        "(",
        ")",
        "C",
        "7",
        "8",
        "9",
        "/",
        "4",
        "5",
        "6",
        "*",
        "1",
        "2",
        "3",
        "-",
        "0",
        ".",
        "=",
        "+",
      ]
    : [
        "%",
        "(",
        ")",
        "C",
        "7",
        "8",
        "9",
        "/",
        "4",
        "5",
        "6",
        "*",
        "1",
        "2",
        "3",
        "-",
        "0",
        ".",
        "=",
        "+",
      ];

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={toggleMode} style={styles.iconButton}>
          <Icon
            name={isScientific ? "calculator-variant" : "calculator"}
            size={30}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowHistory(true)}
          style={styles.iconButton}
        >
          <Icon name="history" size={30} color="#FFFFFF" />
        </TouchableOpacity>
     
      </View>

      {/* Display */}
      <View style={styles.displayContainer}>
        <Text style={styles.inputText}>
          {isSettingPassword ? "Set 4 Digit Password" : input}
        </Text>
        <Text style={styles.resultText}>
          {result !== null ? `= ${result}` : ""}
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        {buttons.map((button) => (
          <TouchableOpacity
            key={button}
            style={[
              isScientific ? styles.scientificButton : styles.standardButton,
              button === "=" && styles.equalsButton,
            ]}
            onPress={() => handlePress(button)}
          >
            <Text style={styles.buttonText}>{button}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* History Modal */}
      <Modal visible={showHistory} transparent={true} animationType="slide">
        <View style={styles.historyModal}>
          <Text style={styles.historyTitle}>Calculation History</Text>
          <ScrollView>
            {history.length > 0 ? (
              history.map((item, index) => (
                <Text key={index} style={styles.historyItem}>
                  {item}
                </Text>
              ))
            ) : (
              <Text style={styles.historyItem}>No history available</Text>
            )}
          </ScrollView>
          <TouchableOpacity
            onPress={() => setShowHistory(false)}
            style={styles.closeHistoryButton}
          >
            <Text style={styles.closeHistoryText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default Calculator;

// Styles remain unchanged

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: "#121212",
  },
  passwordInput: {
    backgroundColor: "#FFFFFF", // White background
    color: "#000000", // Black text color for visibility
    padding: 10, // Padding for space inside the input
    borderRadius: 5, // Rounded corners
    marginBottom: 15, // Space between inputs
    fontSize: 16, // Readable font size
    borderWidth: 1, // Optional: Add a border for clarity
    borderColor: "#E0E0E0", // Light gray border color
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  iconButton: {
    padding: 10,
    backgroundColor: "#333333",
    borderRadius: 5,
    marginLeft: 10,
  },
  displayContainer: {
    flex: 2,
    justifyContent: "center",
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 10,
    margin: 10,
  },
  inputText: {
    fontSize: 32,
    color: "#FFFFFF",
    textAlign: "right",
  },
  resultText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "right",
    marginTop: 10,
  },
  buttonsContainer: {
    flex: 5,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    padding: 10,
  },
  standardButton: {
    width: (width - 60) / 4,
    height: (height - 390) / 5,
    backgroundColor: "#333333",
    margin: 5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  scientificButton: {
    width: "22%",
    aspectRatio: 1,
    backgroundColor: "#333333",
    margin: 5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 20,
    color: "#FFFFFF",
  },
  equalsButton: {
    backgroundColor: "#4CAF50",
  },
  historyModal: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
    marginTop: 50,
    borderRadius: 10,
  },
  historyItem: {
    fontSize: 18,
    color: "#FFFFFF",
    padding: 5,
  },
  closeHistoryButton: {
    padding: 10,
    alignItems: "center",
    backgroundColor: "#333333",
    borderRadius: 5,
    marginTop: 10,
  },
  closeHistoryText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});