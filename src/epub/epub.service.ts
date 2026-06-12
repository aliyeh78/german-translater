import ePub from "epubjs";

export const extractEpubText = async (
  uri: string
): Promise<string> => {
  const book = ePub(uri);

  await book.ready;

  let text = "";

  for (const section of book.spine as any) {
    const contents = await section.load(
      book.load.bind(book)
    );

    text += contents.textContent ?? "";
    section.unload();
  }

  return text;
};