import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { analyzePlanUrl } from "@/lib/ai/analyze";
import { settingsToFoamSettings, calcMeasurement, calcProjectTotals } from "@/lib/calculations";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, planFileId } = await req.json();

  if (!projectId || !planFileId) {
    return NextResponse.json({ error: "Missing projectId or planFileId" }, { status: 400 });
  }

  // Verify ownership
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const planFile = await db.planFile.findFirst({
    where: { id: planFileId, projectId },
  });
  if (!planFile) return NextResponse.json({ error: "Plan file not found" }, { status: 404 });

  // Update status to analyzing
  await db.project.update({ where: { id: projectId }, data: { status: "ANALYZING" } });
  await db.planFile.update({ where: { id: planFileId }, data: { status: "PROCESSING" } });

  try {
    // Run Claude analysis
    const result = await analyzePlanUrl(planFile.s3Url, 1, planFile.pageCount);

    // Store raw analysis
    await db.analysis.create({
      data: {
        planFileId,
        pageNumber: 1,
        rawResponse: result as object,
        extractedData: result as object,
        confidence: result.overallConfidence,
        modelUsed: "claude-sonnet-4-6",
      },
    });

    // Load settings
    const settings = await db.settings.findMany();
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    const foamSettings = settingsToFoamSettings(settingsMap);

    // Convert extracted walls/surfaces into Measurements
    const defaultRValues: Record<string, number> = {
      EXTERIOR_WALL: parseFloat(settingsMap.default_r_exterior_wall ?? "21"),
      INTERIOR_WALL: 13,
      ROOF: parseFloat(settingsMap.default_r_roof ?? "38"),
      ATTIC_FLOOR: parseFloat(settingsMap.default_r_attic_floor ?? "49"),
      CATHEDRAL_CEILING: parseFloat(settingsMap.default_r_roof ?? "38"),
      CRAWL_SPACE: parseFloat(settingsMap.default_r_crawl_space ?? "21"),
      RIM_JOIST: parseFloat(settingsMap.default_r_rim_joist ?? "13"),
      FOUNDATION_WALL: parseFloat(settingsMap.default_r_foundation_wall ?? "21"),
      GARAGE_WALL: 13,
      FLOOR_ASSEMBLY: 21,
    };

    const measurementsToCreate: Parameters<typeof db.measurement.createMany>[0]["data"] = [];

    for (const floor of result.floors) {
      for (const wall of floor.walls) {
        const areaType = wall.type as Parameters<typeof db.measurement.createMany>[0]["data"][0]["areaType"];
        const desiredRValue = defaultRValues[wall.type] ?? 21;
        const foamType = wall.type === "ATTIC_FLOOR" ? "OPEN_CELL" : "CLOSED_CELL";
        const netArea = wall.netArea ?? wall.grossArea ?? 0;

        const calc = calcMeasurement(netArea, desiredRValue, foamType, foamSettings);

        measurementsToCreate.push({
          projectId,
          floor: floor.name,
          areaType,
          label: wall.label,
          length: wall.length,
          height: wall.height,
          grossArea: wall.grossArea,
          windowArea: wall.windowArea,
          doorArea: wall.doorArea,
          netArea: wall.netArea,
          foamType,
          desiredRValue,
          requiredThickness: calc.requiredThickness,
          boardFeet: calc.boardFeet,
          confidence: wall.confidence,
          needsReview: wall.confidence < 0.85,
        });
      }
    }

    // Delete existing measurements for this project and replace
    await db.measurement.deleteMany({ where: { projectId } });
    if (measurementsToCreate.length > 0) {
      await db.measurement.createMany({ data: measurementsToCreate });
    }

    // Recompute totals
    const allMeasurements = await db.measurement.findMany({ where: { projectId } });
    const totals = calcProjectTotals(
      allMeasurements.map((m) => ({
        areaType: m.areaType,
        netArea: m.netArea,
        grossArea: m.grossArea,
        foamType: m.foamType,
        boardFeet: m.boardFeet,
      })),
      foamSettings,
      {
        length: result.buildingTotals.estimatedLength ?? undefined,
        width: result.buildingTotals.estimatedWidth ?? undefined,
        height: result.buildingTotals.estimatedHeight ?? undefined,
      }
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

    // Update statuses
    await db.planFile.update({ where: { id: planFileId }, data: { status: "COMPLETE" } });
    await db.project.update({ where: { id: projectId }, data: { status: "COMPLETE" } });

    return NextResponse.json({
      success: true,
      measurementCount: measurementsToCreate.length,
      totals,
      warnings: result.warningFlags,
      confidence: result.overallConfidence,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    await db.project.update({ where: { id: projectId }, data: { status: "ERROR" } });
    await db.planFile.update({ where: { id: planFileId }, data: { status: "ERROR" } });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
