import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100, "Name is too long"),
  mobile: z
    .string()
    .trim()
    .transform((s) => s.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")),
  address: z.string().trim().min(10, "Enter your full address").max(300, "Address is too long"),
  businessName: z
    .string()
    .trim()
    .max(100, "Business name is too long")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

const tasksSchema = z.object({
  taskIds: z
    .array(z.number().int().positive())
    .min(1, "Select at least one task")
    .max(50, "Too many tasks selected"),
});

// GET /me → who am I, and where am I in onboarding
router.get("/", async (_req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: res.locals.userId },
    include: { profile: true, _count: { select: { tasks: true } } },
  });
  if (!user) throw new AppError(401, "SESSION_EXPIRED", "Your session has expired. Please log in again.");

  res.json({
    id: user.id,
    email: user.email,
    profileCompleted: user.profileCompleted,
    hasSelectedTasks: user._count.tasks > 0,
    profile: user.profile
      ? { ...user.profile, mobile: `+91${user.profile.mobile}` }
      : null,
  });
});

// PUT /me/profile → save name, mobile, address, business name
router.put("/profile", async (req, res) => {
  const body = profileSchema.parse(req.body);
  const userId: string = res.locals.userId;

  const [profile] = await prisma.$transaction([
    prisma.profile.upsert({
      where: { userId },
      create: { userId, ...body },
      update: body,
    }),
    prisma.user.update({ where: { id: userId }, data: { profileCompleted: true } }),
  ]);

  res.json({ message: "Profile saved", profile: { ...profile, mobile: `+91${profile.mobile}` } });
});

// GET /me/tasks → the tasks this user picked
router.get("/tasks", async (_req, res) => {
  const selections = await prisma.userTask.findMany({
    where: { userId: res.locals.userId },
    include: { task: true },
    orderBy: [{ task: { category: "asc" } }, { task: { name: "asc" } }],
  });
  res.json({ tasks: selections.map((s) => s.task) });
});

// PUT /me/tasks → replace the user's selection
router.put("/tasks", async (req, res) => {
  const { taskIds } = tasksSchema.parse(req.body);
  const userId: string = res.locals.userId;
  const uniqueIds = [...new Set(taskIds)];

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.profileCompleted) {
    throw new AppError(403, "PROFILE_REQUIRED", "Please complete your profile first.");
  }

  const found = await prisma.task.count({ where: { id: { in: uniqueIds } } });
  if (found !== uniqueIds.length) {
    throw new AppError(422, "INVALID_TASKS", "One or more selected tasks don't exist.", { taskIds: "Invalid task selected" });
  }

  await prisma.$transaction([
    prisma.userTask.deleteMany({ where: { userId } }),
    prisma.userTask.createMany({ data: uniqueIds.map((taskId) => ({ userId, taskId })) }),
  ]);

  const tasks = await prisma.task.findMany({
    where: { id: { in: uniqueIds } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  res.json({ message: "Tasks saved", tasks });
});

export default router;