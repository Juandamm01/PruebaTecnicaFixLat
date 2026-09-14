import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const userFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
} as const;

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user.role === "ADMIN";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
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

  const { name, email, role } = body as Record<string, unknown>;
  const data: { name?: string; email?: string; role?: "ADMIN" | "USER" } = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre no puede estar vacío" },
        { status: 400 },
      );
    }
    data.name = name.trim();
  }

  if (email !== undefined) {
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "El email no puede estar vacío" },
        { status: 400 },
      );
    }
    data.email = email.trim().toLowerCase();
  }

  if (role !== undefined) {
    if (role !== "ADMIN" && role !== "USER") {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }
    data.role = role;
  }

  if (!Object.keys(data).length) {
    return NextResponse.json(
      { error: "No hay cambios para aplicar" },
      { status: 400 },
    );
  }

  const currentUser = await prisma.user.findUnique({
    where: { id },
    select: { role: true, active: true },
  });

  if (!currentUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (currentUser.role === "ADMIN" && data.role === "USER") {
    const activeAdminCount = await prisma.user.count({
      where: {
        id: { not: id },
        role: "ADMIN",
        active: true,
      },
    });

    if (activeAdminCount === 0) {
      return NextResponse.json(
        { error: "Debe existir al menos un administrador activo" },
        { status: 400 },
      );
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: userFields,
    });

    return NextResponse.json(user);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "No se pudo actualizar el usuario" },
      { status: 500 },
    );
  }
}