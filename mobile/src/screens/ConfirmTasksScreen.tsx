import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../navigation/types";
import { Screen } from "../components/Screen";
import { PrimaryButton } from "../components/PrimaryButton";
import { ErrorBanner, TextLink } from "../components/Feedback";
import { api, toApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { groupByCategory, metaFor } from "../categories";
import { colors, radius, shadow } from "../theme";

type Props = NativeStackScreenProps<AppStackParamList, "ConfirmTasks">;

export default function ConfirmTasksScreen({ navigation, route }: Props) {
  const { tasks } = route.params;
  const { me, refreshMe } = useAuth();
  const wasEditing = useRef(!!me?.hasSelectedTasks).current;

  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.put("/me/tasks", { taskIds: tasks.map((t) => t.id) });
      setDone(true);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const goHome = async () => {
    setFinishing(true);
    try {
      await refreshMe(); // first time: hasSelectedTasks becomes true → navigator shows Home
      if (wasEditing) navigation.popToTop();
    } catch (err) {
      setError(toApiError(err).message);
      setFinishing(false);
    }
  };

  if (done) {
    return (
      <Screen footer={<PrimaryButton title="Go to home" onPress={goHome} loading={finishing} />}>
        <View style={styles.doneWrap}>
          <View style={styles.doneRing}>
            <View style={styles.doneIcon}>
              <Feather name="check" size={30} color="#fff" />
            </View>
          </View>
          <Text style={styles.title}>We're on it</Text>
          <Text style={styles.subtitle}>
            Your Lifestyle Manager has your {tasks.length} {tasks.length === 1 ? "task" : "tasks"} and will handle
            the rest. You'll see them on your home screen.
          </Text>
          {error ? <ErrorBanner message={error} /> : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen footer={<PrimaryButton title="Confirm and save" onPress={save} loading={saving} />}>
      <Text style={styles.title}>Confirm your tasks</Text>
      <Text style={styles.subtitle}>
        You picked {tasks.length} {tasks.length === 1 ? "task" : "tasks"}. Your Lifestyle Manager will take these on.
      </Text>

      {error ? <ErrorBanner message={error} /> : null}

      {groupByCategory(tasks).map((g) => (
        <View key={g.category} style={styles.group}>
          <View style={styles.groupHeader}>
            <Feather name={metaFor(g.category).icon} size={16} color={colors.primary} />
            <Text style={styles.groupTitle}>{g.category}</Text>
          </View>
          {g.tasks.map((t, i) => (
            <View key={t.id} style={[styles.row, i > 0 && styles.rowDivider]}>
              <Feather name="check-circle" size={18} color={colors.primary} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{t.name}</Text>
                <Text style={styles.rowDesc}>{t.description}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}

      <TextLink text="Want to change something?" linkText="Edit selection" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "700", color: colors.text },
  subtitle: { marginTop: 8, marginBottom: 20, fontSize: 15, lineHeight: 22, color: colors.muted },
  group: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, marginBottom: 12, ...shadow.card },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  groupTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5, color: colors.label },
  row: { flexDirection: "row", gap: 12, paddingVertical: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  rowDesc: { marginTop: 2, fontSize: 14, lineHeight: 20, color: colors.muted },
  doneWrap: { flex: 1, justifyContent: "center" },
  doneRing: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primarySoft,
    alignItems: "center", justifyContent: "center", marginBottom: 28,
  },
  doneIcon: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
});
