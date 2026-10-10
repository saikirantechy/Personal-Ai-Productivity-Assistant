import {
  index,
  integer,
  sqliteTable,
  text,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_SOURCES = ["manual", "quick_dump"] as const;
export type TaskSource = (typeof TASK_SOURCES)[number];

export const PROJECT_STATUSES = ["active", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

const now = () => new Date();

export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    /** Tailwind-ish accent key, see `PROJECT_COLORS` in src/lib/project-colors.ts */
    color: text("color").notNull().default("indigo"),
    status: text("status", { enum: PROJECT_STATUSES }).notNull().default("active"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (table) => [index("projects_status_idx").on(table.status)],
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    notes: text("notes"),
    status: text("status", { enum: TASK_STATUSES }).notNull().default("todo"),
    priority: text("priority", { enum: PRIORITIES }).notNull().default("medium"),
    projectId: integer("project_id").references(
      (): AnySQLiteColumn => projects.id,
      { onDelete: "set null" },
    ),
    /** Date-only, stored as `YYYY-MM-DD` so it never shifts across timezones. */
    dueDate: text("due_date"),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    source: text("source", { enum: TASK_SOURCES }).notNull().default("manual"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (table) => [
    index("tasks_status_idx").on(table.status),
    index("tasks_project_idx").on(table.projectId),
    index("tasks_due_date_idx").on(table.dueDate),
  ],
);

export type ProjectRow = typeof projects.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type NewProject = typeof projects.$inferInsert;
