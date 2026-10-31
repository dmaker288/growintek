import { z } from "zod";
import { list, get, insert, isPublic } from "./db.js";
import { schemas } from "./validation.js";

const submission = schemas.comments
  .omit({ status: true })
  .extend({ website: z.string().max(200).default("") });
const publicComment = ({ id, name, body, createdAt }) => ({
  id,
  name,
  body,
  createdAt,
});
export function registerComments(app, db, limiter) {
  app.get("/api/posts/:id/comments", async (req, res) => {
    if (!z.string().uuid().safeParse(req.params.id).success)
      return res.status(404).json({ error: "Article not found." });
    const post = await get(db, "posts", req.params.id);
    if (!post || !isPublic(post))
      return res.status(404).json({ error: "Article not found." });
    const comments = (await list(db, "comments"))
      .filter((c) => c.postId === post.id && c.status === "approved")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 100)
      .map(publicComment);
    res.json({ comments });
  });
  app.post("/api/comments", limiter(4, 60 * 60 * 1000), async (req, res) => {
    const input = submission.parse(req.body);
    const post = await get(db, "posts", input.postId);
    if (!post || !isPublic(post))
      return res.status(404).json({ error: "Article not found." });
    const message = "Thank you. Your comment is waiting for approval.";
    if (input.website) return res.status(202).json({ message });
    await db.transaction(async () => {
      const duplicate = (await list(db, "comments")).some(
        (c) =>
          c.postId === post.id &&
          c.email === input.email &&
          c.body === input.body,
      );
      if (!duplicate)
        await insert(
          db,
          "comments",
          schemas.comments.parse({ ...input, status: "pending" }),
        );
    })();
    res.status(202).json({ message });
  });
}
