import { prisma } from "@/lib/db";
import { saveSettings } from "@/lib/actions/settings";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin();

  const rows = await prisma.setting.findMany();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, unknown>;

  const str = (key: string, fallback = "") =>
    typeof settings[key] === "string" ? (settings[key] as string) : fallback;
  const num = (key: string, fallback: number) =>
    typeof settings[key] === "number" ? (settings[key] as number) : fallback;

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">
            Operational defaults for invoicing and capacity. Anything credential-related
            lives in environment variables, not here.
          </p>
        </div>
      </header>

      <div style={{ maxWidth: "46rem" }}>
        <form action={saveSettings} className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Business</h2>
            <button type="submit" className="a-btn a-btn--primary">Save settings</button>
          </div>
          <div className="panel-body a-form">
            <div className="a-form-row">
              <div className="a-field">
                <label htmlFor="businessName">Business name</label>
                <input id="businessName" name="businessName" defaultValue={str("business.name", "GrowinTek")} className="a-input" />
              </div>
              <div className="a-field">
                <label htmlFor="businessEmail">Reply-to email</label>
                <input id="businessEmail" name="businessEmail" type="email" defaultValue={str("business.email", "hello@growintek.com")} className="a-input" />
              </div>
            </div>

            <div className="a-form-row">
              <div className="a-field">
                <label htmlFor="capacity">
                  Projects per month <span className="hint">shown as “taking on N projects”</span>
                </label>
                <input id="capacity" name="capacity" type="number" min={1} max={20} defaultValue={num("business.capacityPerMonth", 2)} className="a-input" />
              </div>
              <div className="a-field">
                <label htmlFor="currency">Default currency</label>
                <select id="currency" name="currency" defaultValue={str("business.currency", "GBP")} className="a-select">
                  <option value="GBP">GBP</option>
                  <option value="AUD">AUD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <hr style={{ border: 0, borderTop: "1px solid #e2dcce", margin: ".3rem 0" }} />

            <div className="a-form-row--3 a-form-row">
              <div className="a-field">
                <label htmlFor="invoicePrefix">Invoice prefix</label>
                <input id="invoicePrefix" name="invoicePrefix" defaultValue={str("billing.invoicePrefix", "GT")} maxLength={6} className="a-input input--mono" />
              </div>
              <div className="a-field">
                <label htmlFor="dueDays">Payment terms (days)</label>
                <input id="dueDays" name="dueDays" type="number" min={0} max={120} defaultValue={num("billing.dueDays", 14)} className="a-input" />
              </div>
              <div className="a-field">
                <label htmlFor="defaultTaxRate">Default tax rate (%)</label>
                <input id="defaultTaxRate" name="defaultTaxRate" type="number" min={0} step="0.1" defaultValue={num("billing.defaultTaxRate", 0)} className="a-input" />
              </div>
            </div>

            <div className="a-field" style={{ maxWidth: "14rem" }}>
              <label htmlFor="defaultTaxLabel">Tax label</label>
              <select id="defaultTaxLabel" name="defaultTaxLabel" defaultValue={str("billing.defaultTaxLabel", "VAT")} className="a-select">
                <option value="VAT">VAT</option>
                <option value="GST">GST</option>
                <option value="Tax">Tax</option>
                <option value="None">None</option>
              </select>
            </div>

            <p className="dim" style={{ fontSize: ".76rem", lineHeight: 1.55 }}>
              Note: the tax rate on each invoice is captured at issue time, so changing
              the default here never alters an invoice already issued.
            </p>
          </div>
        </form>

        <section className="panel" style={{ marginTop: "1rem" }}>
          <div className="panel-head">
            <h2 className="panel-title">Access</h2>
          </div>
          <div className="panel-body">
            <p style={{ fontSize: ".82rem", lineHeight: 1.6 }}>
              Sign-in is passwordless: a six-digit code is emailed and expires in ten
              minutes. Allowed addresses are set in <code>ADMIN_EMAILS</code>.
            </p>
            <p className="dim" style={{ fontSize: ".78rem", marginTop: ".6rem" }}>
              To add a second user, run <code>npm run admin:create -- email@example.com</code>{" "}
              against the production database, then add the address to{" "}
              <code>ADMIN_EMAILS</code>.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
