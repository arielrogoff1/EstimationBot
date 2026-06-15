import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import AdminSettings from "@/components/admin/settings";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const settings = await db.settings.findMany({ orderBy: [{ category: "asc" }, { key: "asc" }] });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Configure foam pricing, R-values, and material assumptions.</p>
      </div>
      <AdminSettings settings={settings} />
    </div>
  );
}
