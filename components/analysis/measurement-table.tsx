"use client";

import { useState } from "react";
import type { Measurement } from "@prisma/client";
import { AlertTriangle, Edit2, Plus, Trash2 } from "lucide-react";
import { confidenceColor, confidenceLabel, formatNumber } from "@/lib/utils";
import { settingsToFoamSettings } from "@/lib/calculations";
import MeasurementEditDialog from "./measurement-edit-dialog";
import AddMeasurementDialog from "./add-measurement-dialog";

const AREA_TYPE_LABELS: Record<string, string> = {
  EXTERIOR_WALL: "Exterior Wall",
  INTERIOR_WALL: "Interior Wall",
  ROOF: "Roof",
  ATTIC_FLOOR: "Attic Floor",
  CATHEDRAL_CEILING: "Cathedral Ceiling",
  CRAWL_SPACE: "Crawl Space",
  RIM_JOIST: "Rim Joist",
  FOUNDATION_WALL: "Foundation Wall",
  GARAGE_WALL: "Garage Wall",
  FLOOR_ASSEMBLY: "Floor Assembly",
};

interface Props {
  measurements: Measurement[];
  projectId: string;
  settings: Record<string, string>;
  onUpdated: () => void;
}

export default function MeasurementTable({ measurements, projectId, settings, onUpdated }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Group by floor
  const byFloor: Record<string, Measurement[]> = {};
  for (const m of measurements) {
    if (!byFloor[m.floor]) byFloor[m.floor] = [];
    byFloor[m.floor].push(m);
  }

  const foamSettings = settingsToFoamSettings(settings);
  const editingMeasurement = measurements.find((m) => m.id === editingId);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this measurement?")) return;
    await fetch(`/api/measurements/${id}`, { method: "DELETE" });
    onUpdated();
  };

  const reviewCount = measurements.filter((m) => m.needsReview).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Measurements</h2>
          {reviewCount > 0 && (
            <p className="text-sm text-yellow-600 flex items-center gap-1 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {reviewCount} item{reviewCount !== 1 ? "s" : ""} need review (confidence &lt; 85%)
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm bg-foam-orange text-white px-3 py-1.5 rounded-lg hover:bg-foam-orange-dark transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Row
        </button>
      </div>

      {Object.entries(byFloor).map(([floor, items]) => (
        <div key={floor} className="mb-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
            {floor}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-2.5 font-medium text-slate-500 text-xs">Label</th>
                  <th className="text-left px-3 py-2.5 font-medium text-slate-500 text-xs">Type</th>
                  <th className="text-right px-3 py-2.5 font-medium text-slate-500 text-xs">L × H</th>
                  <th className="text-right px-3 py-2.5 font-medium text-slate-500 text-xs">Net SF</th>
                  <th className="text-left px-3 py-2.5 font-medium text-slate-500 text-xs">Foam</th>
                  <th className="text-right px-3 py-2.5 font-medium text-slate-500 text-xs">R-Value</th>
                  <th className="text-right px-3 py-2.5 font-medium text-slate-500 text-xs">Thickness</th>
                  <th className="text-right px-3 py-2.5 font-medium text-slate-500 text-xs">BF</th>
                  <th className="text-center px-3 py-2.5 font-medium text-slate-500 text-xs">Conf.</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((m) => (
                  <tr
                    key={m.id}
                    className={`hover:bg-slate-50 ${m.needsReview ? "bg-yellow-50/50" : ""}`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {m.needsReview && (
                          <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                        )}
                        <span className="font-medium text-slate-800">{m.label}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {AREA_TYPE_LABELS[m.areaType] ?? m.areaType}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-600">
                      {m.length && m.height
                        ? `${formatNumber(m.length, 1)}′ × ${formatNumber(m.height, 1)}′`
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-900">
                      {m.netArea ? formatNumber(m.netArea) : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          m.foamType === "CLOSED_CELL"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {m.foamType === "CLOSED_CELL" ? "CC" : "OC"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-600">
                      R-{formatNumber(m.desiredRValue)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-600">
                      {m.requiredThickness
                        ? `${formatNumber(m.requiredThickness, 2)}″`
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                      {m.boardFeet ? formatNumber(m.boardFeet) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded border font-medium ${confidenceColor(m.confidence)}`}
                        title={confidenceLabel(m.confidence)}
                      >
                        {Math.round(m.confidence * 100)}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingId(m.id)}
                          className="p-1 text-slate-400 hover:text-foam-orange transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {editingMeasurement && (
        <MeasurementEditDialog
          measurement={editingMeasurement}
          foamSettings={foamSettings}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            onUpdated();
          }}
        />
      )}

      {showAdd && (
        <AddMeasurementDialog
          projectId={projectId}
          foamSettings={foamSettings}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            onUpdated();
          }}
        />
      )}
    </div>
  );
}
