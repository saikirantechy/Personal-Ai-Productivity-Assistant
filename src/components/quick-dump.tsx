"use client";

import { useActionState, useMemo, useState } from "react";

import { quickDump, type QuickDumpState } from "@/lib/actions";
import { formatDueDate } from "@/lib/dates";
import { parseDump } from "@/lib/parse";
import { PRIORITY_STYLES } from "@/lib/project-colors";
import { cn, pluralize } from "@/lib/utils";

const PREVIEW_LIMIT = 4;

const PLACEHOLDER = `Dump anything, one task per line:
Draft the launch email !high #Website @tomorrow
Call the accountant
Review PR feedback @friday`;

export function QuickDump({
  className,
  rows = 4,
  autoFocus = false,
}: {
  className?: string;
  rows?: number;
  autoFocus?: boolean;
}) {
  const [state, formAction, pending] = useActionState<QuickDumpState, FormData>(quickDump, null);

  return (
    <form
      action={formAction}
      className={cn("rounded-xl border border-border bg-surface", className)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Quick Dump</h2>
          <p className="mt-0.5 text-xs text-muted">
            One task per line. Add <code className="font-mono">#project</code>,{" "}
            <code className="font-mono">!priority</code> or <code className="font-mono">@friday</code>{" "}
            anywhere.
          </p>
        </div>
        <span className="shrink-0 text-[11px] text-muted">⌘/Ctrl + Enter</span>
      </div>

      <div className="p-4">
        {/*
          Keying the editor on the capture token resets the textarea and the
          live preview after a successful dump without a setState-in-effect. On
          the dump page (`autoFocus`) focus returns to the box for the next dump.
        */}
        <QuickDumpEditor
          key={state?.token ?? 0}
          rows={rows}
          autoFocus={autoFocus}
          pending={pending}
          message={state?.message}
          ok={state?.ok ?? false}
        />
      </div>
    </form>
  );
}

function QuickDumpEditor({
  rows,
  autoFocus,
  pending,
  message,
  ok,
}: {
  rows: number;
  autoFocus: boolean;
  pending: boolean;
  message?: string;
  ok: boolean;
}) {
  const [text, setText] = useState("");
  const parsed = useMemo(() => (text.trim() ? parseDump(text) : []), [text]);

  return (
    <>
      <label htmlFor="quick-dump-text" className="sr-only">
        Quick Dump
      </label>
      <textarea
        id="quick-dump-text"
        name="text"
        rows={rows}
        value={text}
        autoFocus={autoFocus}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder={PLACEHOLDER}
        className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none transition placeholder:text-muted focus:border-primary"
      />

      {parsed.length > 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-surface-muted/60 px-3 py-2">
          <p className="text-[11px] font-medium text-muted">
            Preview · {pluralize(parsed.length, "task")}
          </p>
          <ul className="mt-1.5 space-y-1">
            {parsed.slice(0, PREVIEW_LIMIT).map((task, index) => (
              <li key={index} className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="task-title min-w-0 flex-1">{task.title}</span>
                {task.projectName ? (
                  <span className="rounded-full border border-border px-1.5 text-[10px] text-muted">
                    #{task.projectName}
                  </span>
                ) : null}
                {task.dueDate ? (
                  <span className="rounded-full border border-border px-1.5 text-[10px] text-muted">
                    {formatDueDate(task.dueDate)}
                  </span>
                ) : null}
                {task.priority !== "medium" ? (
                  <span
                    className={cn(
                      "rounded-full border px-1.5 text-[10px] font-medium",
                      PRIORITY_STYLES[task.priority].className,
                    )}
                  >
                    {PRIORITY_STYLES[task.priority].label}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          {parsed.length > PREVIEW_LIMIT ? (
            <p className="mt-1 text-[11px] text-muted">+{parsed.length - PREVIEW_LIMIT} more</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p
          role="status"
          aria-live="polite"
          className={cn("text-xs", ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted")}
        >
          {message ?? "Captured tasks land in Inbox unless you tag a project."}
        </p>
        <button
          type="submit"
          disabled={pending || text.trim().length === 0}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Capturing…" : "Capture"}
        </button>
      </div>
    </>
  );
}
