import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  calcMeasurement,
  calcProjectTotals,
  settingsToFoamSettings,
} from "@/lib/calculations";

const createSchema = z.object({
  projectId: z.string(),
  floor: z.string().default("Main Floor"),
  areaType: z.enum([
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
  ]),
  label: z.string(),
  length: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  windowArea: z.number().default(0),
  doorArea: z.number().default(0),
  foamType: z.enum(["OPEN_CELL", "CLOSED_CELL"]).default("CLOSED_CELL"),
  desiredRValue: z.number().default(21),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { projectId, ...data } = parsed.data;
  const project = await db.project.findFirst({ where: { id: projectId, userId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const settings = await db.settings.findMany();
  const foamSettings = settingsToFoamSettings(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  );

  const grossArea =
    data.length && data.height ? data.length * data.height : null;
  const netArea = grossArea
    ? Math.max(0, grossArea - (data.windowArea + data.doorArea))
    : null;

  const calc = netArea
    ? calcMeasurement(netArea, data.desiredRValue, data.foamType, foamSettings)
    : null;

  const measurement = await db.measurement.create({
    data: {
      projectId,
      ...data,
      grossArea,
      netArea,
      requiredThickness: calc?.requiredThickness ?? null,
      boardFeet: calc?.boardFeet ?? null,
      confidence: 1.0,
    },
  });

  await recalcTotals(projectId, foamSettings);

  return NextResponse.json(measurement, { status: 201 });
}

async function recalcTotals(projectId: string, foamSettings: ReturnType<typeof settingsToFoamSettings>) {
  const measurements = await db.measurement.findMany({ where: { projectId } });
  const totals = calcProjectTotals(
    measurements.map((m) => ({
      areaType: m.areaType,
      netArea: m.netArea,
      grossArea: m.grossArea,
      foamType: m.foamType,
      boardFeet: m.boardFeet,
    })),
    foamSettings
  );

  await db.buildingTotals.upsert({
    where: { projectId },
    update: {
      totalWallArea: totals.totalWallArea,
      totalRoofArea: totals.totalRoofArea,
      totalFloorArea: totals.totalFloorArea,
      volume: totals.volume,
      totalBoardFeet: totals.totalBoardFeet,
      totalCost: totals.totalCost,
    },
    create: {
      projectId,
      totalWallArea: totals.totalWallArea,
      totalRoofArea: totals.totalRoofArea,
      totalFloorArea: totals.totalFloorArea,
      volume: totals.volume,
      totalBoardFeet: totals.totalBoardFeet,
      totalCost: totals.totalCost,
    },
  });
}
