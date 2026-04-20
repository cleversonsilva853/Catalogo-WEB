import { useState, useEffect } from 'react';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useStore, useUpdateStore } from '@/hooks/useStore';
import { useToast } from '@/hooks/use-toast';

const AdminEnvios = () => {
  const { data: store, isLoading } = useStore();
  const updateStore = useUpdateStore();
  const { toast } = useToast();
  
  const [pixMessage, setPixMessage] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');

  useEffect(() => {
    if (store) {
      setPixMessage(store.pix_message || '');
      setCheckoutMessage(store.checkout_whatsapp_message || '');
    }
  }, [store?.id, store?.pix_message, store?.checkout_whatsapp_message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    updateStore.mutate({
      id: store?.id,
      pix_message: pixMessage,
      checkout_whatsapp_message: checkoutMessage
    }, {
      onSuccess: () => {
        toast({
          title: "Configurações salvas",
          description: "As mensagens de envio foram atualizadas com sucesso.",
        });
      },
      onError: () => {
        toast({
          title: "Erro ao salvar",
          description: "Ocorreu um erro ao atualizar as configurações.",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <AdminLayout title="Envios">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const DEFAULT_CHECKOUT_MODEL = "Olá {nome}! 👋\n\nRecebemos seu pedido #{pedido}!\n\n📋 *Resumo:*\n{itens}\n\n📍 *Entrega:* {endereco}\n💳 *Pagamento:* {pagamento}\n💰 *Total:* {total}\n\n🚀 Acompanhe seu pedido aqui:\n{link}";
  const DEFAULT_PIX_MODEL = "Olá {nome}! 🍔\n\nPedido #{pedido} recebido!\n\nTotal: {total}\n\n💎 Chave Pix: {chave_pix} ({tipo_chave})\n\nAguardamos o comprovante para iniciar o preparo!";

  return (
    <AdminLayout title="Envios">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black font-heading">Configurações de Envios</h2>
            <p className="text-muted-foreground text-sm">Personalize as mensagens automáticas enviadas aos seus clientes.</p>
          </div>
        </div>

        {/* Variáveis Globais */}
        <div className="bg-muted/30 border border-border/50 rounded-xl p-4 sm:p-5">
           <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Palavras-Chave (Variáveis)
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { tag: '{nome}', desc: 'Nome do cliente' },
              { tag: '{pedido}', desc: 'Nº pedido' },
              { tag: '{total}', desc: 'Valor total' },
              { tag: '{itens}', desc: 'Produtos' },
              { tag: '{endereco}', desc: 'Endereço' },
              { tag: '{link}', desc: 'Link pedido' },
              { tag: '{pagamento}', desc: 'Tipo pagto.' },
              { tag: '{chave_pix}', desc: 'Sua chave' },
              { tag: '{tipo_chave}', desc: 'Tipo chave' },
            ].map(v => (
              <div key={v.tag} className="flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded-md text-[11px] hover:border-primary/50 transition-colors">
                <code className="font-bold text-primary">{v.tag}</code>
                <span className="text-muted-foreground hidden sm:inline border-l border-border pl-1.5 ml-0.5">{v.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 italic">Copie e cole estas palavras no seu texto para que o sistema as preencha automaticamente.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-xl p-4 sm:p-6 shadow-card space-y-4 border border-border/50">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
                <Send className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Mensagem Automática de Checkout (WhatsApp)
              </h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="text-[10px] h-7 px-2 border-primary/20 hover:bg-primary hover:text-white"
                onClick={() => setCheckoutMessage(DEFAULT_CHECKOUT_MODEL)}
              >
                Usar Modelo Padrão
              </Button>
            </div>

            <div>
              <label className="text-xs sm:text-sm text-muted-foreground block mb-2 font-medium">Enviada automaticamente ao finalizar o pedido</label>
              <Textarea 
                value={checkoutMessage} 
                onChange={e => setCheckoutMessage(e.target.value)} 
                placeholder={DEFAULT_CHECKOUT_MODEL}
                className="mt-1 min-h-[180px] font-mono text-sm leading-relaxed bg-muted/20 border-border focus:border-primary transition-all"
                rows={8}
              />
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 sm:p-6 shadow-card space-y-4 border border-border/50">
             <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Mensagem de Cobrança PIX (WhatsApp)
              </h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="text-[10px] h-7 px-2 border-primary/20 hover:bg-primary hover:text-white"
                onClick={() => setPixMessage(DEFAULT_PIX_MODEL)}
              >
                Usar Modelo Padrão
              </Button>
            </div>

            <div>
              <label className="text-xs sm:text-sm text-muted-foreground block mb-2 font-medium">Mensagem personalizada para cobrança</label>
              <Textarea 
                value={pixMessage} 
                onChange={e => setPixMessage(e.target.value)} 
                placeholder={DEFAULT_PIX_MODEL}
                className="mt-1 min-h-[180px] font-mono text-sm leading-relaxed bg-muted/20 border-border focus:border-primary transition-all"
                rows={8}
              />
            </div>
          </div>

          <div className="flex justify-start">
            <Button type="submit" size="lg" className="min-w-[200px] shadow-lg shadow-primary/20 transition-all active:scale-95" disabled={updateStore.isPending}>
              {updateStore.isPending ? <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </> : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </>
                )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminEnvios;
