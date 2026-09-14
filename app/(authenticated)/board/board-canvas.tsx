"use client";

import { PointerEvent, useRef, useState } from "react";

const canvasWidth = 2000;
const canvasHeight = 1500;
const noteWidth = 248;
const noteHeight = 242;

type NoteStatus = "PENDIENTE" | "EN_CURSO" | "HECHO";

type BoardNote = {
  id: string;
  title: string;
  text: string;
  status: NoteStatus;
  positionX: number;
  positionY: number;
  updatedAt: string;
};

type DragState = {
  id: string;
  offsetX: number;
  offsetY: number;
  previousX: number;
  previousY: number;
};

const statusStyles: Record<NoteStatus, string> = {
  PENDIENTE: "border-yellow-300 bg-yellow-100",
  EN_CURSO: "border-blue-300 bg-blue-100",
  HECHO: "border-emerald-300 bg-emerald-100",
};

function clampPosition(value: number, max: number) {
  return Math.min(Math.max(value, 0), max);
}

async function readResponse(response: Response) {
  const data = (await response.json()) as BoardNote & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "No se pudo completar la operación");
  }

  return data;
}

export function BoardCanvas({
  initialNotes,
}: {
  initialNotes: BoardNote[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);

  function updateNote(id: string, changes: Partial<BoardNote>) {
    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === id ? { ...note, ...changes } : note,
      ),
    );
  }

  function coordinatesForPointer(event: PointerEvent<HTMLDivElement>, currentDrag: DragState) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const bounds = canvas.getBoundingClientRect();
    return {
      x: clampPosition(
        event.clientX - bounds.left - currentDrag.offsetX,
        canvasWidth - noteWidth,
      ),
      y: clampPosition(
        event.clientY - bounds.top - currentDrag.offsetY,
        canvasHeight - noteHeight,
      ),
    };
  }

  function startDrag(
    event: PointerEvent<HTMLDivElement>,
    note: BoardNote,
  ) {
    if (event.button !== 0) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    event.preventDefault();
    const bounds = canvas.getBoundingClientRect();
    const currentDrag = {
      id: note.id,
      offsetX: event.clientX - bounds.left - note.positionX,
      offsetY: event.clientY - bounds.top - note.positionY,
      previousX: note.positionX,
      previousY: note.positionY,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag(currentDrag);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag) {
      return;
    }

    const coordinates = coordinatesForPointer(event, drag);
    if (coordinates) {
      updateNote(drag.id, {
        positionX: coordinates.x,
        positionY: coordinates.y,
      });
    }
  }

  async function finishDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag) {
      return;
    }

    const currentDrag = drag;
    const coordinates = coordinatesForPointer(event, currentDrag);
    setDrag(null);

    if (!coordinates) {
      return;
    }

    updateNote(currentDrag.id, {
      positionX: coordinates.x,
      positionY: coordinates.y,
    });

    try {
      const response = await fetch(`/api/notes/${currentDrag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionX: coordinates.x,
          positionY: coordinates.y,
        }),
      });
      const updatedNote = await readResponse(response);
      updateNote(currentDrag.id, updatedNote);
    } catch (requestError) {
      updateNote(currentDrag.id, {
        positionX: currentDrag.previousX,
        positionY: currentDrag.previousY,
      });
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo guardar la posición",
      );
    }
  }

  async function createNote() {
    setCreating(true);
    setError("");

    try {
      const response = await fetch("/api/notes", { method: "POST" });
      const note = await readResponse(response);
      setNotes((currentNotes) => [note, ...currentNotes]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo crear la nota",
      );
    } finally {
      setCreating(false);
    }
  }

  async function saveNote(note: BoardNote) {
    const previousNote = notes.find((currentNote) => currentNote.id === note.id);
    if (!previousNote) {
      return;
    }

    setError("");
    setSavingIds((currentIds) => new Set(currentIds).add(note.id));

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: note.title,
          text: note.text,
          status: note.status,
        }),
      });
      const updatedNote = await readResponse(response);
      updateNote(note.id, updatedNote);
    } catch (requestError) {
      updateNote(note.id, previousNote);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo guardar la nota",
      );
    } finally {
      setSavingIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(note.id);
        return nextIds;
      });
    }
  }

  async function deleteNote(note: BoardNote) {
    if (!window.confirm("¿Eliminar esta nota?")) {
      return;
    }

    setError("");
    setDeletingIds((currentIds) => new Set(currentIds).add(note.id));
    setNotes((currentNotes) =>
      currentNotes.filter((currentNote) => currentNote.id !== note.id),
    );

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "No se pudo eliminar la nota");
      }
    } catch (requestError) {
      setNotes((currentNotes) => [note, ...currentNotes]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo eliminar la nota",
      );
    } finally {
      setDeletingIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(note.id);
        return nextIds;
      });
    }
  }

  return (
    <section className="-mx-6 -my-10 min-h-[calc(100vh-4rem)] bg-[#e8eef2] px-6 py-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Espacio compartido
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-zinc-950">
              Tablero
            </h1>
            <p className="mt-3 text-zinc-600">
              Arrastra las notas desde su encabezado y guarda sus cambios.
            </p>
          </div>
          <button
            className="cursor-pointer rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={creating}
            onClick={createNote}
            type="button"
          >
            {creating ? "Creando..." : "+ Nueva nota"}
          </button>
        </div>

        {error ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-7 max-h-[calc(100vh-230px)] overflow-auto rounded-2xl border border-zinc-300 bg-[#d8e1e6] shadow-inner">
          <div
            className="relative"
            ref={canvasRef}
            style={{ width: canvasWidth, height: canvasHeight }}
          >
            {notes.map((note) => (
              <article
                className={`absolute flex flex-col rounded-xl border p-4 shadow-lg transition-shadow ${statusStyles[note.status]} ${drag?.id === note.id ? "z-10 shadow-2xl" : ""}`}
                key={note.id}
                style={{
                  left: note.positionX,
                  top: note.positionY,
                  width: noteWidth,
                  minHeight: noteHeight,
                }}
              >
                <div
                  className="mb-3 flex cursor-grab touch-none items-center justify-between border-b border-black/10 pb-2 active:cursor-grabbing"
                  onPointerDown={(event) => startDrag(event, note)}
                  onPointerMove={moveDrag}
                  onPointerUp={finishDrag}
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-black/45">
                    Arrastrar
                  </span>
                  <button
                    aria-label="Eliminar nota"
                    className="cursor-pointer rounded p-1 text-black/45 transition hover:bg-black/10 hover:text-red-700 disabled:opacity-40"
                    disabled={deletingIds.has(note.id)}
                    onClick={() => deleteNote(note)}
                    onPointerDown={(event) => event.stopPropagation()}
                    title="Eliminar nota"
                    type="button"
                  >
                    <span aria-hidden="true">🗑</span>
                  </button>
                </div>
                <input
                  className="mb-2 w-full border-0 bg-transparent p-0 text-base font-bold text-zinc-900 outline-none placeholder:text-black/40"
                  onChange={(event) => updateNote(note.id, { title: event.target.value })}
                  placeholder="Título"
                  value={note.title}
                />
                <textarea
                  className="min-h-24 flex-1 resize-none border-0 bg-transparent p-0 text-sm leading-6 text-zinc-800 outline-none placeholder:text-black/40"
                  onChange={(event) => updateNote(note.id, { text: event.target.value })}
                  placeholder="Escribe una nota..."
                  value={note.text}
                />
                <div className="mt-3 flex items-center gap-2 border-t border-black/10 pt-3">
                  <select
                    aria-label="Estado de la nota"
                    className="min-w-0 flex-1 cursor-pointer rounded-md border border-black/10 bg-white/40 px-2 py-1.5 text-xs font-semibold text-zinc-800 outline-none"
                    onChange={(event) =>
                      updateNote(note.id, {
                        status: event.target.value as NoteStatus,
                      })
                    }
                    value={note.status}
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN_CURSO">En curso</option>
                    <option value="HECHO">Hecho</option>
                  </select>
                  <button
                    className="cursor-pointer rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={savingIds.has(note.id)}
                    onClick={() => saveNote(note)}
                    type="button"
                  >
                    {savingIds.has(note.id) ? "..." : "Guardar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}