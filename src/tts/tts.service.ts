import * as Speech from "expo-speech";

let speaking = false;

export const stopSpeech = () => {
  Speech.stop();
  speaking = false;
};

// 🔊 FULL TEXT (SAFE VERSION)
export const speakText = async (text: string, rate = 0.9) => {
  stopSpeech();

  return new Promise<void>((resolve) => {
    speaking = true;

    Speech.speak(text, {
      language: "de-DE",
      rate,
      onDone: () => {
        speaking = false;
        resolve();
      },
      onStopped: () => {
        speaking = false;
        resolve();
      },
    });
  });
};

// 🔊 WORD (safe)
export const speakWord = (word: string, rate = 0.9) => {
  stopSpeech();

  Speech.speak(word, {
    language: "de-DE",
    rate,
  });
};