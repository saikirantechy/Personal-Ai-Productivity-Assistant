import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";

import { InboxIcon } from "@/components/icons";
import { ProjectCard } from "@/components/project-card";
import { QuickDump } from "@/components/quick-dump";
import { TaskList } from "@/components/task-list";
import { Card, CardHeader, EmptyState, PageHeader, Skeleton, StatCard } from "@/components/ui";
import { addDays, todayISO, toISODate } from "@/lib/dates";
import { PRIORITY_STYLES } from "@/lib/project-colors";
import {
  getDashboardCounts,
  listProjectsWithStats,
  listTasks,
  type TaskWithProject,
} from "@/lib/queries";

export const metadata = { title: "Dashboard · Focus" };

/** Smallest bucket wins: overdue, then due today, then in progress, then the rest. */
function focusRank(task: TaskWithProject, today: string): number {
  if (task.dueDate !== null && task.dueDate < today) return 0;
  if (task.dueDate === today) return 1;
  if (task.status === "in_progress") return 2;
  return 3;
}

function compareFocus(a: TaskWithProject, b: TaskWithProject, today: string) {
  const bucket = focusRank(a, today) - focusRank(b, today);
  if (bucket !== 0) return bucket;

  if (a.dueDate !== b.dueDate) {
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }

  const priority =
    PRIORITY_STYLES[a.priority].rank - PRIORITY_STYLES[b.priority].rank;
  if (priority !== 0) return priority;

  return b.createdAt.getTime() - a.createdAt.getTime();
}

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function weekStart(today: Date) {
  const weekday = (today.getDay() + 6) % 7; // Monday = 0
  return toISODate(addDays(today, -weekday));
}

async function DashboardHeader() {
  await connection();

  const now = new Date();
  const today = toISODate(now);
  const counts = getDashboardCounts(today, weekStart(now));

  const summary =
    counts.overdue > 0
      ? `${counts.overdue} overdue and ${counts.dueToday} due today.`
      : counts.dueToday > 0
        ? `${counts.dueToday} due today, nothing overdue.`
        : counts.open > 0
          ? "Nothing due today. Good time for deep work."
          : "You're all clear. Dump something to get started.";

  return (
    <>
      <PageHeader
        title={`${greeting(now.getHours())}`}
        description={summary}
        actions={
          <Link
            href="/tasks"
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition hover:bg-surface-muted"
          >
            Open task list
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open" value={counts.open} hint={`${counts.inProgress} in progress`} />
        <StatCard
          label="Due today"
          value={counts.dueToday}
          tone={counts.dueToday > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Overdue"
          value={counts.overdue}
          tone={counts.overdue > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Done this week"
          value={counts.completedThisWeek}
          tone="success"
          hint={`${counts.projects} active ${counts.projects === 1 ? "project" : "projects"}`}
        />
      </div>
    </>
  );
}

async function UpNext() {
  await connection();

  const today = todayISO();
  const open = listTasks({ status: "open" });
  const focus = [...open].sort((a, b) => compareFocus(a, b, today)).slice(0, 8);

  return (
    <Card>
      <CardHeader
        title="Up next"
        hint="Overdue, due today and in-progress work first"
        action={<Link href="/tasks">View all</Link>}
      />
      <TaskList
        tasks={focus}
        today={today}
        emptyTitle="Nothing needs attention"
        emptyDescription="Every open task has a future due date, or there is nothing open at all."
      />
    </Card>
  );
}

async function InboxSection() {
  await connection();

  const today = todayISO();
  const inbox = listTasks({ status: "open", inboxOnly: true }).slice(0, 5);

  return (
    <Card>
      <CardHeader
        title="Inbox"
        hint="Captured without a project"
        action={<span>{inbox.length > 0 ? `${inbox.length} showing` : null}</span>}
      />
      {inbox.length === 0 ? (
        <EmptyState
          icon={<InboxIcon width={20} height={20} />}
          title="Inbox is empty"
          description="Quick Dump lands here until you file tasks into a project."
        />
      ) : (
        <TaskList tasks={inbox} today={today} showProject={false} />
      )}
    </Card>
  );
}

async function ProjectsSection() {
  await connection();

  const today = todayISO();
  const projects = listProjectsWithStats(false, today)
    .sort((a, b) => b.overdue - a.overdue || b.open - a.open || a.name.localeCompare(b.name))
    .slice(0, 4);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">Projects</h2>
        <Link href="/projects" className="text-xs text-muted hover:text-foreground">
          Manage
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <EmptyState
            title="No projects yet"
            description={
              <Link href="/projects" className="underline">
                Create your first project
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </section>
  );
}

function HeaderSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-[86px]" />
        ))}
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <Card>
      <div className="border-b border-border px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-3 p-4">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<HeaderSkeleton />}>
        <DashboardHeader />
      </Suspense>

      <QuickDump />

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Suspense fallback={<PanelSkeleton />}>
          <UpNext />
        </Suspense>

        <div className="space-y-6">
          <Suspense fallback={<PanelSkeleton />}>
            <InboxSection />
          </Suspense>
          <Suspense fallback={<PanelSkeleton />}>
            <ProjectsSection />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
