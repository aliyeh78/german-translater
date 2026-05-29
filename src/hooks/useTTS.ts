import * as Speech from "expo-speech";

export const useTTS = () => {
  const speak = (text: string) => {
    Speech.speak(text, { language: "de-DE" });
  };

  return { speak };
};