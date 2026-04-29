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

// ─── Compressão de imagem antes do upload ───────────────────────
async function compressImage(file: File, maxWidth = 1080, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
        },
        'image/webp',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ─── Upload com progresso real via XHR ──────────────────────────
export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const token = getToken();

  // Comprime imagens antes de enviar (reduz tamanho em até 70%)
  let fileToSend = file;
  if (file.type.startsWith('image/')) {
    try { fileToSend = await compressImage(file); } catch { /* mantém original */ }
  }

  const form = new FormData();
  form.append('file', fileToSend);

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/upload`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    // Progresso REAL do upload
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          resolve((data as { url: string }).url);
        } else {
          reject(new Error(data.error || `Erro ${xhr.status}`));
        }
      } catch {
        reject(new Error('Resposta inválida do servidor'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Falha na conexão durante o upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelado')));
    xhr.addEventListener('timeout', () => reject(new Error('Tempo esgotado no upload')));

    // Timeout generoso para vídeos grandes: 10 minutos
    xhr.timeout = 10 * 60 * 1000;
    xhr.send(form);
  });
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
