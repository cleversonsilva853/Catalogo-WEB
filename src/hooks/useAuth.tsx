import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { api, setToken, clearToken, getToken } from '@/lib/api';

// ─── Tipos ────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  usuario: string;
  login_email: string | null;
  acesso_gestao: boolean;
  acesso_operacoes: boolean;
  acesso_sistema: boolean;
  perm_dashboard: boolean;
  perm_pedidos: boolean;
  perm_produtos: boolean;
  perm_categorias: boolean;
  perm_acrescimos: boolean;
  perm_configuracoes: boolean;
  perm_relatorios: boolean;
  perm_usuarios: boolean;
  perm_horarios: boolean;
  perm_taxas_entrega: boolean;
  perm_cupons: boolean;
  perm_entregadores: boolean;
  perm_qrcode: boolean;
  perm_cozinha: boolean;
  perm_pdv: boolean;
  perm_backup: boolean;
  perm_consumir_local: boolean;
}

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (usuario: string, senha: string) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const me = await api.get<AdminUser>('/auth/me');
      setUser(me);
    } catch {
      setUser(null);
      clearToken();
    }
  };

  useEffect(() => {
    if (getToken()) {
      fetchMe().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (usuario: string, senha: string) => {
    const res = await api.post<{ token: string; user: AdminUser }>('/auth/login', { usuario, senha });
    setToken(res.token);
    setUser(res.user);
  };

  const signOut = () => {
    clearToken();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchMe();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAdmin: !!user,
      login,
      signOut,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro do AuthProvider');
  return ctx;
}
