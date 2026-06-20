import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const PAGE_SIZE = 50;

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; type?: string; severity?: string; page?: string }>;
}) {
  await requireAdmin();

  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const type = (sp.type ?? "").trim();
  const severity = (sp.severity ?? "").trim();
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const where = {
    ...(type ? { type } : {}),
    ...(severity ? { severity: severity as any } : {}),
    ...(q
      ? {
          OR: [
            { message: { contains: q, mode: "insensitive" as const } },
            { type: { contains: q, mode: "insensitive" as const } },
            { user: { username: { contains: q, mode: "insensitive" as const } } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  let total = 0;
  let logs: Array<{
    id: string;
    createdAt: Date;
    severity: "INFO" | "WARN" | "ERROR";
    type: string;
    message: string;
    ip: string | null;
    userAgent: string | null;
    metadata: unknown;
    user: { id: string; username: string; email: string } | null;
  }> = [];

  let tableMissing = false;
  try {
    const res = await Promise.all([
      prisma.eventLog.count({ where }),
      prisma.eventLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
        select: {
          id: true,
          createdAt: true,
          severity: true,
          type: true,
          message: true,
          ip: true,
          userAgent: true,
          metadata: true,
          user: { select: { id: true, username: true, email: true } },
        },
      }),
    ]);
    total = res[0];
    logs = res[1] as any;
  } catch (e) {
    // Prisma error P2021: table does not exist (db push not applied yet).
    if (e && typeof e === "object" && "code" in e && (e as any).code === "P2021") {
      tableMissing = true;
    } else {
      throw e;
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">System Logs</h1>
          <p className="mt-2 text-muted">
            Événements internes (connexion, profil, transactions, erreurs).
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-border bg-surface px-5 py-2 text-sm font-medium transition-colors hover:bg-border/40"
        >
          ← Admin
        </Link>
      </div>

      {tableMissing ? (
        <div className="mt-10 rounded-2xl border border-border bg-surface p-8">
          <h2 className="font-serif text-2xl font-semibold">Logs non initialisés</h2>
          <p className="mt-3 text-muted">
            La table <span className="font-mono">EventLog</span> n’existe pas encore dans la base de
            données. Appliquez le schéma Prisma, puis rechargez cette page.
          </p>
          <div className="mt-6 rounded-xl border border-border bg-background p-5 text-sm">
            <p className="font-medium">Commandes à exécuter</p>
            <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs text-muted">{`npm run db:push
npm run db:generate`}</pre>
          </div>
        </div>
      ) : null}

      {!tableMissing ? (
      <form method="get" className="mt-10 rounded-2xl border border-border bg-surface p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-sm font-medium">Recherche</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="type, message, user..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Type (exact)</span>
            <input
              name="type"
              defaultValue={type}
              placeholder="auth.login_failed"
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Sévérité</span>
            <select
              name="severity"
              defaultValue={severity}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            >
              <option value="">Toutes</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </label>

          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="w-full rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Filtrer
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted">
          Résultats: {total} • Page {page} / {totalPages}
        </p>
      </form>
      ) : null}

      {!tableMissing ? (
      <div className="mt-10 space-y-4">
        {logs.map((l) => (
          <article key={l.id} className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
                  {l.severity}
                </span>
                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
                  {l.type}
                </span>
                <span className="text-xs text-muted">{new Date(l.createdAt).toLocaleString("fr-CA")}</span>
              </div>
              <div className="text-xs text-muted">
                {l.user ? `${l.user.username} (${l.user.email})` : "—"}
              </div>
            </div>

            <p className="mt-4 text-sm text-foreground">{l.message}</p>

            <div className="mt-4 grid gap-2 text-xs text-muted sm:grid-cols-2">
              <div>
                <span className="font-medium text-foreground">IP:</span> {l.ip ?? "—"}
              </div>
              <div className="truncate">
                <span className="font-medium text-foreground">UA:</span> {l.userAgent ?? "—"}
              </div>
            </div>

            {l.metadata ? (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium">Metadata</summary>
                <pre className="mt-2 overflow-auto rounded-xl border border-border bg-background p-4 text-xs text-muted">
{JSON.stringify(l.metadata, null, 2)}
                </pre>
              </details>
            ) : null}
          </article>
        ))}
      </div>
      ) : null}

      {!tableMissing ? (
      <div className="mt-10 flex items-center justify-between">
        <div className="text-xs text-muted">
          Page {page} / {totalPages}
        </div>
        <div className="flex gap-2">
          {prev ? (
            <a
              href={`/admin/logs?page=${prev}${q ? `&q=${encodeURIComponent(q)}` : ""}${
                type ? `&type=${encodeURIComponent(type)}` : ""
              }${severity ? `&severity=${encodeURIComponent(severity)}` : ""}`}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:bg-background"
            >
              Précédent
            </a>
          ) : (
            <span className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium opacity-50">
              Précédent
            </span>
          )}

          {next ? (
            <a
              href={`/admin/logs?page=${next}${q ? `&q=${encodeURIComponent(q)}` : ""}${
                type ? `&type=${encodeURIComponent(type)}` : ""
              }${severity ? `&severity=${encodeURIComponent(severity)}` : ""}`}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:bg-background"
            >
              Suivant
            </a>
          ) : (
            <span className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium opacity-50">
              Suivant
            </span>
          )}
        </div>
      </div>
      ) : null}
    </div>
  );
}

