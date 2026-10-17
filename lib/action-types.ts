/** Shared shapes for server actions. Kept out of "use server" modules, where
 *  only async functions may be exported. */

export type ActionState = { ok: boolean; message?: string; id?: string };
export type ContentState = { ok: boolean; message?: string; id?: string };
export type MediaState = { ok: boolean; message?: string; id?: string };
export type SyncState = {
  ok: boolean;
  message?: string;
  lines?: { platform: string; ok: boolean; message: string }[];
};
export type AuthState = {
  step: "email" | "code";
  email: string;
  error?: string;
  info?: string;
};
export type AssistantState = {
  ok: boolean;
  message?: string;
  title?: string;
  excerpt?: string;
  body?: string;
  imageId?: string;
  imageUrl?: string;
  resultId?: string;
};
