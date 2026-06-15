import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowRight, FileText, FolderOpen, Plus, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const projects = await db.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: { totals: true },
  });

  const totalProjects = await db.project.count({ where: { userId } });
  const completedProjects = await db.project.count({
    where: { userId, status: "COMPLETE" },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Manage your insulation estimation projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Projects", value: totalProjects, icon: FolderOpen, color: "text-blue-600 bg-blue-50" },
          { label: "Completed", value: completedProjects, icon: TrendingUp, color: "text-green-600 bg-green-50" },
          { label: "Proposals", value: completedProjects, icon: FileText, color: "text-orange-600 bg-orange-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">{stat.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent Projects</h2>
          <Link
            href="/dashboard/projects"
            className="text-sm text-foam-orange hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-medium text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-500 text-sm mb-6">
              Upload your first set of building plans to get started
            </p>
            <Link
              href="/dashboard/projects/new"
              className="inline-flex items-center gap-2 bg-foam-orange text-white px-5 py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Project
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="font-medium text-slate-900">{project.name}</div>
                  <div className="text-sm text-slate-500">{project.address ?? "No address"}</div>
                </div>
                <div className="flex items-center gap-4">
                  {project.totals && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-900">
                        {project.totals.totalWallArea.toLocaleString()} sf
                      </div>
                      <div className="text-xs text-slate-500">Wall Area</div>
                    </div>
                  )}
                  <StatusBadge status={project.status} />
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-slate-100 text-slate-600",
    UPLOADING: "bg-blue-100 text-blue-600",
    ANALYZING: "bg-yellow-100 text-yellow-600",
    COMPLETE: "bg-green-100 text-green-700",
    ERROR: "bg-red-100 text-red-600",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[status] ?? styles.PENDING}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
