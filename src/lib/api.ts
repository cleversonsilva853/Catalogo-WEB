// ============================================================
// src/lib/api.ts — Cliente HTTP centralizado (substitui Supabase SDK)
// ============================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/api';
const TOKEN_KEY = 'catalogo_token';

// ─── Token helpers ────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Fetch base ───────────────────────────────────────────────
async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/auth';
    throw new Error('Não autenticado');
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // O servidor retornou algo que não é JSON (ex: PHP Warning/Error)
      if (!res.ok) throw new Error(`Erro ${res.status}: resposta inválida do servidor`);
      throw new Error(`Resposta inesperada do servidor: ${text.slice(0, 200)}`);
    }
  }

  if (!res.ok) {
    const msg = (data as { error?: string })?.error || `Erro ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

// ─── Upload de arquivo ────────────────────────────────────────
export async function uploadFile(file: File): Promise<string> {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro no upload');
  return (data as { url: string }).url;
}

// ─── Métodos REST ─────────────────────────────────────────────
export const api = {
  get<T = unknown>(path: string, params?: Record<string, string>) {
    const url = params
      ? `${path}?${new URLSearchParams(params).toString()}`
      : path;
    return request<T>(url, { method: 'GET' });
  },

  post<T = unknown>(path: string, body?: unknown) {
    return request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T = unknown>(path: string, body?: unknown) {
    return request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T = unknown>(path: string, body?: unknown) {
    return request<T>(path, { 
      method: 'DELETE',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
};
