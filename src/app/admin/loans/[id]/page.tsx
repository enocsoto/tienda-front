import { consumePageProps } from "@/lib/consume-page-props";
import PrestamoDetallePageClient from "./client";

export default consumePageProps(PrestamoDetallePageClient, ({ params }) => {
  const raw = params.id;
  const id = typeof raw === "string" ? raw : raw?.[0] ?? "";
  return { id };
});
