import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMinor, formatDate } from "@/lib/money";
import { toggleTask, addTask } from "@/lib/actions/crm";
import ProjectForm from "@/components/admin/ProjectForm";
import StatusPill from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, clients] = await Promise.all([
    prisma.clientProject.findUnique({
      where: { id },
      include: {
        client: true,
        tasks: { orderBy: [{ done: "asc" }, { priority: "asc" }, { dueAt: "asc" }] },
        timeEntries: { orderBy: { startedAt: "desc" }, take: 10 },
      },
    }),
    prisma.client.findMany({
      where: { archived: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true, currency: true },
    }),
  ]);

  if (!project) notFound();

  const open = project.tasks.filter((t) => !t.done);
  const done = project.tasks.filter((t) => t.done);
  const minutes = project.timeEntries.reduce((s, t) => s + t.minutes, 0);

  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/admin/projects" className="a-btn a-btn--sm a-btn--ghost" style={{ marginBottom: ".6rem" }}>
            ← All projects
          </Link>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-sub">
            <Link href={`/admin/clients/${project.clientId}`} className="a-link" style={{ fontWeight: 400 }}>
              {project.client.company ?? project.client.name}
            </Link>
            {project.dueAt && ` · due ${formatDate(project.dueAt)}`}
            {" · "}
            {open.length} open task{open.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="page-actions">
          <StatusPill status={project.status} />
          <Link href={`/admin/invoices/new?client=${project.clientId}`} className="a-btn">Invoice client</Link>
        </div>
      </header>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label">Budget</span>
          <span className="kpi-value">
            {project.budgetMinor ? formatMinor(project.budgetMinor, project.currency) : "—"}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Tasks done</span>
          <span className="kpi-value">
            {done.length}<span className="dim" style={{ fontSize: "1rem" }}> / {project.tasks.length}</span>
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Hours logged</span>
          <span className="kpi-value">{(minutes / 60).toFixed(1)}</span>
        </div>
      </div>

      <div className="split">
        <div className="stack-lg">
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Tasks</h2>
              <span className="dim" style={{ fontSize: ".72rem" }}>{open.length} open</span>
            </div>
            {project.tasks.length === 0 ? (
              <div className="empty">
                <strong>No tasks yet</strong>
                <span>Break the project into the smallest steps that can be finished in a day.</span>
              </div>
            ) : (
              <ul className="task-list">
                {[...open, ...done].map((t) => (
                  <li key={t.id} className={t.done ? "task task--done" : "task"}>
                    <form action={toggleTask}>
                      <input type="hidden" name="id" value={t.id} />
                      <button
                        type="submit"
                        className="task-check"
                        aria-label={t.done ? `Mark “${t.title}” as not done` : `Mark “${t.title}” as done`}
                      >
                        {t.done ? "✓" : ""}
                      </button>
                    </form>
                    <span className="task-title">{t.title}</span>
                    <span className="dim tiny">{t.dueAt ? formatDate(t.dueAt, { day: "numeric", month: "short" }) : ""}</span>
                    <span className={`prio prio--${t.priority}`} aria-hidden="true" />
                  </li>
                ))}
              </ul>
            )}
            <div className="panel-foot">
              <form action={addTask} className="add-task">
                <input type="hidden" name="projectId" value={project.id} />
                <input name="title" required placeholder="Add a task…" aria-label="New task" className="a-input" />
                <input name="dueAt" type="date" aria-label="Due date" className="a-input" style={{ maxWidth: "9.5rem" }} />
                <select name="priority" aria-label="Priority" className="a-select" style={{ maxWidth: "7rem" }} defaultValue="2">
                  <option value="1">High</option>
                  <option value="2">Normal</option>
                  <option value="3">Low</option>
                </select>
                <button type="submit" className="a-btn a-btn--sm">Add</button>
              </form>
            </div>
          </section>

          <ProjectForm
            clients={clients}
            defaultClientId={project.clientId}
            project={{
              id: project.id,
              name: project.name,
              clientId: project.clientId,
              status: project.status,
              budgetMinor: project.budgetMinor,
              currency: project.currency,
              startsAt: project.startsAt,
              dueAt: project.dueAt,
              notes: project.notes,
            }}
          />
        </div>

        <aside className="stack-lg">
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Time</h2>
            </div>
            {project.timeEntries.length === 0 ? (
              <div className="empty"><span>No time logged against this project.</span></div>
            ) : (
              <ul className="time-list">
                {project.timeEntries.map((t) => (
                  <li key={t.id}>
                    <span>{t.note ?? "—"}</span>
                    <span className="mono-num dim">{(t.minutes / 60).toFixed(1)}h</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="panel-foot">
              <Link href="/admin/finance" className="a-link tiny">Log time in Finance →</Link>
            </div>
          </section>
        </aside>
      </div>

      <style>{`
        .task-list { display: grid; }
        .task {
          display: grid;
          grid-template-columns: 1.6rem 1fr auto .6rem;
          gap: .6rem;
          align-items: center;
          padding: .6rem 1.1rem;
          border-bottom: 1px solid #efeadd;
          font-size: .84rem;
        }
        .task:last-child { border-bottom: 0; }
        .task--done .task-title { color: #9a9684; text-decoration: line-through; }
        .task-check {
          width: 20px; height: 20px;
          border: 1.5px solid #cdc5b3;
          border-radius: 4px;
          display: grid; place-items: center;
          font-size: .7rem; color: #fff;
          background: #fff;
        }
        .task--done .task-check { background: #4d7a3a; border-color: #4d7a3a; }
        .prio { width: 6px; height: 6px; border-radius: 50%; background: #cdc5b3; }
        .prio--1 { background: #96331f; }
        .prio--3 { background: #a7b79a; }
        .add-task { display: flex; gap: .35rem; flex-wrap: wrap; }
        .add-task .a-input { flex: 1; min-width: 10rem; min-height: 32px; font-size: .8rem; }
        .add-task .a-select { min-height: 32px; font-size: .78rem; }
        .time-list { display: grid; gap: .5rem; padding: 1rem 1.1rem; font-size: .8rem; }
        .time-list li { display: grid; grid-template-columns: 1fr auto; gap: .5rem; }
        .tiny { font-size: .7rem; }
      `}</style>
    </>
  );
}
