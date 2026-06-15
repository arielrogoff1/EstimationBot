"use client";

import { useState, useCallback } from "react";
import type { Project, PlanFile, Measurement, BuildingTotals, Proposal } from "@prisma/client";
import Dropzone from "@/components/upload/dropzone";
import MeasurementTable from "@/components/analysis/measurement-table";
import TotalsPanel from "@/components/analysis/totals-panel";
import ProposalView from "@/components/reports/proposal-view";
import AnalysisProgress from "@/components/analysis/analysis-progress";
import { settingsToFoamSettings, calcProjectTotals } from "@/lib/calculations";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Brain, FileText, Plus, BarChart3 } from "lucide-react";
import Link from "next/link";

type ProjectWithRelations = Project & {
  planFiles: PlanFile[];
  measurements: Measurement[];
  totals: BuildingTotals | null;
  proposal: Proposal | null;
};

interface WorkspaceProps {
  project: ProjectWithRelations;
  settings: Record<string, string>;
}

export default function ProjectWorkspace({ project: initial, settings }: WorkspaceProps) {
  const [project, setProject] = useState(initial);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [activeTab, setActiveTab] = useState(
    initial.measurements.length > 0 ? "measurements" : "upload"
  );

  const foamSettings = settingsToFoamSettings(settings);

  const refreshProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${project.id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
    }
  }, [project.id]);

  const handleFilesUploaded = useCallback(
    async (planFileIds: string[]) => {
      setAnalyzing(true);
      setActiveTab("analysis");
      setAnalysisProgress(10);
      setAnalysisMessage("Starting AI analysis...");

      try {
        for (let i = 0; i < planFileIds.length; i++) {
          setAnalysisMessage(
            `Analyzing plan ${i + 1} of ${planFileIds.length} with Claude AI...`
          );
          setAnalysisProgress(10 + (i / planFileIds.length) * 80);

          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: project.id,
              planFileId: planFileIds[i],
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? "Analysis failed");
          }
        }

        setAnalysisProgress(100);
        setAnalysisMessage("Analysis complete!");

        await refreshProject();
        setActiveTab("measurements");
      } catch (err) {
        console.error(err);
        setAnalysisMessage(
          `Error: ${err instanceof Error ? err.message : "Analysis failed"}`
        );
      } finally {
        setAnalyzing(false);
      }
    },
    [project.id, refreshProject]
  );

  const handleMeasurementUpdated = useCallback(async () => {
    await refreshProject();
  }, [refreshProject]);

  const totals =
    project.measurements.length > 0
      ? calcProjectTotals(
          project.measurements.map((m) => ({
            areaType: m.areaType,
            netArea: m.netArea,
            grossArea: m.grossArea,
            foamType: m.foamType,
            boardFeet: m.boardFeet,
          })),
          foamSettings
        )
      : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/projects"
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 text-lg truncate">{project.name}</h1>
            {project.address && (
              <p className="text-sm text-slate-500 truncate">{project.address}</p>
            )}
          </div>
          <StatusPill status={project.status} />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Tabs */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="upload" className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Upload Plans
              </TabsTrigger>
              {(analyzing || project.status === "ANALYZING") && (
                <TabsTrigger value="analysis" className="flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 animate-pulse" /> Analyzing
                </TabsTrigger>
              )}
              <TabsTrigger
                value="measurements"
                disabled={project.measurements.length === 0}
                className="flex items-center gap-1.5"
              >
                <BarChart3 className="w-3.5 h-3.5" /> Measurements
                {project.measurements.length > 0 && (
                  <span className="ml-1 bg-foam-orange text-white text-xs rounded-full px-1.5 py-0.5">
                    {project.measurements.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="proposal"
                disabled={!totals}
                className="flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> Proposal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <div className="max-w-2xl">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">Upload Building Plans</h2>
                <p className="text-slate-500 text-sm mb-6">
                  Upload PDFs, blueprints, or floor plan images. Claude AI will extract all dimensions automatically.
                </p>
                <Dropzone
                  projectId={project.id}
                  onFilesUploaded={handleFilesUploaded}
                />
                {project.planFiles.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">
                      Previously Uploaded ({project.planFiles.length})
                    </h3>
                    <div className="space-y-2">
                      {project.planFiles.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg text-sm"
                        >
                          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="flex-1 truncate text-slate-700">{f.filename}</span>
                          <span className="text-slate-400">
                            {(f.sizeBytes / 1024 / 1024).toFixed(1)} MB
                          </span>
                          <StatusDot status={f.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analysis">
              <AnalysisProgress
                progress={analysisProgress}
                message={analysisMessage}
                complete={!analyzing && analysisProgress === 100}
              />
            </TabsContent>

            <TabsContent value="measurements">
              <MeasurementTable
                measurements={project.measurements}
                projectId={project.id}
                settings={settings}
                onUpdated={handleMeasurementUpdated}
              />
            </TabsContent>

            <TabsContent value="proposal">
              {totals && (
                <ProposalView
                  project={project}
                  measurements={project.measurements}
                  totals={totals}
                  foamSettings={foamSettings}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Totals sidebar */}
        {totals && (
          <div className="w-80 flex-shrink-0 border-l border-slate-200 bg-white overflow-y-auto p-4">
            <TotalsPanel totals={totals} foamSettings={foamSettings} />
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-slate-100 text-slate-600",
    UPLOADING: "bg-blue-100 text-blue-600",
    ANALYZING: "bg-yellow-100 text-yellow-700",
    COMPLETE: "bg-green-100 text-green-700",
    ERROR: "bg-red-100 text-red-600",
  };
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${styles[status] ?? styles.PENDING}`}>
      {status === "ANALYZING" ? "🤖 Analyzing..." : status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    COMPLETE: "bg-green-400",
    ERROR: "bg-red-400",
    PROCESSING: "bg-yellow-400 animate-pulse",
    UPLOADING: "bg-blue-400 animate-pulse",
  };
  return (
    <div className={`w-2 h-2 rounded-full ${colors[status] ?? "bg-slate-300"}`} />
  );
}
