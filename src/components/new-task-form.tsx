import { SubmitButton } from "@/components/submit-button";
import { PlusIcon } from "@/components/icons";
import { createTask } from "@/lib/actions";
import { PRIORITIES } from "@/db/schema";
import { PRIORITY_STYLES } from "@/lib/project-colors";
import { cn } from "@/lib/utils";

const fieldClass =
  "rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none transition focus:border-primary";

export function NewTaskForm({
  projects,
  defaultProjectId,
  /** When set, the task is locked to this project and the picker is hidden. */
  lockedProjectId,
  placeholder = "Add a task…",
  className,
}: {
  projects: { id: number; name: string }[];
  defaultProjectId?: number;
  lockedProjectId?: number;
  placeholder?: string;
  className?: string;
}) {
  const locked = lockedProjectId !== undefined;

  return (
    <form action={createTask} className={cn("flex flex-wrap items-center gap-2", className)}>
      <label htmlFor="new-task-title" className="sr-only">
        Task title
      </label>
      <input
        id="new-task-title"
        name="title"
        required
        maxLength={500}
        autoComplete="off"
        placeholder={placeholder}
        className={cn(fieldClass, "min-w-[11rem] flex-1")}
      />

      {locked ? (
        <input type="hidden" name="projectId" value={lockedProjectId} />
      ) : (
        <>
          <label htmlFor="new-task-project" className="sr-only">
            Project
          </label>
          <select
            id="new-task-project"
            name="projectId"
            defaultValue={defaultProjectId ?? ""}
            className={fieldClass}
          >
            <option value="">Inbox</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </>
      )}

      <label htmlFor="new-task-priority" className="sr-only">
        Priority
      </label>
      <select id="new-task-priority" name="priority" defaultValue="medium" className={fieldClass}>
        {PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {PRIORITY_STYLES[priority].label}
          </option>
        ))}
      </select>

      <label htmlFor="new-task-due" className="sr-only">
        Due date
      </label>
      <input id="new-task-due" type="date" name="dueDate" className={fieldClass} />

      <SubmitButton variant="primary" pendingLabel="Adding…">
        <PlusIcon width={14} height={14} />
        Add
      </SubmitButton>
    </form>
  );
}
