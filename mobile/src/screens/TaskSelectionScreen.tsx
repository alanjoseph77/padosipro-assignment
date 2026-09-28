import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../navigation/types";
import { Screen } from "../components/Screen";
import { PrimaryButton } from "../components/PrimaryButton";
import { FullScreenError, FullScreenLoader } from "../components/Feedback";
import { api, toApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { metaFor } from "../categories";
import { Task } from "../types";
import { colors, radius, shadow } from "../theme";

type Props = NativeStackScreenProps<AppStackParamList, "TaskSelection">;
type Group = { category: string; tasks: Task[] };

export default function TaskSelectionScreen({ navigation }: Props) {
  const { me, signOut } = useAuth();
  const editing = !!me?.hasSelectedTasks;

  const [groups, setGroups] = useState<Group[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catalog, mine] = await Promise.all([
        api.get<{ categories: Group[] }>("/tasks"),
        editing ? api.get<{ tasks: Task[] }>("/me/tasks") : Promise.resolve(null),
      ]);
      setGroups(catalog.data.categories);
      if (mine) setSelected(new Set(mine.data.tasks.map((t) => t.id)));
      setExpanded(catalog.data.categories[0]?.category ?? null);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [editing]);

  useEffect(() => {
    load();
  }, [load]);

  const q = query.trim().toLowerCase();

  // When searching, show only matching tasks (and hide empty categories)
  const visible = useMemo(() => {
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        tasks: g.tasks.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            g.category.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.tasks.length > 0);
  }, [groups, q]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const countFor = (category: string) =>
    groups.find((g) => g.category === category)?.tasks.filter((t) => selected.has(t.id)).length ?? 0;

  const onContinue = () => {
    const tasks = groups.flatMap((g) => g.tasks).filter((t) => selected.has(t.id));
    navigation.navigate("ConfirmTasks", { tasks });
  };

  if (loading) return <FullScreenLoader />;
  if (error) return <FullScreenError message={error} onRetry={load} />;

  return (
    <Screen
      footer={
        <PrimaryButton
          title={selected.size ? `Continue (${selected.size} selected)` : "Select at least one"}
          onPress={onContinue}
          disabled={selected.size === 0}
        />
      }
    >
      <View style={styles.topRow}>
        {editing ? (
          <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.back}>
            <Feather name="chevron-left" size={18} color={colors.primary} />
            <Text style={styles.link}>Back</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.email} numberOfLines={1}>{me?.email}</Text>
            <Pressable onPress={signOut} hitSlop={8}>
              <Text style={styles.link}>Log out</Text>
            </Pressable>
          </>
        )}
      </View>

      <Text style={styles.title}>What do you need help with?</Text>
      <Text style={styles.subtitle}>
        Pick a category, then choose the services you want handled. You can change this later.
      </Text>

      <View style={styles.search}>
        <Feather name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="AC leaking, flights, doctor…"
          placeholderTextColor={colors.placeholder}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityLabel="Clear search">
            <Feather name="x" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {visible.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="search" size={32} color={colors.muted} />
          <Text style={styles.emptyTitle}>No services match “{query}”</Text>
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Text style={styles.link}>Clear search</Text>
          </Pressable>
        </View>
      ) : (
        visible.map((g) => {
          const meta = metaFor(g.category);
          const isOpen = !!q || expanded === g.category;
          const count = countFor(g.category);
          return (
            <View key={g.category} style={[styles.card, isOpen && styles.cardOpen]}>
              {isOpen ? <View style={styles.goldBar} /> : null}
              <Pressable
                onPress={() => setExpanded(isOpen && !q ? null : g.category)}
                style={styles.cardHeader}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
              >
                <View style={[styles.iconTile, isOpen && styles.iconTileOpen]}>
                  <Feather name={meta.icon} size={20} color={isOpen ? "#fff" : colors.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{g.category}</Text>
                  <Text style={styles.cardDesc}>{meta.description}</Text>
                </View>
                {count > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{count}</Text>
                  </View>
                ) : (
                  <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
                )}
              </Pressable>

              {isOpen ? (
                <View>
                  <Text style={styles.kicker}>WHAT KIND OF HELP?</Text>
                  <View style={styles.chips}>
                    {g.tasks.map((t) => {
                      const on = selected.has(t.id);
                      return (
                        <Pressable
                          key={t.id}
                          onPress={() => toggle(t.id)}
                          style={[styles.chip, on && styles.chipOn]}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: on }}
                          accessibilityHint={t.description}
                        >
                          {on ? <Feather name="check" size={14} color="#fff" /> : null}
                          <Text style={[styles.chipText, on && styles.chipTextOn]}>{t.name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  back: { flexDirection: "row", alignItems: "center", gap: 2 },
  email: { flex: 1, marginRight: 12, fontSize: 14, color: colors.muted },
  link: { fontSize: 15, fontWeight: "700", color: colors.primary },
  title: { fontSize: 28, fontWeight: "700", color: colors.text },
  subtitle: { marginTop: 8, fontSize: 15, lineHeight: 22, color: colors.muted },
  search: {
    flexDirection: "row", alignItems: "center", gap: 10, height: 52, marginTop: 20, marginBottom: 16,
    paddingHorizontal: 14, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, height: "100%", fontSize: 16, color: colors.text },
  card: {
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: "transparent", borderRadius: radius.lg,
    padding: 16, marginBottom: 12, overflow: "hidden", ...shadow.card,
  },
  cardOpen: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  goldBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.gold },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconTile: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft,
    alignItems: "center", justifyContent: "center",
  },
  iconTileOpen: { backgroundColor: colors.primary },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "600", color: colors.text },
  cardDesc: { marginTop: 2, fontSize: 14, lineHeight: 20, color: colors.muted },
  badge: {
    minWidth: 26, height: 26, paddingHorizontal: 6, borderRadius: 13, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  kicker: { marginTop: 16, marginBottom: 10, fontSize: 12, fontWeight: "700", letterSpacing: 0.8, color: colors.muted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: "500", color: colors.text },
  chipTextOn: { color: "#fff" },
  empty: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.text, textAlign: "center" },
});
