export const useDictionary = () => {
  const getMeaning = async (word: string) => {
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${word}&langpair=de|fa`
      );
      const data = await res.json();
      return data.responseData.translatedText;
    } catch {
      return "No meaning";
    }
  };

  const translateSentence = async (text: string) => {
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          text
        )}&langpair=de|fa`
      );
      const data = await res.json();
      return data.responseData.translatedText;
    } catch {
      return "No translation";
    }
  };

  return { getMeaning, translateSentence };
};