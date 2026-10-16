import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Edit2, Eye, MapPin, MessageCircle, Phone, Trash2 } from 'lucide-react';


interface InstallmentActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installmentId: string | null;
  clientName: string;
  clientPhone: string;
  latitude?: number | null;
  longitude?: number | null;
  onWhatsAppClick: (phone: string) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function InstallmentActionsSheet({
  open,
  onOpenChange,
  installmentId,
  clientName,
  clientPhone,
  latitude,
  longitude,
  onWhatsAppClick,
  onView,
  onEdit,
  onDelete,
}: InstallmentActionsSheetProps) {
  const closeAndRun = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  const actions = [
    {
      id: 'whatsapp',
      label: 'مراسلة عبر واتساب',
      icon: MessageCircle,
      onClick: () => closeAndRun(() => onWhatsAppClick(clientPhone)),
    },
    {
      id: 'phone',
      label: 'اتصال هاتفي بالعميل',
      icon: Phone,
      onClick: () => closeAndRun(() => { window.location.href = `tel:${clientPhone}`; }),
    },
    ...(latitude != null && longitude != null
      ? [{
        id: 'map',
        label: 'عرض الموقع على الخريطة',
        icon: MapPin,
        onClick: () => closeAndRun(() => window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank')),
      }]
      : []),
    {
      id: 'view',
      label: 'عرض التفاصيل',
      icon: Eye,
      className: 'text-gray-500',
      disabled: !installmentId,
      onClick: () => installmentId && closeAndRun(() => onView(installmentId)),
    },
    {
      id: 'edit',
      label: 'تعديل البيانات',
      icon: Edit2,
      className: 'text-orange-500',
      disabled: !installmentId,
      onClick: () => installmentId && closeAndRun(() => onEdit(installmentId)),
    },
    {
      id: 'delete',
      label: 'حذف القسط',
      icon: Trash2,
      disabled: !installmentId,
      onClick: () => installmentId && closeAndRun(() => onDelete(installmentId)),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[500px] overflow-y-auto" dir="rtl">
        <SheetHeader className="text-right">
          <SheetTitle className="text-right text-xl mt-10">
            {clientName}
          </SheetTitle>
        </SheetHeader>

        <SidebarGroup>
          <SidebarGroupLabel >إجراءات القسط</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {actions.map(({ id, label, icon: Icon, className, disabled, onClick }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    size="lg"
                    className={className}
                    disabled={disabled}
                    onClick={onClick}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


      </SheetContent>


    </Sheet>
  );




}

