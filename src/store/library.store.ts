import AsyncStorage from "@react-native-async-storage/async-storage";
import { EpubBook } from "@/services/epub.service";

const BOOKS_KEY = "library_books";
const PROGRESS_PREFIX = "reading_progress_";

export type ReadingProgress = {
  bookId: string;
  chapterIndex: number;
};

// ── Books ──────────────────────────────────────────────────────────────

export const loadBooks = async (): Promise<EpubBook[]> => {
  try {
    const data = await AsyncStorage.getItem(BOOKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveBook = async (book: EpubBook): Promise<void> => {
  const books = await loadBooks();
  const idx = books.findIndex((b) => b.id === book.id);
  if (idx >= 0) books[idx] = book;
  else books.push(book);
  await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(books));
};

export const deleteBook = async (bookId: string): Promise<void> => {
  const books = await loadBooks();
  await AsyncStorage.setItem(
    BOOKS_KEY,
    JSON.stringify(books.filter((b) => b.id !== bookId))
  );
};

// ── Progress ───────────────────────────────────────────────────────────

export const loadProgress = async (bookId: string): Promise<ReadingProgress | null> => {
  try {
    const data = await AsyncStorage.getItem(`${PROGRESS_PREFIX}${bookId}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const saveProgress = async (progress: ReadingProgress): Promise<void> => {
  await AsyncStorage.setItem(
    `${PROGRESS_PREFIX}${progress.bookId}`,
    JSON.stringify(progress)
  );
};
