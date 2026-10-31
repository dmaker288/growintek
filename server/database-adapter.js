import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { AsyncLocalStorage } from "node:async_hooks";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const context = new AsyncLocalStorage();
function normalize(value) {
  if (typeof value === "bigint") return Number(value);
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normalize(v)]),
    );
  return value;
}
export function databaseAdapter(filename) {
  if (
    process.env.DATABASE_URL &&
    filename !== ":memory:" &&
    !process.env.FORCE_SQLITE
  ) {
    const prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        max: 3,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
      }),
    });
    const adapter = {
      provider: "postgresql",
      prisma,
      prepare(sql) {
        let index = 0;
        const ignored = /INSERT OR IGNORE/i.test(sql);
        const statement =
          sql
            .replace(/INSERT OR IGNORE/i, "INSERT")
            .replace(/\?/g, () => `$${++index}`) +
          (ignored ? " ON CONFLICT DO NOTHING" : "");
        async function execute(mode, args) {
          const client =
            context.getStore()?.adapter === adapter
              ? context.getStore().client
              : prisma;
          try {
            if (mode === "run")
              return {
                changes: await client.$executeRawUnsafe(statement, ...args),
              };
            const rows = normalize(
              await client.$queryRawUnsafe(statement, ...args),
            );
            return mode === "get" ? rows[0] : rows;
          } catch (e) {
            if (e.code === "P2010" && e.meta?.code === "23505")
              e.code = "SQLITE_CONSTRAINT_UNIQUE";
            throw e;
          }
        }
        return {
          get: (...args) => execute("get", args),
          all: (...args) => execute("all", args),
          run: (...args) => execute("run", args),
        };
      },
      transaction(fn) {
        return async (...args) => {
          if (context.getStore()?.adapter === adapter) return fn(...args);
          // Serialize CMS writes and worker claims across serverless instances.
          return prisma.$transaction(
            async (client) => {
              await client.$executeRaw`SELECT pg_advisory_xact_lock(74829301)`;
              return context.run({ adapter, client }, () => fn(...args));
            },
            { maxWait: 15000, timeout: 20000 },
          );
        };
      },
      close: () => prisma.$disconnect(),
    };
    return adapter;
  }
  if (process.env.VERCEL)
    throw new Error(
      "Vercel requires DATABASE_URL. Local SQLite is not persistent on Vercel.",
    );
  if (filename !== ":memory:")
    mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
  const raw = new Database(filename);
  raw.pragma("journal_mode = WAL");
  raw.pragma("foreign_keys = ON");
  raw.pragma("busy_timeout = 5000");
  let tail = Promise.resolve();
  const adapter = {
    provider: "sqlite",
    pragma: (...a) => raw.pragma(...a),
    exec: (...a) => raw.exec(...a),
    backup: (...a) => raw.backup(...a),
    close: () => raw.close(),
  };
  function exclusive(fn) {
    if (context.getStore()?.adapter === adapter)
      return Promise.resolve().then(fn);
    const result = tail.then(() => context.run({ adapter }, fn));
    tail = result.catch(() => {});
    return result;
  }
  adapter.prepare = (sql) => ({
    get: (...args) => exclusive(() => raw.prepare(sql).get(...args)),
    all: (...args) => exclusive(() => raw.prepare(sql).all(...args)),
    run: (...args) => exclusive(() => raw.prepare(sql).run(...args)),
  });
  adapter.transaction =
    (fn) =>
    (...args) =>
      context.getStore()?.adapter === adapter && context.getStore()?.transaction
        ? fn(...args)
        : exclusive(async () => {
            raw.exec("BEGIN IMMEDIATE");
            try {
              const result = await context.run(
                { adapter, transaction: true },
                () => fn(...args),
              );
              raw.exec("COMMIT");
              return result;
            } catch (e) {
              raw.exec("ROLLBACK");
              throw e;
            }
          });
  return adapter;
}
