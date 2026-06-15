import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { uploadToS3, s3KeyForPlan } from "@/lib/s3";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const projectId = formData.get("projectId") as string;
  const file = formData.get("file") as File;

  if (!projectId || !file) {
    return NextResponse.json({ error: "Missing projectId or file" }, { status: 400 });
  }

  // Verify project ownership
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const s3Key = s3KeyForPlan(projectId, file.name);
  const s3Url = await uploadToS3(s3Key, buffer, file.type);

  // Record in database
  const planFile = await db.planFile.create({
    data: {
      projectId,
      filename: file.name,
      s3Key,
      s3Url,
      fileType: file.type,
      sizeBytes: buffer.length,
      status: "COMPLETE",
    },
  });

  // Update project status
  await db.project.update({
    where: { id: projectId },
    data: { status: "PENDING" },
  });

  return NextResponse.json({ planFile, s3Url }, { status: 201 });
}
