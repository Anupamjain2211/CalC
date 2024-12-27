import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";

import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as SecureStore from "expo-secure-store";

const VaultScreen = () => {
  const [hiddenFiles, setHiddenFiles] = useState([]);
  const [inputPassword, setInputPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [history, setHistory] = useState([]);
  const [numColumns, setNumColumns] = useState(2); // Number of columns for grid
  const hiddenFolderUri = FileSystem.documentDirectory + "hiddenMedia/";
  const navigation = useNavigation();

  useEffect(() => {
    const initializeVault = async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Media library access is required to hide or restore files."
        );
        return;
      }

      const folderInfo = await FileSystem.getInfoAsync(hiddenFolderUri);
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(hiddenFolderUri, {
          intermediates: true,
        });
      }

      const nomediaPath = hiddenFolderUri + ".nomedia";
      const nomediaExists = await FileSystem.getInfoAsync(nomediaPath);
      if (!nomediaExists.exists) {
        await FileSystem.writeAsStringAsync(nomediaPath, "");
      }

      const storedFiles = await SecureStore.getItemAsync("hiddenFiles");
      if (storedFiles) {
        setHiddenFiles(JSON.parse(storedFiles));
      }

      const savedPassword = await SecureStore.getItemAsync("userPassword");
      if (!savedPassword) {
        await SecureStore.setItemAsync("userPassword", "1234"); // Default password
      }
    };

    initializeVault();
  }, []);

  const saveHiddenFiles = async (files) => {
    await SecureStore.setItemAsync("hiddenFiles", JSON.stringify(files));
  };

  const hideFile = async (uri) => {
    try {
      const fileName = `${Date.now()}-${uri.split("/").pop()}`;
      const newFileUri = hiddenFolderUri + fileName;

      await FileSystem.moveAsync({ from: uri, to: newFileUri });

      const updatedFiles = [...hiddenFiles, newFileUri];
      setHiddenFiles(updatedFiles);
      await saveHiddenFiles(updatedFiles);

      addToHistory(`File hidden: ${fileName}`);
      Alert.alert(
        "Success",
        "The file has been hidden and will not appear in your gallery."
      );
    } catch (error) {
      console.error("Error hiding file:", error);
      Alert.alert("Error", "Could not hide the file.");
    }
  };

  const restoreFile = async (fileUri) => {
    try {
      const restoredFileUri =
        FileSystem.documentDirectory +
        "restored_" +
        Date.now() +
        "-" +
        fileUri.split("/").pop();

      await FileSystem.moveAsync({ from: fileUri, to: restoredFileUri });
      await MediaLibrary.createAssetAsync(restoredFileUri);

      const updatedFiles = hiddenFiles.filter((file) => file !== fileUri);
      setHiddenFiles(updatedFiles);
      await saveHiddenFiles(updatedFiles);

      addToHistory(`File restored: ${restoredFileUri}`);
      Alert.alert("Success", "The file has been restored to your gallery.");
    } catch (error) {
      console.error("Error restoring file:", error);
      Alert.alert("Error", "Could not restore the file.");
    }
  };

  const addToHistory = (action) => {
    setHistory((prev) => [...prev, action]);
  };

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
      });

      if (!result.canceled) {
        hideFile(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking media:", error);
      Alert.alert("Error", "Could not pick media.");
    }
  };

  const handlePasswordSubmit = async () => {
    const savedPassword = await SecureStore.getItemAsync("userPassword");
    if (!savedPassword) {
      Alert.alert("Error", "No password set.");
      return;
    }

    if (inputPassword === savedPassword) {
      setIsAuthenticated(true);
      setInputPassword("");
    } else {
      Alert.alert("Incorrect Password", "Please try again.");
    }
  };

  const handlePasswordChange = async () => {
    const savedPassword = await SecureStore.getItemAsync("userPassword");

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
    setIsChangingPassword(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const renderFile = ({ item }) => {
    const fileName = item.split("/").pop();
    return (
      <View style={styles.gridItem}>
        {fileName.endsWith(".mp4") ? (
          <Text style={styles.fileName}>Video: {fileName}</Text>
        ) : (
          <Image source={{ uri: item }} style={styles.image} />
        )}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={() => restoreFile(item)}
        >
          <Text style={styles.buttonReText}>Restore</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!isAuthenticated ? (
        <View>
          <Text style={styles.headingText}>Enter Password</Text>
          <TextInput
            style={styles.passwordInput}
            value={inputPassword}
            onChangeText={setInputPassword}
            placeholder="Enter Password"
            secureTextEntry
          />
          <TouchableOpacity
            style={styles.passwordButton}
            onPress={handlePasswordSubmit}
          >
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.changePasswordButton, { marginTop: 10 }]}
            onPress={() => setIsChangingPassword(true)}
          >
            <Text style={styles.buttonText}>Change Password</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.changeCancleButton, { marginTop: 10 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Cancle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.passwordButton} onPress={pickMedia}>
              <Text style={[styles.buttonText, { width: 250, textAlign:"center" }]}>
                Hide Media
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsAuthenticated(false)}
            >
              <Text style={styles.buttonText}>X</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            key={numColumns}
            data={hiddenFiles}
            keyExtractor={(item) => item}
            renderItem={renderFile}
            numColumns={numColumns}
          />
        </View>
      )}

      <Modal
        visible={isChangingPassword}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Change Password</Text>
          <TextInput
            placeholder="Enter Old Password"
            style={styles.passwordInput1}
            secureTextEntry
            value={oldPassword}
            onChangeText={setOldPassword}
          />
          <TextInput
            placeholder="Enter New Password"
            style={styles.passwordInput1}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            placeholder="Confirm New Password"
            style={styles.passwordInput1}
            secureTextEntry
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
          />
          <TouchableOpacity
            style={styles.modalButton}
            onPress={handlePasswordChange}
          >
            <Text style={styles.buttonText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setIsChangingPassword(false)}
          >
            <Text style={styles.buttonCancle}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  gridRow: {
    justifyContent: "space-between", // Distribute items evenly in a row
    marginBottom: 10, // Spacing between rows
  },
  gridItem: {
    flex: 1,
    margin: 5, // Add spacing between grid items
    alignItems: "center", // Center items horizontally
    // backgroundColor: "black", // Optional: Background color for the item
    padding: 10, // Optional: Padding inside each grid item
  },
  image: { width: 160, height: 120, marginBottom: 10 },
  restoreButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonReText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
    backgroundColor: "#4CAF50",
    padding:10,
    borderRadius: 8,
    width:160

  },
  fileName: {
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  passwordInput: {
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    borderRadius: 8,
  },
  passwordButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12, // Vertical padding
    paddingHorizontal: 20, // Horizontal padding
    borderRadius: 8, // Rounded corners
    alignItems: "center", // Center the text horizontally
  },
  closeButton: {
    backgroundColor: "#4CAF50", // Green color for close button
    paddingVertical: 12, // Vertical padding
    paddingHorizontal: 20, // Horizontal padding
    borderRadius: 8, // Rounded corners
    alignItems: "center", // Center the text horizontally
  },
  headingText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
  },
  buttonText: {
    color: "#FFFFFF", // White text color
    fontSize: 20, // Font size
    fontWeight: "bold", // Bold text
  },
  buttonCancle: {
    color: "#FFFFFF", // White text color
    fontSize: 20, // Font size
    fontWeight: "bold", // Bold text
  },
  buttonContainer: {
    flexDirection: "row", // Horizontal layout for the buttons
    justifyContent: "space-between", // Space between the buttons
    marginBottom: 20, // Spacing between buttons and the grid
  },
  changePasswordButton: {
    backgroundColor: "#FFA500",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  changeCancleButton: {
    backgroundColor: "red",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "white", // Semi-transparent background
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "black",
  },
  modalButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  changePasswordInput: {
    borderWidth: 1,
    borderColor: "#888888", // Light gray border for password inputs
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#333333", // Dark background
    color: "white", // White text
  },
  passwordInput1: {
    borderWidth: 1,
    padding: 20,
    height: 65,
    marginBottom: 20,
    borderRadius: 8,
  },
});

export default VaultScreen;
