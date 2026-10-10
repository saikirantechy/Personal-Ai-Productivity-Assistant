import { SubmitButton } from "@/components/submit-button";
import { PlusIcon } from "@/components/icons";
import { createProject } from "@/lib/actions";
import { PROJECT_COLOR_KEYS, PROJECT_COLORS } from "@/lib/project-colors";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary";

export function ProjectForm({ className }: { className?: string }) {
  return (
    <form action={createProject} className={cn("space-y-3", className)}>
      <div>
        <label htmlFor="project-name" className="text-xs font-medium text-muted">
          Project name
        </label>
        <input
          id="project-name"
          name="name"
          required
          maxLength={120}
          autoComplete="off"
          placeholder="Website redesign"
          className={cn(fieldClass, "mt-1")}
        />
      </div>

      <div>
        <label htmlFor="project-description" className="text-xs font-medium text-muted">
          Description <span className="font-normal">(optional)</span>
        </label>
        <input
          id="project-description"
          name="description"
          maxLength={500}
          autoComplete="off"
          placeholder="What does done look like?"
          className={cn(fieldClass, "mt-1")}
        />
      </div>

      <fieldset>
        <legend className="text-xs font-medium text-muted">Accent</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROJECT_COLOR_KEYS.map((color, index) => (
            <label
              key={color}
              title={PROJECT_COLORS[color].label}
              className="group relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-surface has-checked:ring-2 has-checked:ring-ring"
            >
              <input
                type="radio"
                name="color"
                value={color}
                defaultChecked={index === 0}
                className="sr-only"
              />
              <span className={cn("h-4 w-4 rounded-full", PROJECT_COLORS[color].dot)} />
            </label>
          ))}
        </div>
      </fieldset>

      <SubmitButton variant="primary" pendingLabel="Creating…" className="w-full">
        <PlusIcon width={14} height={14} />
        Create project
      </SubmitButton>
    </form>
  );
}
