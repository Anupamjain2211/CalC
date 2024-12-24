import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const Calculator = () => {
  const navigation = useNavigation();
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [isScientific, setIsScientific] = useState(true);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [password, setPassword] = useState(""); // Track the entered password
  const [passwordEntered, setPasswordEntered] = useState(false); // Check if password is entered

  const correctPassword = "1234"; // Set your correct password here

  const handlePress = (value) => {
    if (value === "=") {
      if (input === "1234") { // Replace "1234" with your desired password
        navigation.navigate("VaultScreen");
      } else {
        try {
          const calculationResult = eval(input);
          if (calculationResult !== undefined && calculationResult !== null) {
            const calculation = `${input} = ${calculationResult}`;
            setResult(calculationResult);
            setHistory((prev) => [...prev, calculation]);
          } else {
            throw new Error("Invalid calculation");
          }
        } catch (error) {
          setResult("Error");
        }
      }
    } else if (value === "C") {
      setInput("");
      setResult(null);
    } else if (value === "Password") {
      // Toggle password entry mode
      setPasswordEntered(true); // Set passwordEntered to true when user wants to enter the password
    } else {
      if (passwordEntered) {
        setPassword(password + value); // Append to password if in password entry mode
      } else {
        setInput((prev) => prev + value); // Regular calculator input
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
        "Password", // Password button
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
        "Password", // Password button
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
          {passwordEntered ? "Enter Password" : input}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: "#121212",
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
