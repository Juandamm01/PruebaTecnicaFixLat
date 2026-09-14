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

type NoteStatus = "PENDIENTE" | "EN_CURSO" | "HECHO";

async function hasActiveSession() {
  const session = await getServerSession(authOptions);
  return session?.user.active === true;
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await hasActiveSession())) {
    return unauthorizedResponse();
  }

  const { id } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const data: {
    title?: string;
    text?: string;
    status?: NoteStatus;
    positionX?: number;
    positionY?: number;
  } = {};

  if (input.title !== undefined) {
    if (typeof input.title !== "string") {
      return NextResponse.json({ error: "Título inválido" }, { status: 400 });
    }
    data.title = input.title;
  }

  if (input.text !== undefined) {
    if (typeof input.text !== "string") {
      return NextResponse.json({ error: "Texto inválido" }, { status: 400 });
    }
    data.text = input.text;
  }

  if (input.status !== undefined) {
    if (
      input.status !== "PENDIENTE" &&
      input.status !== "EN_CURSO" &&
      input.status !== "HECHO"
    ) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }
    data.status = input.status;
  }

  if (input.positionX !== undefined) {
    if (
      typeof input.positionX !== "number" ||
      !Number.isFinite(input.positionX) ||
      input.positionX < 0
    ) {
      return NextResponse.json(
        { error: "La posición X es inválida" },
        { status: 400 },
      );
    }
    data.positionX = input.positionX;
  }

  if (input.positionY !== undefined) {
    if (
      typeof input.positionY !== "number" ||
      !Number.isFinite(input.positionY) ||
      input.positionY < 0
    ) {
      return NextResponse.json(
        { error: "La posición Y es inválida" },
        { status: 400 },
      );
    }
    data.positionY = input.positionY;
  }

  if (!Object.keys(data).length) {
    return NextResponse.json(
      { error: "No hay cambios para aplicar" },
      { status: 400 },
    );
  }

  try {
    const note = await prisma.note.update({
      where: { id },
      data,
      select: noteFields,
    });

    return NextResponse.json(note);
  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar la nota" },
      { status: 404 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await hasActiveSession())) {
    return unauthorizedResponse();
  }

  const { id } = await context.params;

  try {
    await prisma.note.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "No se pudo eliminar la nota" },
      { status: 404 },
    );
  }
}