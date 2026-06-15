import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProjectWorkspace from "@/components/project/workspace";

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const project = await db.project.findFirst({
    where: { id: params.id, userId },
    include: {
      planFiles: { orderBy: { createdAt: "asc" } },
      measurements: { orderBy: { createdAt: "asc" } },
      totals: true,
      proposal: true,
    },
  });

  if (!project) notFound();

  const settings = await db.settings.findMany();
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return <ProjectWorkspace project={project} settings={settingsMap} />;
}
