import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { calcProjectTotals, settingsToFoamSettings } from "@/lib/calculations";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await db.project.findFirst({
    where: { id: params.id, userId },
    include: {
      measurements: { orderBy: [{ floor: "asc" }, { areaType: "asc" }] },
      totals: true,
      planFiles: true,
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const settings = await db.settings.findMany();
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const foamSettings = settingsToFoamSettings(settingsMap);

  const totals = calcProjectTotals(
    project.measurements.map((m) => ({
      areaType: m.areaType,
      netArea: m.netArea,
      grossArea: m.grossArea,
      foamType: m.foamType,
      boardFeet: m.boardFeet,
    })),
    foamSettings
  );

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      address: project.address,
      builder: project.builder,
      notes: project.notes,
    },
    measurements: project.measurements,
    totals,
    foamSettings,
    generatedAt: new Date().toISOString(),
  });
}
