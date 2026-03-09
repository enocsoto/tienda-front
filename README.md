# Kiosko Frontend

Frontend del **Sistema Kiosko**: aplicación web para administración (inventario, ventas, caja, créditos, configuración) y tienda pública para pedidos. Desarrollado con Next.js (App Router) y Tailwind CSS.

## Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Estilos**: Tailwind CSS 4
- **Iconos**: Lucide React
- **API**: Consumo del backend Kiosko vía `fetch` (token JWT en `localStorage`)

## Requisitos

- Node.js 20+
- Backend Kiosko en ejecución (por defecto `http://localhost:3001/api`). Ver [kiosko-backend](../kiosko-backend) para levantar el API.

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto. Ejemplo:

```env
# URL base del API (por defecto: http://localhost:3001/api)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Ejecución

- **Desarrollo**:
  ```bash
  npm run dev
  ```
  Abre [http://localhost:3000](http://localhost:3000).

- **Producción**:
  ```bash
  npm run build
  npm run start
  ```

- **Lint**:
  ```bash
  npm run lint
  ```

## Estructura de la aplicación

| Ruta | Descripción |
|------|-------------|
| `/` | Página principal (landing / inicio) |
| `/login` | Inicio de sesión (admin) |
| `/comprar` | Tienda pública: catálogo y pedidos (envío a domicilio) |
| `/admin/*` | Panel de administración (requiere login) |

### Panel Admin

- **Inventario** — Listado, nuevo producto, editar, importar Excel
- **Ventas** — Registrar venta, historial
- **Créditos** — Listado y pagos de créditos
- **Caja** — Balance, egresos, utilidad
- **Configuración** — Ganancia, cuentas Nequi
- **Notificaciones** — Stock crítico, pedidos recibidos

## Diseño

- **Tema**: Sky Blue y blanco (profesional y limpio).
- **Componentes reutilizables**: `src/components/ui/` (Badge, PageHeader, StatCard, Toast, etc.).
- **Utilidades**: `src/lib/api.ts` (fetch con token), `src/lib/format.ts`, `src/lib/inventario.ts`.

## API y autenticación

- El frontend usa `NEXT_PUBLIC_API_URL` para todas las peticiones al backend.
- Tras el login, el token JWT se guarda en `localStorage` y se envía en el header `Authorization: Bearer <token>` en las rutas protegidas.
- Rutas públicas (catálogo y crear pedido en `/comprar`) no envían token.

Para el detalle de endpoints, DTOs y reglas de negocio del backend, consulta el **[README y AGENTS.md del backend](../kiosko-backend/README.md)**.

## Licencia

Uso interno / proyecto Kiosko.
