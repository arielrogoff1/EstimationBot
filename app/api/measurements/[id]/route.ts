import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  calcMeasurement,
  calcProjectTotals,
  settingsToFoamSettings,
} from "@/lib/calculations";

const updateSchema = z.object({
  label: z.string().optional(),
  floor: z.string().optional(),
  length: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  windowArea: z.number().optional(),
  doorArea: z.number().optional(),
  foamType: z.enum(["OPEN_CELL", "CLOSED_CELL"]).optional(),
  desiredRValue: z.number().optional(),
  areaType: z
    .enum([
      "EXTERIOR_WALL",
      "INTERIOR_WALL",
      "ROOF",
      "ATTIC_FLOOR",
      "CATHEDRAL_CEILING",
      "CRAWL_SPACE",
      "RIM_JOIST",
      "FOUNDATION_WALL",
      "GARAGE_WALL",
      "FLOOR_ASSEMBLY",
    ])
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const measurement = await db.measurement.findFirst({
    where: { id: params.id },
    include: { project: true },
  });
  if (!measurement || measurement.project.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const settings = await db.settings.findMany();
  const foamSettings = settingsToFoamSettings(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  );

  const updatedData = { ...parsed.data };
  const length = updatedData.length ?? measurement.length;
  const height = updatedData.height ?? measurement.height;
  const windowArea = updatedData.windowArea ?? measurement.windowArea;
  const doorArea = updatedData.doorArea ?? measurement.doorArea;
  const foamType = updatedData.foamType ?? measurement.foamType;
  const desiredRValue = updatedData.desiredRValue ?? measurement.desiredRValue;

  const grossArea = length && height ? length * height : measurement.grossArea;
  const netArea = grossArea ? Math.max(0, grossArea - windowArea - doorArea) : measurement.netArea;

  const calc = netArea
    ? calcMeasurement(netArea, desiredRValue, foamType, foamSettings)
    : null;

  const updated = await db.measurement.update({
    where: { id: params.id },
    data: {
      ...updatedData,
      grossArea,
      netArea,
      requiredThickness: calc?.requiredThickness ?? measurement.requiredThickness,
      boardFeet: calc?.boardFeet ?? measurement.boardFeet,
    },
  });

  // Recalc project totals
  const allMeasurements = await db.measurement.findMany({
    where: { projectId: measurement.projectId },
  });
  const totals = calcProjectTotals(
    allMeasurements.map((m) => ({
      areaType: m.areaType,
      netArea: m.netArea,
      grossArea: m.grossArea,
      foamType: m.foamType,
      boardFeet: m.boardFeet,
    })),
    foamSettings
  );

  await db.buildingTotals.upsert({
    where: { projectId: measurement.projectId },
    update: {
      totalWallArea: totals.totalWallArea,
      totalRoofArea: totals.totalRoofArea,
      totalFloorArea: totals.totalFloorArea,
      volume: totals.volume,
      totalBoardFeet: totals.totalBoardFeet,
      totalCost: totals.totalCost,
    },
    create: {
      projectId: measurement.projectId,
      totalWallArea: totals.totalWallArea,
      totalRoofArea: totals.totalRoofArea,
      totalFloorArea: totals.totalFloorArea,
      volume: totals.volume,
      totalBoardFeet: totals.totalBoardFeet,
      totalCost: totals.totalCost,
    },
  });

  return NextResponse.json({ measurement: updated, totals });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const measurement = await db.measurement.findFirst({
    where: { id: params.id },
    include: { project: true },
  });
  if (!measurement || measurement.project.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.measurement.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
