import { prisma } from "@/lib/prisma";

type Metrics = {
  total: number;
  pendiente: number;
  enCurso: number;
  hecho: number;
};

async function getFallbackMetrics(): Promise<Metrics> {
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

  return metrics;
}

async function getMetrics(): Promise<Metrics> {
  const metricsUrl =
    process.env.LAMBDA_METRICS_URL ?? "http://127.0.0.1:3001/metrics";

  try {
    const response = await fetch(metricsUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Metrics Lambda returned ${response.status}`);
    }

    return (await response.json()) as Metrics;
  } catch {
    // Development fallback while SAM local is not running.
    return getFallbackMetrics();
  }
}

const metricCards = [
  {
    key: "total" as const,
    label: "Total",
    className: "border-zinc-200 bg-white text-zinc-950",
  },
  {
    key: "pendiente" as const,
    label: "Pendientes",
    className: "border-yellow-200 bg-yellow-50 text-yellow-950",
  },
  {
    key: "enCurso" as const,
    label: "En curso",
    className: "border-blue-200 bg-blue-50 text-blue-950",
  },
  {
    key: "hecho" as const,
    label: "Hechas",
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
];

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const metrics = await getMetrics();

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        Espacio de trabajo
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-zinc-950">Dashboard</h1>
      <p className="mt-3 max-w-xl text-zinc-600">
        Resumen de las notas del tablero compartido.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <article
            className={`rounded-xl border p-5 shadow-sm ${card.className}`}
            key={card.key}
          >
            <p className="text-sm font-medium opacity-70">{card.label}</p>
            <p className="mt-3 text-4xl font-semibold">{metrics[card.key]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}