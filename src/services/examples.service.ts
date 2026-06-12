export const getExamples = async (word: string): Promise<string[]> => {
  try {
    const res = await fetch(
      `https://tatoeba.org/api_v0/search?from=deu&query=${encodeURIComponent(word)}&limit=3`
    );
    const data = await res.json();
    return data.results?.map((r: any) => r.text as string) ?? [];
  } catch {
    return [];
  }
};
