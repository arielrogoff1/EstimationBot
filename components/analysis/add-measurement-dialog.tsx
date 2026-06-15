"use client";

import { useState } from "react";
import type { FoamSettings } from "@/lib/calculations";
import { calcRequiredThickness, calcBoardFeet } from "@/lib/calculations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const AREA_TYPES = [
  { value: "EXTERIOR_WALL", label: "Exterior Wall" },
  { value: "INTERIOR_WALL", label: "Interior Wall" },
  { value: "ROOF", label: "Roof" },
  { value: "ATTIC_FLOOR", label: "Attic Floor" },
  { value: "CATHEDRAL_CEILING", label: "Cathedral Ceiling" },
  { value: "CRAWL_SPACE", label: "Crawl Space" },
  { value: "RIM_JOIST", label: "Rim Joist" },
  { value: "FOUNDATION_WALL", label: "Foundation Wall" },
  { value: "GARAGE_WALL", label: "Garage Wall" },
  { value: "FLOOR_ASSEMBLY", label: "Floor Assembly" },
];

interface Props {
  projectId: string;
  foamSettings: FoamSettings;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddMeasurementDialog({ projectId, foamSettings, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: "",
    floor: "First Floor",
    areaType: "EXTERIOR_WALL",
    length: "",
    height: "",
    windowArea: "0",
    doorArea: "0",
    foamType: "CLOSED_CELL",
    desiredRValue: "21",
  });

  const length = parseFloat(form.length) || 0;
  const height = parseFloat(form.height) || 0;
  const windowArea = parseFloat(form.windowArea) || 0;
  const doorArea = parseFloat(form.doorArea) || 0;
  const rValue = parseFloat(form.desiredRValue) || 21;
  const rPerInch =
    form.foamType === "CLOSED_CELL"
      ? foamSettings.closedCellRPerInch
      : foamSettings.openCellRPerInch;
  const grossArea = length && height ? length * height : 0;
  const netArea = Math.max(0, grossArea - windowArea - doorArea);
  const thickness = calcRequiredThickness(rValue, rPerInch);
  const boardFeet = calcBoardFeet(netArea, thickness);

  async function handleSave() {
    if (!form.label.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          label: form.label,
          floor: form.floor,
          areaType: form.areaType,
          length: parseFloat(form.length) || null,
          height: parseFloat(form.height) || null,
          windowArea: parseFloat(form.windowArea) || 0,
          doorArea: parseFloat(form.doorArea) || 0,
          foamType: form.foamType,
          desiredRValue: parseFloat(form.desiredRValue) || 21,
        }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Measurement</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Label *</label>
            <input
              placeholder="e.g. North Exterior Wall"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foam-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Floor</label>
            <input
              value={form.floor}
              onChange={(e) => setForm({ ...form, floor: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foam-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Area Type</label>
            <select
              value={form.areaType}
              onChange={(e) => setForm({ ...form, areaType: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foam-orange"
            >
              {AREA_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Length (ft)</label>
            <input
              type="number" step="0.1" value={form.length}
              onChange={(e) => setForm({ ...form, length: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foam-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Height (ft)</label>
            <input
              type="number" step="0.1" value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foam-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Window Area (sf)</label>
            <input
              type="number" step="0.1" value={form.windowArea}
              onChange={(e) => setForm({ ...form, windowArea: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foam-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Door Area (sf)</label>
            <input
              type="number" step="0.1" value={form.doorArea}
              onChange={(e) => setForm({ ...form, doorArea: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foam-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Foam Type</label>
            <select
              value={form.foamType}
              onChange={(e) => setForm({ ...form, foamType: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foam-orange"
            >
              <option value="CLOSED_CELL">Closed Cell (R-6.5/in)</option>
              <option value="OPEN_CELL">Open Cell (R-3.7/in)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Desired R-Value</label>
            <input
              type="number" step="1" value={form.desiredRValue}
              onChange={(e) => setForm({ ...form, desiredRValue: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foam-orange"
            />
          </div>
        </div>

        {netArea > 0 && (
          <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-3 gap-3 text-center text-sm border border-slate-200">
            <div>
              <div className="font-semibold text-slate-900">{netArea.toFixed(0)} sf</div>
              <div className="text-xs text-slate-500">Net Area</div>
            </div>
            <div>
              <div className="font-semibold text-slate-900">{thickness.toFixed(2)}″</div>
              <div className="text-xs text-slate-500">Thickness</div>
            </div>
            <div>
              <div className="font-semibold text-foam-orange">{boardFeet.toFixed(0)} BF</div>
              <div className="text-xs text-slate-500">Board Feet</div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.label.trim()}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Add Measurement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
