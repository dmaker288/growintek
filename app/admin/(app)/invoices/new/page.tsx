import { prisma } from "@/lib/db";
import InvoiceFormShell from "@/components/admin/InvoiceFormShell";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;

  const clients = await prisma.client.findMany({
    where: { archived: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, company: true, currency: true },
  });

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">New invoice</h1>
          <p className="page-sub">
            Draft first, then issue. Numbers are assigned in sequence only when you issue.
          </p>
        </div>
      </header>
      <InvoiceFormShell clients={clients} defaultClientId={client} />
    </>
  );
}
