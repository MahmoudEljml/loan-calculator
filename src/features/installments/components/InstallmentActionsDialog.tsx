import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, MessageCircle, Phone } from 'lucide-react';

interface InstallmentActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installmentId: string | null;
  clientName: string;
  clientPhone: string;
  onWhatsAppClick: (phone: string) => void;
  onView: (id: string) => void;
}

export function InstallmentActionsDialog({
  open,
  onOpenChange,
  installmentId,
  clientName,
  clientPhone,
  onWhatsAppClick,
  onView,
}: InstallmentActionsDialogProps) {
  const closeAndRun = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-right">إجراءات القسط</DialogTitle>
          <DialogDescription className="text-right">{clientName}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Button
            variant="outline"
            className="justify-start gap-3"
            onClick={() => closeAndRun(() => onWhatsAppClick(clientPhone))}
          >
            <MessageCircle className="w-4 h-4" />
            مراسلة عبر واتساب
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-3"
            onClick={() => closeAndRun(() => { window.location.href = `tel:${clientPhone}`; })}
          >
            <Phone className="w-4 h-4" />
            اتصال هاتفي بالعميل
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-3"
            disabled={!installmentId}
            onClick={() => installmentId && closeAndRun(() => onView(installmentId))}
          >
            <Eye className="w-4 h-4" />
            عرض التفاصيل
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
