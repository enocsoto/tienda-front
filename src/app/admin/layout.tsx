import AdminLayoutClient from "./AdminLayoutClient";

/** Layout servidor: consume `params` aquí (Next.js 15+). */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Record<string, string | string[]>>;
}) {
  await params;
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
