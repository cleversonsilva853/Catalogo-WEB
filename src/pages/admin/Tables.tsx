import { useState } from 'react';
import { Plus, Trash2, Loader2, Utensils, Users, Pencil, QrCode, Download, ExternalLink } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useTables, useCreateTable, useUpdateTable, useDeleteTable, Table } from '@/hooks/useTables';
import { useStore } from '@/hooks/useStore';

// Helper to convert HSL to HEX for PDF generation
const hslToHex = (hslString: string): string => {
  if (hslString.startsWith('#')) return hslString;
  const cleanString = hslString.replace(/hsl\(|\)|,/g, ' ').trim();
  const parts = cleanString.split(/\s+/).filter(p => p.length > 0);
  if (parts.length < 3) return '#ea384c';
  const h = parseFloat(parts[0]) || 0;
  const s = parseFloat(parts[1].replace('%', '')) / 100;
  const l = parseFloat(parts[2].replace('%', '')) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const AdminTables = () => {
  const { toast } = useToast();
  const { data: storeConfig } = useStore();
  const { data: tables = [], isLoading: loadingTables } = useTables();
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    capacity: '4'
  });

  const getBaseUrl = () => {
    if (storeConfig?.subdomain_slug) {
      return `https://${storeConfig.subdomain_slug}.infornexa.com.br`;
    }
    return window.location.origin;
  };

  const handleOpenDialog = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        number: String(table.number),
        name: table.name || '',
        capacity: String(table.capacity)
      });
    } else {
      setEditingTable(null);
      setFormData({
        number: String(tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1),
        name: '',
        capacity: '4'
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(formData.number);
    if (isNaN(num) || num <= 0) {
      toast({ title: 'Número inválido', variant: 'destructive' });
      return;
    }

    const data = {
      number: num,
      name: formData.name || null,
      capacity: parseInt(formData.capacity) || 4,
    };

    try {
      if (editingTable) {
        await updateTable.mutateAsync({ id: editingTable.id, data });
        toast({ title: 'Mesa atualizada!' });
      } else {
        await createTable.mutateAsync(data);
        toast({ title: 'Mesa criada com sucesso!' });
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string, number: number) => {
    if (!confirm(`Deseja realmente excluir a Mesa #${number}?`)) return;
    try {
      await deleteTable.mutateAsync(id);
      toast({ title: 'Mesa excluída' });
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
    }
  };

  const generatePDF = async (table: Table) => {
    setGeneratingPDF(table.id);
    const baseUrl = getBaseUrl();
    const tableUrl = `${baseUrl}/#/mesa=${table.number}`;

    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const centerX = pageWidth / 2;

      const colorHex = hslToHex(storeConfig?.primary_color || '0 84% 60%');
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 234, g: 56, b: 76 };
      };
      const rgb = hexToRgb(colorHex);

      // Header background
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.rect(0, 0, pageWidth, 45, "F");

      let currentY = 60;
      
      // Store Name
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.setTextColor(33, 33, 33);
      pdf.text(storeConfig?.name || "Nosso Cardápio", centerX, currentY, { align: "center" });
      currentY += 15;

      // Table Identifier
      pdf.setFontSize(36);
      pdf.setTextColor(rgb.r, rgb.g, rgb.b);
      pdf.text(`MESA ${table.number}`, centerX, currentY, { align: "center" });
      currentY += 15;

      // QR Code
      const qrCanvas = document.getElementById(`qr-canvas-${table.id}`) as HTMLCanvasElement;
      if (qrCanvas) {
        const qrDataUrl = qrCanvas.toDataURL("image/png");
        const qrSize = 100;
        const qrX = centerX - qrSize / 2;
        pdf.addImage(qrDataUrl, "PNG", qrX, currentY, qrSize, qrSize);
        currentY += qrSize + 15;
      }

      // Instructions
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(14);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Aponte a câmera do seu celular para fazer seu pedido", centerX, currentY, { align: "center" });
      currentY += 8;
      pdf.setFontSize(10);
      pdf.text(tableUrl, centerX, currentY, { align: "center" });

      // Footer
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.rect(0, pageHeight - 15, pageWidth, 15, "F");

      pdf.save(`mesa-${table.number}-qrcode.pdf`);
      toast({ title: 'PDF exportado com sucesso!' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao gerar PDF', variant: 'destructive' });
    } finally {
      setGeneratingPDF(null);
    }
  };

  return (
    <AdminLayout title="Gerenciar Mesas">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Controle de Mesas</h2>
            <p className="text-muted-foreground text-sm">Cadastre e gere QR Codes individuais por mesa</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} size="lg" className="shadow-lg">
                <Plus className="h-5 w-5 mr-2" />
                Nova Mesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTable ? `Editar Mesa #${editingTable.number}` : 'Cadastrar Nova Mesa'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="number">Número da Mesa</Label>
                    <Input
                      id="number"
                      type="number"
                      value={formData.number}
                      onChange={e => setFormData({ ...formData, number: e.target.value })}
                      placeholder="Ex: 1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacidade (Pessoas)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="Ex: 4"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Identificação/Nome (Opcional)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Mesa da Janela, VIP, etc."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={createTable.isPending || updateTable.isPending}>
                    {createTable.isPending || updateTable.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : editingTable ? 'Salvar Alterações' : 'Criar Mesa'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loadingTables ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : tables.length === 0 ? (
          <Card className="border-dashed border-2 py-20 text-center">
            <Utensils className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground text-lg">Nenhuma mesa cadastrada.</p>
            <Button variant="link" onClick={() => handleOpenDialog()} className="mt-2 text-primary">
              Clique aqui para criar sua primeira mesa
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map(table => (
              <Card key={table.id} className="overflow-hidden group hover:shadow-md transition-all border-none bg-card shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Utensils className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-lg font-bold">Mesa #{table.number}</CardTitle>
                  </div>
                  <Badge 
                    variant={table.status === 'available' ? 'secondary' : 'destructive'}
                    className="text-[10px] uppercase font-bold"
                  >
                    {table.status === 'available' ? 'Livre' : 'Ocupada'}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-2 space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>Capacidade: {table.capacity} pessoas</span>
                    </div>
                  </div>
                  
                  {table.name && (
                    <div className="text-xs bg-muted/50 p-2 rounded-md italic text-muted-foreground">
                      "{table.name}"
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl border border-border">
                    <QRCodeCanvas
                      id={`qr-canvas-${table.id}`}
                      value={`${getBaseUrl()}/#/mesa=${table.number}`}
                      size={140}
                      level="H"
                      includeMargin
                    />
                    <div className="flex gap-2 w-full">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1 text-[10px] h-8"
                        onClick={() => window.open(`${getBaseUrl()}/#/mesa=${table.number}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver Link
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="flex-1 text-[10px] h-8 bg-primary text-primary-foreground"
                        disabled={generatingPDF === table.id}
                        onClick={() => generatePDF(table)}
                      >
                        {generatingPDF === table.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}
                        PDF
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleOpenDialog(table)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDelete(table.id, table.number)}
                    >
                      <Trash2 className="h-3 w-3" />
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
};

export default AdminTables;
