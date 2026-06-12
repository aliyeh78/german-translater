// src/app/library.tsx
// This is the Library tab — shows all imported EPUB books.
// Route: /library

import { pickAndParseEpub, EpubBook } from "@/services/epub.service";
import { loadBooks, saveBook, deleteBook } from "@/store/library.store";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

export default function LibraryScreen() {
  const [books, setBooks] = useState<EpubBook[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadBooks().then(setBooks);
  }, []);

  const handleImport = async () => {
    setLoading(true);
    try {
      const book = await pickAndParseEpub();
      if (book) {
        await saveBook(book);
        setBooks((prev) => [...prev, book]);
      }
    } catch {
      Alert.alert("خطا", "فایل EPUB خوانده نشد.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (bookId: string, title: string) => {
    Alert.alert("حذف کتاب", `آیا "${title}" حذف شود؟`, [
      { text: "لغو", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          await deleteBook(bookId);
          setBooks((prev) => prev.filter((b) => b.id !== bookId));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f4ed" }}>
      <View style={{ flex: 1, padding: 16, marginTop: 40 }}>

        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#1a1a1a" }}>
            📚 کتابخانه
          </Text>
          <Pressable
            onPress={handleImport}
            disabled={loading}
            style={{
              backgroundColor: "#185FA5",
              paddingVertical: 9,
              paddingHorizontal: 16,
              borderRadius: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
                + افزودن EPUB
              </Text>
            )}
          </Pressable>
        </View>

        {/* Empty state */}
        {books.length === 0 && !loading && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
            <Text style={{ fontSize: 56 }}>📖</Text>
            <Text style={{ fontSize: 16, color: "#888", textAlign: "center", lineHeight: 24 }}>
              هنوز کتابی اضافه نشده{"\n"}فایل EPUB آلمانی خود را وارد کنید
            </Text>
            <Pressable
              onPress={handleImport}
              style={{
                backgroundColor: "#185FA5",
                paddingVertical: 12,
                paddingHorizontal: 28,
                borderRadius: 12,
                marginTop: 8,
              }}
            >
              <Text style={{ color: "white", fontWeight: "600", fontSize: 15 }}>
                انتخاب فایل EPUB
              </Text>
            </Pressable>
          </View>
        )}

        {/* Book list */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {books.map((book) => (
            <View
              key={book.id}
              style={{
                backgroundColor: "white",
                borderRadius: 14,
                padding: 16,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              {/* Book spine icon */}
              <View
                style={{
                  width: 44,
                  height: 60,
                  backgroundColor: "#E6F1FB",
                  borderRadius: 6,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                  borderLeftWidth: 4,
                  borderLeftColor: "#185FA5",
                }}
              >
                <Text style={{ fontSize: 22 }}>📖</Text>
              </View>

              {/* Book info */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 15, fontWeight: "600", color: "#1a1a1a", marginBottom: 4 }}
                  numberOfLines={2}
                >
                  {book.title}
                </Text>
                <Text style={{ fontSize: 12, color: "#888" }}>
                  {book.chapters.length} فصل
                </Text>
              </View>

              {/* Buttons */}
              <View style={{ gap: 8, alignItems: "flex-end" }}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/reader",
                      params: { bookId: book.id },
                    })
                  }
                  style={{
                    backgroundColor: "#185FA5",
                    paddingVertical: 7,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 13, fontWeight: "500" }}>
                    خواندن
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(book.id, book.title)}
                  style={{
                    backgroundColor: "#fdecea",
                    paddingVertical: 7,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#A32D2D", fontSize: 13 }}>حذف</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
