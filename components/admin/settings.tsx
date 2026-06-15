"use client";

import { useState } from "react";
import type { Settings } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  foam: "Foam R-Values",
  pricing: "Pricing",
  material: "Material Assumptions",
  labor: "Labor Rates",
  defaults: "Default R-Values by Area",
};

interface Props {
  settings: Settings[];
}

export default function AdminSettings({ settings }: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const byCategory: Record<string, Settings[]> = {};
  for (const s of settings) {
    if (!byCategory[s.category]) byCategory[s.category] = [];
    byCategory[s.category].push(s);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <h2 className="font-semibold text-slate-800">
              {CATEGORY_LABELS[cat] ?? cat}
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map((setting) => (
              <div key={setting.key} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700">
                    {setting.label}
                  </label>
                  <div className="text-xs text-slate-400 font-mono">{setting.key}</div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={values[setting.key] ?? setting.value}
                  onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
                  className="w-32 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-foam-orange"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-foam-orange hover:bg-foam-orange-dark"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : saved ? (
            <Check className="w-4 h-4 mr-2" />
          ) : null}
          {saved ? "Saved!" : "Save Settings"}
        </Button>
        <p className="text-sm text-slate-500">
          Changes apply to all future calculations immediately.
        </p>
      </div>
    </div>
  );
}
