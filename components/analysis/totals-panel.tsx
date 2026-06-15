"use client";

import type { ProjectTotals, FoamSettings } from "@/lib/calculations";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Props {
  totals: ProjectTotals;
  foamSettings: FoamSettings;
}

export default function TotalsPanel({ totals, foamSettings }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-900 text-base">Project Summary</h3>

      {/* Areas */}
      <Section title="Building Areas">
        <Row label="Total Wall Area" value={`${formatNumber(totals.totalWallArea)} sf`} />
        <Row label="Total Roof Area" value={`${formatNumber(totals.totalRoofArea)} sf`} />
        <Row label="Total Floor Area" value={`${formatNumber(totals.totalFloorArea)} sf`} />
        {totals.volume > 0 && (
          <Row label="Building Volume" value={`${formatNumber(totals.volume)} cf`} />
        )}
      </Section>

      {/* Foam */}
      <Section title="Spray Foam">
        <Row label="Closed Cell BF" value={formatNumber(totals.closedCellBoardFeet)} />
        <Row label="Open Cell BF" value={formatNumber(totals.openCellBoardFeet)} />
        <Row label="Total Board Feet" value={formatNumber(totals.totalBoardFeet)} bold />
        {totals.closedCellSets > 0 && (
          <Row label="CC Sets" value={`${totals.closedCellSets} set${totals.closedCellSets !== 1 ? "s" : ""}`} />
        )}
        {totals.openCellSets > 0 && (
          <Row label="OC Sets" value={`${totals.openCellSets} set${totals.openCellSets !== 1 ? "s" : ""}`} />
        )}
      </Section>

      {/* Labor */}
      <Section title="Labor">
        <Row label="Estimated Hours" value={`${totals.laborHours}h`} />
      </Section>

      {/* Cost */}
      <Section title="Cost Breakdown">
        <Row label="Material" value={formatCurrency(totals.materialCost)} />
        <Row label="Labor" value={formatCurrency(totals.laborCost)} />
        <Row label={`Overhead (${foamSettings.overheadPercent}%)`} value={formatCurrency(totals.overhead)} />
        <div className="border-t border-slate-200 pt-2 mt-1">
          <Row label="Total Cost" value={formatCurrency(totals.totalCost)} bold />
        </div>
      </Section>

      {/* Sell price */}
      <div className="bg-foam-orange rounded-xl p-4 text-white text-center">
        <div className="text-sm opacity-90 mb-1">Suggested Sell Price</div>
        <div className="text-3xl font-bold">{formatCurrency(totals.sellPrice)}</div>
        <div className="text-xs opacity-75 mt-1">
          Incl. {foamSettings.profitPercent}% margin
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={bold ? "font-bold text-slate-900" : "font-medium text-slate-800"}>
        {value}
      </span>
    </div>
  );
}
