import Link from "next/link";

export default function AdminPage() {
  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        Administración
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-zinc-950">
        Usuarios
      </h1>
      <p className="mt-3 max-w-xl text-zinc-600">
        Gestiona las cuentas y los permisos del espacio de trabajo.
      </p>
      <Link
        className="mt-6 inline-flex cursor-pointer rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        href="/admin/users"
      >
        Administrar usuarios
      </Link>
    </section>
  );
}