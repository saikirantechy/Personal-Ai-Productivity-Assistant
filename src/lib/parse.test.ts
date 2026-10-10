import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatDueDate, resolveDueToken, toISODate } from "./dates";
import { matchProjectName, parseDump } from "./parse";

// Fixed anchor so the suite is deterministic: Monday 2026-10-12.
const ANCHOR = new Date(2026, 9, 12);

describe("parseDump", () => {
  it("creates one task per non-empty line and skips blanks", () => {
    const tasks = parseDump("Write spec\n\n   \nBook flights", ANCHOR);
    assert.equal(tasks.length, 2);
    assert.deepEqual(
      tasks.map((task) => task.title),
      ["Write spec", "Book flights"],
    );
  });

  it("applies defaults when a line has no tokens", () => {
    const [task] = parseDump("Draft the outline", ANCHOR);
    assert.equal(task.priority, "medium");
    assert.equal(task.dueDate, null);
    assert.equal(task.projectName, null);
  });

  it("strips bullet prefixes from pasted lists", () => {
    const tasks = parseDump("- alpha\n* beta\n1. gamma\n2) delta", ANCHOR);
    assert.deepEqual(
      tasks.map((task) => task.title),
      ["alpha", "beta", "gamma", "delta"],
    );
  });

  it("extracts priority, project, and due date tokens", () => {
    const [task] = parseDump(
      "Ship the dashboard !urgent #website @friday",
      ANCHOR,
    );
    assert.equal(task.title, "Ship the dashboard");
    assert.equal(task.priority, "urgent");
    assert.equal(task.projectName, "website");
    assert.equal(task.dueDate, "2026-10-16");
    assert.equal(task.raw, "Ship the dashboard !urgent #website @friday");
  });

  it("resolves relative and weekday due dates", () => {
    assert.equal(parseDump("a @today", ANCHOR)[0].dueDate, "2026-10-12");
    assert.equal(parseDump("a @tomorrow", ANCHOR)[0].dueDate, "2026-10-13");
    assert.equal(parseDump("a @+3", ANCHOR)[0].dueDate, "2026-10-15");
    assert.equal(parseDump("a @next-week", ANCHOR)[0].dueDate, "2026-10-19");
    // Same weekday as the anchor rolls to next week rather than "today".
    assert.equal(parseDump("a @mon", ANCHOR)[0].dueDate, "2026-10-19");
    assert.equal(parseDump("a @friday", ANCHOR)[0].dueDate, "2026-10-16");
  });

  it("parses absolute dates and rejects invalid ones", () => {
    assert.equal(parseDump("a @2026-12-25", ANCHOR)[0].dueDate, "2026-12-25");
    assert.equal(parseDump("a @12/25", ANCHOR)[0].dueDate, "2026-12-25");
    assert.equal(parseDump("a @2026-02-31", ANCHOR)[0].dueDate, null);
  });

  it("keeps unrecognised tokens in the title instead of dropping them", () => {
    const [task] = parseDump("Email @sarah about !whatever", ANCHOR);
    assert.equal(task.title, "Email @sarah about !whatever");
    assert.equal(task.dueDate, null);
    assert.equal(task.priority, "medium");
  });

  it("accepts priority aliases and numbers", () => {
    assert.equal(parseDump("a !l", ANCHOR)[0].priority, "low");
    assert.equal(parseDump("a !1", ANCHOR)[0].priority, "low");
    assert.equal(parseDump("a !h", ANCHOR)[0].priority, "high");
    assert.equal(parseDump("a !4", ANCHOR)[0].priority, "urgent");
  });

  it("keeps every token when a line is only tokens", () => {
    const [task] = parseDump("#website @today", ANCHOR);
    assert.equal(task.title, "#website @today");
    assert.equal(task.projectName, "website");
    assert.equal(task.dueDate, "2026-10-12");
  });

  it("keeps extra project tags in the title", () => {
    const [task] = parseDump("sync notes #work #personal", ANCHOR);
    assert.equal(task.projectName, "work");
    assert.equal(task.title, "sync notes #personal");
  });
});

describe("matchProjectName", () => {
  const projects = [
    { id: 1, name: "Website" },
    { id: 2, name: "Deep Work" },
  ];

  it("matches case-insensitively", () => {
    assert.equal(matchProjectName(projects, "website")?.id, 1);
    assert.equal(matchProjectName(projects, "DEEP WORK")?.id, 2);
  });

  it("returns null for unknown or missing names", () => {
    assert.equal(matchProjectName(projects, "nope"), null);
    assert.equal(matchProjectName(projects, null), null);
  });
});

describe("date helpers", () => {
  it("formats dates relative to today", () => {
    assert.equal(formatDueDate("2026-10-12", "2026-10-12"), "Today");
    assert.equal(formatDueDate("2026-10-13", "2026-10-12"), "Tomorrow");
    assert.equal(formatDueDate("2026-10-11", "2026-10-12"), "Yesterday");
    assert.equal(formatDueDate("2026-10-16", "2026-10-12"), "Fri");
    assert.equal(formatDueDate("2026-11-02", "2026-10-12"), "Nov 2");
    assert.equal(formatDueDate("2027-01-04", "2026-10-12"), "Jan 4, 2027");
  });

  it("uses the local calendar day, not UTC", () => {
    // 23:30 local would already be the next day in UTC for negative offsets.
    const lateEvening = new Date(2026, 9, 12, 23, 30);
    assert.equal(toISODate(lateEvening), "2026-10-12");
  });

  it("returns null for unparseable tokens", () => {
    assert.equal(resolveDueToken("someday", ANCHOR), null);
    assert.equal(resolveDueToken("", ANCHOR), null);
  });
});
