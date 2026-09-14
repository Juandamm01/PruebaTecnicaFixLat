"use client";

import { FormEvent, useState } from "react";

type UserRole = "ADMIN" | "USER";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
};

type UserForm = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

const emptyForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "USER",
};

async function readResponse(response: Response) {
  const data = (await response.json()) as AdminUser & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "No se pudo completar la operación");
  }

  return data;
}

export function UsersManager({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function openCreateModal() {
    setEditingUser(null);
    setForm(emptyForm);
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(user: AdminUser) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (!isSubmitting) {
      setIsModalOpen(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        editingUser ? `/api/users/${editingUser.id}` : "/api/users",
        {
          method: editingUser ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            editingUser
              ? { name: form.name, email: form.email, role: form.role }
              : form,
          ),
        },
      );
      const updatedUser = await readResponse(response);

      setUsers((currentUsers) =>
        editingUser
          ? currentUsers.map((user) =>
              user.id === updatedUser.id ? updatedUser : user,
            )
          : [updatedUser, ...currentUsers],
      );
      setIsModalOpen(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo completar la operación",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(user: AdminUser) {
    setPendingUserId(user.id);
    setError("");

    try {
      const response = await fetch(`/api/users/${user.id}/toggle-active`, {
        method: "PATCH",
      });
      const updatedUser = await readResponse(response);

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === updatedUser.id ? updatedUser : currentUser,
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cambiar el estado del usuario",
      );
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <section>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Administración
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-zinc-950">
            Usuarios
          </h1>
          <p className="mt-3 text-zinc-600">
            Gestiona accesos, roles y estados de las cuentas.
          </p>
        </div>
        <button
          className="cursor-pointer rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          onClick={openCreateModal}
          type="button"
        >
          Nuevo usuario
        </button>
      </div>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Nombre</th>
                <th className="px-5 py-4 font-semibold">Email</th>
                <th className="px-5 py-4 font-semibold">Rol</th>
                <th className="px-5 py-4 font-semibold">Estado</th>
                <th className="px-5 py-4 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4 font-medium text-zinc-900">{user.name}</td>
                  <td className="px-5 py-4 text-zinc-600">{user.email}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.role === "ADMIN"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        className="cursor-pointer font-medium text-blue-700 hover:text-blue-900 disabled:opacity-50"
                        disabled={pendingUserId === user.id || isSubmitting}
                        onClick={() => openEditModal(user)}
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        className="cursor-pointer font-medium text-zinc-600 hover:text-zinc-950 disabled:opacity-50"
                        disabled={pendingUserId === user.id || isSubmitting}
                        onClick={() => toggleActive(user)}
                        type="button"
                      >
                        {pendingUserId === user.id
                          ? "Guardando..."
                          : user.active
                            ? "Desactivar"
                            : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-zinc-950/40 px-6 py-8">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">
                  {editingUser ? "Editar usuario" : "Nuevo usuario"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {editingUser
                    ? "Actualiza los datos y el rol de la cuenta."
                    : "Crea una cuenta con acceso al espacio de trabajo."}
                </p>
              </div>
              <button
                className="cursor-pointer text-2xl leading-none text-zinc-400 hover:text-zinc-900"
                aria-label="Cerrar modal"
                onClick={closeModal}
                type="button"
              >
                ×
              </button>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-zinc-700">
                Nombre
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-zinc-300 px-3 font-normal text-zinc-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      name: event.target.value,
                    }))
                  }
                  required
                  value={form.name}
                />
              </label>
              <label className="block text-sm font-medium text-zinc-700">
                Email
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-zinc-300 px-3 font-normal text-zinc-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      email: event.target.value,
                    }))
                  }
                  required
                  type="email"
                  value={form.email}
                />
              </label>
              {!editingUser ? (
                <label className="block text-sm font-medium text-zinc-700">
                  Password
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-zinc-300 px-3 font-normal text-zinc-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        password: event.target.value,
                      }))
                    }
                    required
                    type="password"
                    value={form.password}
                  />
                </label>
              ) : null}
              <label className="block text-sm font-medium text-zinc-700">
                Rol
                <select
                  className="mt-2 h-11 w-full cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 font-normal text-zinc-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      role: event.target.value as UserRole,
                    }))
                  }
                  value={form.role}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:border-zinc-950 disabled:opacity-50"
                  disabled={isSubmitting}
                  onClick={closeModal}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="cursor-pointer rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}