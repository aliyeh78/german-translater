export const parseText = (text: string): string[] => {
  return text.split(" ");
};export const parseWords = (text: string) => {
  return text.split(/(\s+)/).filter(Boolean);
};