import * as Speech from "expo-speech";

let speaking = false;

export const stopSpeech = () => {
  Speech.stop();
  speaking = false;
};

// 🔊 Speak a single word (for word tap / synonym tap)
export const speakWord = (word: string, rate = 0.9) => {
  stopSpeech();
  Speech.speak(word, {
    language: "de-DE",
    rate,
  });
};

// 🔊 Speak one sentence and wait until it finishes naturally
// Returns a promise that resolves when done or stopped
export const speakSentence = (sentence: string, rate = 0.9): Promise<void> => {
  stopSpeech();
  return new Promise((resolve) => {
    speaking = true;
    Speech.speak(sentence, {
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
      onError: () => {
        speaking = false;
        resolve();
      },
    });
  });
};
