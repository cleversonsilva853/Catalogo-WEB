import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import logoInfornexa from '@/assets/logo-infornexa.png';
import { z } from 'zod';
import { api } from '@/lib/api';

const adminLoginSchema = z.object({
  usuario: z.string().trim().min(1, { message: 'Digite seu usuário' }),
  senha: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
});

type AuthMode = 'login' | 'forgot';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, login } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ usuario: '', senha: '', email: '' });

  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const emailValidation = z.string().email().safeParse(formData.email);
      if (!emailValidation.success) {
        toast({ title: 'Email inválido', description: 'Digite um email válido', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      await api.post('/auth/forgot-password', { email: formData.email });
      toast({ title: 'Email enviado!', description: 'Se o email existir, você receberá um link de recuperação.' });
      setMode('login');
    } catch {
      toast({ title: 'Erro', description: 'Tente novamente mais tarde', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'forgot') return handleForgotPassword(e);

    setIsLoading(true);
    try {
      const validation = adminLoginSchema.safeParse(formData);
      if (!validation.success) {
        toast({ title: 'Dados inválidos', description: validation.error.errors[0].message, variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      await login(formData.usuario.trim(), formData.senha);
      toast({ title: 'Bem-vindo!', description: 'Login realizado com sucesso' });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Usuário ou senha incorretos';
      toast({
        title: 'Erro ao entrar',
        description: msg,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const titles: Record<AuthMode, string> = {
    login: 'Entrar no Painel',
    forgot: 'Recuperar Senha',
  };

  const subtitles: Record<AuthMode, string> = {
    login: 'Acesso Administrativo',
    forgot: 'Digite seu email para receber o link de recuperação',
  };

  return (
    <>
      <Helmet>
        <title>{titles[mode]} - Painel Admin</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#23354D' }}>
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img
                src={logoInfornexa}
                alt="Logo do sistema"
                className="h-28 sm:h-36 w-auto drop-shadow-lg"
              />
            </div>

            {/* Card */}
            <div className="bg-card rounded-2xl shadow-xl p-8">
              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao login
                </button>
              )}

              <h1 className="text-2xl font-bold text-center text-foreground mb-1">
                {titles[mode]}
              </h1>
              <p className="text-center text-muted-foreground text-sm mb-8">
                {subtitles[mode]}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'login' && (
                  <>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Nome de usuário"
                        value={formData.usuario}
                        onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                        className="pl-10 h-12 bg-muted/50 border-0 rounded-xl"
                        autoComplete="username"
                        autoFocus
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Sua senha"
                        value={formData.senha}
                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                        className="pl-10 pr-10 h-12 bg-muted/50 border-0 rounded-xl"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-primary hover:underline text-sm"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                  </>
                )}

                {mode === 'forgot' && (
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 h-12 bg-muted/50 border-0 rounded-xl"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  size="xl"
                  className="w-full rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Aguarde...
                    </>
                  ) : mode === 'login' ? 'Entrar' : 'Enviar Link'}
                </Button>
              </form>
            </div>

            {/* Back to menu */}
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-white/70 hover:text-white text-sm transition-colors"
              >
                ← Voltar ao cardápio
              </button>
            </div>
          </div>
      </div>
    </>
  );
};

export default Auth;
