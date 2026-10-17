import { permanentRedirect } from "next/navigation";

/** The print view moved out of the admin shell. Keep old links working. */
export default async function LegacyPrintRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(`/admin/print/${id}`);
}
