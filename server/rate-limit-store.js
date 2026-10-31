import { createHash } from "node:crypto";
// Shared storage prevents a new Vercel instance from resetting authentication limits.
export class DatabaseRateLimitStore {
  constructor(db, scope) {
    this.db = db;
    this.scope = scope;
    this.localKeys = false;
  }
  init(options) {
    this.windowMs = options.windowMs;
  }
  key(key) {
    return createHash("sha256")
      .update(this.scope + ":" + key)
      .digest("hex");
  }
  async increment(key) {
    const id = this.key(key),
      time = Date.now();
    return this.db.transaction(async () => {
      const old = await this.db
        .prepare("SELECT * FROM rate_limits WHERE id=?")
        .get(id);
      const reset = !old || old.reset_at <= time;
      const totalHits = reset ? 1 : old.hits + 1,
        resetAt = reset ? time + this.windowMs : old.reset_at;
      await this.db
        .prepare(
          "INSERT INTO rate_limits(id,hits,reset_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET hits=excluded.hits,reset_at=excluded.reset_at",
        )
        .run(id, totalHits, resetAt);
      return { totalHits, resetTime: new Date(resetAt) };
    })();
  }
  async decrement(key) {
    await this.db
      .prepare(
        "UPDATE rate_limits SET hits=CASE WHEN hits>0 THEN hits-1 ELSE 0 END WHERE id=?",
      )
      .run(this.key(key));
  }
  async resetKey(key) {
    await this.db
      .prepare("DELETE FROM rate_limits WHERE id=?")
      .run(this.key(key));
  }
}
