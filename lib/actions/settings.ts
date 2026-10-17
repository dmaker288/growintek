"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireAdmin, assertSameOrigin } from "@/lib/auth";
import { syncReviews } from "@/lib/integrations/reviews";
import { syncSocial } from "@/lib/integrations/social";
import type { SyncState } from "@/lib/action-types";

export async function runSync(_prev: SyncState, _formData: FormData): Promise<SyncState> {
  await requireAdmin();
  const h = await headers();
  assertSameOrigin(h.get("origin"), h.get("host"));

  const [reviews, social] = await Promise.all([syncReviews(), syncSocial()]);
  const all = [...reviews, ...social];

  revalidatePath("/reviews");
  revalidatePath("/");
  revalidatePath("/admin/integrations");

  return {
    ok: all.some((r) => r.ok),
    message: all.some((r) => r.ok)
      ? "Sync finished."
      : "Nothing synced — add the API credentials in your environment first.",
    lines: all.map((r) => ({
      platform: r.platform,
      ok: r.ok,
      message: r.message,
    })),
  };
}

/** Numeric/operational settings the site reads at render time. */
export async function saveSettings(formData: FormData): Promise<void> {
  await requireAdmin();
  const h = await headers();
  assertSameOrigin(h.get("origin"), h.get("host"));

  const entries: Record<string, unknown> = {
    "business.name": String(formData.get("businessName") ?? "GrowinTek"),
    "business.email": String(formData.get("businessEmail") ?? ""),
    "business.capacityPerMonth": Number(formData.get("capacity") ?? 2) || 2,
    "business.currency": String(formData.get("currency") ?? "GBP"),
    "billing.invoicePrefix": String(formData.get("invoicePrefix") ?? "GT"),
    "billing.dueDays": Number(formData.get("dueDays") ?? 14) || 14,
    "billing.defaultTaxRate": Number(formData.get("defaultTaxRate") ?? 0) || 0,
    "billing.defaultTaxLabel": String(formData.get("defaultTaxLabel") ?? "VAT"),
  };

  for (const [key, value] of Object.entries(entries)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value: value as never },
      update: { value: value as never },
    });
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
}
