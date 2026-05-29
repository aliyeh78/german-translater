import { translateSentence, translateWord } from "@/  dictionary/ dictionary.api";
import { speakWord, stopSpeech } from "@/tts/tts.service";
import { loadVocab, saveVocab } from "@/vocabulary/vocabulary.store";
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TextInput,
  Pressable,
  Animated,
} from "react-native";

export default function Index() {
  const [text, setText] = useState("");
  const [sentences, setSentences] = useState<string[]>([]);
  const [vocab, setVocab] = useState<string[]>([]);
  const [mode, setMode] = useState<"edit" | "read">("edit");
  const [speed] = useState(0.9);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [meaning, setMeaning] = useState("");
  const [translation, setTranslation] = useState("");

  const [currentSentence, setCurrentSentence] = useState(-1);
  const [currentWord, setCurrentWord] = useState("");

  const readingRef = useRef(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadVocab().then(setVocab);
  }, []);

  const updateText = (t: string) => {
    setText(t);
    const s = t
      .split(/[.!?]/)
      .map((x) => x.trim())
      .filter(Boolean);
    setSentences(s);
  };

  // ✅ باز/بسته کردن bottom sheet با انیمیشن
  const openSheet = () => {
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedWord(null));
    setMeaning("");
  };

  // ✅ کلیک روی کلمه — select + speak + معنی
  const onWordPress = async (word: string) => {
    const clean = word.replace(/[.,!?;:]/g, "");
    setSelectedWord(clean);
    setMeaning("");
    openSheet();
    speakWord(clean, speed);
    const result = await translateWord(clean);
    setMeaning(result);
  };

  const saveWord = async () => {
    if (!selectedWord) return;
    if (!vocab.includes(selectedWord)) {
      const updated = [...vocab, selectedWord];
      setVocab(updated);
      await saveVocab(updated);
    }
  };

  const translateAll = async () => {
    // ✅ ترجمه کل متن بالای باکس کلمه نشون داده میشه، نه داخلش
    const result = await translateSentence(text);
    setTranslation(result);
  };

  // ✅ خواندن کلمه به کلمه با هایلایت
  const startReading = async () => {
    readingRef.current = true;

    for (let i = 0; i < sentences.length; i++) {
      if (!readingRef.current) break;
      setCurrentSentence(i);

      const words = sentences[i].split(" ").filter(Boolean);

      for (let j = 0; j < words.length; j++) {
        if (!readingRef.current) break;
        const word = words[j];
        setCurrentWord(word);
        speakWord(word, speed);
        // تخمین مدت زمان هر کلمه
        await new Promise((res) => setTimeout(res, word.length * 80 + 300));
      }

      setCurrentWord("");
      // مکث بین جمله‌ها
      await new Promise((res) => setTimeout(res, 600));
    }

    setCurrentSentence(-1);
    setCurrentWord("");
    readingRef.current = false;
  };

  const stopReading = () => {
    readingRef.current = false;
    stopSpeech();
    setCurrentSentence(-1);
    setCurrentWord("");
  };

  const handleMode = (m: "edit" | "read") => {
    setMode(m);
    if (m === "read") {
      setTimeout(startReading, 300);
    } else {
      stopReading();
    }
  };

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f4ed" }}>
      <View style={{ flex: 1, padding: 12, marginTop: 40 }}>

        {/* TOP BAR */}
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Pressable
            onPress={() => handleMode("edit")}
            style={{
              paddingVertical: 7,
              paddingHorizontal: 14,
              backgroundColor: mode === "edit" ? "#4A4A4A" : "#333",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", fontSize: 14 }}>Edit</Text>
          </Pressable>

          <Pressable
            onPress={() => handleMode("read")}
            style={{
              paddingVertical: 7,
              paddingHorizontal: 14,
              backgroundColor: mode === "read" ? "#185FA5" : "#333",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", fontSize: 14 }}>Read</Text>
          </Pressable>

          <Pressable
            onPress={translateAll}
            style={{
              paddingVertical: 7,
              paddingHorizontal: 14,
              backgroundColor: "#555",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", fontSize: 14 }}>Translate</Text>
          </Pressable>

          <Pressable
            onPress={stopReading}
            style={{
              paddingVertical: 7,
              paddingHorizontal: 14,
              backgroundColor: "#A32D2D",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", fontSize: 14 }}>Stop</Text>
          </Pressable>
        </View>

        {/* EDIT MODE */}
        {mode === "edit" && (
          <TextInput
            value={text}
            onChangeText={updateText}
            multiline
            placeholder="Paste German text..."
            style={{
              marginTop: 10,
              minHeight: 140,
              backgroundColor: "white",
              padding: 12,
              borderRadius: 10,
            }}
          />
        )}

        {/* READ MODE */}
        {mode === "read" && (
          <ScrollView style={{ marginTop: 10, marginBottom: 10 }}>
            {sentences.map((sentence, i) => (
              <Text
                key={i}
                style={{
                  fontSize: 18,
                  lineHeight: 32,
                  marginBottom: 10,
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor:
                    i === currentSentence ? "#FAEEDA" : "transparent",
                }}
              >
                {sentence.split(" ").map((word, wi) => {
                  const clean = word.replace(/[.,!?;:]/g, "");
                  const isSpeaking = word === currentWord || clean === currentWord;
                  const isSelected = clean === selectedWord;
                  const isSaved = vocab.includes(clean);

                  return (
                    <Text
                      key={wi}
                      onPress={() => onWordPress(word)}
                      style={{
                        // ✅ اولویت: speaking > selected > saved
                        backgroundColor: isSpeaking
                          ? "#C0DD97"
                          : isSelected
                          ? "#B5D4F4"
                          : "transparent",
                        color: isSpeaking
                          ? "#27500A"
                          : isSelected
                          ? "#0C447C"
                          : "#1a1a1a",
                        borderRadius: 4,
                        // ✅ هایلایت کلمات سیو شده با underline
                        textDecorationLine: isSaved ? "underline" : "none",
                        textDecorationColor: "#EF9F27",
                        textDecorationStyle: "solid",
                      }}
                    >
                      {word + " "}
                    </Text>
                  );
                })}
              </Text>
            ))}
          </ScrollView>
        )}

        {/* ✅ ترجمه کل متن — بالای صفحه، جدا از word sheet */}
        {translation !== "" && (
          <View
            style={{
              backgroundColor: "#f0f0f0",
              borderRadius: 10,
              padding: 12,
              marginTop: 8,
              borderWidth: 0.5,
              borderColor: "#ddd",
            }}
          >
            <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
              ترجمه متن
            </Text>
            <Text style={{ fontSize: 14, color: "#333" }}>{translation}</Text>
            <Pressable onPress={() => setTranslation("")} style={{ marginTop: 6 }}>
              <Text style={{ fontSize: 12, color: "#999" }}>بستن</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* ✅ WORD BOTTOM SHEET — کاملاً جدا از translation */}
      {selectedWord && (
        <>
          {/* Backdrop */}
          <Pressable
            onPress={closeSheet}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.25)",
            }}
          />

          {/* Sheet */}
          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              transform: [{ translateY: sheetTranslateY }],
              backgroundColor: "white",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: 36,
              shadowColor: "#000",
              shadowOpacity: 0.12,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: -4 },
            }}
          >
            {/* Handle */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: "#ddd",
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: 16,
              }}
            />

            {/* Word + POS */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <Text style={{ fontSize: 26, fontWeight: "500", color: "#111" }}>
                {selectedWord}
              </Text>
              {vocab.includes(selectedWord) && (
                <View
                  style={{
                    backgroundColor: "#FAEEDA",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#633806" }}>⭐ ذخیره شده</Text>
                </View>
              )}
            </View>

            {/* Meaning */}
            <Text style={{ fontSize: 16, color: "#555", marginBottom: 20 }}>
              {meaning || "در حال بارگذاری..."}
            </Text>

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={saveWord}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  backgroundColor: "#FAEEDA",
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#633806", fontWeight: "500" }}>
                  ⭐ ذخیره کلمه
                </Text>
              </Pressable>

              <Pressable
                onPress={() => speakWord(selectedWord, speed)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  backgroundColor: "#E6F1FB",
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#185FA5", fontWeight: "500" }}>
                  🔊 پخش دوباره
                </Text>
              </Pressable>

              <Pressable
                onPress={closeSheet}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#666" }}>✕</Text>
              </Pressable>
            </View>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}