
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "vocab";

export const loadVocab = async (): Promise<string[]> => {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
};

export const saveVocab = async (words: string[]) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(words));
};