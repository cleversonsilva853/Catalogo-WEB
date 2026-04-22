import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import { useStories, useCreateStory, useUpdateStory, useDeleteStory, useReorderStories, Story } from '@/hooks/useStories';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { uploadFile } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Plus, Pencil, Trash2, Loader2, Film, Image as ImageIcon,
  ArrowUp, ArrowDown, BookImage, X, Bell, Calendar, Video
} from 'lucide-react';


// ─── Componente de Upload de Vídeo ─────────────────────────────────────────
interface VideoUploadProps {
  currentUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

function VideoUpload({ currentUrl, onUpload, onRemove }: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
      toast({ title: 'Arquivo inválido', description: 'Selecione um vídeo MP4, WebM ou MOV', variant: 'destructive' });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'O tamanho máximo é 100MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    setProgress(10);

    try {
      // Simula progresso enquanto faz upload
      const interval = setInterval(() => setProgress(p => Math.min(p + 10, 85)), 400);
      const url = await uploadFile(file);
      clearInterval(interval);
      setProgress(100);
      onUpload(url);
      toast({ title: 'Vídeo enviado com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro ao enviar vídeo', description: error.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" className="hidden" onChange={handleFileSelect} />

      {currentUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-border w-full max-w-[180px]">
          <div className="aspect-[9/16]">
            <video src={currentUrl} className="w-full h-full object-cover" muted playsInline controls />
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-destructive text-white flex items-center justify-center shadow"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            'w-full h-40 rounded-xl border-2 border-dashed border-border',
            'flex flex-col items-center justify-center gap-2',
            'bg-muted/30 hover:bg-muted/50 transition-colors text-muted-foreground',
            isUploading && 'cursor-not-allowed opacity-80',
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">Enviando vídeo... {progress}%</span>
              <div className="w-3/4 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            <>
              <Video className="h-8 w-8" />
              <span className="text-sm font-medium">Clique para enviar vídeo</span>
              <span className="text-xs">MP4, WebM ou MOV até 100MB</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Stories() {
  const { toast } = useToast();
  const { data: stories, isLoading } = useStories(true);
  const createMutation = useCreateStory();
  const updateMutation = useUpdateStory();
  const deleteMutation = useDeleteStory();
  const reorderMutation = useReorderStories();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isActive, setIsActive] = useState(true);
  const [scheduledAt, setScheduledAt] = useState('');

  const sorted = [...(stories || [])].sort((a, b) => a.display_order - b.display_order);

  const resetForm = () => {
    setTitle(''); setSubtitle(''); setDescription('');
    setMediaUrl(''); setMediaType('image'); setIsActive(true);
    setScheduledAt('');
    setEditingId(null); setShowForm(false);
  };

  const openEdit = (story: Story) => {
    setEditingId(story.id);
    setTitle(story.title || '');
    setSubtitle(story.subtitle || '');
    setDescription(story.description || '');
    setMediaUrl(story.media_url);
    setMediaType(story.media_type);
    setIsActive(story.is_active);
    // Converte 'YYYY-MM-DD HH:mm:ss' → 'YYYY-MM-DDTHH:mm' para datetime-local
    setScheduledAt(story.scheduled_at ? story.scheduled_at.replace(' ', 'T').slice(0, 16) : '');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) { toast({ title: 'Selecione uma mídia', variant: 'destructive' }); return; }

    const data = {
      title, subtitle, description,
      media_url: mediaUrl, media_type: mediaType, is_active: isActive,
      scheduled_at: scheduledAt || null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data }, {
        onSuccess: () => { toast({ title: 'Story atualizado!' }); resetForm(); },
        onError: () => toast({ title: 'Erro ao atualizar', variant: 'destructive' }),
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => { toast({ title: 'Story criado!' }); resetForm(); },
        onError: () => toast({ title: 'Erro ao criar', variant: 'destructive' }),
      });
    }
  };

  const moveStory = (index: number, direction: 'up' | 'down') => {
    const newList = [...sorted];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    const updates = newList.map((s, i) => ({ id: s.id, display_order: i }));
    reorderMutation.mutate(updates);
  };

  const toggleActive = (story: Story) => {
    updateMutation.mutate({ id: story.id, is_active: !story.is_active });
  };

  return (
    <AdminLayout title="Stories">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-muted-foreground">Gerencie os stories exibidos no cardápio</p>
          <Button
            className="bg-primary text-primary-foreground"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Story
          </Button>
        </div>


        {/* Form */}
        {showForm && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingId ? 'Editar Story' : 'Novo Story'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Media Upload */}
                <div className="space-y-2">
                  <Label>Mídia (Imagem PNG/JPG ou Vídeo MP4) — Formato retrato 9:16</Label>
                  <div className="flex gap-3 mb-3">
                    <Button
                      type="button"
                      variant={mediaType === 'image' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMediaType('image')}
                    >
                      <ImageIcon className="w-4 h-4 mr-1" /> Imagem
                    </Button>
                    <Button
                      type="button"
                      variant={mediaType === 'video' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMediaType('video')}
                    >
                      <Film className="w-4 h-4 mr-1" /> Vídeo
                    </Button>
                  </div>
                  {mediaType === 'image' ? (
                    <ImageUpload
                      bucket="store-assets"
                      currentUrl={mediaUrl || null}
                      onUpload={(url) => setMediaUrl(url)}
                      onRemove={() => setMediaUrl('')}
                      aspectRatio="aspect-[9/16]"
                    />
                  ) : (
                    <VideoUpload
                      currentUrl={mediaUrl || null}
                      onUpload={(url) => setMediaUrl(url)}
                      onRemove={() => setMediaUrl('')}
                    />
                  )}
                </div>

                {/* Text Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Título</Label>
                    <Input placeholder="Título do story" value={title} onChange={e => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Subtítulo</Label>
                    <Input placeholder="Subtítulo" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva o produto, promoção ou informação do story..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <Label>Ativo (visível no cardápio)</Label>
                </div>

                {/* Agendamento de Notificação Push */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <Label className="font-semibold">Notificação Push Agendada</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Quando chegar essa data/hora, todos os dispositivos com a PWA instalada receberão uma notificação.
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={e => setScheduledAt(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    {scheduledAt && (
                      <button type="button" onClick={() => setScheduledAt('')} className="text-xs text-muted-foreground hover:text-destructive whitespace-nowrap">
                        Limpar
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingId ? 'Salvar' : 'Criar Story'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookImage className="h-5 w-5 text-primary" /> Lista de Stories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <BookImage className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Nenhum story criado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sorted.map((story, index) => (
                  <div key={story.id} className="flex items-center gap-4 p-3 rounded-xl border border-border/60 bg-card/50 hover:bg-muted/30 transition-colors">
                    {/* Thumbnail */}
                    <div className="w-12 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {story.media_type === 'video' ? (
                        <video src={story.media_url} className="w-full h-full object-cover" muted playsInline />
                      ) : (
                        <img src={story.media_url} alt={story.title || 'story'} className="w-full h-full object-cover" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{story.title || '(sem título)'}</p>
                      {story.subtitle && <p className="text-xs text-muted-foreground truncate">{story.subtitle}</p>}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={story.is_active ? 'default' : 'secondary'} className="text-[10px]">
                          {story.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {story.media_type === 'video' ? '🎬 Vídeo' : '🖼️ Imagem'}
                        </Badge>
                        {story.scheduled_at && !story.notification_sent && (
                          <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 bg-amber-50">
                            ⏰ Agendado: {new Date(story.scheduled_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          </Badge>
                        )}
                        {story.notification_sent ? (
                          <Badge variant="outline" className="text-[10px] border-green-400 text-green-700 bg-green-50">
                            ✅ Notificação enviada
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Switch
                        checked={story.is_active}
                        onCheckedChange={() => toggleActive(story)}
                        className="mr-1"
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveStory(index, 'up')} disabled={index === 0}>
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveStory(index, 'down')} disabled={index === sorted.length - 1}>
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(story)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover story?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(story.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
