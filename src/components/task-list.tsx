import { CheckIcon } from "@/components/icons";
import { TaskItem } from "@/components/task-item";
import { EmptyState } from "@/components/ui";
import type { TaskWithProject } from "@/lib/queries";

export function TaskList({
  tasks,
  today,
  showProject = true,
  emptyTitle = "Nothing here",
  emptyDescription,
}: {
  tasks: TaskWithProject[];
  today: string;
  showProject?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckIcon width={20} height={20} />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} today={today} showProject={showProject} />
      ))}
    </ul>
  );
}
