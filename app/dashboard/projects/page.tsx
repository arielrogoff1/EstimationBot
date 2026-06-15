import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowRight, Plus, Search } from "lucide-react";

export default async function ProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const projects = await db.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      totals: true,
      planFiles: { select: { id: true } },
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500">{projects.length} total projects</p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center gap-2 bg-foam-orange text-white px-5 py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects yet</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">
            Create your first project and upload building plans to generate spray foam estimates.
          </p>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 bg-foam-orange text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-foam-orange/50 hover:shadow-sm transition-all flex items-center justify-between group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-foam-orange transition-colors truncate">
                    {project.name}
                  </h3>
                  <StatusBadge status={project.status} />
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  {project.address && <span>{project.address}</span>}
                  {project.builder && <span>· {project.builder}</span>}
                  <span>· {project.planFiles.length} file{project.planFiles.length !== 1 ? "s" : ""}</span>
                  <span>· {new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-6 ml-6">
                {project.totals ? (
                  <div className="grid grid-cols-3 gap-4 text-right">
                    <Stat label="Wall Area" value={`${project.totals.totalWallArea.toLocaleString()} sf`} />
                    <Stat label="Board Feet" value={project.totals.totalBoardFeet.toLocaleString()} />
                    <Stat label="Est. Cost" value={`$${project.totals.totalCost.toLocaleString()}`} highlight />
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 italic">No analysis yet</span>
                )}
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-foam-orange transition-colors flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className={`font-semibold ${highlight ? "text-foam-orange" : "text-slate-900"}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-slate-100 text-slate-600",
    UPLOADING: "bg-blue-100 text-blue-600",
    ANALYZING: "bg-yellow-100 text-yellow-700 animate-pulse",
    COMPLETE: "bg-green-100 text-green-700",
    ERROR: "bg-red-100 text-red-600",
  };
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${styles[status] ?? styles.PENDING}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
