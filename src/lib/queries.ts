import { asc, desc, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { toISODate } from "@/lib/dates";
import {
  projects,
  tasks,
  type Priority,
  type ProjectStatus,
  type TaskSource,
  type TaskStatus,
} from "@/db/schema";

export type TaskWithProject = {
  id: number;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  completedAt: Date | null;
  createdAt: Date;
  source: TaskSource;
  projectId: number | null;
  projectName: string | null;
  projectColor: string | null;
};

export type ProjectRow = {
  id: number;
  name: string;
  description: string | null;
  color: string;
  status: ProjectStatus;
  createdAt: Date;
};

export type ProjectCounts = {
  total: number;
  done: number;
  open: number;
  overdue: number;
};

export type ProjectWithStats = ProjectRow & ProjectCounts;

/**
 * Order open work the way a human triages it: in-progress first, then soonest
 * due date (undated last), then priority, then newest.
 */
const dueDateRank = sql`${tasks.dueDate} is null`;
const statusRank = sql`case ${tasks.status} when 'in_progress' then 0 when 'todo' then 1 else 2 end`;
const priorityRank = sql`case ${tasks.priority} when 'urgent' then 0 when 'high' then 1 when 'medium' then 2 else 3 end`;

const taskSelection = {
  id: tasks.id,
  title: tasks.title,
  notes: tasks.notes,
  status: tasks.status,
  priority: tasks.priority,
  dueDate: tasks.dueDate,
  completedAt: tasks.completedAt,
  createdAt: tasks.createdAt,
  source: tasks.source,
  projectId: tasks.projectId,
  projectName: projects.name,
  projectColor: projects.color,
};

export type TaskFilter = {
  /** `open` = everything not done (default), `done`, or `all`. */
  status?: "open" | "done" | "all";
  projectId?: number;
  priority?: Priority;
  /** Only tasks with no project attached. */
  inboxOnly?: boolean;
  source?: TaskSource;
  limit?: number;
};

export function listTasks(filter: TaskFilter = {}): TaskWithProject[] {
  const conditions = [];
  if (filter.status === "open") conditions.push(ne(tasks.status, "done"));
  if (filter.status === "done") conditions.push(eq(tasks.status, "done"));
  if (filter.projectId !== undefined) conditions.push(eq(tasks.projectId, filter.projectId));
  if (filter.inboxOnly) conditions.push(sql`${tasks.projectId} is null`);
  if (filter.priority) conditions.push(eq(tasks.priority, filter.priority));
  if (filter.source) conditions.push(eq(tasks.source, filter.source));

  const query = db
    .select(taskSelection)
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(conditions.length ? sql.join(conditions, sql` and `) : undefined)
    .orderBy(statusRank, dueDateRank, asc(tasks.dueDate), priorityRank, desc(tasks.createdAt));

  return filter.limit ? query.limit(filter.limit).all() : query.all();
}

export function listProjects(includeArchived = false): ProjectRow[] {
  const query = db.select().from(projects);
  const rows = includeArchived
    ? query.orderBy(asc(projects.name)).all()
    : query.where(eq(projects.status, "active")).orderBy(asc(projects.name)).all();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    status: row.status,
    createdAt: row.createdAt,
  }));
}

export function getProject(id: number): ProjectRow | null {
  const row = db.select().from(projects).where(eq(projects.id, id)).get();
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    status: row.status,
    createdAt: row.createdAt,
  };
}

/** Aggregate per-project counts in one grouped query. */
export function getProjectStats(today: string): Map<number, ProjectCounts> {
  const rows = db
    .select({
      projectId: tasks.projectId,
      total: sql<number>`count(*)`,
      done: sql<number>`sum(case when ${tasks.status} = 'done' then 1 else 0 end)`,
      overdue: sql<number>`sum(case when ${tasks.status} != 'done' and ${tasks.dueDate} is not null and ${tasks.dueDate} < ${today} then 1 else 0 end)`,
    })
    .from(tasks)
    .groupBy(tasks.projectId)
    .all();

  const stats = new Map<number, ProjectCounts>();
  for (const row of rows) {
    if (row.projectId === null) continue;
    stats.set(row.projectId, {
      total: row.total,
      done: row.done ?? 0,
      open: row.total - (row.done ?? 0),
      overdue: row.overdue ?? 0,
    });
  }
  return stats;
}

export function listProjectsWithStats(includeArchived = false, today: string): ProjectWithStats[] {
  const stats = getProjectStats(today);
  return listProjects(includeArchived).map((project) => {
    const entry = stats.get(project.id) ?? { total: 0, done: 0, open: 0, overdue: 0 };
    return { ...project, ...entry };
  });
}

export function getSidebarCounts(): { tasks: number; projects: number } {
  const openTasks =
    db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(ne(tasks.status, "done"))
      .get()?.count ?? 0;

  const activeProjects =
    db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.status, "active"))
      .get()?.count ?? 0;

  return { tasks: openTasks, projects: activeProjects };
}

export type DashboardCounts = {
  open: number;
  inProgress: number;
  dueToday: number;
  overdue: number;
  completedThisWeek: number;
  inbox: number;
  projects: number;
};

export function getDashboardCounts(today: string, weekStartISO: string): DashboardCounts {
  const rows = db
    .select({
      status: tasks.status,
      dueDate: tasks.dueDate,
      completedAt: tasks.completedAt,
      projectId: tasks.projectId,
    })
    .from(tasks)
    .all();

  const counts: DashboardCounts = {
    open: 0,
    inProgress: 0,
    dueToday: 0,
    overdue: 0,
    completedThisWeek: 0,
    inbox: 0,
    projects: 0,
  };

  for (const row of rows) {
    if (row.status === "done") {
      if (row.completedAt && toISODate(row.completedAt) >= weekStartISO) {
        counts.completedThisWeek += 1;
      }
      continue;
    }

    counts.open += 1;
    if (row.status === "in_progress") counts.inProgress += 1;
    if (row.projectId === null) counts.inbox += 1;
    if (row.dueDate === today) counts.dueToday += 1;
    if (row.dueDate !== null && row.dueDate < today) counts.overdue += 1;
  }

  counts.projects = db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(eq(projects.status, "active"))
    .get()?.count ?? 0;

  return counts;
}
