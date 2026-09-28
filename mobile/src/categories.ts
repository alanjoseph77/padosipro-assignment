import { Feather } from "@expo/vector-icons";
import type { Task } from "./types";

type CategoryMeta = { icon: keyof typeof Feather.glyphMap; description: string };

export const CATEGORY_META: Record<string, CategoryMeta> = {
  "Errands & Daily Tasks": { icon: "check-square", description: "Bills, banks, documents, government work" },
  "Home Services": { icon: "home", description: "AC, plumbing, electrical, cleaning, repairs" },
  "Travel & Tourism": { icon: "map-pin", description: "Flights, hotels, visas, transfers, itineraries" },
  "Health & Medical": { icon: "heart", description: "Doctors, lab tests, medicines, hospitals" },
  "Senior Care": { icon: "users", description: "Check-ins, caregivers and support for parents" },
  "Events & Management": { icon: "calendar", description: "Parties, poojas, catering and decor" },
};

export const metaFor = (category: string): CategoryMeta =>
  CATEGORY_META[category] ?? { icon: "grid", description: "" };

// Groups tasks by category, keeping the order they arrive in
export function groupByCategory(tasks: Task[]) {
  const groups: { category: string; tasks: Task[] }[] = [];
  for (const task of tasks) {
    let group = groups.find((g) => g.category === task.category);
    if (!group) {
      group = { category: task.category, tasks: [] };
      groups.push(group);
    }
    group.tasks.push(task);
  }
  return groups;
}
