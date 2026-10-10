"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BoltIcon, FolderIcon, HomeIcon, TasksIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", Icon: HomeIcon },
  { href: "/tasks", label: "Tasks", Icon: TasksIcon },
  { href: "/projects", label: "Projects", Icon: FolderIcon },
  { href: "/dump", label: "Quick Dump", Icon: BoltIcon },
] as const;

type Counts = { tasks?: number; projects?: number };

function NavItems({ pathname, counts }: { pathname: string | null; counts?: Counts }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname !== null && (href === "/" ? pathname === "/" : pathname.startsWith(href));
        const badge =
          href === "/tasks" ? counts?.tasks : href === "/projects" ? counts?.projects : undefined;

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-surface text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-border"
                : "text-muted hover:bg-surface-muted hover:text-foreground",
            )}
          >
            <Icon className="shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {badge !== undefined && badge > 0 ? (
              <span className="rounded-full bg-surface-muted px-1.5 text-[11px] font-semibold tabular-nums text-muted">
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * `usePathname` is runtime URL data, so it cannot live in a prerendered shell.
 * Inside a `<Suspense>` boundary it is fine, but the fallback must stay hook-free
 * — hence this static twin.
 */
export function NavFallback() {
  return <NavItems pathname={null} />;
}

export function NavLinks({ counts }: { counts?: Counts }) {
  const pathname = usePathname();
  return <NavItems pathname={pathname} counts={counts} />;
}
