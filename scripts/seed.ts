import { sql } from "drizzle-orm";

import { db } from "../src/db";
import { projects, tasks } from "../src/db/schema";
import { toISODate, addDays } from "../src/lib/dates";

const today = new Date();
const day = (offset: number) => toISODate(addDays(today, offset));

function main() {
  const existing = db.select({ count: sql<number>`count(*)` }).from(tasks).get()?.count ?? 0;
  if (existing > 0) {
    console.log(`Seed skipped — ${existing} task(s) already present.`);
    return;
  }

  const inserted = db
    .insert(projects)
    .values([
      {
        name: "Website",
        description: "Marketing site refresh: copy, design and launch checklist.",
        color: "indigo",
      },
      {
        name: "Deep Work",
        description: "Long-focus blocks that need an uninterrupted calendar slot.",
        color: "violet",
      },
      {
        name: "Admin",
        description: "Recurring life admin that should never live in your head.",
        color: "amber",
      },
    ])
    .returning({ id: projects.id, name: projects.name })
    .all();

  const idFor = (name: string) => inserted.find((project) => project.name === name)?.id ?? null;

  db.insert(tasks)
    .values([
      {
        title: "Draft the launch email for the new pricing page",
        priority: "high",
        dueDate: day(0),
        projectId: idFor("Website"),
      },
      {
        title: "Fix the mobile nav overlap on the blog index",
        priority: "urgent",
        dueDate: day(-2),
        projectId: idFor("Website"),
      },
      {
        title: "Review the accessibility audit findings",
        priority: "medium",
        dueDate: day(2),
        projectId: idFor("Website"),
      },
      {
        title: "Write the architecture one-pager for the assistant",
        status: "in_progress",
        priority: "high",
        dueDate: day(1),
        projectId: idFor("Deep Work"),
      },
      {
        title: "Block two hours for the writing sprint",
        priority: "medium",
        projectId: idFor("Deep Work"),
      },
      {
        title: "Renew the domain before it lapses",
        priority: "urgent",
        dueDate: day(5),
        projectId: idFor("Admin"),
      },
      {
        title: "Book the dentist appointment",
        priority: "medium",
        dueDate: day(-1),
        projectId: idFor("Admin"),
      },
      {
        title: "Read the Q3 report and note three takeaways",
        priority: "low",
        status: "done",
        completedAt: addDays(today, -1),
        projectId: idFor("Deep Work"),
      },
      {
        title: "Sketch ideas for the weekly review ritual",
        priority: "low",
        source: "quick_dump",
      },
      {
        title: "Try the keyboard-driven capture flow for a week",
        priority: "medium",
        source: "quick_dump",
      },
    ])
    .run();

  console.log(
    `Seeded ${inserted.length} projects and 10 tasks. Open http://localhost:3000 to explore.`,
  );
}

main();
