import { lookupWord, WordData } from "@/services/lookup.service";
import { loadBooks, saveProgress, loadProgress } from "@/store/library.store";
import { speakWord, speakSentence, stopSpeech } from "@/tts/tts.service";
import { loadVocab, saveVocab } from "@/vocabulary/vocabulary.store";
import { translateSentence } from "@/  dictionary/ dictionary.api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, SafeAreaView, Pressable,
  Animated, ActivityIndicator, Modal,
} from "react-native";
import { EpubBook } from "@/services/epub.service";

export default function ReaderScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const router = useRouter();

  const [book, setBook] = useState<EpubBook | null>(null);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [sentences, setSentences] = useState<string[]>([]);
  const [vocab, setVocab] = useState<string[]>([]);
  const [isReading, setIsReading] = useState(false);
  const [speed] = useState(0.85);
  const [translation, setTranslation] = useState("");
  const [translating, setTranslating] = useState(false);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordData, setWordData] = useState<WordData | null>(null);

  // ✅ Only sentence-level highlight — no word tracking
  const [currentSentence, setCurrentSentence] = useState(-1);

  const readingRef = useRef(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadVocab().then(setVocab);
    loadBooks().then((books) => {
      const found = books.find((b) => b.id === bookId);
      if (!found) return;
      setBook(found);
      loadProgress(bookId!).then((progress) => {
        const startChapter = progress?.chapterIndex ?? 0;
        setChapterIndex(startChapter);
        loadChapter(found, startChapter);
      });
    });
  }, [bookId]);

  const loadChapter = (b: EpubBook, idx: number) => {
    stopReading();
    setTranslation("");
    const chapterText = b.chapters[idx]?.text ?? "";
    // ✅ Split on sentence boundaries properly
    const parsed = chapterText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);
    setSentences(parsed);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const switchChapter = (idx: number) => {
    if (!book) return;
    setChapterIndex(idx);
    loadChapter(book, idx);
    setShowChapterPicker(false);
    saveProgress({ bookId: bookId!, chapterIndex: idx });
  };

  const openSheet = () => {
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      .start(() => setSelectedWord(null));
    setWordData(null);
  };

  const onWordPress = async (word: string) => {
    const clean = word.replace(/[.,!?;:«»"'„"]/g, "");
    if (!clean) return;
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

  // ✅ Sentence-by-sentence reading — natural, clear, no choppy gaps
  const startReading = async () => {
    readingRef.current = true;
    setIsReading(true);

    for (let i = 0; i < sentences.length; i++) {
      if (!readingRef.current) break;
      setCurrentSentence(i);
      // Speak full sentence, wait for it to finish naturally via onDone
      await speakSentence(sentences[i], speed);
      // Short breath between sentences
      if (readingRef.current) {
        await new Promise((res) => setTimeout(res, 350));
      }
    }

    setCurrentSentence(-1);
    readingRef.current = false;
    setIsReading(false);
  };

  const stopReading = () => {
    readingRef.current = false;
    stopSpeech();
    setCurrentSentence(-1);
    setIsReading(false);
  };

  const translateChapter = async () => {
    if (!book) return;
    setTranslating(true);
    const fullText = book.chapters[chapterIndex]?.text.slice(0, 500) ?? "";
    const result = await translateSentence(fullText);
    setTranslation(result);
    setTranslating(false);
  };

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  if (!book) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f4ed", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#185FA5" />
        <Text style={{ marginTop: 12, color: "#888" }}>در حال بارگذاری کتاب...</Text>
      </SafeAreaView>
    );
  }

  const currentChapter = book.chapters[chapterIndex];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f4ed" }}>

      {/* TOP BAR */}
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 8,
        padding: 12, paddingTop: 48, flexWrap: "wrap", backgroundColor: "#f7f4ed",
      }}>
        <Pressable
          onPress={() => { stopReading(); router.back(); }}
          style={{ paddingVertical: 7, paddingHorizontal: 12, backgroundColor: "#333", borderRadius: 8 }}
        >
          <Text style={{ color: "white", fontSize: 14 }}>← برگشت</Text>
        </Pressable>

        <Pressable
          onPress={() => setShowChapterPicker(true)}
          style={{ flex: 1, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: "#E6F1FB", borderRadius: 8 }}
        >
          <Text style={{ color: "#185FA5", fontSize: 13 }} numberOfLines={1}>
            📑 {currentChapter?.title ?? `فصل ${chapterIndex + 1}`}
          </Text>
        </Pressable>

        {!isReading ? (
          <Pressable
            onPress={startReading}
            style={{ paddingVertical: 7, paddingHorizontal: 12, backgroundColor: "#185FA5", borderRadius: 8 }}
          >
            <Text style={{ color: "white", fontSize: 14 }}>▶ خواندن</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={stopReading}
            style={{ paddingVertical: 7, paddingHorizontal: 12, backgroundColor: "#A32D2D", borderRadius: 8 }}
          >
            <Text style={{ color: "white", fontSize: 14 }}>■ توقف</Text>
          </Pressable>
        )}

        <Pressable
          onPress={translateChapter}
          style={{ paddingVertical: 7, paddingHorizontal: 12, backgroundColor: "#555", borderRadius: 8 }}
        >
          {translating
            ? <ActivityIndicator color="white" size="small" />
            : <Text style={{ color: "white", fontSize: 14 }}>ترجمه</Text>}
        </Pressable>
      </View>

      {/* BOOK TEXT */}
      <ScrollView ref={scrollRef} style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#1a1a1a", marginBottom: 16, marginTop: 8 }}>
          {currentChapter?.title}
        </Text>

        {translation !== "" && (
          <View style={{
            backgroundColor: "#f0f0f0", borderRadius: 10, padding: 12,
            marginBottom: 16, borderWidth: 0.5, borderColor: "#ddd",
          }}>
            <Text style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>ترجمه (۵۰۰ کاراکتر اول)</Text>
            <Text style={{ fontSize: 14, color: "#333", lineHeight: 22 }}>{translation}</Text>
            <Pressable onPress={() => setTranslation("")} style={{ marginTop: 6 }}>
              <Text style={{ fontSize: 12, color: "#999" }}>بستن ✕</Text>
            </Pressable>
          </View>
        )}

        {sentences.map((sentence, i) => (
          <Text
            key={i}
            style={{
              fontSize: 19,
              lineHeight: 36,
              marginBottom: 10,
              padding: 8,
              borderRadius: 8,
              // ✅ Full sentence highlighted while being spoken
              backgroundColor: i === currentSentence ? "#FAEEDA" : "transparent",
              borderLeftWidth: i === currentSentence ? 3 : 0,
              borderLeftColor: "#EF9F27",
            }}
          >
            {sentence.split(" ").map((word, wi) => {
              const clean = word.replace(/[.,!?;:«»"'„"]/g, "");
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
 {/* Chapter navigation */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 24 }}>
          {chapterIndex > 0 && (
            <Pressable
              onPress={() => switchChapter(chapterIndex - 1)}
              style={{ flex: 1, padding: 14, backgroundColor: "#E6F1FB", borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#185FA5", fontWeight: "600" }}>← فصل قبلی</Text>
            </Pressable>
          )}
          {chapterIndex < book.chapters.length - 1 && (
            <Pressable
              onPress={() => switchChapter(chapterIndex + 1)}
              style={{ flex: 1, padding: 14, backgroundColor: "#185FA5", borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>فصل بعدی →</Text>
            </Pressable>
          )}
        </View>
      {/* CHAPTER PICKER MODAL */}
      <Modal visible={showChapterPicker} animationType="slide" transparent onRequestClose={() => setShowChapterPicker(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setShowChapterPicker(false)} />
        <View style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          backgroundColor: "white", borderTopLeftRadius: 20, borderTopRightRadius: 20,
          maxHeight: "70%", padding: 20, paddingBottom: 40,
        }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#1a1a1a", marginBottom: 16 }}>انتخاب فصل</Text>
          <ScrollView>
            {book.chapters.map((ch, i) => (
              <Pressable
                key={i}
                onPress={() => switchChapter(i)}
                style={{
                  paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginBottom: 6,
                  backgroundColor: i === chapterIndex ? "#E6F1FB" : "#f5f5f5",
                }}
              >
                <Text style={{
                  fontSize: 14,
                  color: i === chapterIndex ? "#185FA5" : "#333",
                  fontWeight: i === chapterIndex ? "600" : "400",
                }}>
                  {i + 1}. {ch.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

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
            padding: 20, paddingBottom: 40,
            shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: -4 },
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

            <Text style={{ fontSize: 16, color: "#555", marginBottom: 14 }}>
              {wordData ? wordData.meaning : "در حال بارگذاری..."}
            </Text>

            {wordData && wordData.synonyms.length > 0 && (
              <View style={{ marginBottom: 14 }}>
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
              <View style={{ marginBottom: 14 }}>
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
