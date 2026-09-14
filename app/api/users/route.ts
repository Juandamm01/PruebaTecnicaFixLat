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

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: userFields,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { name, email, password, role } = body as Record<string, unknown>;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password ||
    (role !== "ADMIN" && role !== "USER")
  ) {
    return NextResponse.json(
      { error: "Nombre, email, password y rol son obligatorios" },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "El email ya está registrado" },
      { status: 409 },
    );
  }

  const bcrypt = await import("bcryptjs");
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
      },
      select: userFields,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "No se pudo crear el usuario" },
      { status: 500 },
    );
  }
}