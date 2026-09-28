import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export function Logo() {
  return (
    <View style={styles.logo}>
      <View style={styles.mark} />
    </View>
  );
}

export function AuthHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Logo />
      <Text style={styles.brand}>PadosiPro</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 28 },
  logo: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: colors.brandDark,
    alignItems: "center", justifyContent: "center",
  },
  mark: {
    width: 26, height: 26, borderWidth: 6, borderColor: colors.brandAccent,
    borderRadius: 4, transform: [{ rotate: "45deg" }],
  },
  brand: { marginTop: 14, fontSize: 13, fontWeight: "700", letterSpacing: 1.5, color: colors.label },
  title: { marginTop: 14, fontSize: 34, fontWeight: "700", color: colors.text },
  subtitle: { marginTop: 12, fontSize: 16, lineHeight: 24, color: colors.muted },
});
