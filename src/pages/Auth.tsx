import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import logoInfornexa from '@/assets/logo-infornexa.png';
import { z } from 'zod';

const adminLoginSchema = z.object({
  usuario: z.string().trim().min(1, { message: 'Digite seu usuário' }),
  senha: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ usuario: '', senha: '' });

  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

  return (
    <>
      <Helmet>
        <title>Entrar no ambiente de gestão - Painel Admin</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#23354D' }}>
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img
                src={logoInfornexa}
                alt="Logo do sistema"
                className="h-40 sm:h-52 w-auto drop-shadow-lg"
              />
            </div>

            {/* Card */}
            <div className="bg-card rounded-2xl shadow-xl p-8">
              <h1 className="text-2xl font-bold text-center text-foreground mb-1">
                Entrar no ambiente de gestão
              </h1>
              <p className="text-center text-muted-foreground text-sm mb-8">
                Acesso Administrativo
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  ) : 'Entrar'}
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
