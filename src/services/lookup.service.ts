import { translateWord } from "@/  dictionary/ dictionary.api";
import { getSynonyms } from "@/services/synonyms.service";
import { getExamples } from "@/services/examples.service";

export type WordData = {
  meaning: string;
  synonyms: string[];
  examples: string[];
};

const cache = new Map<string, WordData>();

export const lookupWord = async (word: string): Promise<WordData> => {
  const key = word.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const [meaning, synonyms, examples] = await Promise.all([
    translateWord(word),
    getSynonyms(word),
    getExamples(word),
  ]);

  const result: WordData = { meaning, synonyms, examples };
  cache.set(key, result);
  return result;
};

export const clearLookupCache = () => cache.clear();
