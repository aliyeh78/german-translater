import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "lingq_words";

export const loadWords = async (): Promise<string[]> => {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
};

export const saveWords = async (words: string[]) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(words));
};