import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

// Up to two initials from the name, falling back to the first letter of the email
function initials(name?: string | null, email?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length) return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return (email?.[0] ?? "?").toUpperCase();
}

export function Avatar({ name, email, size = 44 }: { name?: string | null; email?: string | null; size?: number }) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials(name, email)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: colors.brandDark, alignItems: "center", justifyContent: "center" },
  text: { color: colors.brandAccent, fontWeight: "700", letterSpacing: 0.5 },
});
