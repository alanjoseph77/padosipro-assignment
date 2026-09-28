import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../theme";
import { PrimaryButton } from "./PrimaryButton";

export function ErrorBanner({ message, actionLabel, onAction }: {
  message: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Feather name="alert-circle" size={18} color={colors.error} />
      <Text style={styles.bannerText}>
        {message}
        {actionLabel ? <Text style={styles.bannerAction} onPress={onAction}>  {actionLabel}</Text> : null}
      </Text>
    </View>
  );
}

export function InfoBanner({ message }: { message: string }) {
  return (
    <View style={[styles.banner, styles.infoBanner]}>
      <Feather name="check-circle" size={18} color={colors.primary} />
      <Text style={[styles.bannerText, styles.infoText]}>{message}</Text>
    </View>
  );
}

export function FullScreenLoader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function FullScreenError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Feather name="wifi-off" size={40} color={colors.muted} />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorText}>{message}</Text>
      <View style={styles.retry}>
        <PrimaryButton title="Try again" onPress={onRetry} />
      </View>
    </View>
  );
}

export function TextLink({ text, linkText, onPress }: { text: string; linkText: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.linkRow} hitSlop={8}>
      <Text style={styles.linkText}>
        {text} <Text style={styles.link}>{linkText}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row", gap: 10, backgroundColor: colors.errorBg, borderRadius: 12,
    padding: 12, marginBottom: 18, alignItems: "flex-start",
  },
  bannerText: { flex: 1, color: colors.error, fontSize: 14, lineHeight: 20 },
  bannerAction: { fontWeight: "700", textDecorationLine: "underline" },
  infoBanner: { backgroundColor: colors.primarySoft },
  infoText: { color: colors.primary },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.bg },
  errorTitle: { marginTop: 16, fontSize: 20, fontWeight: "700", color: colors.text },
  errorText: { marginTop: 8, fontSize: 15, color: colors.muted, textAlign: "center" },
  retry: { marginTop: 24, alignSelf: "stretch" },
  linkRow: { marginTop: 16, alignItems: "center" },
  linkText: { fontSize: 15, color: colors.muted },
  link: { color: colors.primary, fontWeight: "700" },
});
