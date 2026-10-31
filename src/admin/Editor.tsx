import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { fields, collectionNames, totals, money, slugify } from "./fields";
import type { RecordData, Field } from "./fields";
import Markdown from "../components/Markdown";
const images = [
  "insight-seo.svg",
  "insight-automation.svg",
  "insight-web.svg",
  "project-growintek.svg",
  "project-daroodi.svg",
  "project-kish.svg",
  "project-pakexporters.svg",
  "project-zamanalytics.svg",
  "hero-background.webp",
  "about-art.webp",
].map((x) => "/images/" + x);
function localDate(value: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export default function Editor({
  kind,
  initial,
  clients,
  onSave,
  onCancel,
  saving,
  error,
  uploadImage,
}: {
  kind: string;
  initial: RecordData;
  clients: RecordData[];
  onSave: (v: RecordData) => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
  uploadImage: (file: File) => Promise<string>;
}) {
  const [draft, setDraft] = useState<RecordData>(initial),
    [preview, setPreview] = useState(false),
    [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false),
    [uploadError, setUploadError] = useState("");
  useEffect(() => {
    if (!dirty) return;
    const prevent = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  async function upload(file: File | undefined, key: string) {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      set(key, await uploadImage(file));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }
  const set = (key: string, value: unknown) => {
    setDirty(true);
    setDraft((d) => ({
      ...d,
      [key]: value,
      ...(key === "title" &&
      !initial.id &&
      (!d.slug || d.slug === slugify(d.title || ""))
        ? { slug: slugify(String(value)) }
        : {}),
    }));
  };
  function cancel() {
    if (!dirty || confirm("Discard your unsaved changes?")) onCancel();
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    onSave(draft);
  }
  function field(f: Field) {
    const value = draft[f.key];
    const id = `field-${f.key}`;
    if (f.type === "checkbox")
      return (
        <label className="admin-check" key={f.key}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => set(f.key, e.target.checked)}
          />
          {f.label}
        </label>
      );
    if (f.type === "sources")
      return (
        <fieldset className="editor-wide source-editor" key={f.key}>
          <legend>{f.label}</legend>
          <p className="field-help">
            Add URLs you have verified and the evidence the article may use.
            Source notes stay in the admin workspace.
          </p>
          {(value || []).map((s: RecordData, i: number) => (
            <div className="source-row" key={i}>
              <label>
                Source title
                <input
                  required
                  value={s.title}
                  onChange={(e) =>
                    set(
                      f.key,
                      value.map((x: RecordData, j: number) =>
                        j === i ? { ...x, title: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
              <label>
                HTTPS URL
                <input
                  type="url"
                  required
                  value={s.url}
                  onChange={(e) =>
                    set(
                      f.key,
                      value.map((x: RecordData, j: number) =>
                        j === i ? { ...x, url: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
              <label>
                Verified research notes
                <textarea
                  required
                  minLength={20}
                  rows={3}
                  value={s.notes}
                  onChange={(e) =>
                    set(
                      f.key,
                      value.map((x: RecordData, j: number) =>
                        j === i ? { ...x, notes: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="admin-link danger"
                onClick={() =>
                  set(
                    f.key,
                    value.filter((_: unknown, j: number) => j !== i),
                  )
                }
              >
                Remove source
              </button>
            </div>
          ))}
          <button
            type="button"
            className="admin-btn secondary"
            onClick={() =>
              set(f.key, [...(value || []), { title: "", url: "", notes: "" }])
            }
          >
            + Add source
          </button>
        </fieldset>
      );
    if (f.type === "items")
      return (
        <fieldset className="editor-wide invoice-items" key={f.key}>
          <legend>Invoice items</legend>
          {(value || []).map((item: RecordData, i: number) => (
            <div className="invoice-item" key={i}>
              <label>
                Description
                <input
                  value={item.description}
                  required
                  onChange={(e) =>
                    set(
                      f.key,
                      value.map((x: RecordData, j: number) =>
                        j === i ? { ...x, description: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={item.quantity}
                  onChange={(e) =>
                    set(
                      f.key,
                      value.map((x: RecordData, j: number) =>
                        j === i
                          ? { ...x, quantity: Number(e.target.value) }
                          : x,
                      ),
                    )
                  }
                />
              </label>
              <label>
                Unit price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={item.unitPrice}
                  onChange={(e) =>
                    set(
                      f.key,
                      value.map((x: RecordData, j: number) =>
                        j === i
                          ? { ...x, unitPrice: Number(e.target.value) }
                          : x,
                      ),
                    )
                  }
                />
              </label>
              <button
                type="button"
                aria-label={`Remove item ${i + 1}`}
                className="admin-icon-btn"
                disabled={value.length === 1}
                onClick={() =>
                  set(
                    f.key,
                    value.filter((_: unknown, j: number) => j !== i),
                  )
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="admin-btn secondary"
            onClick={() =>
              set(f.key, [
                ...value,
                { description: "", quantity: 1, unitPrice: 0 },
              ])
            }
          >
            + Add item
          </button>
          <div className="invoice-total">
            <span>
              Subtotal {money(totals(draft).subtotal, draft.currency)}
            </span>
            <span>Tax {money(totals(draft).tax, draft.currency)}</span>
            <strong>Total {money(totals(draft).total, draft.currency)}</strong>
          </div>
        </fieldset>
      );
    const common = {
      id,
      required: f.required,
      value: value ?? "",
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => set(f.key, e.target.value),
    };
    return (
      <label
        key={f.key}
        className={
          ["textarea", "markdown", "lines"].includes(f.type || "")
            ? "editor-wide"
            : ""
        }
        htmlFor={id}
      >
        {f.label}
        {f.required ? <span className="required-mark"> *</span> : null}
        {f.type === "select" ? (
          <select {...common}>
            {f.options?.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        ) : f.type === "client" ? (
          <select {...common}>
            <option value="">Choose a client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company || c.name} — {c.email}
              </option>
            ))}
          </select>
        ) : f.type === "image" ? (
          <>
            <input {...common} list="image-library" />
            <datalist id="image-library">
              {images.map((i) => (
                <option key={i} value={i} />
              ))}
            </datalist>
            <input
              aria-label="Upload image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploading}
              onChange={(e) => upload(e.target.files?.[0], f.key)}
            />
            <span className="field-help">
              {uploading
                ? "Optimizing and uploading…"
                : "Upload a PNG, JPEG or WebP, up to 8 MB. Automatically resized, converted to WebP and stripped of metadata."}
            </span>
            {uploadError ? (
              <span role="alert" className="admin-error">
                {uploadError}
              </span>
            ) : null}
            {value ? (
              <img
                className="editor-image"
                src={value}
                alt="Selected cover preview"
              />
            ) : null}
          </>
        ) : f.type === "markdown" ? (
          <>
            <div className="editor-mode">
              <button
                type="button"
                className={!preview ? "active" : ""}
                onClick={() => setPreview(false)}
              >
                Write
              </button>
              <button
                type="button"
                className={preview ? "active" : ""}
                onClick={() => setPreview(true)}
              >
                Preview
              </button>
              <span>
                {
                  String(value || "")
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean).length
                }{" "}
                words
              </span>
            </div>
            {preview ? (
              <div className="markdown-preview">
                <Markdown
                  content={value || "Your content preview will appear here."}
                />
              </div>
            ) : (
              <textarea {...common} rows={16} />
            )}
          </>
        ) : f.type === "lines" ? (
          <textarea
            id={id}
            value={(value || []).join("\n")}
            rows={4}
            onChange={(e) => set(f.key, e.target.value.split("\n"))}
          />
        ) : f.type === "textarea" ? (
          <textarea {...common} rows={f.key === "message" ? 5 : 3} />
        ) : f.type === "datetime-local" ? (
          <input
            id={id}
            type="datetime-local"
            value={localDate(value || "")}
            onChange={(e) =>
              set(
                f.key,
                e.target.value ? new Date(e.target.value).toISOString() : "",
              )
            }
          />
        ) : f.type === "number" ? (
          <input
            {...common}
            type="number"
            step="0.01"
            min={f.key === "position" ? 1 : 0}
            max={f.key === "taxRate" ? 100 : undefined}
            onChange={(e) =>
              set(f.key, e.target.value === "" ? null : Number(e.target.value))
            }
          />
        ) : (
          <input {...common} type={f.type || "text"} />
        )}
        {f.help ? <span className="field-help">{f.help}</span> : null}
        {f.key === "slug" ? (
          <button
            type="button"
            className="admin-link"
            onClick={() => set("slug", slugify(draft.title || ""))}
          >
            Generate from title
          </button>
        ) : null}
        {f.key === "seoDescription" ? (
          <span className="field-help">
            {String(value || "").length} / 160 suggested characters
          </span>
        ) : null}
      </label>
    );
  }
  return (
    <section className="editor-panel">
      <div className="editor-heading">
        <div>
          <span className="admin-eyebrow">{collectionNames[kind]}</span>
          <h2>{initial.id ? "Edit record" : "Create a record"}</h2>
        </div>
        <button type="button" className="admin-btn secondary" onClick={cancel}>
          Back to list
        </button>
      </div>
      <form onSubmit={submit}>
        <div className="editor-grid">{fields[kind].map(field)}</div>
        {kind === "invoices" ? (
          <p className="field-help">
            Changing status records your bookkeeping decision. It does not send
            an invoice or process a payment. Use Print to save a PDF after
            saving.
          </p>
        ) : null}
        {error ? (
          <p className="admin-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="editor-actions">
          <button className="admin-btn primary" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            className="admin-btn secondary"
            onClick={cancel}
          >
            Cancel
          </button>
          {dirty ? <span>Unsaved changes</span> : null}
        </div>
      </form>
    </section>
  );
}
