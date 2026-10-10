import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";

import { BoltIcon } from "@/components/icons";
import { NavFallback, NavLinks } from "@/components/nav-links";
import { getSidebarCounts } from "@/lib/queries";

async function NavWithCounts() {
  // Per-request data: reads must opt out of prerendering under Cache Components.
  await connection();
  return <NavLinks counts={getSidebarCounts()} />;
}

export function Sidebar() {
  return (
    <aside className="flex shrink-0 flex-col gap-6 border-b border-border px-4 py-5 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r lg:px-3">
      <Link href="/" className="flex items-center gap-2.5 px-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <BoltIcon width={17} height={17} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold leading-tight">Focus</span>
          <span className="block truncate text-[11px] leading-tight text-muted">
            AI productivity assistant
          </span>
        </span>
      </Link>

      <Suspense fallback={<NavFallback />}>
        <NavWithCounts />
      </Suspense>

      <div className="mt-auto hidden rounded-lg border border-dashed border-border px-3 py-3 lg:block">
        <p className="text-[11px] font-semibold">Phase 1 · local workspace</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Tasks, projects and Quick Dump run on a local SQLite file. Google, Microsoft and Slack
          connect in later phases.
        </p>
      </div>
    </aside>
  );
}
