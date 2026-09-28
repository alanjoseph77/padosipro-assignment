import { ReactNode } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { AppStackParamList } from "../navigation/types";
import { Avatar } from "../components/Avatar";
import { useAuth } from "../context/AuthContext";
import { colors, radius, shadow } from "../theme";

type Props = NativeStackScreenProps<AppStackParamList, "Account">;
type Icon = keyof typeof Feather.glyphMap;

function DetailRow({ icon, label, value, first }: { icon: Icon; label: string; value: string; first?: boolean }) {
  return (
    <View style={[styles.detailRow, !first && styles.divider]}>
      <Feather name={icon} size={18} color={colors.muted} style={styles.detailIcon} />
      <View style={styles.flex}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({ icon, title, subtitle, right, onPress, danger, first }: {
  icon: Icon; title: string; subtitle?: string; right?: ReactNode; onPress?: () => void; danger?: boolean; first?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      style={({ pressed }) => [styles.actionRow, !first && styles.divider, pressed && styles.pressed]}
    >
      <View style={[styles.iconTile, danger && styles.iconTileDanger]}>
        <Feather name={icon} size={18} color={danger ? colors.error : colors.primary} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.actionTitle, danger && styles.dangerText]}>{title}</Text>
        {subtitle ? <Text style={styles.actionSub}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress && !danger ? <Feather name="chevron-right" size={20} color={colors.placeholder} /> : null)}
    </Pressable>
  );
}

export default function AccountScreen({ navigation }: Props) {
  const { me, signOut } = useAuth();
  const profile = me?.profile;

  const confirmLogout = () => {
    Alert.alert("Log out?", "You'll need to log in again to see your tasks.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.back}>
          <Feather name="chevron-left" size={18} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Account</Text>

        <View style={[styles.card, styles.profileCard]}>
          <Avatar name={profile?.name} email={me?.email} size={56} />
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={1}>{profile?.name ?? "Your account"}</Text>
            <Text style={styles.email} numberOfLines={1}>{me?.email}</Text>
          </View>
        </View>

        {profile ? (
          <>
            <Text style={styles.kicker}>YOUR DETAILS</Text>
            <View style={styles.card}>
              <DetailRow first icon="phone" label="Mobile" value={profile.mobile} />
              <DetailRow icon="map-pin" label="Address" value={profile.address} />
              {profile.businessName ? (
                <DetailRow icon="briefcase" label="Business" value={profile.businessName} />
              ) : null}
            </View>
          </>
        ) : null}

        <Text style={styles.kicker}>SERVICES</Text>
        <View style={styles.card}>
          <ActionRow
            first
            icon="list"
            title="Your tasks"
            subtitle="Add or change what your Lifestyle Manager handles"
            onPress={() => navigation.navigate("TaskSelection")}
          />
          <ActionRow
            icon="credit-card"
            title="Wallet"
            subtitle="Your Lifestyle Manager can send you the bill directly for now."
            right={
              <View style={styles.soonPill}>
                <Text style={styles.soonText}>Soon</Text>
              </View>
            }
          />
        </View>

        <View style={styles.card}>
          <ActionRow first icon="log-out" title="Log out" danger onPress={confirmLogout} />
        </View>

        <Text style={styles.version}>PadosiPro · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 32 },
  flex: { flex: 1 },
  back: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 16 },
  backText: { fontSize: 15, fontWeight: "700", color: colors.primary },
  title: { fontSize: 28, fontWeight: "700", color: colors.text, marginBottom: 20 },
  kicker: { marginTop: 12, marginBottom: 10, fontSize: 12, fontWeight: "700", letterSpacing: 0.8, color: colors.muted },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 16,
    marginBottom: 14, ...shadow.card,
  },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 18 },
  name: { fontSize: 18, fontWeight: "700", color: colors.text },
  email: { marginTop: 2, fontSize: 14, color: colors.muted },

  divider: { borderTopWidth: 1, borderTopColor: colors.divider },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 14 },
  detailIcon: { marginTop: 2 },
  detailLabel: { fontSize: 12, fontWeight: "600", color: colors.label, marginBottom: 2 },
  detailValue: { fontSize: 15, lineHeight: 21, color: colors.text },

  actionRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  pressed: { opacity: 0.7 },
  iconTile: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft,
    alignItems: "center", justifyContent: "center",
  },
  iconTileDanger: { backgroundColor: colors.errorBg },
  actionTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  actionSub: { marginTop: 2, fontSize: 13, lineHeight: 18, color: colors.muted },
  dangerText: { color: colors.error },
  soonPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.goldSoft },
  soonText: { fontSize: 12, fontWeight: "700", color: colors.goldText },

  version: { marginTop: 8, textAlign: "center", fontSize: 12, color: colors.placeholder },
});
