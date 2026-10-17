"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  requestSignInCode,
  verifySignInCode,
  signInWithPassword,
  signOut,
  assertSameOrigin,
} from "@/lib/auth";
import type { AuthState } from "@/lib/action-types";

async function originGuard() {
  const h = await headers();
  assertSameOrigin(h.get("origin"), h.get("host"));
}

export async function loginWithPassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  await originGuard();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    return { email, error: "Please enter a valid email address." };
  }

  if (!password) {
    return { email, error: "Please enter your password." };
  }

  const result = await signInWithPassword(email, password);
  if (!result.ok) {
    return { email, error: result.reason };
  }

  redirect("/admin");
}

export async function startSignIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  await originGuard();
  const email = String(formData.get("email") ?? "").trim();

  if (!email.includes("@")) {
    return { step: "email", email, error: "Enter the email address on your account." };
  }

  const { throttled } = await requestSignInCode(email);

  return {
    step: "code",
    email,
    info: throttled
      ? "A code was sent recently. Check your inbox, or wait a minute before requesting another."
      : "If that address has an account, a six-digit code is on its way. It expires in 10 minutes.",
  };
}

export async function submitCode(_prev: AuthState, formData: FormData): Promise<AuthState> {
  await originGuard();
  const email = String(formData.get("email") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  if (!/^\d{6}$/.test(code)) {
    return { step: "code", email, error: "That is not a six-digit code." };
  }

  const result = await verifySignInCode(email, code);
  if (!result.ok) {
    return { step: "code", email, error: result.reason };
  }

  redirect("/admin");
}

export async function backToEmail(prev: AuthState, _formData?: FormData): Promise<AuthState> {
  return { step: "email", email: prev.email };
}

export async function signOutAction(): Promise<void> {
  await originGuard();
  await signOut();
  redirect("/admin/login");
}
