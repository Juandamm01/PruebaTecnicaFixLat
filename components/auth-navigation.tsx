"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function AuthNavigation() {
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link className="cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-zinc-950" href="/dashboard">
          Fixlat
        </Link>
        <nav className="flex items-center gap-5 text-sm text-zinc-600">
          <Link className="cursor-pointer transition hover:text-zinc-950" href="/dashboard">
            Dashboard
          </Link>
          <Link className="cursor-pointer transition hover:text-zinc-950" href="/board">
            Tablero
          </Link>
          {isAdmin ? (
            <Link className="cursor-pointer transition hover:text-zinc-950" href="/admin/users">
              Administración
            </Link>
          ) : null}
        </nav>
        <button
          className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
          onClick={() => signOut({ callbackUrl: "/login" })}
          type="button"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}