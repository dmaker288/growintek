import ClientForm from "@/components/admin/ClientForm";

export const dynamic = "force-dynamic";

export default function NewClientPage() {
  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">New client</h1>
          <p className="page-sub">Billing details are used on invoices issued to this account.</p>
        </div>
      </header>
      <div style={{ maxWidth: "52rem" }}>
        <ClientForm />
      </div>
    </>
  );
}
