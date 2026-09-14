import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const noteFields = {
  id: true,
  title: true,
  text: true,
  status: true,
  positionX: true,
  positionY: true,
  updatedAt: true,
} as const;

async function hasActiveSession() {
  const session = await getServerSession(authOptions);
  return session?.user.active === true;
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export async function GET() {
  if (!(await hasActiveSession())) {
    return unauthorizedResponse();
  }

  const notes = await prisma.note.findMany({
    select: noteFields,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST() {
  if (!(await hasActiveSession())) {
    return unauthorizedResponse();
  }

  const note = await prisma.note.create({
    data: {
      title: "Nueva nota",
      text: "",
      status: "PENDIENTE",
      positionX: 80 + Math.round(Math.random() * 240),
      positionY: 80 + Math.round(Math.random() * 180),
    },
    select: noteFields,
  });

  return NextResponse.json(note, { status: 201 });
}