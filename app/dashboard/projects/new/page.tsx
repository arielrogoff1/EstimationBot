"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", builder: "", notes: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      const project = await res.json();
      router.push(`/dashboard/projects/${project.id}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">New Project</h1>
      <p className="text-slate-500 mb-8">
        Enter project details, then upload your building plans on the next screen.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        {[
          { key: "name", label: "Project Name", placeholder: "e.g. 819 Glen Drive", required: true },
          { key: "address", label: "Property Address", placeholder: "e.g. 819 Glen Drive, Anytown, ST 12345" },
          { key: "builder", label: "Builder / General Contractor", placeholder: "e.g. Smith Construction" },
        ].map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              required={f.required}
              placeholder={f.placeholder}
              value={form[f.key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foam-orange focus:border-transparent"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
          <textarea
            rows={3}
            placeholder="Any special instructions..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foam-orange focus:border-transparent resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !form.name.trim()}
            className="flex-1 bg-foam-orange text-white py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Project & Upload Plans
          </button>
          <Link
            href="/dashboard/projects"
            className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
