import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, FlatList, Image, TextInput, Alert, TouchableOpacity, Modal, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as SecureStore from "expo-secure-store";

const VaultScreen = () => {
  const [hiddenFiles, setHiddenFiles] = useState([]);
  const [password, setPassword] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  const correctPassword = "1234"; // Set default password, can be changed later
  const hiddenFolderUri = FileSystem.documentDirectory + "hiddenMedia/";

  useEffect(() => {
    const initializeVault = async () => {
      // Ensure hidden folder exists
      const folderInfo = await FileSystem.getInfoAsync(hiddenFolderUri);
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(hiddenFolderUri, { intermediates: true });
      }

      // Check if .nomedia file exists
      const nomediaFilePath = hiddenFolderUri + ".nomedia";
      const nomediaFileExists = await FileSystem.getInfoAsync(nomediaFilePath);

      // If .nomedia doesn't exist, create it
      if (!nomediaFileExists.exists) {
        await FileSystem.writeAsStringAsync(nomediaFilePath, "");
        console.log(".nomedia file created at:", nomediaFilePath);
      } else {
        console.log(".nomedia file already exists at:", nomediaFilePath);
      }

      // Load hidden files from secure storage
      const files = await SecureStore.getItemAsync("hiddenFiles");
      if (files) {
        setHiddenFiles(JSON.parse(files));
      }
    };

    initializeVault();
  }, []);

  const checkFolderContents = async () => {
    const folderContents = await FileSystem.readDirectoryAsync(hiddenFolderUri);
    console.log("Hidden folder contents:", folderContents);
  };

  // Save hidden files to secure storage
  const saveHiddenFiles = async (files) => {
    await SecureStore.setItemAsync("hiddenFiles", JSON.stringify(files));
  };

  // Hide selected file (image or video) by moving it to the hiddenMedia folder
  const hideFile = async (uri) => {
    try {
      const fileName = `${Date.now()}-${uri.split("/").pop()}`;
      const newFileUri = hiddenFolderUri + fileName;

      // Move the file to the hidden directory
      await FileSystem.moveAsync({
        from: uri,
        to: newFileUri,
      });

      // Update the hidden files list
      const updatedFiles = [...hiddenFiles, newFileUri];
      setHiddenFiles(updatedFiles);
      await saveHiddenFiles(updatedFiles);

      // Add to history
      addToHistory(`File hidden: ${fileName}`);
    } catch (error) {
      console.error("Error hiding file:", error);
      Alert.alert("Error", "Could not hide the file.");
    }
  };

  // Select and pick media (image/video)
  const pickMedia = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Support both images and videos
      });

      if (!result.canceled) {
        hideFile(result.assets[0].uri); // Pass the selected file URI to hide
      }
    } catch (error) {
      console.error("Error picking media:", error);
      Alert.alert("Error", "Could not pick media.");
    }
  };

  // Handle password submission and authentication
  const handlePasswordSubmit = () => {
    if (inputPassword === correctPassword) {
      setIsAuthenticated(true);
      setInputPassword("");
    } else {
      Alert.alert("Incorrect Password", "Please try again.");
    }
  };

  // Restore hidden file from vault to gallery (making it visible again)
  const restoreFile = async (fileUri) => {
    try {
      const restoredFileUri = FileSystem.documentDirectory + "restored_" + Date.now() + "-" + fileUri.split("/").pop();

      // Move the file back from the hidden folder to the restored location
      await FileSystem.moveAsync({
        from: fileUri,
        to: restoredFileUri,
      });

      // Remove the .nomedia file if the file is being restored
      const nomediaFilePath = hiddenFolderUri + ".nomedia";
      const nomediaFileExists = await FileSystem.getInfoAsync(nomediaFilePath);
      if (nomediaFileExists.exists) {
        await FileSystem.deleteAsync(nomediaFilePath);
      }

      // Update hidden files list
      const updatedFiles = hiddenFiles.filter((item) => item !== fileUri);
      setHiddenFiles(updatedFiles);
      await saveHiddenFiles(updatedFiles);

      Alert.alert("File Restored", "The file has been successfully restored.");
      addToHistory(`File restored: ${restoredFileUri}`);
    } catch (error) {
      console.error("Error restoring file:", error);
      Alert.alert("Error", "Could not restore the file.");
    }
  };

  // Add actions to history (Hide or Restore)
  const addToHistory = (action) => {
    setHistory((prev) => [...prev, action]);
  };

  const renderFile = ({ item }) => {
    const fileName = item.split("/").pop(); // Extract file name for display
    return (
      <View style={styles.fileContainer}>
        {item.endsWith(".mp4") || item.endsWith(".mov") ? (
          <Text style={styles.fileName}>Video: {fileName}</Text>
        ) : (
          <Image source={{ uri: item }} style={styles.image} />
        )}
        <Button title="Restore" onPress={() => restoreFile(item)} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!isAuthenticated ? (
        <View>
          <TextInput
            style={styles.passwordInput}
            value={inputPassword}
            onChangeText={setInputPassword}
            placeholder="Enter Password"
            secureTextEntry
          />
          <Button title="Submit" onPress={handlePasswordSubmit} />
        </View>
      ) : (
        <View>
          <Button title="Hide Media" onPress={pickMedia} />
          <FlatList
            data={hiddenFiles}
            keyExtractor={(item) => item}
            renderItem={renderFile}
          />
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => setShowHistory(true)}
          >
            <Text style={styles.historyText}>Show History</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* History Modal */}
      <Modal visible={showHistory} transparent={true} animationType="slide">
        <View style={styles.historyModal}>
          <Text style={styles.historyTitle}>Action History</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#121212" },
  image: { width: 100, height: 100, margin: 10 },
  passwordInput: { backgroundColor: "white", padding: 10, marginBottom: 20 },
  historyButton: { marginTop: 20, alignItems: "center", padding: 10, backgroundColor: "#333333", borderRadius: 5 },
  historyText: { color: "#FFFFFF", fontSize: 16 },
  historyModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  historyTitle: { color: "#FFFFFF", fontSize: 20, marginBottom: 20 },
  historyItem: { color: "#FFFFFF", fontSize: 16, marginBottom: 10 },
  closeHistoryButton: { backgroundColor: "#444444", padding: 10, borderRadius: 5 },
  closeHistoryText: { color: "#FFFFFF" },
  fileContainer: { marginBottom: 10 },
  fileName: { color: "#FFFFFF", marginBottom: 5 },
});

export default VaultScreen;
