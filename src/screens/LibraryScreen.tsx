// src/screens/LibraryScreen.tsx
// Usage: import this into your app router or tab navigator.
// Install required package: npx expo install expo-file-system jszip

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
    } catch (e) {
      Alert.alert("خطا", "فایل EPUB خوانده نشد. مطمئن شوید فرمت درست است.");
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

  const handleOpen = (book: EpubBook) => {
    // Pass book id to reader via router param
    router.push({ pathname: "/", params: { bookId: book.id } });
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
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "600", color: "#1a1a1a" }}>
            کتابخانه
          </Text>
          <Pressable
            onPress={handleImport}
            disabled={loading}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "#185FA5",
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 10,
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={{ color: "white", fontWeight: "500" }}>+ افزودن EPUB</Text>
            )}
          </Pressable>
        </View>

        {/* Empty state */}
        {books.length === 0 && !loading && (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 40 }}>📚</Text>
            <Text style={{ fontSize: 16, color: "#888", textAlign: "center" }}>
              هنوز کتابی اضافه نشده.{"\n"}فایل EPUB آلمانی خود را وارد کنید.
            </Text>
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
                shadowOpacity: 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              {/* Book icon */}
              <View
                style={{
                  width: 48,
                  height: 64,
                  backgroundColor: "#E6F1FB",
                  borderRadius: 6,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <Text style={{ fontSize: 24 }}>📖</Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: "#1a1a1a",
                    marginBottom: 4,
                  }}
                  numberOfLines={2}
                >
                  {book.title}
                </Text>
                <Text style={{ fontSize: 12, color: "#888" }}>
                  {book.chapters.length} فصل
                </Text>
              </View>

              {/* Actions */}
              <View style={{ gap: 8 }}>
                <Pressable
                  onPress={() => handleOpen(book)}
                  style={{
                    backgroundColor: "#185FA5",
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 13 }}>خواندن</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(book.id, book.title)}
                  style={{
                    backgroundColor: "#fdecea",
                    paddingVertical: 6,
                    paddingHorizontal: 14,
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
