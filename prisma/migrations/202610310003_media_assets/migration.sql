CREATE TABLE media_assets (filename TEXT PRIMARY KEY, data TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX media_assets_created_at_idx ON media_assets(created_at);
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE target text;
BEGIN
  FOR target IN SELECT DISTINCT CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE r.rolname END
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a
    LEFT JOIN pg_roles r ON r.oid=a.grantee
    WHERE n.nspname='public' AND c.relname='media_assets'
      AND (a.grantee=0 OR r.rolname IN ('anon','authenticated'))
  LOOP
    IF target='PUBLIC' THEN REVOKE ALL ON media_assets FROM PUBLIC;
    ELSE EXECUTE format('REVOKE ALL ON media_assets FROM %I',target); END IF;
  END LOOP;
END $$;
