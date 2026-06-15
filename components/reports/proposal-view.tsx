"use client";

import { useState } from "react";
import type { Measurement, Project } from "@prisma/client";
import type { ProjectTotals, FoamSettings } from "@/lib/calculations";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

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
  project: Project;
  measurements: Measurement[];
  totals: ProjectTotals;
  foamSettings: FoamSettings;
}

export default function ProposalView({ project, measurements, totals, foamSettings }: Props) {
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => window.print();

  const byFloor: Record<string, Measurement[]> = {};
  for (const m of measurements) {
    if (!byFloor[m.floor]) byFloor[m.floor] = [];
    byFloor[m.floor].push(m);
  }

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-3 mb-6 no-print">
        <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
          <Printer className="w-4 h-4" /> Print Proposal
        </Button>
        <Button
          variant="outline"
          disabled={downloading}
          className="flex items-center gap-2"
          onClick={async () => {
            setDownloading(true);
            const res = await fetch(`/api/reports/${project.id}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${project.name}-proposal.json`;
            a.click();
            setDownloading(false);
          }}
        >
          <Download className="w-4 h-4" /> Export JSON
        </Button>
      </div>

      {/* Proposal document */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-4xl print-page" id="proposal">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="text-foam-orange font-bold text-xl mb-1">
              Spray Foam Insulation Proposal
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            {project.address && (
              <p className="text-slate-500 mt-1">{project.address}</p>
            )}
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>Date: {today}</p>
            {project.builder && <p>Builder: {project.builder}</p>}
            <p>Ref: #{project.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>

        {/* Building Summary */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Building Summary</h2>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Wall Area", value: `${formatNumber(totals.totalWallArea)} sf` },
              { label: "Total Roof Area", value: `${formatNumber(totals.totalRoofArea)} sf` },
              { label: "Total Floor Area", value: `${formatNumber(totals.totalFloorArea)} sf` },
              { label: "Total Board Feet", value: formatNumber(totals.totalBoardFeet) },
            ].map((s) => (
              <div key={s.label} className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Insulation Schedule */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Insulation Schedule</h2>
          {Object.entries(byFloor).map(([floor, items]) => (
            <div key={floor} className="mb-6">
              <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">
                {floor}
              </h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left px-3 py-2 font-medium text-slate-600 border border-slate-200">Area / Surface</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600 border border-slate-200">Type</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600 border border-slate-200">Net SF</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600 border border-slate-200">Foam</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600 border border-slate-200">Thickness</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600 border border-slate-200">R-Value</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600 border border-slate-200">Board Feet</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((m) => (
                    <tr key={m.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 border border-slate-200 font-medium text-slate-800">{m.label}</td>
                      <td className="px-3 py-2 border border-slate-200 text-slate-600">{AREA_TYPE_LABELS[m.areaType]}</td>
                      <td className="px-3 py-2 border border-slate-200 text-right">{m.netArea ? formatNumber(m.netArea) : "—"}</td>
                      <td className="px-3 py-2 border border-slate-200 text-slate-600">
                        {m.foamType === "CLOSED_CELL" ? "Closed Cell" : "Open Cell"}
                      </td>
                      <td className="px-3 py-2 border border-slate-200 text-right">
                        {m.requiredThickness ? `${m.requiredThickness.toFixed(2)}″` : "—"}
                      </td>
                      <td className="px-3 py-2 border border-slate-200 text-right">R-{m.desiredRValue}</td>
                      <td className="px-3 py-2 border border-slate-200 text-right font-medium">
                        {m.boardFeet ? formatNumber(m.boardFeet) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>

        {/* Material Summary */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Material Summary</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="text-left px-3 py-2 font-medium text-slate-600 border border-slate-200">Item</th>
                <th className="text-right px-3 py-2 font-medium text-slate-600 border border-slate-200">Quantity</th>
                <th className="text-right px-3 py-2 font-medium text-slate-600 border border-slate-200">Unit Cost</th>
                <th className="text-right px-3 py-2 font-medium text-slate-600 border border-slate-200">Total</th>
              </tr>
            </thead>
            <tbody>
              {totals.closedCellBoardFeet > 0 && (
                <tr>
                  <td className="px-3 py-2 border border-slate-200">Closed Cell Spray Foam</td>
                  <td className="px-3 py-2 border border-slate-200 text-right">{formatNumber(totals.closedCellBoardFeet)} BF</td>
                  <td className="px-3 py-2 border border-slate-200 text-right">${foamSettings.closedCellCostPerBF.toFixed(2)}/BF</td>
                  <td className="px-3 py-2 border border-slate-200 text-right font-medium">
                    {formatCurrency(totals.closedCellBoardFeet * foamSettings.closedCellCostPerBF)}
                  </td>
                </tr>
              )}
              {totals.openCellBoardFeet > 0 && (
                <tr>
                  <td className="px-3 py-2 border border-slate-200">Open Cell Spray Foam</td>
                  <td className="px-3 py-2 border border-slate-200 text-right">{formatNumber(totals.openCellBoardFeet)} BF</td>
                  <td className="px-3 py-2 border border-slate-200 text-right">${foamSettings.openCellCostPerBF.toFixed(2)}/BF</td>
                  <td className="px-3 py-2 border border-slate-200 text-right font-medium">
                    {formatCurrency(totals.openCellBoardFeet * foamSettings.openCellCostPerBF)}
                  </td>
                </tr>
              )}
              <tr>
                <td className="px-3 py-2 border border-slate-200">Labor ({totals.laborHours} hours)</td>
                <td className="px-3 py-2 border border-slate-200 text-right">{totals.laborHours}h</td>
                <td className="px-3 py-2 border border-slate-200 text-right">${foamSettings.laborRatePerHour}/hr</td>
                <td className="px-3 py-2 border border-slate-200 text-right font-medium">{formatCurrency(totals.laborCost)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Pricing */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Pricing</h2>
          <div className="max-w-sm ml-auto space-y-1.5">
            {[
              { label: "Material Cost", value: formatCurrency(totals.materialCost) },
              { label: "Labor Cost", value: formatCurrency(totals.laborCost) },
              { label: `Overhead (${foamSettings.overheadPercent}%)`, value: formatCurrency(totals.overhead) },
            ].map((r) => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-slate-600">{r.label}</span>
                <span className="font-medium">{r.value}</span>
              </div>
            ))}
            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{formatCurrency(totals.totalCost)}</span>
            </div>
          </div>
        </section>

        {/* Customer price */}
        <div className="bg-foam-orange rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">Total Project Price</div>
              <div className="text-orange-100 text-sm mt-0.5">
                Includes materials, labor, and {foamSettings.profitPercent}% margin
              </div>
            </div>
            <div className="text-4xl font-bold">{formatCurrency(totals.sellPrice)}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-400 text-center">
          <p>This proposal is valid for 30 days from the date above.</p>
          <p className="mt-1">
            Generated by Spray Foam Estimator AI · {today}
          </p>
        </div>
      </div>
    </div>
  );
}
