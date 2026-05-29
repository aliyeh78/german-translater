import { Text } from "react-native";

export default function Word({
  word,
  onPress,
  saved,
}: {
  word: string;
  onPress: (w: string) => void;
  saved: string[];
}) {
  const isSaved = saved.includes(word);

  return (
    <Text
      onPress={() => onPress(word)}
      style={{
        fontSize: 24,
        backgroundColor: isSaved ? "#b8f5b1" : "transparent",
      }}
    >
      {word + " "}
    </Text>
  );
}