import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, radius } from "../theme";

type Props = { title: string; onPress: () => void; loading?: boolean; disabled?: boolean };

export function PrimaryButton({ title, onPress, loading, disabled }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: inactive ? colors.primaryDisabled : colors.primary, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { height: 56, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  text: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
