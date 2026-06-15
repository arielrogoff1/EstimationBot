"use client";

import { Brain, CheckCircle2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AnalysisProgressProps {
  progress: number;
  message: string;
  complete: boolean;
}

const steps = [
  "Reading drawing scale and orientation",
  "Identifying exterior wall runs",
  "Detecting window and door openings",
  "Analyzing roof assembly",
  "Finding attic and crawl space areas",
  "Extracting dimension annotations",
  "Calculating net insulation areas",
  "Generating board-foot estimates",
];

export default function AnalysisProgress({ progress, message, complete }: AnalysisProgressProps) {
  const stepIndex = Math.floor((progress / 100) * steps.length);

  return (
    <div className="max-w-lg mx-auto py-12">
      <div className="text-center mb-8">
        {complete ? (
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        ) : (
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <Brain className="w-10 h-10 text-foam-orange" />
            <div className="absolute inset-0 rounded-full border-4 border-foam-orange/20 animate-ping" />
          </div>
        )}

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {complete ? "Analysis Complete" : "Claude AI is Reading Your Plans"}
        </h2>
        <p className="text-slate-500 text-sm">{message}</p>
      </div>

      <Progress value={progress} className="mb-6 h-2" />

      <div className="space-y-2.5">
        {steps.map((step, i) => (
          <div
            key={step}
            className={`flex items-center gap-3 text-sm transition-all ${
              i < stepIndex
                ? "text-green-600"
                : i === stepIndex && !complete
                ? "text-foam-orange font-medium"
                : "text-slate-400"
            }`}
          >
            {i < stepIndex ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : i === stepIndex && !complete ? (
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-current flex-shrink-0" />
            )}
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
