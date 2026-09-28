import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { AppStackParamList } from "../navigation/types";
import { PrimaryButton } from "../components/PrimaryButton";
import { ErrorBanner } from "../components/Feedback";
import { Avatar } from "../components/Avatar";
import { api, toApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { groupByCategory, metaFor } from "../categories";
import { Task } from "../types";
import { colors, radius, shadow } from "../theme";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const today = () => new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

const STEPS: { title: string; text: string }[] = [
  { title: "Tell us what you need", text: "In your own words. No forms to hunt through." },
  { title: "Your Lifestyle Manager takes it on", text: "One person who knows your family and follows it through." },
  { title: "You see it done", text: "Updates as things happen, with proof when it matters." },
];

export default function HomeScreen({ navigation }: Props) {
  const { me } = useAuth();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get<{ tasks: Task[] }>("/me/tasks");
      setTasks(res.data.tasks);
    } catch (err) {
      setError(toApiError(err).message);
    }
  }, []);

  // Reload every time Home comes into view (e.g. after editing tasks)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const firstName = me?.profile?.name.split(" ")[0] ?? "";
  const groups = tasks ? groupByCategory(tasks) : [];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.date}>{today()}</Text>
            <Text style={styles.greeting}>
              {greeting()}
              {firstName ? `, ${firstName}` : ""}
            </Text>
          </View>
          <Pressable onPress={() => navigation.navigate("Account")} hitSlop={10} accessibilityLabel="Account">
            <Avatar name={me?.profile?.name} email={me?.email} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Feather name="user-check" size={20} color={colors.brandDark} />
            </View>
            <View style={styles.activePill}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Your Lifestyle Manager is on it</Text>
          <Text style={styles.heroText}>
            {tasks && tasks.length
              ? `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} across ${groups.length} ${groups.length === 1 ? "category" : "categories"}`
              : "Pick the tasks you want handled"}
          </Text>
          {me?.profile ? (
            <View style={styles.heroFooter}>
              <Feather name="phone" size={14} color={colors.brandAccent} />
              <Text style={styles.heroFooterText}>We'll call you on {me.profile.mobile}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.kicker}>YOUR TASKS</Text>
          {tasks && tasks.length ? (
            <Pressable onPress={() => navigation.navigate("TaskSelection")} hitSlop={8}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          ) : null}
        </View>

        {error ? (
          <ErrorBanner message={error} actionLabel="Try again" onAction={load} />
        ) : tasks === null ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : tasks.length === 0 ? (
          <View style={[styles.card, styles.emptyCard]}>
            <Feather name="inbox" size={28} color={colors.muted} />
            <Text style={styles.emptyText}>You haven't picked any tasks yet.</Text>
          </View>
        ) : (
          groups.map((g) => (
            <View key={g.category} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconTile}>
                  <Feather name={metaFor(g.category).icon} size={18} color={colors.primary} />
                </View>
                <Text style={styles.cardTitle}>{g.category}</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{g.tasks.length}</Text>
                </View>
              </View>
              {g.tasks.map((t, i) => (
                <View key={t.id} style={[styles.taskRow, i > 0 && styles.taskDivider]}>
                  <View style={styles.checkDot}>
                    <Feather name="check" size={12} color="#fff" />
                  </View>
                  <View style={styles.taskText}>
                    <Text style={styles.taskName}>{t.name}</Text>
                    <Text style={styles.taskDesc}>{t.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}

        <Text style={[styles.kicker, styles.kickerSpaced]}>HOW PADOSIPRO WORKS</Text>
        <View style={styles.card}>
          {STEPS.map((s, i) => (
            <View key={s.title} style={styles.step}>
              <View style={styles.stepRail}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                {i < STEPS.length - 1 ? <View style={styles.stepLine} /> : null}
              </View>
              <View style={[styles.taskText, styles.stepBody]}>
                <Text style={styles.taskName}>{s.title}</Text>
                <Text style={styles.taskDesc}>{s.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title="Add or change tasks" onPress={() => navigation.navigate("TaskSelection")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  headerText: { flex: 1 },
  date: { fontSize: 13, fontWeight: "500", color: colors.muted, marginBottom: 2 },
  greeting: { fontSize: 24, fontWeight: "700", color: colors.text },

  hero: { backgroundColor: colors.brandDark, borderRadius: radius.lg + 4, padding: 20, ...shadow.card },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  heroIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brandAccent,
    alignItems: "center", justifyContent: "center",
  },
  activePill: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)",
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold },
  activeText: { fontSize: 12, fontWeight: "700", color: colors.goldSoft },
  heroTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  heroText: { marginTop: 4, fontSize: 15, color: "rgba(255,255,255,0.72)" },
  heroFooter: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)",
  },
  heroFooterText: { fontSize: 14, fontWeight: "500", color: "rgba(255,255,255,0.85)" },

  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 28, marginBottom: 12 },
  kicker: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8, color: colors.muted },
  kickerSpaced: { marginTop: 16, marginBottom: 12 },
  editLink: { fontSize: 14, fontWeight: "700", color: colors.primary },
  loader: { marginVertical: 24 },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, marginBottom: 12, ...shadow.card },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  iconTile: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primarySoft,
    alignItems: "center", justifyContent: "center",
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.text },
  countPill: {
    minWidth: 24, height: 24, paddingHorizontal: 7, borderRadius: 12, backgroundColor: colors.goldSoft,
    alignItems: "center", justifyContent: "center",
  },
  countText: { fontSize: 12, fontWeight: "700", color: colors.goldText },
  taskRow: { flexDirection: "row", gap: 12, paddingVertical: 10 },
  taskDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  checkDot: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, marginTop: 1,
    alignItems: "center", justifyContent: "center",
  },
  taskText: { flex: 1 },
  taskName: { fontSize: 15, fontWeight: "600", color: colors.text },
  taskDesc: { marginTop: 2, fontSize: 13, lineHeight: 19, color: colors.muted },
  emptyCard: { alignItems: "center", paddingVertical: 28, gap: 10 },
  emptyText: { fontSize: 15, color: colors.muted },

  step: { flexDirection: "row", gap: 14 },
  stepRail: { alignItems: "center" },
  stepNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft,
    alignItems: "center", justifyContent: "center",
  },
  stepNumText: { fontSize: 13, fontWeight: "700", color: colors.primary },
  stepLine: { flex: 1, width: 2, backgroundColor: colors.primarySoft, marginVertical: 4 },
  stepBody: { paddingBottom: 18, paddingTop: 3 },

  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
});
