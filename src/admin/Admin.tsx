import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Icon from "../components/Icon";
import Editor from "./Editor";
import { collectionNames, emptyRecord, money, totals, slugify } from "./fields";
import type { RecordData } from "./fields";
import "./admin.css";
type Session = { email: string; csrf: string };
type Request = (path: string, method?: string, body?: unknown) => Promise<any>;
const nav = [
  ["overview", "Overview", "globe"],
  ["posts", "Blog posts", "pen"],
  ["pages", "Pages", "code"],
  ["sections", "Homepage sections", "settings"],
  ["services", "Services", "settings"],
  ["portfolio", "Portfolio", "heart"],
  ["leads", "Leads", "megaphone"],
  ["clients", "Clients", "team"],
  ["invoices", "Invoices", "shield"],
  ["funds", "Funds", "globe"],
  ["transactions", "Funds ledger", "pen"],
  ["analytics", "Analytics", "globe"],
  ["seo", "SEO health", "search"],
  ["keywords", "Keyword research", "search"],
  ["ai", "AI publishing", "robot"],
  ["integrations", "Integrations", "settings"],
  ["settings", "Site settings", "settings"],
];
export default function Admin() {
  const [session, setSession] = useState<Session | null>(null),
    [checking, setChecking] = useState(true),
    [tab, setTab] = useState("overview"),
    [mobile, setMobile] = useState(false),
    [notice, setNotice] = useState(""),
    [version, setVersion] = useState(0);
  useEffect(() => {
    fetch("/api/admin/session")
      .then(async (r) => {
        const data = await r.json();
        return r.ok ? data : null;
      })
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setChecking(false));
  }, []);
  const request = useCallback<Request>(
    async (path, method = "GET", body) => {
      const r = await fetch(`/api/admin/${path}`, {
        method,
        headers: {
          ...(body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }),
          ...(session ? { "x-csrf-token": session.csrf } : {}),
        },
        ...(body !== undefined
          ? { body: body instanceof FormData ? body : JSON.stringify(body) }
          : {}),
      });
      const data = r.status === 204 ? null : await r.json();
      if (r.status === 401) {
        setSession(null);
        throw new Error("Your session expired. Sign in again.");
      }
      if (!r.ok)
        throw new Error(data?.error || "The request failed. Please try again.");
      return data;
    },
    [session],
  );
  function toast(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(""), 5000);
  }
  if (checking)
    return (
      <div className="admin-login">
        <p>Checking your secure session…</p>
      </div>
    );
  if (!session) return <Login onLogin={setSession} />;
  function navigate(id: string) {
    setTab(id);
    setMobile(false);
    setVersion((v) => v + 1);
  }
  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${mobile ? "open" : ""}`}>
        <a className="brand" href="/">
          <img
            className="admin-flat-logo"
            src="/images/growintek-flat.png"
            width="180"
            height="60"
            alt="Growintek Solutions"
          />
        </a>
        <span className="sidebar-caption">YOUR BUSINESS, CONNECTED</span>
        <nav aria-label="Admin navigation">
          {nav.map(([id, label, icon]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => navigate(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <Icon name={icon as "globe"} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <a href="/" target="_blank" rel="noreferrer">
            View website ↗
          </a>
          <span>{session.email}</span>
          <button
            onClick={async () => {
              try {
                await request("logout", "POST", {});
                setSession(null);
              } catch (e) {
                toast(String(e));
              }
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-mobile-toggle"
            aria-label="Toggle admin navigation"
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            <Icon name={mobile ? "close" : "menu"} />
          </button>
          <div>
            <span>GROWINTEK WORKSPACE</span>
            <strong>{nav.find((n) => n[0] === tab)?.[1]}</strong>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="admin-btn secondary"
          >
            View website ↗
          </a>
        </header>
        <main className="admin-content" key={`${tab}-${version}`}>
          {Object.hasOwn(collectionNames, tab) ? (
            <Collection kind={tab} request={request} toast={toast} />
          ) : tab === "overview" ? (
            <Overview request={request} navigate={navigate} />
          ) : tab === "settings" ? (
            <Settings request={request} toast={toast} />
          ) : tab === "integrations" ? (
            <Integrations request={request} toast={toast} />
          ) : tab === "seo" ? (
            <SEOHealth request={request} toast={toast} />
          ) : tab === "analytics" ? (
            <Analytics request={request} />
          ) : tab === "funds" ? (
            <Funds request={request} navigate={navigate} />
          ) : tab === "ai" ? (
            <Publishing request={request} toast={toast} navigate={navigate} />
          ) : null}
        </main>
      </div>
      {notice ? (
        <div className="admin-toast" role="status">
          {notice}
        </div>
      ) : null}
    </div>
  );
}
function Login({ onLogin }: { onLogin: (s: Session) => void }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      onLogin(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-login">
      <a href="/" className="login-brand">
        <img
          src="/images/growintek-flat.png"
          alt="Growintek Solutions"
          width="190"
          height="63"
        />
      </a>
      <div className="login-panel">
        <span className="admin-eyebrow">YOUR STUDIO, CONNECTED</span>
        <h1>Welcome back.</h1>
        <p>Sign in to manage your website and business.</p>
        <form onSubmit={submit}>
          <label>
            Email address
            <input type="email" name="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              minLength={1}
            />
          </label>
          {error ? (
            <p className="admin-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="admin-btn primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in securely"} <Icon name="arrow" />
          </button>
        </form>
        <p className="login-help">
          Administrator accounts are created by the site owner. Contact your
          administrator if you need access.
        </p>
      </div>
      <a href="/">← Back to the website</a>
    </main>
  );
}
function useResource(path: string, request: Request) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    setLoading(true);
    setError("");
    return request(path)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [path, request]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { data, error, loading, reload, setData };
}
function LoadState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string;
  retry?: () => void;
}) {
  return loading ? (
    <div className="admin-empty">Loading your workspace…</div>
  ) : error ? (
    <div className="admin-error" role="alert">
      {error}
      {retry ? (
        <button className="admin-link" onClick={retry}>
          Try again
        </button>
      ) : null}
    </div>
  ) : null;
}
function PageTitle({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="admin-page-title">
      <div>
        <span className="admin-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
function Badge({ status }: { status: string }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}
function Overview({
  request,
  navigate,
}: {
  request: Request;
  navigate: (s: string) => void;
}) {
  const { data, error, loading, reload } = useResource("overview", request);
  return (
    <>
      <PageTitle
        eyebrow="A CLEARER PICTURE"
        title="Let’s move your business forward."
        description="Your content, client conversations and next steps in one place."
      >
        <button className="admin-btn primary" onClick={() => navigate("posts")}>
          Manage content <Icon name="arrow" />
        </button>
      </PageTitle>
      <LoadState loading={loading} error={error} retry={reload} />
      {data ? (
        <>
          <div className="metric-grid">
            {[
              [
                "New conversations",
                data.counts.leads,
                "All recorded leads",
                "leads",
              ],
              [
                "Qualified opportunities",
                data.counts.qualified,
                "Qualified, proposal or won",
                "leads",
              ],
              [
                "Active clients",
                data.counts.clients,
                "Client relationships",
                "clients",
              ],
              [
                "Published insights",
                data.counts.published,
                `${data.counts.review} awaiting review`,
                "posts",
              ],
            ].map(([label, value, sub, tab]) => (
              <button
                className="metric-card"
                key={label}
                onClick={() => navigate(String(tab))}
              >
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{sub}</small>
              </button>
            ))}
          </div>
          <div className="overview-grid">
            <section className="admin-panel">
              <div className="panel-heading">
                <h2>Recent conversations</h2>
                <button
                  className="admin-link"
                  onClick={() => navigate("leads")}
                >
                  View all →
                </button>
              </div>
              {data.recentLeads.length ? (
                data.recentLeads.map((l: RecordData) => (
                  <div className="recent-row" key={l.id}>
                    <span className="record-avatar">{l.name[0]}</span>
                    <div>
                      <strong>{l.name}</strong>
                      <span>{l.company || l.email}</span>
                    </div>
                    <Badge status={l.status} />
                  </div>
                ))
              ) : (
                <div className="admin-empty">
                  <Icon name="megaphone" />
                  <h3>Your next conversation starts here.</h3>
                  <p>
                    Inquiries from the website contact form will appear here
                    automatically.
                  </p>
                  <a
                    href="/contact"
                    className="admin-link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open the contact page ↗
                  </a>
                </div>
              )}
            </section>
            <section className="admin-panel next-steps">
              <span className="admin-eyebrow">MAKE IT YOURS</span>
              <h2>
                A strong foundation.
                <br />
                Ready for your next move.
              </h2>
              <p>
                Connect your tools, confirm your business details and build a
                useful content plan.
              </p>
              {[
                ["settings", "Confirm website & legal details"],
                ["integrations", "Connect analytics and search tools"],
                ["keywords", "Plan your next helpful article"],
              ].map(([id, t]) => (
                <button key={id} onClick={() => navigate(id)}>
                  {t}
                  <Icon name="arrow" />
                </button>
              ))}
            </section>
          </div>
          <section className="admin-panel">
            <div className="panel-heading">
              <h2>Recent activity</h2>
              <span className="subtle">Administrative audit trail</span>
            </div>
            {data.activity.length ? (
              <div className="activity-list">
                {data.activity.map((a: RecordData, i: number) => (
                  <div key={i}>
                    <span>{a.action}</span>
                    <strong>{a.target}</strong>
                    <time>{new Date(a.created_at).toLocaleString()}</time>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-empty">
                Changes to your workspace will appear here.
              </p>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
function Collection({
  kind,
  request,
  toast,
}: {
  kind: string;
  request: Request;
  toast: (m: string) => void;
}) {
  const { data, error, loading, reload } = useResource(
      `content/${kind}`,
      request,
    ),
    [editing, setEditing] = useState<RecordData | null>(null),
    [saving, setSaving] = useState(false),
    [saveError, setSaveError] = useState(""),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [clients, setClients] = useState<RecordData[]>([]),
    [printInvoice, setPrintInvoice] = useState<RecordData | null>(null);
  useEffect(() => {
    if (kind === "invoices")
      request("content/clients")
        .then(setClients)
        .catch((e) => setSaveError(e.message));
  }, [kind, request]);
  async function save(d: RecordData) {
    setSaving(true);
    setSaveError("");
    try {
      await request(
        `content/${kind}${d.id ? `/${d.id}` : ""}`,
        d.id ? "PUT" : "POST",
        d,
      );
      setEditing(null);
      await reload();
      toast("Changes saved.");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setSaving(false);
    }
  }
  async function remove(d: RecordData) {
    if (
      !confirm(
        `Delete “${d.title || d.name || d.number}”? This permanently removes the record.`,
      )
    )
      return;
    try {
      await request(`content/${kind}/${d.id}`, "DELETE", {
        revision: d.revision,
      });
      await reload();
      toast("Record deleted.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Unable to delete.");
    }
  }
  if (editing)
    return (
      <Editor
        key={editing.id || "new"}
        kind={kind}
        initial={editing}
        clients={clients}
        onSave={save}
        onCancel={() => {
          setEditing(null);
          setSaveError("");
        }}
        saving={saving}
        error={saveError}
        uploadImage={async (file) => {
          const form = new FormData();
          form.append("image", file);
          const result = await request("media", "POST", form);
          return result.url;
        }}
      />
    );
  const rows = (data || []).filter(
    (d: RecordData) =>
      (status === "all" || d.status === status) &&
      [d.title, d.name, d.email, d.company, d.number, d.keyword]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        eyebrow="YOUR WORKSPACE"
        title={collectionNames[kind]}
        description={
          {
            posts:
              "Ideas, drafts and published insights. Make every article useful.",
            pages:
              "Edit your public pages and policies with clear publication controls.",
            services: "Keep your capabilities and deliverables up to date.",
            sections:
              "Edit the questions, industries, delivery steps and reasons to choose Growintek.",
            transactions:
              "Record income and expenses in USD, PKR and other supported currencies.",
            portfolio:
              "Show your work with context, permission and accurate descriptions.",
            leads: "Turn new conversations into the right opportunities.",
            clients: "Keep client and billing details in one place.",
            invoices:
              "Create itemized invoices, track status and print a clean copy.",
            keywords:
              "Build an evidence-based topic plan. AI ideas are hypotheses, not search-volume data.",
          }[kind] || ""
        }
      >
        <button
          className="admin-btn primary"
          onClick={() => {
            setSaveError("");
            setEditing(emptyRecord(kind));
          }}
        >
          + Create{" "}
          {kind === "posts"
            ? "post"
            : kind === "keywords"
              ? "topic"
              : kind === "portfolio"
                ? "project"
                : kind.slice(0, -1)}
        </button>
      </PageTitle>
      <LoadState loading={loading} error={error} retry={reload} />
      {data ? (
        <section className="admin-panel collection-panel">
          <div className="collection-toolbar">
            <label className="admin-search">
              <Icon name="search" />
              <input
                placeholder={`Search ${collectionNames[kind].toLowerCase()}…`}
                aria-label={`Search ${collectionNames[kind]}`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              {[
                ...new Set<string>(
                  data.map((d: RecordData) => String(d.status)),
                ),
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <span className="subtle">{rows.length} records</span>
          </div>
          {rows.length ? (
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>
                      {kind === "invoices"
                        ? "Invoice"
                        : kind === "leads" || kind === "clients"
                          ? "Contact"
                          : "Title"}
                    </th>
                    <th>
                      {kind === "invoices"
                        ? "Client & amount"
                        : kind === "keywords"
                          ? "Market / position"
                          : "Details"}
                    </th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d: RecordData) => (
                    <tr key={d.id}>
                      <td>
                        <button
                          className="record-title"
                          onClick={() => setEditing(d)}
                        >
                          {d.title || d.name || d.number}
                        </button>
                        <small>
                          {d.slug?.includes("-") &&
                          ["posts", "pages", "services", "portfolio"].includes(
                            kind,
                          )
                            ? `/${kind === "posts" ? "blog" : kind === "pages" ? "" : kind}${kind === "pages" ? "" : "/"}${d.slug}`
                            : d.email || ""}
                        </small>
                      </td>
                      <td>
                        {kind === "invoices" ? (
                          <>
                            <span>
                              {clients.find((c) => c.id === d.clientId)
                                ?.company ||
                                clients.find((c) => c.id === d.clientId)
                                  ?.name ||
                                "Client"}
                            </span>
                            <small>{money(totals(d).total, d.currency)}</small>
                          </>
                        ) : kind === "transactions" ? (
                          <>
                            <span>
                              {money(d.amount, d.currency)} · {d.type}
                            </span>
                            <small>
                              {d.category} · {d.date}
                            </small>
                          </>
                        ) : kind === "sections" ? (
                          <>
                            <span>{d.group}</span>
                            <small>Display order: {d.order}</small>
                          </>
                        ) : kind === "keywords" ? (
                          <>
                            <span>{d.market}</span>
                            <small>
                              {d.position
                                ? `Observed position ${d.position}`
                                : "No ranking observation"}
                            </small>
                          </>
                        ) : (
                          <>
                            <span>
                              {d.category || d.company || d.service || "—"}
                            </span>
                            {d.aiGenerated ? (
                              <small>
                                AI-assisted · {d.reviewer || "Needs review"}
                              </small>
                            ) : null}
                          </>
                        )}
                      </td>
                      <td>
                        <Badge status={d.status} />
                      </td>
                      <td className="nowrap">
                        {new Date(d.updatedAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            onClick={() => {
                              setSaveError("");
                              setEditing(d);
                            }}
                          >
                            Edit
                          </button>
                          {kind === "invoices" ? (
                            <button onClick={() => setPrintInvoice(d)}>
                              Print
                            </button>
                          ) : null}
                          <button className="danger" onClick={() => remove(d)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-empty">
              <Icon
                name={
                  kind === "invoices"
                    ? "shield"
                    : kind === "leads"
                      ? "team"
                      : "pen"
                }
              />
              <h3>
                {query || status !== "all"
                  ? "No matching records."
                  : "A clean slate for what’s next."}
              </h3>
              <p>
                {kind === "leads"
                  ? "Website inquiries are saved here. You can also add a lead manually."
                  : `Create your first ${kind === "keywords" ? "researched topic" : "record"} to get started.`}
              </p>
            </div>
          )}
        </section>
      ) : null}
      {printInvoice ? (
        <InvoicePrint
          invoice={printInvoice}
          client={clients.find((c) => c.id === printInvoice.clientId)}
          onClose={() => setPrintInvoice(null)}
          request={request}
        />
      ) : null}
    </>
  );
}
function InvoicePrint({
  invoice,
  client,
  onClose,
  request,
}: {
  invoice: RecordData;
  client?: RecordData;
  onClose: () => void;
  request: Request;
}) {
  const { data } = useResource("settings", request);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items =
          dialog.current?.querySelectorAll<HTMLButtonElement>("button");
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [onClose]);
  const sum = totals(invoice);
  return (
    <div
      className="invoice-overlay"
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label="Invoice print preview"
    >
      <div className="invoice-preview">
        <div className="invoice-print-actions">
          <button className="admin-btn secondary" onClick={onClose}>
            Close preview
          </button>
          <button
            className="admin-btn primary"
            disabled={!data}
            onClick={() => window.print()}
          >
            Print / Save PDF
          </button>
        </div>
        <div className="invoice-heading">
          <div>
            <strong>{data?.legalName || "Growintek"}</strong>
            <p>{data?.email}</p>
            <p>{data?.country}</p>
          </div>
          <div>
            <h1>Invoice</h1>
            <p>{invoice.number}</p>
            <Badge status={invoice.status} />
          </div>
        </div>
        <div className="invoice-parties">
          <div>
            <span>BILL TO</span>
            <h2>{client?.company || client?.name}</h2>
            <p>{client?.name}</p>
            <p>{client?.email}</p>
            <p className="preserve-lines">{client?.address}</p>
            <p>{client?.country}</p>
          </div>
          <div>
            <span>PAYMENT DUE</span>
            <h2>{new Date(invoice.dueDate).toLocaleDateString()}</h2>
            <p>Currency: {invoice.currency}</p>
          </div>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((i: RecordData, n: number) => (
              <tr key={n}>
                <td>{i.description}</td>
                <td>{i.quantity}</td>
                <td>{money(i.unitPrice, invoice.currency)}</td>
                <td>
                  {money(
                    Math.round(i.quantity * i.unitPrice * 100) / 100,
                    invoice.currency,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="invoice-total">
          <span>Subtotal {money(sum.subtotal, invoice.currency)}</span>
          <span>
            Tax ({invoice.taxRate}%) {money(sum.tax, invoice.currency)}
          </span>
          <strong>Total due {money(sum.total, invoice.currency)}</strong>
        </div>
        <p className="invoice-notes preserve-lines">{invoice.notes}</p>
        <p className="subtle">Thank you for working with Growintek.</p>
      </div>
    </div>
  );
}
function Settings({
  request,
  toast,
}: {
  request: Request;
  toast: (s: string) => void;
}) {
  const { data, error, loading, reload, setData } = useResource(
      "settings",
      request,
    ),
    [saving, setSaving] = useState(false),
    [saveError, setSaveError] = useState("");
  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      await request("settings", "PUT", data);
      toast("Website settings saved.");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="THE DETAILS MATTER"
        title="Website settings"
        description="Confirm your business details, public profiles and editorial preferences."
      />
      <LoadState loading={loading} error={error} retry={reload} />
      {data ? (
        <form className="admin-panel settings-form" onSubmit={save}>
          <h2>Business & website</h2>
          <div className="editor-grid">
            {[
              ["brand", "Brand name"],
              ["legalName", "Legal business name"],
              ["email", "Business contact email"],
              ["country", "Legal jurisdiction / country"],
              ["gaId", "Google Analytics measurement ID"],
            ].map(([k, l]) => (
              <label key={k}>
                {l}
                <input
                  type={k === "email" ? "email" : "text"}
                  value={data[k]}
                  onChange={(e) => setData({ ...data, [k]: e.target.value })}
                  placeholder={k === "gaId" ? "G-XXXXXXXXXX" : undefined}
                />
              </label>
            ))}
          </div>
          <p className="field-help">
            The canonical production domain and all secret keys are configured
            on the server. Confirm legal copy against your actual operations
            before launch.
          </p>
          <h2>Public social profiles</h2>
          <div className="editor-grid">
            {["facebook", "instagram", "youtube"].map((k) => (
              <label key={k}>
                {k[0].toUpperCase() + k.slice(1)} profile URL
                <input
                  type="url"
                  value={data.social[k]}
                  onChange={(e) =>
                    setData({
                      ...data,
                      social: { ...data.social, [k]: e.target.value },
                    })
                  }
                />
              </label>
            ))}
          </div>
          <h2>Daily AI editorial workflow</h2>
          <div className="editor-grid">
            <label className="admin-check">
              <input
                type="checkbox"
                checked={data.aiEnabled}
                onChange={(e) =>
                  setData({ ...data, aiEnabled: e.target.checked })
                }
              />
              Enable one daily article from ready topics
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={data.aiApproval}
                onChange={(e) =>
                  setData({ ...data, aiApproval: e.target.checked })
                }
              />
              Require admin approval before publishing
            </label>
            <label>
              Daily generation hour (0–23)
              <input
                type="number"
                min="0"
                max="23"
                value={data.aiHour}
                onChange={(e) =>
                  setData({ ...data, aiHour: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Timezone
              <input
                value={data.aiTimezone}
                onChange={(e) =>
                  setData({ ...data, aiTimezone: e.target.value })
                }
              />
            </label>
            <label>
              Editorial byline
              <input
                required
                value={data.aiAuthor}
                onChange={(e) => setData({ ...data, aiAuthor: e.target.value })}
              />
            </label>
            <label>
              Analytics retention (days)
              <input
                type="number"
                min="30"
                max="730"
                value={data.retentionDays}
                onChange={(e) =>
                  setData({ ...data, retentionDays: Number(e.target.value) })
                }
              />
            </label>
            <label className="editor-wide">
              Editorial focus
              <textarea
                rows={3}
                value={data.aiTopics}
                onChange={(e) => setData({ ...data, aiTopics: e.target.value })}
              />
            </label>
          </div>
          {!data.aiApproval ? (
            <p className="admin-callout">
              Automatic publication uses source and duplicate checks, which
              cannot verify factual accuracy or guarantee originality. Articles
              disclose that no human review took place. You remain responsible
              for published content.
            </p>
          ) : null}
          <p className="field-help">
            On Vercel, the daily scheduler runs at 09:00 Asia/Karachi. A ready
            topic needs two researched sources. An empty queue is recorded as a
            job error.
          </p>
          {saveError ? (
            <p className="admin-error" role="alert">
              {saveError}
            </p>
          ) : null}
          <button className="admin-btn primary" disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </button>
        </form>
      ) : null}
    </>
  );
}
function Integrations({
  request,
  toast,
}: {
  request: Request;
  toast: (s: string) => void;
}) {
  const { data, error, loading, reload } = useResource("integrations", request),
    [busy, setBusy] = useState("");
  async function act(path: string) {
    setBusy(path);
    try {
      const r = await request(path, "POST", {});
      toast(
        r.message || "Social connection check finished. Review the feed state.",
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "Connection failed.");
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="CONNECTED WHEN YOU ARE"
        title="Your tools, working together."
        description="Credentials stay on the server. A configured connection still needs valid permissions and a successful live request."
      />
      <LoadState loading={loading} error={error} retry={reload} />
      {data ? (
        <div className="integration-grid">
          {data.map((i: RecordData) => (
            <section className="admin-panel integration-card" key={i.id}>
              <div className="integration-top">
                <span className="integration-mark">{i.name[0]}</span>
                <Badge status={i.configured ? "configured" : "unconfigured"} />
              </div>
              <h2>{i.name}</h2>
              <p>{i.detail}</p>
              {i.endpoint ? <p className="integration-endpoint">{i.endpoint}</p> : null}
              <div className="integration-requires">
                <span>SERVER CONFIGURATION</span>
                <code>{i.required}</code>
              </div>
              {i.id === "search-console" ? (
                <button
                  className="admin-btn secondary"
                  disabled={!i.configured || Boolean(busy)}
                  onClick={() => act("sitemap")}
                >
                  {busy === "sitemap" ? "Submitting…" : "Submit sitemap"}
                </button>
              ) : ["facebook", "instagram", "youtube"].includes(i.id) ? (
                <button
                  className="admin-btn secondary"
                  disabled={!i.configured || Boolean(busy)}
                  onClick={() => act("social-refresh")}
                >
                  {busy === "social-refresh" ? "Refreshing…" : "Refresh feeds"}
                </button>
              ) : null}
            </section>
          ))}
        </div>
      ) : null}
      <p className="admin-callout">
        No integration has a secret field in this browser. Add credentials to
        the server’s environment, restart the service, then run the relevant
        report or refresh. See the operations guide for account permissions.
      </p>
    </>
  );
}
function SEOHealth({
  request,
  toast,
}: {
  request: Request;
  toast: (s: string) => void;
}) {
  const { data, error, loading, reload } = useResource("audit", request),
    [onlyIssues, setOnlyIssues] = useState(true),
    [report, setReport] = useState<RecordData | null>(null),
    [reportError, setReportError] = useState(""),
    [busy, setBusy] = useState(false);
  async function loadReport() {
    setBusy(true);
    setReportError("");
    try {
      setReport(await request("search-console"));
    } catch (e) {
      setReportError(e instanceof Error ? e.message : "Could not load report.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="HEALTHY FOUNDATIONS"
        title="SEO health & search visibility"
        description="Find actionable content issues and inspect measured Google query performance."
      >
        <button
          className="admin-btn secondary"
          onClick={() => {
            void reload();
            toast("Checking current content and settings.");
          }}
        >
          Run audit again
        </button>
      </PageTitle>
      <LoadState loading={loading} error={error} retry={reload} />
      {data ? (
        <>
          <div className="audit-summary">
            <strong>
              {data.score}
              <small>/100</small>
            </strong>
            <div>
              <h2>Content & configuration checks</h2>
              <p>{data.scope}</p>
              <span className="subtle">
                Checked {new Date(data.checkedAt).toLocaleString()}
              </span>
            </div>
          </div>
          <section className="admin-panel">
            <div className="panel-heading">
              <h2>Audit findings</h2>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={onlyIssues}
                  onChange={(e) => setOnlyIssues(e.target.checked)}
                />
                Only show issues
              </label>
            </div>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th>Check</th>
                    <th>Status</th>
                    <th>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {data.findings
                    .filter((f: RecordData) => !onlyIssues || !f.pass)
                    .map((f: RecordData, i: number) => (
                      <tr key={i}>
                        <td>{f.path}</td>
                        <td>{f.check}</td>
                        <td>
                          <Badge
                            status={f.pass ? "passed" : "needs attention"}
                          />
                        </td>
                        <td>{f.detail}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {onlyIssues && !data.findings.some((f: RecordData) => !f.pass) ? (
              <p className="admin-empty">All checks in this audit passed.</p>
            ) : null}
          </section>
        </>
      ) : null}
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Search Console performance</h2>
            <p className="subtle">
              The latest available 28-day window, with a three-day reporting
              delay.
            </p>
          </div>
          <button
            className="admin-btn primary"
            disabled={busy}
            onClick={loadReport}
          >
            {busy ? "Loading…" : "Load Google data"}
          </button>
        </div>
        {reportError ? (
          <p className="admin-error" role="alert">
            {reportError}
          </p>
        ) : null}
        {report ? (
          <>
            <p className="field-help">
              {report.startDate} to {report.endDate}. {report.note}
            </p>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Query</th>
                    <th>Clicks</th>
                    <th>Impressions</th>
                    <th>CTR</th>
                    <th>Average position</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((r: RecordData, i: number) => (
                    <tr key={i}>
                      <td>{r.keys[0]}</td>
                      <td>{r.clicks}</td>
                      <td>{r.impressions}</td>
                      <td>{(r.ctr * 100).toFixed(1)}%</td>
                      <td>{r.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!report.rows.length ? (
              <p className="admin-empty">
                Google returned no query data for this period.
              </p>
            ) : null}
          </>
        ) : (
          <p className="admin-empty">
            Load your verified property’s real query data. No rankings are
            simulated.
          </p>
        )}
      </section>
    </>
  );
}
function Analytics({ request }: { request: Request }) {
  const { data, error, loading, reload } = useResource("overview", request),
    [google, setGoogle] = useState<RecordData | null>(null),
    [providerError, setProviderError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true);
    setProviderError("");
    try {
      setGoogle(await request("analytics"));
    } catch (e) {
      setProviderError(
        e instanceof Error ? e.message : "Could not load analytics.",
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => { void load(); }, []);
  const views = (data?.events || [])
    .filter((e: RecordData) => e.event === "pageview")
    .reduce((s: number, e: RecordData) => s + e.count, 0);
  return (
    <>
      <PageTitle
        eyebrow="EVIDENCE, NOT GUESSWORK"
        title="Website analytics"
        description="First-party events are collected only with visitor consent. Counts are not unique people or independently verified conversions."
      />
      <LoadState loading={loading} error={error} retry={reload} />
      {data ? (
        <>
          <div className="metric-grid analytics-metrics">
            <div className="metric-card">
              <span>Consented page views</span>
              <strong>{views}</strong>
              <small>All retained consented events</small>
            </div>
            <div className="metric-card">
              <span>Total inquiries</span>
              <strong>{data.counts.leads}</strong>
              <small>All saved contact records</small>
            </div>
            <div className="metric-card">
              <span>Qualified opportunities</span>
              <strong>{data.counts.qualified}</strong>
              <small>Qualified, proposal or won stages</small>
            </div>
          </div>
          <section className="admin-panel">
            <div className="panel-heading">
              <h2>Pages people are exploring</h2>
              <span className="subtle">Retained consented events</span>
            </div>
            {data.topPages.length ? (
              <div className="traffic-bars">
                {data.topPages.map((p: RecordData) => (
                  <div key={p.path}>
                    <span>{p.path}</span>
                    <meter
                      value={p.views}
                      max={Math.max(
                        ...data.topPages.map((p: RecordData) => p.views),
                      )}
                    >
                      {p.views}
                    </meter>
                    <strong>{p.views}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty">
                <h3>Your measurement starts with consent.</h3>
                <p>
                  Accepted analytics visits will populate this view. No sample
                  traffic is shown.
                </p>
              </div>
            )}
          </section>
        </>
      ) : null}
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Google Analytics 4</h2>
            <p className="subtle">
              28 days through yesterday · Your configured property
            </p>
          </div>
          <button className="admin-btn primary" onClick={load} disabled={busy}>
            {busy ? "Loading…" : "Load GA4 report"}
          </button>
        </div>
        {providerError ? (
          <p className="admin-error" role="alert">
            {providerError}
          </p>
        ) : null}
        {google ? (
          <>
          <div className="analytics-connection"><span className="status-dot"/><div><strong>Connected to Growintek · Property {google.propertyId}</strong><p>{google.serviceAccount}</p><p>{(google.streams || []).map((s: RecordData) => `${s.measurementId} · ${s.url}`).join(" / ")}</p></div><span>Updated {new Date(google.checkedAt).toLocaleTimeString()}</span></div>
          <div className="metric-grid analytics-google-metrics">{["Active users", "Sessions", "Page views", "Engaged sessions"].map((label, i) => <div className="metric-card" key={label}><span>{label}</span><strong>{Number(google.summary?.[i] || 0).toLocaleString()}</strong><small>Last 28 days · GA4</small></div>)}</div>
          <div className="analytics-detail-grid"><div className="analytics-realtime"><span className="status-dot"/><span>Active in the last 30 minutes</span><strong>{google.realtime ?? "Unavailable"}</strong><p>Reported by Google Analytics</p></div><div className="analytics-channels"><h3>How visitors find you</h3>{google.channels?.length ? google.channels.map((r: RecordData) => <div key={r.dimensionValues[0].value}><span>{r.dimensionValues[0].value}</span><strong>{r.metricValues[0].value} sessions</strong></div>) : <p>No channel data for this period yet.</p>}</div></div>
          {google.warnings?.map((w: string) => <p className="admin-callout" key={w}>{w}</p>)}
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Active users</th>
                  <th>Sessions</th>
                  <th>Page views</th>
                </tr>
              </thead>
              <tbody>
                {(google.rows || []).map((r: RecordData, i: number) => (
                  <tr key={i}>
                    <td>{r.dimensionValues[0].value}</td>
                    {r.metricValues.map((m: RecordData, j: number) => (
                      <td key={j}>{m.value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!google.rows?.length ? (
              <p className="admin-empty">
                No GA4 data returned for this period.
              </p>
            ) : null}
          </div>
          </>
        ) : (
          <p className="admin-empty">
            Connect a Google service account to view your property’s measured
            traffic.
          </p>
        )}
      </section>
    </>
  );
}
function Publishing({
  request,
  toast,
  navigate,
}: {
  request: Request;
  toast: (s: string) => void;
  navigate: (s: string) => void;
}) {
  const { data: jobs, error, loading, reload } = useResource("jobs", request),
    [topics, setTopics] = useState<RecordData[]>([]),
    [topic, setTopic] = useState(""),
    [ideas, setIdeas] = useState<RecordData[]>([]),
    [brief, setBrief] = useState(""),
    [busy, setBusy] = useState(""),
    [actionError, setActionError] = useState("");
  useEffect(() => {
    request("content/keywords")
      .then(setTopics)
      .catch((e) => setActionError(e.message));
  }, [request]);
  async function action(type: string) {
    setBusy(type);
    setActionError("");
    try {
      if (type === "run") {
        const r = await request("jobs/run", "POST", {});
        toast(r.message);
        await reload();
      } else if (type === "ideas") {
        const r = await request("keyword-ideas", "POST", { brief });
        setIdeas(r.ideas);
        toast(r.note);
      } else {
        const r = await request("generate", "POST", { topicId: topic });
        toast(r.message);
        await reload();
      }
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Unable to complete the request.",
      );
    } finally {
      setBusy("");
    }
  }
  async function saveIdea(idea: RecordData) {
    try {
      await request("content/keywords", "POST", {
        ...emptyRecord("keywords"),
        title: idea.title,
        slug: slugify(idea.title),
        intent: idea.intent,
        notes: idea.rationale,
        source: "ai-idea",
      });
      setIdeas((current) => current.filter((i) => i.title !== idea.title));
      toast(
        "Topic saved for research. Add verified sources before marking ready.",
      );
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Unable to save topic.");
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="A THOUGHTFUL EDITORIAL WORKFLOW"
        title="AI publishing studio"
        description="Research first. Draft with DashScope. Review for accuracy, originality and usefulness."
      >
        <button
          className="admin-btn secondary"
          onClick={() => navigate("settings")}
        >
          Schedule & approval settings
        </button>
        <button
          className="admin-btn primary"
          disabled={Boolean(busy)}
          onClick={() => action("run")}
        >
          {busy === "run" ? "Processing…" : "Process next job"}
        </button>
      </PageTitle>
      <div className="publishing-flow">
        {[
          "Research a topic",
          "Add verified sources",
          "Generate a draft",
          "Review & publish",
        ].map((s, i) => (
          <div key={s}>
            <span>{i + 1}</span>
            {s}
          </div>
        ))}
      </div>
      <div className="overview-grid">
        <section className="admin-panel">
          <h2>Discover useful topics</h2>
          <p className="field-help">
            AI suggestions do not include measured search volume or verified
            difficulty. Validate them against real demand.
          </p>
          <label className="admin-form-label">
            What should we explore?
            <textarea
              rows={4}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="For example: questions international B2B buyers ask before commissioning a website"
            />
          </label>
          <button
            className="admin-btn primary"
            disabled={Boolean(busy)}
            onClick={() => action("ideas")}
          >
            {busy === "ideas" ? "Researching ideas…" : "Suggest topic ideas"}
          </button>
        </section>
        <section className="admin-panel">
          <h2>Turn research into a draft</h2>
          <p className="field-help">
            Choose a ready topic with at least two source notes. A background
            job will generate and validate the article.
          </p>
          <label className="admin-form-label">
            Ready topic
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">Choose a researched topic</option>
              {topics
                .filter((t) => t.status === "ready")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </select>
          </label>
          <button
            className="admin-btn primary"
            disabled={!topic || Boolean(busy)}
            onClick={() => action("generate")}
          >
            {busy === "generate" ? "Queueing…" : "Generate article"}
          </button>
          <button
            className="admin-link block-link"
            onClick={() => navigate("keywords")}
          >
            Manage research & sources →
          </button>
        </section>
      </div>
      {actionError ? (
        <p className="admin-error" role="alert">
          {actionError}
        </p>
      ) : null}
      {ideas.length ? (
        <section className="admin-panel">
          <h2>Topic hypotheses</h2>
          <div className="idea-list">
            {ideas.map((i) => (
              <div key={i.title}>
                <div>
                  <Badge status={i.intent} />
                  <h3>{i.title}</h3>
                  <p>{i.rationale}</p>
                </div>
                <button
                  className="admin-btn secondary"
                  onClick={() => saveIdea(i)}
                >
                  Save for research
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <section className="admin-panel">
        <div className="panel-heading">
          <h2>Job history</h2>
          <button className="admin-link" onClick={() => reload()}>
            Refresh
          </button>
        </div>
        <LoadState loading={loading} error={error} retry={reload} />
        {jobs?.length ? (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Result / issue</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j: RecordData) => (
                  <tr key={j.id}>
                    <td>{j.kind}</td>
                    <td>
                      <Badge status={j.status} />
                    </td>
                    <td>{j.attempts}</td>
                    <td>
                      {j.error ||
                        j.data.result?.title ||
                        (j.status === "complete"
                          ? "Completed"
                          : "Waiting for worker")}
                      {j.status === "failed" ? (
                        <button
                          className="admin-link block-link"
                          onClick={async () => {
                            try {
                              await request(
                                `jobs/${encodeURIComponent(j.id)}/retry`,
                                "POST",
                                {},
                              );
                              await reload();
                              toast("Job queued for retry.");
                            } catch (e) {
                              toast(
                                e instanceof Error
                                  ? e.message
                                  : "Retry failed.",
                              );
                            }
                          }}
                        >
                          Retry job
                        </button>
                      ) : null}
                    </td>
                    <td>{new Date(j.updated_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !loading ? (
          <div className="admin-empty">
            <Icon name="robot" />
            <h3>Your editorial workflow is ready.</h3>
            <p>
              Connect your AI provider, add a researched topic and generate your
              first draft.
            </p>
          </div>
        ) : null}
      </section>
      <p className="admin-callout">
        Automated checks catch formatting problems, unapproved source URLs and
        substantial overlap with existing articles. They cannot guarantee
        factual accuracy, legal clearance, global originality or Google
        rankings. Automatic publication follows your saved approval preference.
      </p>
    </>
  );
}

function Funds({
  request,
  navigate,
}: {
  request: Request;
  navigate: (tab: string) => void;
}) {
  const { data, error, loading, reload } = useResource("funds", request);
  return (
    <>
      <PageTitle
        eyebrow="YOUR FINANCIAL PICTURE"
        title="Know where your money goes."
        description="Recorded income and expenses, with each currency kept separate."
      >
        <button
          className="admin-btn primary"
          onClick={() => navigate("transactions")}
        >
          Manage ledger
        </button>
      </PageTitle>
      <LoadState loading={loading} error={error} retry={reload} />
      {data ? (
        <>
          <div className="funds-currencies">
            {data.currencies.map((c: RecordData) => (
              <section className="admin-panel" key={c.currency}>
                <div className="panel-heading">
                  <h2>{c.currency}</h2>
                  <span className="status-badge">Recorded cash flow</span>
                </div>
                <div className="metric-grid">
                  <div className="metric-card">
                    <span>Income</span>
                    <strong>{money(c.income, c.currency)}</strong>
                  </div>
                  <div className="metric-card">
                    <span>Expenses</span>
                    <strong>{money(c.expenses, c.currency)}</strong>
                  </div>
                  <div className="metric-card">
                    <span>Net cash flow</span>
                    <strong>{money(c.balance, c.currency)}</strong>
                  </div>
                </div>
                <p>
                  Paid invoices: {money(c.paidInvoices, c.currency)} ·
                  Outstanding invoices: {money(c.outstanding, c.currency)}
                </p>
              </section>
            ))}
          </div>
          <div className="admin-panel">
            <h2>A clear record, without double counting.</h2>
            <p>
              Ledger totals include only recorded transactions. Invoice totals
              are shown separately. Marking an invoice paid does not create a
              ledger entry; record its payment when received.
            </p>
          </div>
        </>
      ) : null}
    </>
  );
}
