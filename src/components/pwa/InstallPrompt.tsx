import { useState, useEffect } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useStore } from '@/hooks/useStore';

interface InstallPromptProps {
  inline?: boolean;
}

const InstallPrompt = ({ inline = false }: InstallPromptProps) => {
  const { isInstallable, isInstalled, promptInstall, isIOS, showIOSInstructions } = usePWAInstall();
  const { data: store } = useStore();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (inline) return;

    const handleScroll = () => {
      // Se for desktop, o floating button pode ficar ativo direto
      if (window.innerWidth >= 768) {
        setHasScrolled(true);
      } else {
        // No celular, só exibe o floating popup se rolar pra baixo do hero banner
        if (window.scrollY > 400) {
          setHasScrolled(true);
        } else {
          setHasScrolled(false);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // checagem inicial
    
    // Adicionar listener de redimensionamento também
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [inline]);

  // Don't show if already installed
  if (isInstalled) return null;

  // Don't show floating if dismissed or hasn't scrolled past threshold
  if (!inline) {
    if (dismissed) return null;
    if (!hasScrolled) return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else if (isInstallable) {
      await promptInstall();
    } else {
      // Se o Chrome bloqueou o native prompt (ex: sem HTTPs válido)
      // Exibiremos o manual de instruções.
      setShowIOSModal(true);
    }
  };

  const appName = store?.pwa_short_name || store?.pwa_name || store?.name || 'Cardápio';

  return (
    <>
      {inline ? (
        <div className="flex justify-center px-4 mt-2 mb-4 md:hidden">
          <Button
            onClick={handleInstallClick}
            size="lg"
            className="w-full sm:max-w-[400px] h-12 rounded-[16px] shadow-sm gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm"
          >
            <Download className="h-5 w-5" />
            Instalar App
          </Button>
        </div>
      ) : (
        <div className="fixed bottom-6 right-4 sm:bottom-8 sm:right-6 z-40 animate-slide-up">
          <div className="relative">
            <Button
              onClick={handleInstallClick}
              size="lg"
              className="rounded-full shadow-lg pr-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              <Download className="h-5 w-5" />
              Instalar App
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center shadow-md border"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Instalar {appName}</h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isIOS ? "Para instalar o app no seu iPhone ou iPad:" : "Para instalar o app no seu dispositivo:"}
              </p>
              
              <div className="space-y-3">
                {isIOS ? (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Share className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">1. Toque em Compartilhar</p>
                        <p className="text-xs text-muted-foreground">
                          Na barra do Safari, toque no ícone de compartilhar
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">2. Adicionar à Tela de Início</p>
                        <p className="text-xs text-muted-foreground">
                          Role para baixo e toque em "Adicionar à Tela de Início"
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Download className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Instalação Manual</p>
                        <p className="text-xs text-muted-foreground">
                          Toque no menu do navegador (⋮) e selecione <strong>Instalar aplicativo...</strong> ou <strong>Adicionar à tela inicial</strong>
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <Button
                onClick={() => setShowIOSModal(false)}
                className="w-full"
              >
                Entendi
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { InstallPrompt };
