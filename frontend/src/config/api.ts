/**
 * Configuración dinámica de la URL base del Backend API y cliente HTTP optimizado.
 * Prioriza VITE_API_URL, o calcula la dirección en base al hostname actual (bodegia.bamms.dev / IP).
 */
export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:4000/api/v1`;
  }

  return 'http://localhost:4000/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Generador de claves de idempotencia UUID v4 para peticiones mutativas
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'idemp-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
}

export interface ApiFetchOptions extends RequestInit {
  idempotencyKey?: string;
  token?: string;
}

/**
 * Wrapper de Fetch con inyección automática de JWT Authorization, x-idempotency-key y manejo de errores.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { idempotencyKey, token, headers: customHeaders, ...restOptions } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // Inyectar Token de Autenticación
  const authToken = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('bodegia_token') : null);
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Inyectar Clave de Idempotencia en peticiones mutativas (POST, PUT, PATCH, DELETE)
  const method = (restOptions.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['x-idempotency-key'] = idempotencyKey || generateIdempotencyKey();
  }

  const response = await fetch(url, {
    ...restOptions,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.message || data.error || `Error HTTP ${response.status}: ${response.statusText}`;
    const error = new Error(errorMessage) as any;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}
