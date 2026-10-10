import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";

import { NewTaskForm } from "@/components/new-task-form";
import { TaskList } from "@/components/task-list";
import { Card, CardHeader, PageHeader, Skeleton } from "@/components/ui";
import { todayISO } from "@/lib/dates";
import { listProjects, listTasks } from "@/lib/queries";
import { cn, buildHref, pluralize } from "@/lib/utils";

export const metadata = { title: "Tasks · Focus" };

const SCOPES = [
  { value: "open", label: "Open" },
  { value: "done", label: "Completed" },
  { value: "all", label: "All" },
] as const;

type Scope = (typeof SCOPES)[number]["value"];

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readScope(params: SearchParams): Scope {
  const raw = first(params.scope);
  return SCOPES.some((scope) => scope.value === raw) ? (raw as Scope) : "open";
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

async function TasksView({ searchParams }: { searchParams: PageProps<"/tasks">["searchParams"] }) {
  const params = await searchParams;
  await connection();

  const scope = readScope(params);
  const projectParam = first(params.project) ?? "all";
  const today = todayISO();

  const projects = listProjects();
  const projectId =
    projectParam !== "all" && projectParam !== "inbox" && /^\d+$/.test(projectParam)
      ? Number(projectParam)
      : undefined;

  const tasks = listTasks({
    status: scope === "all" ? "all" : scope === "done" ? "done" : "open",
    projectId,
    inboxOnly: projectParam === "inbox",
  });

  const openCount = listTasks({ status: "open" }).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Add a task"
          hint="Leave the project empty to capture into Inbox"
          
        />
        <NewTaskForm projects={projects} className="px-4 py-3" />
      </Card>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {SCOPES.map((item) => (
            <Chip
              key={item.value}
              href={buildHref("/tasks", { scope: item.value, project: projectParam })}
              active={scope === item.value}
            >
              {item.label}
            </Chip>
          ))}
          <span className="ml-auto text-xs text-muted">{pluralize(openCount, "open task")}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip
            href={buildHref("/tasks", { scope, project: "all" })}
            active={projectParam === "all"}
          >
            Every project
          </Chip>
          <Chip
            href={buildHref("/tasks", { scope, project: "inbox" })}
            active={projectParam === "inbox"}
          >
            Inbox
          </Chip>
          {projects.map((project) => (
            <Chip
              key={project.id}
              href={buildHref("/tasks", { scope, project: project.id })}
              active={projectParam === String(project.id)}
            >
              {project.name}
            </Chip>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader
          title={
            scope === "done" ? "Completed" : scope === "all" ? "All tasks" : "Open tasks"
          }
          hint={`${pluralize(tasks.length, "task")} shown`}
        />
        <TaskList
          tasks={tasks}
          today={today}
          emptyTitle={
            scope === "done" ? "Nothing completed yet" : "No tasks match these filters"
          }
          emptyDescription="Adjust the filters above, or add a task."
        />
      </Card>
    </div>
  );
}

function TasksSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[104px] w-full" />
      <div className="flex gap-2">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-7 w-20 rounded-full" />
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        {[0, 1, 2, 3, 4].map((index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function TasksPage({ searchParams }: PageProps<"/tasks">) {
  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Everything you have captured, ordered by what needs attention first."
      />
      <Suspense fallback={<TasksSkeleton />}>
        <TasksView searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
