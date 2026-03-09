export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/** Llama a la API sin enviar token (para rutas públicas como pedidos). */
export async function fetchPublicApi(endpoint: string, options: RequestInit = {}) {
  const hasBody = options.body !== undefined && options.body !== null;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'Error en la petición';
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const hasBody = options.body !== undefined && options.body !== null;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      console.warn('[API] 401 No autorizado en', endpoint, '-> cerrando sesión y redirigiendo a /');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    throw new Error('Sesión expirada o no autorizada');
  }

  if (!response.ok) {
    let errorMsg = 'Error en la petición';
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // Ignorar si no hay JSON
    }
    throw new Error(errorMsg);
  }

  // Si es 204 No Content, no hay JSON que parsear
  if (response.status === 204) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
}
