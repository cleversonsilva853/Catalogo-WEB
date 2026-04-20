import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useActiveDrivers, useAssignDriver, Driver } from "@/hooks/useDrivers";
import { Truck, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { UnifiedOrder } from "@/hooks/useAllOrders";

interface DriverSelectorModalProps {
  order: UnifiedOrder | null;
  onClose: () => void;
}

export function DriverSelectorModal({ order, onClose }: DriverSelectorModalProps) {
  const { data: drivers, isLoading } = useActiveDrivers();
  const assignDriver = useAssignDriver();

  const handleSelect = (driver: Driver) => {
    if (!order) return;
    
    assignDriver.mutate(
      { 
        orderId: order.id, 
        driverId: driver.id, 
        driverName: driver.name 
      },
      {
        onSuccess: () => {
          toast.success(`Entregador ${driver.name} atribuído ao pedido #${order.id}`);
          onClose();
        },
        onError: (error: any) => {
          toast.error(`Erro ao atribuir entregador: ${error.message}`);
        }
      }
    );
  };

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Selecionar Entregador
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando entregadores...</p>
            </div>
          ) : !drivers || drivers.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-3" />
              <p className="text-muted-foreground">Nenhum entregador ativo encontrado.</p>
              <p className="text-xs text-muted-foreground mt-1">Configure em Painel &gt; Entregadores</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {drivers.map((driver) => (
                <Button
                  key={driver.id}
                  variant="outline"
                  className={`h-16 justify-start gap-4 px-4 hover:border-primary hover:bg-primary/5 transition-all ${
                    order?.driver_id === driver.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''
                  }`}
                  onClick={() => handleSelect(driver)}
                  disabled={assignDriver.isPending}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="font-bold text-base truncate w-full text-foreground">{driver.name}</span>
                    <span className="text-xs text-muted-foreground">Clique para selecionar</span>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>

        {assignDriver.isPending && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
