import * as DocumentPicker from "expo-document-picker";

export const pickEpub = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/epub+zip",
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0];
};