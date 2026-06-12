export const getSynonyms = async (word: string): Promise<string[]> => {
  try {
    const res = await fetch(
      `https://www.openthesaurus.de/synonyme/search?q=${encodeURIComponent(word)}&format=application/json`
    );
    const data = await res.json();
    return (
      data.synsets
        ?.flatMap((s: any) => s.terms.map((t: any) => t.term as string))
        .filter((t: string) => t.toLowerCase() !== word.toLowerCase())
        .slice(0, 6) ?? []
    );
  } catch {
    return [];
  }
};
