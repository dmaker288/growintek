import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import { requireUser } from "@/lib/auth";
import "@/components/admin/admin.css";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AdminShell user={user}>{children}</AdminShell>;
}
