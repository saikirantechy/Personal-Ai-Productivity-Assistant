/** Accent palette for projects. Class strings are literal so Tailwind can see them. */
export const PROJECT_COLORS = {
  indigo: {
    label: "Indigo",
    dot: "bg-indigo-500",
    bar: "bg-indigo-500",
    chip: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  },
  emerald: {
    label: "Emerald",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  amber: {
    label: "Amber",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  rose: {
    label: "Rose",
    dot: "bg-rose-500",
    bar: "bg-rose-500",
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  sky: {
    label: "Sky",
    dot: "bg-sky-500",
    bar: "bg-sky-500",
    chip: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  violet: {
    label: "Violet",
    dot: "bg-violet-500",
    bar: "bg-violet-500",
    chip: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
} as const;

export type ProjectColor = keyof typeof PROJECT_COLORS;

export const PROJECT_COLOR_KEYS = Object.keys(PROJECT_COLORS) as ProjectColor[];

export function projectColor(color: string | null | undefined) {
  if (color && color in PROJECT_COLORS) {
    return PROJECT_COLORS[color as ProjectColor];
  }
  return PROJECT_COLORS.indigo;
}

export const PRIORITY_STYLES = {
  low: {
    label: "Low",
    className: "border-zinc-400/30 bg-zinc-400/10 text-zinc-600 dark:text-zinc-400",
    rank: 3,
  },
  medium: {
    label: "Medium",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    rank: 2,
  },
  high: {
    label: "High",
    className: "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300",
    rank: 1,
  },
  urgent: {
    label: "Urgent",
    className: "border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300",
    rank: 0,
  },
} as const;

export const STATUS_STYLES = {
  todo: { label: "To do" },
  in_progress: { label: "In progress" },
  done: { label: "Done" },
} as const;
