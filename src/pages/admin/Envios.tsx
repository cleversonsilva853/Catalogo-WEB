import { useState, useEffect } from 'react';
import { Loader2, MessageSquare, Send, Calendar, ImagePlus, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useStore, useUpdateStore } from '@/hooks/useStore';
import { useToast } from '@/hooks/use-toast';
import { useBulkMessages } from '@/hooks/useBulkMessages';
import { ImageUpload } from '@/components/admin/ImageUpload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AdminEnvios = () => {
  const { data: store, isLoading } = useStore();
  const updateStore = useUpdateStore();
  const { createBulkMessage, clients, isLoadingClients } = useBulkMessages();
  const { toast } = useToast();
  
  const [pixMessage, setPixMessage] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');

  // Bulk Message Form State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkData, setBulkData] = useState({
    scheduled_at: '',
    media_url: '',
    message: ''
  });

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

  const handleCreateBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkData.scheduled_at || !bulkData.message) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    try {
      await createBulkMessage.mutateAsync(bulkData);
      toast({ title: 'Envio agendado com sucesso!' });
      setIsBulkModalOpen(false);
      setBulkData({ scheduled_at: '', media_url: '', message: '' });
    } catch (e: any) {
      toast({ title: 'Erro ao agendar', description: e.message, variant: 'destructive' });
    }
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
      <div className="max-w-5xl mx-auto space-y-8">
        {/* SECTION 1: Bulk Messages */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-8 bg-primary rounded-full mr-1" />
              Envios em massa no WhatsApp dos clientes
            </h2>
            <p className="text-sm text-slate-500 ml-4">Ative o marketing direto e envie ofertas para toda sua base.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:border-primary/30 transition-all">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
              <Send className="h-10 w-10 rotate-[-15deg]" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-slate-900">Potencialize suas vendas!</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-lg">
                Selecione seus clientes cadastrados e envie promoções, novos stories ou avisos importantes diretamente no WhatsApp deles.
              </p>
            </div>

            <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  <Plus className="h-5 w-5 mr-2" />
                  Criar envio
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white border-slate-200 text-slate-900 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <Send className="h-5 w-5 text-primary" />
                    Novo Envio em Massa
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleCreateBulk} className="space-y-6 pt-4">
                  {/* Reach Indicator */}
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Alcance Estimado</p>
                      <p className="text-lg font-extrabold text-primary">
                        {isLoadingClients ? 'Carregando...' : `${clients.length} clientes únicos`}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight">Baseado no seu histórico de pedidos.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Date & Time */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        Data e Hora do Envio
                      </Label>
                      <Input 
                        type="datetime-local" 
                        className="bg-slate-50 border-slate-200 h-11"
                        value={bulkData.scheduled_at}
                        onChange={e => setBulkData({ ...bulkData, scheduled_at: e.target.value })}
                        required
                      />
                    </div>

                    {/* Media Upload */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                        <ImagePlus className="h-3.5 w-3.5 text-primary" />
                        Imagem ou Vídeo (Opcional)
                      </Label>
                      <ImageUpload 
                        bucket="store-assets"
                        currentUrl={bulkData.media_url}
                        onUpload={url => setBulkData({ ...bulkData, media_url: url })}
                        onRemove={() => setBulkData({ ...bulkData, media_url: '' })}
                        className="h-32"
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                        Sua Mensagem
                      </Label>
                      <Textarea 
                        placeholder="Escreva aqui o que seus clientes vão receber..."
                        className="min-h-[120px] bg-slate-50 border-slate-200"
                        value={bulkData.message}
                        onChange={e => setBulkData({ ...bulkData, message: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="flex-1"
                      onClick={() => setIsBulkModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 shadow-lg shadow-primary/20"
                      disabled={createBulkMessage.isPending}
                    >
                      {createBulkMessage.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Salvar Envio
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* SECTION 2: Order Messages */}
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-8 bg-blue-500 rounded-full mr-1" />
              Envios dos Pedidos
            </h2>
            <p className="text-sm text-slate-500 ml-4">Mensagens automáticas disparadas no fluxo de compra.</p>
          </div>

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
      </div>
    </AdminLayout>
  );
};

export default AdminEnvios;
