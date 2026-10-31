CREATE TABLE "rate_limits" ("id" TEXT NOT NULL PRIMARY KEY,"hits" INTEGER NOT NULL,"reset_at" BIGINT NOT NULL);
CREATE INDEX "rate_limits_reset_at_idx" ON "rate_limits"("reset_at");
ALTER TABLE "rate_limits" ENABLE ROW LEVEL SECURITY;
-- Prisma Postgres uses a restricted server role. Revoke only actual grants;
-- a new PostgreSQL table has no PUBLIC privileges by default.
DO $$
DECLARE tbl text; target text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['rate_limits'] LOOP
    FOR target IN
      SELECT DISTINCT CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE r.rolname END
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a
      LEFT JOIN pg_roles r ON r.oid=a.grantee
      WHERE n.nspname='public' AND c.relname=tbl
        AND (a.grantee=0 OR r.rolname IN ('anon','authenticated'))
    LOOP
      IF target='PUBLIC' THEN EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC',tbl);
      ELSE EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I',tbl,target); END IF;
    END LOOP;
  END LOOP;
END $$;
