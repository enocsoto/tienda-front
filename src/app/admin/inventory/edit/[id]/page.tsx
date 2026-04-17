import { consumePageProps } from "@/lib/consume-page-props";
import { EditProductClient } from "./EditProductClient";

export default consumePageProps(EditProductClient, ({ params }) => {
  const raw = params.id;
  const id = typeof raw === "string" ? raw : raw?.[0] ?? "";
  return { id };
});
