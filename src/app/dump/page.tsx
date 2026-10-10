import { Suspense } from "react";
import { connection } from "next/server";

import { QuickDump } from "@/components/quick-dump";
import { TaskList } from "@/components/task-list";
import { Card, CardHeader, PageHeader, Skeleton } from "@/components/ui";
import { todayISO } from "@/lib/dates";
import { listProjects, listTasks } from "@/lib/queries";
import { projectColor } from "@/lib/project-colors";
import { cn } from "@/lib/utils";

export const metadata = { title: "Quick Dump · Focus" };

const SYNTAX = [
  { token: "One task per line", detail: "Blank lines are ignored; bullet and number prefixes are stripped." },
  { token: "#project", detail: "Files the task into a matching project. Unknown tags stay in the title." },
  { token: "!urgent", detail: "Priority: low, medium, high, urgent (also !1 – !4, !h, !l)." },
  { token: "@friday", detail: "Due date: today, tomorrow, a weekday, next-week, +3, 2026-12-25 or 12/25." },
];

async function RecentCaptures() {
  await connection();

  const today = todayISO();
  const recent = listTasks({ status: "all", source: "quick_dump", limit: 8 });

  return (
    <Card>
      <CardHeader title="Recently captured" hint="Newest dumps, whatever their status" />
      <TaskList
        tasks={recent}
        today={today}
        emptyTitle="No captures yet"
        emptyDescription="Everything you capture with Quick Dump is listed here."
      />
    </Card>
  );
}

async function TagReference() {
  await connection();

  const projects = listProjects();

  return (
    <Card>
      <CardHeader title="Available tags" hint="Use these with # to file captures" />
      <div className="flex flex-wrap gap-2 p-4">
        {projects.length === 0 ? (
          <p className="text-xs text-muted">No projects yet — create one to get a tag.</p>
        ) : (
          projects.map((project) => {
            const accent = projectColor(project.color);
            return (
              <span
                key={project.id}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                  accent.chip,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", accent.dot)} />#{project.name}
              </span>
            );
          })
        )}
      </div>
    </Card>
  );
}

export default function DumpPage() {
  return (
    <div>
      <PageHeader
        title="Quick Dump"
        description="Get it out of your head first. Structure it inline with #project, !priority and @due tokens."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <QuickDump rows={10} autoFocus />

          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
            <RecentCaptures />
          </Suspense>
        </div>

        <div className="space-y-6">
          <Card className="h-fit">
            <CardHeader title="Syntax" />
            <dl className="divide-y divide-border">
              {SYNTAX.map((item) => (
                <div key={item.token} className="px-4 py-3">
                  <dt className="font-mono text-xs font-medium">{item.token}</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-muted">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Suspense fallback={<Skeleton className="h-32 w-full rounded-xl" />}>
            <TagReference />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
