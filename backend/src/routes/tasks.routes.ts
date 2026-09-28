import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /tasks → tasks grouped by category
router.get("/", requireAuth, async (_req, res) => {
  const tasks = await prisma.task.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });

  const groups: { category: string; tasks: typeof tasks }[] = [];
  for (const task of tasks) {
    let group = groups.find((g) => g.category === task.category);
    if (!group) {
      group = { category: task.category, tasks: [] };
      groups.push(group);
    }
    group.tasks.push(task);
  }

  res.json({ categories: groups });
});

export default router;