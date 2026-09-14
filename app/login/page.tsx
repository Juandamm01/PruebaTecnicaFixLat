import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-12">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Fixlat
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-950">
            Iniciar sesión
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Accede a tu espacio de trabajo.
          </p>
        </div>
        <LoginForm initialError={error} />
      </section>
    </main>
  );
}