import { Suspense } from "react";
import { connection } from "next/server";

import { ProjectCard } from "@/components/project-card";
import { ProjectForm } from "@/components/project-form";
import { Card, CardHeader, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { todayISO } from "@/lib/dates";
import { listProjectsWithStats } from "@/lib/queries";
import { pluralize } from "@/lib/utils";

export const metadata = { title: "Projects · Focus" };

async function ProjectsView() {
  await connection();

  const today = todayISO();
  const projects = listProjectsWithStats(true, today);
  const active = projects.filter((project) => project.status === "active");
  const archived = projects.filter((project) => project.status === "archived");

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Active</h2>
          <span className="text-xs text-muted">{pluralize(active.length, "project")}</span>
        </div>

        {active.length === 0 ? (
          <Card>
            <EmptyState
              title="No active projects"
              description="Create one on the right, then use #project-name in Quick Dump to file tasks as you capture them."
            />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      {archived.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Archived</h2>
            <span className="text-xs text-muted">{pluralize(archived.length, "project")}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {archived.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <Skeleton key={index} className="h-[132px] w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <div>
      <PageHeader
        title="Projects"
        description="Group related tasks so Quick Dump can file captures automatically."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Suspense fallback={<ProjectsSkeleton />}>
          <ProjectsView />
        </Suspense>

        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader title="New project" hint="Pick an accent for its badge" />
          <div className="p-4">
            <ProjectForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
