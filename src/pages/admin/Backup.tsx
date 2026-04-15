import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Download, 
  Upload, 
  Loader2, 
  Database, 
  FileJson, 
  CheckCircle2, 
  AlertTriangle,
  ShoppingBag,
  Tag,
  Users,
  MapPin,
  Clock,
  Ticket,
  PlusCircle,
  Settings,
  Package,
  ClipboardList,
  UserCog,
  DollarSign,
  Trash2
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface BackupData {
  version: string;
  created_at: string;
  store_config: any;
  categories: any[];
  products: any[];
  addon_groups: any[];
  addon_options: any[];
  product_addon_groups: any[];
  coupons: any[];
  delivery_zones: any[];
  business_hours: any[];
  user_roles: any[];
  customer_addresses: any[];
  // Inventory (NEW)
  ingredients: any[];
  product_ingredients: any[];
  // History & Orders (Report Data)
  orders: any[];
  order_items: any[];
  comandas: any[];
  comanda_pedidos: any[];
  comanda_vendas: any[];
  // Financial (NEW)
  caixa_sessions: any[];
  caixa_movimentacoes: any[];
  admin_users: any[];
}

const AdminBackup = () => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = async () => {
    if (!window.confirm('TEM CERTEZA ABSOLUTA?\n\nIsso irá APAGAR GERAL todos os pedidos, comandas, itens vendidos e sessões de caixa do sistema.\n\nEsta ação NÃO PODE SER DESFEITA.')) {
      return;
    }

    toast({
      title: 'Atenção',
      description: 'O recurso de reset no painel foi desativado. Apague os dados via phpMyAdmin (HostGator).',
      variant: 'destructive',
    });
  };
  const [progress, setProgress] = useState(0);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<BackupData | null>(null);

  const tables = [
    { name: 'store_config', label: 'Configurações da Loja', icon: Settings },
    { name: 'categories', label: 'Categorias', icon: Tag },
    { name: 'products', label: 'Produtos', icon: ShoppingBag },
    { name: 'addon_groups', label: 'Grupos de Acréscimos', icon: PlusCircle },
    { name: 'addon_options', label: 'Opções de Acréscimos', icon: PlusCircle },
    { name: 'product_addon_groups', label: 'Vínculos Produto-Acréscimo', icon: PlusCircle },
    { name: 'coupons', label: 'Cupons', icon: Ticket },
    { name: 'delivery_zones', label: 'Zonas de Entrega', icon: MapPin },
    { name: 'business_hours', label: 'Horários de Funcionamento', icon: Clock },
    { name: 'ingredients', label: 'Ingredientes (Estoque)', icon: Package },
    { name: 'product_ingredients', label: 'Composição de Produtos', icon: ClipboardList },
    { name: 'orders', label: 'Pedidos Delivery/Comandas', icon: Package },
    { name: 'order_items', label: 'Itens dos Pedidos', icon: ClipboardList },
    { name: 'comandas', label: 'Comandas Ativas', icon: Database },
    { name: 'comanda_vendas', label: 'Vendas de Comandas', icon: DollarSign },
    { name: 'caixa_sessions', label: 'Sessões de Caixa', icon: Database },
    { name: 'caixa_movimentacoes', label: 'Movimentações de Caixa', icon: DollarSign },
    { name: 'admin_users', label: 'Usuários Admin (Equipe)', icon: Users },
    { name: 'user_roles', label: 'Permissões de Usuário', icon: UserCog },
    { name: 'customer_addresses', label: 'Endereços de Clientes', icon: MapPin },
  ];

  const exportBackup = async () => {
    toast({
      title: 'Backup externo',
      description: 'Recomendamos usar o cPanel Hostgator / phpMyAdmin para backups completos de MySQL.',
    });
    setIsExporting(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Selecione um arquivo .json de backup.',
        variant: 'destructive',
      });
      return;
    }

    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as BackupData;
        if (!data.version || !data.created_at) {
          throw new Error('Invalid backup format');
        }
        setPreviewData(data);
      } catch {
        toast({
          title: 'Arquivo inválido',
          description: 'O arquivo não é um backup válido.',
          variant: 'destructive',
        });
        setImportFile(null);
        setPreviewData(null);
      }
    };
    reader.readAsText(file);
  };

  const importBackup = async () => {
    if (!previewData) return;

    toast({
      title: 'Importação Bloqueada',
      description: 'Por segurança do MySQL, a importação direta via app foi desabilitada. Use o phpMyAdmin.',
      variant: 'destructive'
    });
    setIsImporting(false);
  };

  const cancelImport = () => {
    setImportFile(null);
    setPreviewData(null);
  };

  return (
    <AdminLayout title="Backup">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Backup do Sistema</h2>
          <p className="text-muted-foreground mt-1">
            Exporte ou importe todos os dados, incluindo histórico de vendas e relatórios
          </p>
        </div>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Exportar Backup Completo
            </CardTitle>
            <CardDescription>
              Gera um arquivo JSON com TODO o conteúdo do sistema: produtos, pedidos, comandas, caixa e estoque.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {tables.map((table) => (
                <div
                  key={table.name}
                  className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2"
                >
                  <table.icon className="h-4 w-4" />
                  <span>{table.label}</span>
                </div>
              ))}
            </div>

            {isExporting && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Exportando... {Math.round(progress)}%
                </p>
              </div>
            )}

            <Button
              onClick={exportBackup}
              disabled={isExporting}
              className="w-full sm:w-auto"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Backup Completo
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Importar Backup
            </CardTitle>
            <CardDescription>
              Restaure o sistema a partir de um arquivo de backup completo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Risco de Perda de Dados!</AlertTitle>
              <AlertDescription>
                A importação irá <strong>sobrescrever todo o banco de dados</strong>.
              </AlertDescription>
            </Alert>

            {!previewData ? (
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                <FileJson className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Selecione um arquivo .json de backup
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Arquivo
                    </span>
                  </Button>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Arquivo: {importFile?.name}</AlertTitle>
                  <AlertDescription>
                    Criado em {format(new Date(previewData.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </AlertDescription>
                </Alert>

                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <h4 className="font-medium text-foreground">Conteúdo do Backup:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2">
                      <span className="text-muted-foreground">Produtos</span>
                      <span className="font-medium">{previewData.products?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2 border-2 border-primary/30">
                      <span className="text-muted-foreground font-semibold">Vendas (Relatórios)</span>
                      <span className="font-bold text-primary">{previewData.orders?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2">
                      <span className="text-muted-foreground">Comandas</span>
                      <span className="font-medium">{previewData.comandas?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2">
                      <span className="text-muted-foreground">Caixa</span>
                      <span className="font-medium">{previewData.caixa_sessions?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2">
                      <span className="text-muted-foreground">Estoque</span>
                      <span className="font-medium">{previewData.ingredients?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2">
                      <span className="text-muted-foreground">Zonas</span>
                      <span className="font-medium">{previewData.delivery_zones?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      Restaurando... {Math.round(progress)}%
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={importBackup}
                    disabled={isImporting}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Restaurando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Substituir Dados Agora
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={cancelImport}
                    disabled={isImporting}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reset Section */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Apagar Registros
            </CardTitle>
            <CardDescription>
              Apaga apenas as transações (pedidos, itens, comandas, caixa), mantendo os produtos, estoque e configurações intactos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Cuidado MÁXIMO!</AlertTitle>
              <AlertDescription>
                Esta ação apagará permanentemente todo o histórico de vendas. É recomendado gerar um Backup Completo antes de prosseguir.
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleResetData}
              disabled={isResetting || isExporting || isImporting}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Apagando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Apagar geral
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-muted/30 border-primary/20">
          <CardContent className="pt-6">
            <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Backup Total (com Relatórios)
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• <strong>Relatórios e Vendas</strong>: Histórico de todos os pedidos e itens vendidos.</li>
              <li>• <strong>Financeiro (Caixa)</strong>: Sessões abertas/fechadas e todas as entradas/saídas.</li>
              <li>• <strong>Estoque Completo</strong>: Ingredientes, produtos e fichas técnicas (composições).</li>
              <li>• <strong>Equipe e Acessos</strong>: Usuários do painel admin e suas permissões configuradas.</li>
              <li>• <strong>Configurações</strong>: Produtos, categorias, taxas de entrega e horários.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminBackup;

