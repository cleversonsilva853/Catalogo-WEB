import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  useSocialMedia, 
  useCreateSocialMedia, 
  useUpdateSocialMedia, 
  useDeleteSocialMedia,
  SocialMedia as SocialMediaModel
} from '@/hooks/useSocialMedia';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Globe, 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Loader2,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';

const getSocialIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('instagram')) return <Instagram className="h-5 w-5" />;
  if (n.includes('facebook')) return <Facebook className="h-5 w-5" />;
  if (n.includes('whatsapp')) return <MessageCircle className="h-5 w-5" />;
  return <Globe className="h-5 w-5" />;
};

export default function SocialMedia() {
  const { toast } = useToast();
  const { data: socials, isLoading } = useSocialMedia();
  const createMutation = useCreateSocialMedia();
  const updateMutation = useUpdateSocialMedia();
  const deleteMutation = useDeleteSocialMedia();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState('0');

  const resetForm = () => {
    setName('');
    setLink('');
    setIconUrl('');
    setIsActive(true);
    setDisplayOrder('0');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (item: SocialMediaModel) => {
    setName(item.name);
    setLink(item.link);
    setIconUrl(item.icon_url || '');
    setIsActive(item.is_active);
    setDisplayOrder(item.display_order.toString());
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !link.trim()) {
      toast({ title: 'Erro', description: 'Preencha nome e link.', variant: 'destructive' });
      return;
    }

    const payload = {
      name: name.trim(),
      link: link.trim(),
      icon_url: iconUrl.trim() || null,
      is_active: isActive,
      display_order: parseInt(displayOrder) || 0
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast({ title: 'Sucesso', description: 'Rede social atualizada.' });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: 'Sucesso', description: 'Rede social adicionada.' });
      }
      resetForm();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message || 'Erro ao salvar.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta rede social?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: 'Sucesso', description: 'Removida com sucesso.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message || 'Erro ao remover.', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout title="Redes Sociais">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" /> Redes Sociais
          </h2>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="text-base">
                {editingId ? 'Editar Rede Social' : 'Nova Rede Social'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome (ex: Instagram, Link Direto)</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Instagram" />
                </div>
                <div className="space-y-2">
                  <Label>Link (URL Completa)</Label>
                  <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>URL do Ícone (Opcional - Image URL)</Label>
                  <div className="flex gap-2">
                    <Input value={iconUrl} onChange={e => setIconUrl(e.target.value)} placeholder="https://.../icon.png" />
                    <Button variant="outline" size="icon" title="Preview">
                      {iconUrl ? <img src={iconUrl} className="h-4 w-4 object-contain" alt="icon" /> : <ImageIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ordem de Exibição</Label>
                  <Input type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Ativo (Visível no cardápio)</Label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Salvar
                </Button>
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : socials?.length === 0 ? (
          <Card className="admin-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma rede social configurada.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {socials?.map(item => (
              <Card key={item.id} className={`admin-card ${!item.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center bg-muted rounded-full overflow-hidden">
                      {item.icon_url ? (
                        <img src={item.icon_url} className="h-full w-full object-cover" alt={item.name} />
                      ) : (
                        getSocialIcon(item.name)
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                        Abrir link <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
