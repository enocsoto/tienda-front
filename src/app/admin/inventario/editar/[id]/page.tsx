"use client";

import { use } from "react";
import { EditarProductoClient } from "./EditarProductoClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditarProductoPage(props: PageProps) {
  const resolved = use(props.params);
  return <EditarProductoClient id={resolved.id} />;
}
