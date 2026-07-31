/**
 * Configuración dinámica de la URL base del Backend API.
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
