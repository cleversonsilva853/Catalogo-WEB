import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Truck, Loader2, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';
import { useStore } from '@/hooks/useStore';
import { useTheme } from '@/hooks/useTheme';
import { usePWAConfig } from '@/hooks/usePWAConfig';
import { useDrivers, Driver } from '@/hooks/useDrivers';

export default function DriverAccess() {
  const navigate = useNavigate();
  const { data: store } = useStore();
  const { data: drivers = [], isLoading } = useDrivers();
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [selectedDriverData, setSelectedDriverData] = useState<Driver | null>(null);

  useTheme();
  usePWAConfig();

  const activeDrivers = drivers.filter(d => d.is_active);

  const handleSelectDriver = (driver: Driver) => {
    if (driver.password) {
      setSelectedDriverData(driver);
      setShowPasswordPrompt(true);
    } else {
      performLogin(driver.id, driver.name);
    }
  };

  const performLogin = (driverId: string, driverName: string) => {
    setSelectedDriver(driverId);
    localStorage.setItem('driver_id', driverId);
    localStorage.setItem('driver_name', driverName);
    setTimeout(() => navigate('/driver/dashboard'), 300);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverData) return;

    if (passwordInput === selectedDriverData.password) {
      performLogin(selectedDriverData.id, selectedDriverData.name);
    } else {
      alert('Senha incorreta!');
      setPasswordInput('');
    }
  };

  return (
    <>
      <Helmet>
        <title>{`Acesso Entregador - ${store?.name || 'Restaurante'}`}</title>
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="fixed top-4 right-4 z-50">
          <PWAInstallButton appName="Entregadores" />
        </div>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              {store?.logo_url ? (
                <img src={store.logo_url} alt="Logo" className="h-12 w-12 object-contain rounded-full" />
              ) : (
                <Truck className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">Olá, Entregador!</CardTitle>
            <CardDescription>Selecione seu nome para acessar suas entregas</CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : showPasswordPrompt && selectedDriverData ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setShowPasswordPrompt(false);
                      setSelectedDriverData(null);
                      setPasswordInput('');
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">Voltar para a lista</span>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-xl mb-4 text-center">
                  <p className="text-sm text-muted-foreground">Entregador selecionado:</p>
                  <p className="text-lg font-bold text-primary">{selectedDriverData.name}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Digite sua senha de acesso</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Senha do entregador"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="pl-10 h-12 text-lg"
                      autoFocus
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-bold"
                  disabled={selectedDriver !== null}
                >
                  {selectedDriver !== null ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    'Acessar Dashboard'
                  )}
                </Button>
              </form>
            ) : activeDrivers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Nenhum entregador ativo no momento.</p>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Voltar ao cardápio
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {activeDrivers.map((driver) => (
                  <Button
                    key={driver.id}
                    variant={selectedDriver === driver.id ? 'default' : 'outline'}
                    className="w-full h-14 text-lg justify-start px-4"
                    onClick={() => handleSelectDriver(driver)}
                    disabled={selectedDriver !== null}
                  >
                    {selectedDriver === driver.id ? (
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    ) : (
                      <Truck className="h-5 w-5 mr-3" />
                    )}
                    {driver.name}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
