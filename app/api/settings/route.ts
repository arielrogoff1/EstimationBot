import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await db.settings.findMany({ orderBy: [{ category: "asc" }, { key: "asc" }] });
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updates: Record<string, string> = await req.json();

  const results = await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      db.settings.update({ where: { key }, data: { value } })
    )
  );

  return NextResponse.json(results);
}
