"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const inactiveMessage =
  "Tu cuenta está desactivada, contacta a un administrador";

export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(
    initialError === "CuentaDesactivada"
      ? inactiveMessage
      : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.ok) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setError(
      result?.error === inactiveMessage
        ? inactiveMessage
        : "Credenciales inválidas",
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="email">
          Email
        </label>
        <input
          className="h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          id="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="password">
          Contraseña
        </label>
        <div className="relative">
          <input
            className="h-11 w-full rounded-lg border border-zinc-300 px-3 pr-11 text-sm text-zinc-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            id="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-zinc-500 transition hover:text-zinc-900"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              {showPassword ? (
                <>
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </>
              ) : (
                <>
                  <path d="M3 3l18 18" />
                  <path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17.4 17.4 0 0 1-3.1 3.8M6.2 6.7C3.8 8.3 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="h-11 w-full cursor-pointer rounded-lg bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Validando..." : "Entrar"}
      </button>
    </form>
  );
}