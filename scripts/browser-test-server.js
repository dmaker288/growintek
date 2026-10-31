// Dedicated disposable fixture: never inherit cloud credentials from .env.
import 'dotenv/config';
process.env.FORCE_SQLITE='1';
process.env.DATABASE_PATH='/tmp/grow-browser-tests/test.sqlite';
process.env.MEDIA_PATH='/tmp/grow-browser-tests/media';
process.env.PORT='3100';
process.env.SERVE_BUILD='true';
process.env.SITE_URL='';
for(const key of Object.keys(process.env)) {
  if (/^(S3_|SUPABASE_|GOOGLE_|GA4_|GSC_|DASHSCOPE_|COMPOSIO_|YOUTUBE_|META_|INDEXNOW_|CRON_SECRET)/.test(key)) process.env[key]='';
}
await import('../server/index.js');
