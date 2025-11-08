import { toast } from "sonner";

export async function apiFetch(url: string, options: RequestInit = {}) {
  const userData = localStorage.getItem('user');
  const token = userData ? JSON.parse(userData).token : null;

  const headers = {
    ...options.headers,
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    console.warn('Unauthorized request. Token might be invalid or expired.');
    // Limpiar localStorage y redirigir a login
    localStorage.removeItem('user');
    toast.error("Sesión expirada. Por favor, inicia sesión nuevamente.");
    window.location.href = '/login';
    return response;
  }

  if (!response.ok) {
    console.error(`API request failed with status ${response.status}: ${response.statusText}`);
  }

  return response;
}