import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type LambdaEvent = unknown;
type LambdaContext = unknown;

type Metrics = {
  total: number;
  pendiente: number;
  enCurso: number;
  hecho: number;
};

const globalForPrisma = globalThis as typeof globalThis & {
  dashboardPrisma?: PrismaClient;
};

function getPrisma() {
  if (!globalForPrisma.dashboardPrisma) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    globalForPrisma.dashboardPrisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.dashboardPrisma;
}

export async function handler(
  event: LambdaEvent,
  context: LambdaContext,
) {
  void event;
  void context;

  const prisma = getPrisma();
  const groupedNotes = await prisma.note.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const metrics: Metrics = {
    total: groupedNotes.reduce((total, group) => total + group._count._all, 0),
    pendiente: 0,
    enCurso: 0,
    hecho: 0,
  };

  for (const group of groupedNotes) {
    if (group.status === "PENDIENTE") metrics.pendiente = group._count._all;
    if (group.status === "EN_CURSO") metrics.enCurso = group._count._all;
    if (group.status === "HECHO") metrics.hecho = group._count._all;
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metrics),
  };
}
