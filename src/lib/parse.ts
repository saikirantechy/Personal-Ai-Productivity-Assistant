import type { Priority } from "../db/schema";
import { resolveDueToken } from "./dates";

export type DumpTask = {
  /** The original line, before any tokens were stripped. */
  raw: string;
  title: string;
  priority: Priority;
  /** `YYYY-MM-DD`, or null when the line had no due token. */
  dueDate: string | null;
  /** Project name from `#tag`, matched against existing projects later. */
  projectName: string | null;
};

const PRIORITY_ALIASES: Record<string, Priority> = {
  low: "low",
  l: "low",
  "1": "low",
  medium: "medium",
  med: "medium",
  m: "medium",
  normal: "medium",
  "2": "medium",
  high: "high",
  h: "high",
  "3": "high",
  urgent: "urgent",
  u: "urgent",
  critical: "urgent",
  "4": "urgent",
};

const BULLET_PREFIX = /^\s*(?:[-*•–—]|\d+[.)])\s+/;
const TOKEN_PATTERN = /(^|\s)[#!@]([^\s#!@][^\s#!@]*)/g;

type TokenMatch = {
  sigil: "#" | "!" | "@";
  value: string;
  start: number;
  end: number;
};

function collectTokens(line: string): TokenMatch[] {
  const tokens: TokenMatch[] = [];
  TOKEN_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = TOKEN_PATTERN.exec(line)) !== null) {
    const [full, leading, value] = match;
    const start = match.index + leading.length;
    tokens.push({
      sigil: full.trimStart()[0] as TokenMatch["sigil"],
      value,
      start,
      end: start + 1 + value.length,
    });
  }
  return tokens;
}

function removeRanges(line: string, ranges: Array<{ start: number; end: number }>): string {
  if (ranges.length === 0) return line;

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  let result = "";
  let cursor = 0;

  for (const range of sorted) {
    result += line.slice(cursor, range.start);
    cursor = Math.max(cursor, range.end);
  }
  result += line.slice(cursor);

  return result.replace(/\s+/g, " ").trim();
}

/**
 * Turn a Quick Dump blob into individual tasks, one per non-empty line.
 *
 * Inline tokens are recognised anywhere on the line:
 *   `#project`  assign to a project by name
 *   `!urgent`   priority (low | medium | high | urgent, plus 1-4 and initials)
 *   `@friday`   due date (today, tomorrow, weekday, next-week, +3, 2026-12-25, 12/25)
 *
 * Unrecognised `!` / `@` tokens are left untouched in the title instead of being
 * silently dropped, so a stray `@handle` never loses information.
 */
export function parseDump(text: string, anchor: Date = new Date()): DumpTask[] {
  const results: DumpTask[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(BULLET_PREFIX, "").trim();
    if (!line) continue;

    const consumed: Array<{ start: number; end: number }> = [];
    let priority: Priority = "medium";
    let dueDate: string | null = null;
    let projectName: string | null = null;

    for (const token of collectTokens(line)) {
      if (token.sigil === "!" ) {
        const resolved = PRIORITY_ALIASES[token.value.toLowerCase()];
        if (resolved) {
          priority = resolved;
          consumed.push(token);
        }
        continue;
      }

      if (token.sigil === "@") {
        const resolved = resolveDueToken(token.value, anchor);
        if (resolved) {
          dueDate = resolved;
          consumed.push(token);
        }
        continue;
      }

      // `#project` — the first one wins, extras stay in the title.
      if (!projectName) {
        projectName = token.value;
        consumed.push(token);
      }
    }

    const title = removeRanges(line, consumed);
    results.push({
      raw: line,
      title: title || line,
      priority,
      dueDate,
      projectName,
    });
  }

  return results;
}

/** Case-insensitive project lookup used when a dump is committed. */
export function matchProjectName<T extends { id: number; name: string }>(
  projects: T[],
  name: string | null,
): T | null {
  if (!name) return null;
  const needle = name.trim().toLowerCase();
  return projects.find((project) => project.name.toLowerCase() === needle) ?? null;
}
