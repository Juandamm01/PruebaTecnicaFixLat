import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user.role === "ADMIN";
}

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await context.params;
  const currentUser = await prisma.user.findUnique({
    where: { id },
    select: { role: true, active: true },
  });

  if (!currentUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (currentUser.active && currentUser.role === "ADMIN") {
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

  const user = await prisma.user.update({
    where: { id },
    data: { active: !currentUser.active },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}