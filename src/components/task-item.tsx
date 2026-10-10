import { ConfirmSubmitButton, SubmitButton } from "@/components/submit-button";
import { BoltIcon, CheckIcon, CircleIcon, ClockIcon, TrashIcon } from "@/components/icons";
import { deleteTask, setTaskStatus, toggleTask } from "@/lib/actions";
import { formatDueDate } from "@/lib/dates";
import type { TaskWithProject } from "@/lib/queries";
import { PRIORITY_STYLES, STATUS_STYLES, projectColor } from "@/lib/project-colors";
import { cn } from "@/lib/utils";

const STATUS_CYCLE = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
} as const;

export function TaskItem({
  task,
  today,
  showProject = true,
}: {
  task: TaskWithProject;
  today: string;
  showProject?: boolean;
}) {
  const done = task.status === "done";
  const overdue = !done && task.dueDate !== null && task.dueDate < today;
  const dueToday = !done && task.dueDate === today;
  const accent = projectColor(task.projectColor);
  const nextStatus = STATUS_CYCLE[task.status];

  return (
    <li className="group flex items-start gap-3 px-4 py-2.5 transition hover:bg-surface-muted/60">
      <form action={toggleTask} className="pt-0.5">
        <input type="hidden" name="id" value={task.id} />
        <SubmitButton
          variant="ghost"
          ariaLabel={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
          title={done ? "Reopen" : "Mark done"}
          className={cn(
            "grid h-5 w-5 place-items-center !rounded-full border p-0",
            done
              ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "border-border-strong text-transparent hover:border-primary hover:text-primary",
          )}
        >
          <CheckIcon width={13} height={13} />
        </SubmitButton>
      </form>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "task-title text-sm leading-6",
            done && "text-muted line-through decoration-muted/60",
          )}
        >
          {task.title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {showProject && task.projectName ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-1.5 text-[10px] font-medium leading-5",
                accent.chip,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", accent.dot)} />
              {task.projectName}
            </span>
          ) : null}

          {showProject && !task.projectName ? (
            <span className="inline-flex items-center rounded-full border border-dashed border-border px-1.5 text-[10px] leading-5 text-muted">
              Inbox
            </span>
          ) : null}

          <span
            className={cn(
              "inline-flex items-center rounded-full border px-1.5 text-[10px] font-medium leading-5",
              PRIORITY_STYLES[task.priority].className,
            )}
          >
            {PRIORITY_STYLES[task.priority].label}
          </span>

          {task.dueDate ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 text-[10px] font-medium leading-5",
                overdue
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  : dueToday
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    : "text-muted",
              )}
              title={task.dueDate}
            >
              <ClockIcon width={11} height={11} />
              {formatDueDate(task.dueDate, today)}
            </span>
          ) : null}

          {task.source === "quick_dump" ? (
            <span
              className="inline-flex items-center text-muted"
              title="Captured with Quick Dump"
            >
              <BoltIcon width={11} height={11} />
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
        <form action={setTaskStatus}>
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="status" value={nextStatus} />
          <SubmitButton
            variant="ghost"
            title={`Move to ${STATUS_STYLES[nextStatus].label.toLowerCase()}`}
            ariaLabel={`Move ${task.title} to ${STATUS_STYLES[nextStatus].label}`}
            className="whitespace-nowrap"
          >
            {task.status === "in_progress" ? (
              <ClockIcon width={13} height={13} />
            ) : task.status === "todo" ? (
              <CircleIcon width={13} height={13} />
            ) : (
              <CheckIcon width={13} height={13} />
            )}
            {STATUS_STYLES[task.status].label}
          </SubmitButton>
        </form>

        <form action={deleteTask}>
          <input type="hidden" name="id" value={task.id} />
          <ConfirmSubmitButton
            variant="ghost"
            confirmMessage={`Delete “${task.title}”?`}
            title="Delete task"
            ariaLabel={`Delete ${task.title}`}
            className="hover:text-rose-600 dark:hover:text-rose-400"
          >
            <TrashIcon width={13} height={13} />
          </ConfirmSubmitButton>
        </form>
      </div>
    </li>
  );
}
