"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  PRIORITIES,
  PROJECT_STATUSES,
  TASK_STATUSES,
  projects,
  tasks,
  type Priority,
  type ProjectStatus,
  type TaskStatus,
} from "@/db/schema";
import { parseISODate } from "@/lib/dates";
import { parseDump } from "@/lib/parse";
import { PROJECT_COLOR_KEYS } from "@/lib/project-colors";

/**
 * Phase 1 is single-user and local, so there is no ownership check here. When
 * accounts arrive, every one of these functions must resolve the session and
 * scope its writes — Server Functions are reachable by direct POST.
 */

// A single Quick Dump is deliberately generous but bounded.
const MAX_DUMP_LINES = 200;
const MAX_TITLE_LENGTH = 500;

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(formData: FormData, key: string, max = MAX_TITLE_LENGTH) {
  const value = readText(formData, key);
  return value ? value.slice(0, max) : null;
}

function readId(formData: FormData, key: string): number | null {
  const raw = readText(formData, key);
  if (!/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

function readPriority(formData: FormData, key: string, fallback: Priority = "medium"): Priority {
  const raw = readText(formData, key);
  return (PRIORITIES as readonly string[]).includes(raw) ? (raw as Priority) : fallback;
}

function readTaskStatus(formData: FormData, key: string, fallback: TaskStatus = "todo"): TaskStatus {
  const raw = readText(formData, key);
  return (TASK_STATUSES as readonly string[]).includes(raw) ? (raw as TaskStatus) : fallback;
}

function readProjectStatus(formData: FormData, key: string): ProjectStatus | null {
  const raw = readText(formData, key);
  return (PROJECT_STATUSES as readonly string[]).includes(raw) ? (raw as ProjectStatus) : null;
}

/** Accepts `YYYY-MM-DD` from `<input type="date">`; anything else becomes null. */
function readDueDate(formData: FormData, key: string): string | null {
  const raw = readText(formData, key);
  if (!raw) return null;
  const parsed = parseISODate(raw);
  return parsed ? raw : null;
}

/** Only same-origin, relative paths are honoured. */
function readRedirect(formData: FormData): string | null {
  const raw = readText(formData, "redirectTo");
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

function readColor(formData: FormData, key: string) {
  const raw = readText(formData, key);
  return (PROJECT_COLOR_KEYS as readonly string[]).includes(raw) ? raw : "indigo";
}

/** Uncached reads mean every route must be refreshed after a write. */
function revalidate() {
  revalidatePath("/", "layout");
}

export async function createTask(formData: FormData): Promise<void> {
  const title = readText(formData, "title").slice(0, MAX_TITLE_LENGTH);
  if (!title) return;

  db.insert(tasks)
    .values({
      title,
      notes: readOptionalText(formData, "notes", 2000),
      priority: readPriority(formData, "priority"),
      status: readTaskStatus(formData, "status"),
      dueDate: readDueDate(formData, "dueDate"),
      projectId: readId(formData, "projectId"),
      source: "manual",
    })
    .run();

  revalidate();
}

export async function toggleTask(formData: FormData): Promise<void> {
  const id = readId(formData, "id");
  if (id === null) return;

  const current = db
    .select({ status: tasks.status })
    .from(tasks)
    .where(eq(tasks.id, id))
    .get();
  if (!current) return;

  const next: TaskStatus = current.status === "done" ? "todo" : "done";
  db.update(tasks)
    .set({ status: next, completedAt: next === "done" ? new Date() : null, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .run();

  revalidate();
}

export async function setTaskStatus(formData: FormData): Promise<void> {
  const id = readId(formData, "id");
  if (id === null) return;

  const status = readTaskStatus(formData, "status");
  db.update(tasks)
    .set({ status, completedAt: status === "done" ? new Date() : null, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .run();

  revalidate();
}

export async function deleteTask(formData: FormData): Promise<void> {
  const id = readId(formData, "id");
  if (id === null) return;

  db.delete(tasks).where(eq(tasks.id, id)).run();
  revalidate();
}

export async function createProject(formData: FormData): Promise<void> {
  const name = readText(formData, "name").slice(0, 120);
  if (!name) return;

  db.insert(projects)
    .values({
      name,
      description: readOptionalText(formData, "description", 500),
      color: readColor(formData, "color"),
    })
    .run();

  revalidate();
}

export async function setProjectStatus(formData: FormData): Promise<void> {
  const id = readId(formData, "id");
  const status = readProjectStatus(formData, "status");
  if (id === null || !status) return;

  db.update(projects)
    .set({ status, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .run();

  revalidate();
}

export async function deleteProject(formData: FormData): Promise<void> {
  const id = readId(formData, "id");
  if (id === null) return;

  // Tasks keep existing; the FK is `on delete set null` so they land in Inbox.
  db.delete(projects).where(eq(projects.id, id)).run();
  revalidate();

  const redirectTo = readRedirect(formData);
  if (redirectTo) redirect(redirectTo);
}

export type QuickDumpState = {
  ok: boolean;
  created: number;
  message: string;
  /** Changes on every successful capture so the editor can reset itself. */
  token: number;
} | null;

export async function quickDump(
  _previous: QuickDumpState,
  formData: FormData,
): Promise<QuickDumpState> {
  const text = readText(formData, "text");
  if (!text) {
    return { ok: false, created: 0, message: "Nothing to capture yet.", token: 0 };
  }

  const parsed = parseDump(text).slice(0, MAX_DUMP_LINES);
  if (parsed.length === 0) {
    return { ok: false, created: 0, message: "Nothing to capture yet.", token: 0 };
  }

  const existing = db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .all();

  const byName = new Map(existing.map((project) => [project.name.toLowerCase(), project.id]));
  let filed = 0;
  const unknownTags = new Set<string>();

  const rows = parsed.map((task) => {
    let projectId: number | null = null;

    if (task.projectName) {
      const match = byName.get(task.projectName.toLowerCase());
      if (match !== undefined) {
        projectId = match;
        filed += 1;
      } else {
        // No project by that name yet: keep the tag visible rather than losing it.
        unknownTags.add(task.projectName);
      }
    }

    const title = task.projectName && projectId === null && !task.title.startsWith("#")
      ? `#${task.projectName} ${task.title}`
      : task.title;

    return {
      title: title.slice(0, MAX_TITLE_LENGTH),
      priority: task.priority,
      dueDate: task.dueDate,
      projectId,
      source: "quick_dump" as const,
      status: "todo" as const,
    };
  });

  db.insert(tasks).values(rows).run();
  revalidate();

  const parts = [`Captured ${rows.length} ${rows.length === 1 ? "task" : "tasks"}`];
  if (filed > 0) parts.push(`${filed} filed into projects`);
  if (unknownTags.size > 0) {
    parts.push(
      `${unknownTags.size} unknown ${unknownTags.size === 1 ? "tag" : "tags"} kept in titles`,
    );
  }

  return {
    ok: true,
    created: rows.length,
    message: parts.join(" · "),
    token: Date.now(),
  };
}
