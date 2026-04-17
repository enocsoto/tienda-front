import type { ComponentType } from "react";

/** Props que Next.js 15+ pasa a las páginas (promesas; no exponer a componentes cliente sin await). */
export type NextAppPageProps = {
  params: Promise<Record<string, string | string[]>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type Resolved = {
  params: Record<string, string | string[]>;
  searchParams: Record<string, string | string[] | undefined>;
};

/**
 * Envuelve un componente cliente: resuelve params/searchParams en el servidor
 * para que no lleguen Promises a la capa cliente (evita errores con DevTools / sync-dynamic-apis).
 */
export function consumePageProps<P extends object>(
  Client: ComponentType<P>,
  mapProps?: (resolved: Resolved) => P
) {
  return async function Page(props: NextAppPageProps) {
    const [params, searchParams] = await Promise.all([
      props.params,
      props.searchParams,
    ]);
    const clientProps = (mapProps ? mapProps({ params, searchParams }) : {}) as P;
    return <Client {...clientProps} />;
  };
}
