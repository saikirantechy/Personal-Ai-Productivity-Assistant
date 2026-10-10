import Link from "next/link";

import { ArchiveIcon, TrashIcon } from "@/components/icons";
import { ConfirmSubmitButton, SubmitButton } from "@/components/submit-button";
import { Card, ProgressBar } from "@/components/ui";
import { deleteProject, setProjectStatus } from "@/lib/actions";
import { projectColor } from "@/lib/project-colors";
import type { ProjectWithStats } from "@/lib/queries";
import { cn, pluralize } from "@/lib/utils";

export function ProjectCard({ project }: { project: ProjectWithStats }) {
  const accent = projectColor(project.color);
  const archived = project.status === "archived";

  return (
    <Card className={cn("group flex flex-col", archived && "opacity-70")}>
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/projects/${project.id}`}
            className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight hover:underline"
          >
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", accent.dot)} />
            <span className="truncate">{project.name}</span>
          </Link>

          <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <form action={setProjectStatus}>
              <input type="hidden" name="id" value={project.id} />
              <input type="hidden" name="status" value={archived ? "active" : "archived"} />
              <SubmitButton
                variant="ghost"
                title={archived ? "Restore project" : "Archive project"}
                ariaLabel={archived ? `Restore ${project.name}` : `Archive ${project.name}`}
              >
                <ArchiveIcon width={13} height={13} />
              </SubmitButton>
            </form>
            <form action={deleteProject}>
              <input type="hidden" name="id" value={project.id} />
              <ConfirmSubmitButton
                variant="ghost"
                confirmMessage={`Delete “${project.name}”? Its tasks stay and move to Inbox.`}
                title="Delete project"
                ariaLabel={`Delete ${project.name}`}
                className="hover:text-rose-600 dark:hover:text-rose-400"
              >
                <TrashIcon width={13} height={13} />
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>

        {project.description ? (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
            {project.description}
          </p>
        ) : null}

        <div className="mt-3">
          <ProgressBar
            value={project.done}
            total={project.total}
            barClassName={accent.bar}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
            <span>
              {project.total === 0
                ? "No tasks yet"
                : `${project.done}/${project.total} done`}
            </span>
            <span className="flex items-center gap-2">
              {project.open > 0 ? <span>{pluralize(project.open, "open task")}</span> : null}
              {project.overdue > 0 ? (
                <span className="text-rose-600 dark:text-rose-400">
                  {project.overdue} overdue
                </span>
              ) : null}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
