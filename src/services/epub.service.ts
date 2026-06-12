// epub.service.ts
// Only requires: jszip
// Install: npm install jszip --legacy-peer-deps
// expo-document-picker is already in your package.json ✅

import * as DocumentPicker from "expo-document-picker";

export type EpubChapter = {
  title: string;
  text: string;
};

export type EpubBook = {
  id: string;
  title: string;
  uri: string;
  chapters: EpubChapter[];
};

export const pickAndParseEpub = async (): Promise<EpubBook | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/epub+zip",
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const uri = asset.uri;
  const title = asset.name.replace(/\.epub$/i, "");

  try {
    // Fetch the epub file as array buffer
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    const chapters = await extractChapters(arrayBuffer);

    return {
      id: Date.now().toString(),
      title,
      uri,
      chapters,
    };
  } catch (e) {
    console.error("EPUB parse error:", e);
    return null;
  }
};

const extractChapters = async (buffer: ArrayBuffer): Promise<EpubChapter[]> => {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);

  // 1. Read container.xml to find OPF path
  const containerXml = await zip.file("META-INF/container.xml")?.async("string");
  if (!containerXml) throw new Error("No container.xml");

  const opfPath = containerXml.match(/full-path="([^"]+\.opf)"/)?.[1];
  if (!opfPath) throw new Error("No OPF path");

  const opfXml = await zip.file(opfPath)?.async("string");
  if (!opfXml) throw new Error("No OPF file");

  const opfDir = opfPath.includes("/")
    ? opfPath.split("/").slice(0, -1).join("/") + "/"
    : "";

  // 2. Build manifest: id → href
  const itemMap: Record<string, string> = {};
  const itemRegex = /<item[^>]+id="([^"]+)"[^>]+href="([^"]+)"[^>]*>/g;
  let m;
  while ((m = itemRegex.exec(opfXml)) !== null) {
    itemMap[m[1]] = m[2];
  }

  // 3. Get spine order
  const spineIds: string[] = [];
  const spineRegex = /<itemref[^>]+idref="([^"]+)"/g;
  while ((m = spineRegex.exec(opfXml)) !== null) {
    spineIds.push(m[1]);
  }

  const chapters: EpubChapter[] = [];

  for (const id of spineIds) {
    const href = itemMap[id];
    if (!href) continue;

    // Handle relative paths and fragments
    const cleanHref = href.split("#")[0];
    const filePath = opfDir + cleanHref;

    const html = await zip.file(filePath)?.async("string");
    if (!html) continue;

    // Extract title
    const chapterTitle =
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
      html.match(/<h[123][^>]*>([^<]+)<\/h[123]>/i)?.[1]?.trim() ||
      `فصل ${chapters.length + 1}`;

    // Strip HTML → plain text
    const text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (text.length > 80) {
      chapters.push({ title: chapterTitle, text });
    }
  }

  return chapters;
};
