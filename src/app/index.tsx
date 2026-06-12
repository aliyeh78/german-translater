import { translateSentence } from "@/  dictionary/ dictionary.api";
import { lookupWord, WordData } from "@/services/lookup.service";
import { pickAndParseEpub } from "@/services/epub.service";
import { saveBook } from "@/store/library.store";
import { speakWord, speakSentence, stopSpeech } from "@/tts/tts.service";
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
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  const [text, setText] = useState("");
  const [sentences, setSentences] = useState<string[]>([]);
  const [vocab, setVocab] = useState<string[]>([]);
  const [mode, setMode] = useState<"edit" | "read">("edit");
  const [speed] = useState(0.85);
  const [epubLoading, setEpubLoading] = useState(false);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [translation, setTranslation] = useState("");

  // ✅ Only track current sentence now — no more currentWord needed
  const [currentSentence, setCurrentSentence] = useState(-1);

  const readingRef = useRef(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadVocab().then(setVocab);
  }, []);

  const updateText = (t: string) => {
    setText(t);
    const s = t
      .split(/(?<=[.!?])\s+/)
      .map((x) => x.trim())
      .filter(Boolean);
    setSentences(s);
  };

  const handleUploadEpub = async () => {
    setEpubLoading(true);
    try {
      const book = await pickAndParseEpub();
      if (!book) { setEpubLoading(false); return; }
      if (book.chapters.length === 0) {
        Alert.alert("خطا", "فصلی در این EPUB پیدا نشد.");
        setEpubLoading(false);
        return;
      }
      await saveBook(book);
      router.push({ pathname: "/reader", params: { bookId: book.id } });
    } catch {
      Alert.alert("خطا", "فایل EPUB خوانده نشد.");
    } finally {
      setEpubLoading(false);
    }
  };

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
    setWordData(null);
  };

  const onWordPress = async (word: string) => {
    const clean = word.replace(/[.,!?;:]/g, "");
    setSelectedWord(clean);
    setWordData(null);
    openSheet();
    speakWord(clean, speed);
    const result = await lookupWord(clean);
    setWordData(result);
  };

  const saveWord = async () => {
    if (!selectedWord || vocab.includes(selectedWord)) return;
    const updated = [...vocab, selectedWord];
    setVocab(updated);
    await saveVocab(updated);
  };

  const translateAll = async () => {
    const result = await translateSentence(text);
    setTranslation(result);
  };

  // ✅ NEW: reads full sentences — natural, continuous, no choppy gaps
  const startReading = async () => {
    readingRef.current = true;

    for (let i = 0; i < sentences.length; i++) {
      if (!readingRef.current) break;
      setCurrentSentence(i);
      // Speak the whole sentence and wait for it to finish naturally
      await speakSentence(sentences[i], speed);
      // Small pause between sentences
      if (readingRef.current) {
        await new Promise((res) => setTimeout(res, 400));
      }
    }

    setCurrentSentence(-1);
    readingRef.current = false;
  };

  const stopReading = () => {
    readingRef.current = false;
    stopSpeech();
    setCurrentSentence(-1);
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
    outputRange: [500, 0],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f4ed" }}>
      <View style={{ flex: 1, padding: 12, marginTop: 40 }}>

        {/* TOP BAR */}
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Pressable
            onPress={() => handleMode("edit")}
            style={{
              paddingVertical: 7, paddingHorizontal: 14,
              backgroundColor: mode === "edit" ? "#4A4A4A" : "#333",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", fontSize: 14 }}>Edit</Text>
          </Pressable>

          <Pressable
            onPress={() => handleMode("read")}
            style={{
              paddingVertical: 7, paddingHorizontal: 14,
              backgroundColor: mode === "read" ? "#185FA5" : "#333",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", fontSize: 14 }}>Read</Text>
          </Pressable>

          <Pressable
            onPress={translateAll}
            style={{ paddingVertical: 7, paddingHorizontal: 14, backgroundColor: "#555", borderRadius: 8 }}
          >
            <Text style={{ color: "white", fontSize: 14 }}>Translate</Text>
          </Pressable>

          <Pressable
            onPress={stopReading}
            style={{ paddingVertical: 7, paddingHorizontal: 14, backgroundColor: "#A32D2D", borderRadius: 8 }}
          >
            <Text style={{ color: "white", fontSize: 14 }}>Stop</Text>
          </Pressable>
        </View>

        {/* EPUB UPLOAD BUTTON */}
        <Pressable
          onPress={handleUploadEpub}
          disabled={epubLoading}
          style={{
            marginTop: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 13,
            backgroundColor: "#1a1a1a",
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: "#444",
            borderStyle: "dashed",
          }}
        >
          {epubLoading ? (
            <>
              <ActivityIndicator color="white" size="small" />
              <Text style={{ color: "#aaa", fontSize: 14 }}>در حال پردازش EPUB...</Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 18 }}>📂</Text>
              <Text style={{ color: "white", fontSize: 14, fontWeight: "500" }}>آپلود فایل EPUB</Text>
              <Text style={{ color: "#888", fontSize: 12 }}>(برای خواندن کتاب)</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push("/library")}
          style={{ marginTop: 6, paddingVertical: 8, alignItems: "center" }}
        >
          <Text style={{ color: "#185FA5", fontSize: 13 }}>📚 مشاهده کتابخانه</Text>
        </Pressable>

        {/* EDIT MODE */}
        {mode === "edit" && (
          <TextInput
            value={text}
            onChangeText={updateText}
            multiline
            placeholder="Paste German text..."
            style={{
              marginTop: 8, minHeight: 140,
              backgroundColor: "white", padding: 12, borderRadius: 10,
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
                  // ✅ Whole sentence highlights as it's being spoken
                  backgroundColor: i === currentSentence ? "#FAEEDA" : "transparent",
                  borderLeftWidth: i === currentSentence ? 3 : 0,
                  borderLeftColor: "#EF9F27",
                }}
              >
                {sentence.split(" ").map((word, wi) => {
                  const clean = word.replace(/[.,!?;:]/g, "");
                  const isSelected = clean === selectedWord;
                  const isSaved = vocab.includes(clean);

                  return (
                    <Text
                      key={wi}
                      onPress={() => onWordPress(word)}
                      style={{
                        backgroundColor: isSelected ? "#B5D4F4" : "transparent",
                        color: isSelected ? "#0C447C" : "#1a1a1a",
                        borderRadius: 4,
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

        {/* Translation box */}
        {translation !== "" && (
          <View style={{
            backgroundColor: "#f0f0f0", borderRadius: 10, padding: 12,
            marginTop: 8, borderWidth: 0.5, borderColor: "#ddd",
          }}>
            <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>ترجمه متن</Text>
            <Text style={{ fontSize: 14, color: "#333" }}>{translation}</Text>
            <Pressable onPress={() => setTranslation("")} style={{ marginTop: 6 }}>
              <Text style={{ fontSize: 12, color: "#999" }}>بستن</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* WORD BOTTOM SHEET */}
      {selectedWord && (
        <>
          <Pressable
            onPress={closeSheet}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.25)" }}
          />
          <Animated.View style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            transform: [{ translateY: sheetTranslateY }],
            backgroundColor: "white",
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: 20, paddingBottom: 36,
            shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12,
            shadowOffset: { width: 0, height: -4 },
          }}>
            <View style={{ width: 40, height: 4, backgroundColor: "#ddd", borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Text style={{ fontSize: 26, fontWeight: "500", color: "#111" }}>{selectedWord}</Text>
              {vocab.includes(selectedWord) && (
                <View style={{ backgroundColor: "#FAEEDA", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, color: "#633806" }}>⭐ ذخیره شده</Text>
                </View>
              )}
            </View>

            <Text style={{ fontSize: 16, color: "#555", marginBottom: 16 }}>
              {wordData ? wordData.meaning : "در حال بارگذاری..."}
            </Text>

            {wordData && wordData.synonyms.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>مترادف‌ها</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {wordData.synonyms.map((syn, i) => (
                    <Pressable key={i} onPress={() => speakWord(syn, speed)}
                      style={{ backgroundColor: "#f0f0f0", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                      <Text style={{ fontSize: 13, color: "#333" }}>{syn}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {wordData && wordData.examples.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>جملات نمونه</Text>
                {wordData.examples.map((ex, i) => (
                  <Text key={i} style={{
                    fontSize: 13, color: "#444", lineHeight: 20, marginBottom: 6,
                    paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: "#B5D4F4",
                  }}>{ex}</Text>
                ))}
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={saveWord}
                style={{ flex: 1, paddingVertical: 12, backgroundColor: "#FAEEDA", borderRadius: 12, alignItems: "center" }}>
                <Text style={{ color: "#633806", fontWeight: "500" }}>⭐ ذخیره کلمه</Text>
              </Pressable>
              <Pressable onPress={() => speakWord(selectedWord, speed)}
                style={{ flex: 1, paddingVertical: 12, backgroundColor: "#E6F1FB", borderRadius: 12, alignItems: "center" }}>
                <Text style={{ color: "#185FA5", fontWeight: "500" }}>🔊 پخش دوباره</Text>
              </Pressable>
              <Pressable onPress={closeSheet}
                style={{ paddingVertical: 12, paddingHorizontal: 16, backgroundColor: "#f5f5f5", borderRadius: 12, alignItems: "center" }}>
                <Text style={{ color: "#666" }}>✕</Text>
              </Pressable>
            </View>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}
