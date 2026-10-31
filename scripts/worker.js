import "dotenv/config";
import { openDatabase, seed } from "../server/db.js";
import { tick } from "../server/jobs.js";
const db = openDatabase();
await seed(db);
await tick(db);
db.close();
