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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as SecureStore from "expo-secure-store";

const VaultScreen = () => {
  const [hiddenFiles, setHiddenFiles] = useState([]);
  const [inputPassword, setInputPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [history, setHistory] = useState([]);
  const [numColumns, setNumColumns] = useState(2); // Keep track of number of columns
  const hiddenFolderUri = FileSystem.documentDirectory + "hiddenMedia/";

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

      // Create a .nomedia file to hide the folder from the gallery
      const nomediaPath = hiddenFolderUri + ".nomedia";
      const nomediaExists = await FileSystem.getInfoAsync(nomediaPath);
      if (!nomediaExists.exists) {
        await FileSystem.writeAsStringAsync(nomediaPath, "");
      }

      // Load previously hidden files
      const storedFiles = await SecureStore.getItemAsync("hiddenFiles");
      if (storedFiles) {
        setHiddenFiles(JSON.parse(storedFiles));
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
          style={[styles.restoreButton, { backgroundColor: "#4CAF50" }]}
          onPress={() => restoreFile(item)}
        >
          <Text style={styles.buttonReText}>Restore</Text>
        </TouchableOpacity>
      </View>
    );
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
        </View>
      ) : (
        <View>
          {/* Hide Media and Close Button Layout */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.passwordButton, { flex: 0.85 }]}
              onPress={pickMedia}
            >
              <Text style={styles.buttonText}>Hide Media</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.closeButton, { flex: 0.05 }]}
              onPress={() => setIsAuthenticated(false)} // Close action
            >
              <Text style={styles.buttonText}>X</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            key={numColumns} // Trigger re-render on numColumns change
            data={hiddenFiles}
            keyExtractor={(item) => item}
            renderItem={renderFile}
            numColumns={numColumns} // Set number of columns dynamically
            columnWrapperStyle={styles.gridRow} // Optional: Add spacing between rows
          />
        </View>
      )}
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
    backgroundColor: "#F5F5F5", // Optional: Background color for the item
    padding: 10, // Optional: Padding inside each grid item
  },
  image: { width: 100, height: 100, marginBottom: 10 },
  restoreButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonReText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
    textAlign: "center",
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
    backgroundColor: "#4CAF50", // Red color for close button
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
  buttonContainer: {
    flexDirection: "row", // Horizontal layout for the buttons
    marginBottom: 20, // Spacing between buttons and the grid
  },
  buttonContainer: {
    flexDirection: "row", // Horizontal layout for the buttons
    justifyContent: "space-between", // Space between the buttons
    marginBottom: 20, // Spacing between buttons and the grid
  },
});

export default VaultScreen;
