import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";

import { ArchiveIcon, TrashIcon } from "@/components/icons";
import { NewTaskForm } from "@/components/new-task-form";
import { ConfirmSubmitButton, SubmitButton } from "@/components/submit-button";
import { TaskList } from "@/components/task-list";
import { Card, CardHeader, Pill, ProgressBar, Skeleton } from "@/components/ui";
import { deleteProject, setProjectStatus } from "@/lib/actions";
import { todayISO } from "@/lib/dates";
import { projectColor } from "@/lib/project-colors";
import { getProject, listProjects, listTasks } from "@/lib/queries";
import { cn, pluralize } from "@/lib/utils";

async function ProjectView({ params }: { params: PageProps<"/projects/[id]">["params"] }) {
  const { id } = await params;
  await connection();

  if (!/^\d+$/.test(id)) notFound();
  const project = getProject(Number(id));
  if (!project) notFound();

  const today = todayISO();
  const tasks = listTasks({ projectId: project.id, status: "all" });
  const open = tasks.filter((task) => task.status !== "done");
  const done = tasks.filter((task) => task.status === "done");
  const overdue = open.filter((task) => task.dueDate !== null && task.dueDate < today).length;
  const accent = projectColor(project.color);
  const archived = project.status === "archived";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/projects" className="text-xs text-muted hover:text-foreground">
          ← All projects
        </Link>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn("h-3 w-3 shrink-0 rounded-full", accent.dot)} />
              <h1 className="truncate text-2xl font-semibold tracking-tight">{project.name}</h1>
              {archived ? (
                <Pill className="border-border bg-surface-muted text-muted">Archived</Pill>
              ) : null}
            </div>
            {project.description ? (
              <p className="mt-1 max-w-2xl text-sm text-muted">{project.description}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <form action={setProjectStatus}>
              <input type="hidden" name="id" value={project.id} />
              <input type="hidden" name="status" value={archived ? "active" : "archived"} />
              <SubmitButton variant="secondary">
                <ArchiveIcon width={14} height={14} />
                {archived ? "Restore" : "Archive"}
              </SubmitButton>
            </form>

            <form action={deleteProject}>
              <input type="hidden" name="id" value={project.id} />
              <input type="hidden" name="redirectTo" value="/projects" />
              <ConfirmSubmitButton
                variant="secondary"
                confirmMessage={`Delete “${project.name}”? Its ${pluralize(tasks.length, "task")} stay and move to Inbox.`}
                className="hover:text-rose-600 dark:hover:text-rose-400"
              >
                <TrashIcon width={14} height={14} />
                Delete
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>

        <div className="mt-4 max-w-md">
          <ProgressBar value={done.length} total={tasks.length} barClassName={accent.bar} />
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted">
            <span>
              {tasks.length === 0 ? "No tasks yet" : `${done.length}/${tasks.length} done`}
            </span>
            <span>{pluralize(open.length, "open task")}</span>
            {overdue > 0 ? (
              <span className="text-rose-600 dark:text-rose-400">{overdue} overdue</span>
            ) : null}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader title="Add a task" hint={`Filed under ${project.name}`} />
        <NewTaskForm
          projects={listProjects()}
          lockedProjectId={project.id}
          placeholder="Next step…"
          className="px-4 py-3"
        />
      </Card>

      <Card>
        <CardHeader title="Open" hint={pluralize(open.length, "task")} />
        <TaskList
          tasks={open}
          today={today}
          showProject={false}
          emptyTitle="Nothing open here"
          emptyDescription="Add a task above to get moving."
        />
      </Card>

      {done.length > 0 ? (
        <Card>
          <CardHeader title="Completed" hint={pluralize(done.length, "task")} />
          <TaskList tasks={done} today={today} showProject={false} />
        </Card>
      ) : null}
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-2 w-80 rounded-full" />
      <Skeleton className="h-[104px] w-full rounded-xl" />
      <Skeleton className="h-56 w-full rounded-xl" />
    </div>
  );
}

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <div>
      <Suspense fallback={<ProjectSkeleton />}>
        <ProjectView params={params} />
      </Suspense>
    </div>
  );
}
