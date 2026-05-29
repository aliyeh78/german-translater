export const translateWord = async (word: string) => {
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${word}&langpair=de|fa`
  );

  const data = await res.json();
  return data.responseData.translatedText;
};

export const translateSentence = async (text: string) => {
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=de|fa`
  );

  const data = await res.json();
  return data.responseData.translatedText;
};