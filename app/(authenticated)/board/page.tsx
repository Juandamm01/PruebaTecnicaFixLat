import { prisma } from "@/lib/prisma";

import { BoardCanvas } from "./board-canvas";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const notes = await prisma.note.findMany({
    select: {
      id: true,
      title: true,
      text: true,
      status: true,
      positionX: true,
      positionY: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <BoardCanvas
      initialNotes={notes.map((note) => ({
        ...note,
        updatedAt: note.updatedAt.toISOString(),
      }))}
    />
  );
}