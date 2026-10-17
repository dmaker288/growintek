"use client";

import { useActionState } from "react";
import InvoiceBuilder from "@/components/admin/InvoiceBuilder";
import { saveInvoice as saveInvoiceAction } from "@/lib/actions/crm";
import type { ActionState } from "@/lib/action-types";

type Client = { id: string; name: string; company: string | null; currency: string };

export default function InvoiceFormShell({
  clients,
  defaultClientId,
}: {
  clients: Client[];
  defaultClientId?: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveInvoiceAction,
    { ok: false }
  );

  return (
    <InvoiceBuilder
      clients={clients}
      defaultClientId={defaultClientId}
      action={action}
      state={state}
      pending={pending}
    />
  );
}
