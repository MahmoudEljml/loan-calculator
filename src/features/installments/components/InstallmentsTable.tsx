// src/components/InstallmentsTable.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Settings, MapPin, CreditCard, Check } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Installment } from '@/features/installments/hooks/useInstallmentsStorage';
import useLocalStorage from '@/hooks/useLocalStorage';

// Define available columns
const AVAILABLE_COLUMNS = [
  { id: 'image', label: 'الصورة' },
  { id: 'installmentNumber', label: 'رقم القسط' },
  { id: 'loanDuration', label: 'مدة القرض' },
  { id: 'name', label: 'اسم العميل' },
  { id: 'nationalId', label: 'الرقم القومي' },
  { id: 'phone', label: 'رقم الهاتف' },
  { id: 'address', label: 'العنوان' },
  { id: 'amount', label: 'قيمة القسط' },
  { id: 'status', label: 'الحالة' },
  { id: 'actions', label: 'الإجراءات' },
];

// Default columns to show
const DEFAULT_COLUMNS = ['image', 'installmentNumber', 'loanDuration', 'name', 'nationalId', 'phone', 'address', 'amount', 'status', 'actions'];

interface InstallmentsTableProps {
  installments: Installment[];
  selectedClientId: string | null;
  onClientClick: (id: string) => void;
  onActionClick: (id: string, action: 'view' | 'edit' | 'delete' | 'notes' | 'actions') => void;
  getStatusColor: (status: 'pending' | 'paid') => string;
  getStatusLabel: (status: 'pending' | 'paid') => string;
}

export const InstallmentsTable: React.FC<InstallmentsTableProps> = ({
  installments,
  selectedClientId,
  onClientClick,
  onActionClick,
  getStatusColor,
  getStatusLabel,
}) => {
  // Use useLocalStorage hook to manage visible columns
  const [visibleColumns, setVisibleColumns] = useLocalStorage<string[]>('installmentsTableColumns', DEFAULT_COLUMNS);
  const [isColumnDialogOpen, setIsColumnDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setVisibleColumns(columns => {
      if (!columns.includes('code')) return columns;
      const migratedColumns = columns.map(column => column === 'code' ? 'installmentNumber' : column);
      if (!migratedColumns.includes('loanDuration')) migratedColumns.push('loanDuration');
      return [...new Set(migratedColumns)];
    });
  }, [setVisibleColumns]);

  // Toggle column visibility
  const toggleColumn = (columnId: string) => {
    setVisibleColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  // Reset to default columns
  const resetColumns = () => {
    setVisibleColumns(DEFAULT_COLUMNS);
  };

  return (
    <div>
      {/* Column Customization Button */}
      <div className="flex justify-end mb-4">
        <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">تخصيص الأعمدة</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-xl border-0 shadow-xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right text-lg">تخصيص أعمدة الجدول</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-muted-foreground">حدد الأعمدة التي تريد عرضها</span>
                <Button variant="ghost" size="sm" onClick={resetColumns}>
                  إعادة تعيين
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_COLUMNS.map(column => (
                  <div key={column.id} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={`column-${column.id}`}
                      checked={visibleColumns.includes(column.id)}
                      onCheckedChange={() => toggleColumn(column.id)}
                    />
                    <Label
                      htmlFor={`column-${column.id}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <DialogClose asChild>
                <Button variant="outline">إلغاء</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={() => setIsColumnDialogOpen(false)}>
                  <Check className="w-4 h-4 mr-2" />
                  تطبيق
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              {visibleColumns.includes('image') && (
                <th className="px-4 py-4 text-right font-semibold text-muted-foreground">الصورة</th>
              )}
              {visibleColumns.includes('installmentNumber') && (
                <th className="px-4 py-4 text-right font-semibold text-muted-foreground">رقم القسط</th>
              )}
              {visibleColumns.includes('loanDuration') && (
                <th className="px-4 py-4 text-right font-semibold text-muted-foreground">مدة القرض</th>
              )}
              {visibleColumns.includes('name') && (
                <th className="px-4 py-4 text-right font-semibold text-muted-foreground">اسم العميل</th>
              )}
              {visibleColumns.includes('nationalId') && (
                <th className="px-4 py-4 text-right font-semibold text-muted-foreground">الرقم القومي</th>
              )}
              {visibleColumns.includes('phone') && (
                <th className="px-4 py-4 text-right font-semibold text-muted-foreground">رقم الهاتف</th>
              )}
              {visibleColumns.includes('address') && (
                <th className="px-4 py-4 text-right font-semibold text-muted-foreground">العنوان</th>
              )}
              {visibleColumns.includes('amount') && (
                <th className="px-4 py-4 text-right font-semibold text-muted-foreground">قيمة القسط</th>
              )}
              {visibleColumns.includes('status') && (
                <th className="px-4 py-4 text-right font-semibold text-muted-foreground">الحالة</th>
              )}
              {visibleColumns.includes('actions') && (
                <th className="px-4 py-4 text-center font-semibold text-muted-foreground">الإجراءات</th>
              )}
            </tr>
          </thead>
          <tbody>
            {installments.map((installment) => (
              <tr
                key={installment.id}
                className={`border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer ${selectedClientId === installment.id ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''
                  }`}
                onClick={() => onClientClick(installment.id)}
              >
                {visibleColumns.includes('image') && (
                  <td className="px-4 py-3">
                    {installment.clientImages.length > 0 ? (
                      <div className="flex gap-1">
                        <img
                          src={installment.clientImages[0]}
                          alt="صورة العميل"
                          className="w-10 h-10 object-cover rounded-lg shadow-sm"
                          title={`${installment.clientImages.length} صورة`}
                        />
                        {installment.clientImages.length > 1 && (
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-xs font-semibold">
                            +{installment.clientImages.length - 1}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                )}
                {visibleColumns.includes('installmentNumber') && (
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {installment.installmentNumber ?? '-'}
                  </td>
                )}
                {visibleColumns.includes('loanDuration') && (
                  <td className="px-4 py-3 text-muted-foreground">
                    {installment.loanDuration != null ? `${installment.loanDuration} شهر` : '-'}
                  </td>
                )}
                {visibleColumns.includes('name') && (
                  <td className="px-4 py-3 font-medium">{installment.clientName || '-'}</td>
                )}
                {visibleColumns.includes('nationalId') && (
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {installment.nationalId || '-'}
                  </td>
                )}
                {visibleColumns.includes('phone') && (
                  <td className="px-4 py-3" dir="ltr">{installment.clientPhone || '-'}</td>
                )}
                {visibleColumns.includes('address') && (
                  <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate" title={installment.address}>
                        {installment.address || 'غير محدد'}
                      </span>
                      {installment.latitude && installment.longitude && (
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0" title="موقع GPS متوفر" />
                      )}
                    </div>
                  </td>
                )}
                {visibleColumns.includes('amount') && (
                  <td className="px-4 py-3 font-bold text-primary">{installment.installmentAmount} ج.م</td>
                )}
                {visibleColumns.includes('status') && (
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1.5 rounded-md text-xs font-semibold ${getStatusColor(installment.status)}`}>
                      {getStatusLabel(installment.status)}
                    </span>
                  </td>
                )}
                {visibleColumns.includes('actions') && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center items-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClientClick(installment.id);
                          onActionClick(installment.id, 'notes');
                        }}
                        className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 bg-transparent border shadow-sm"
                        title="الملاحظات"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline font-medium">
                          الملاحظات ({installment.notes.length})
                        </span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onActionClick(installment.id, 'actions');
                        }}
                        className="gap-1.5 shadow-sm"
                        title="الإجراءات"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline font-medium">الإجراءات</span>
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4 p-3 bg-muted/20">
        {installments.map((installment) => (
          <div
            key={installment.id}
            className={`border rounded-xl p-5 bg-card shadow-sm hover:shadow-md transition-all cursor-pointer ${selectedClientId === installment.id ? 'ring-2 ring-orange-500 dark:ring-orange-400' : ''
              }`}
            onClick={() => onClientClick(installment.id)}
          >
            <div className="space-y-4">
              <div className="flex gap-3 items-start justify-between">
                <div className="flex-1">
                  {visibleColumns.includes('installmentNumber') && installment.installmentNumber != null && (
                    <span className="inline-flex items-center gap-0.5 bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-muted-foreground">
                      رقم القسط: {installment.installmentNumber}
                    </span>
                  )}
                  {visibleColumns.includes('loanDuration') && installment.loanDuration != null && (
                    <span className="inline-flex items-center bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium text-muted-foreground mr-1">
                      مدة القرض: {installment.loanDuration} شهر
                    </span>
                  )}
                  {visibleColumns.includes('name') && (
                    <p className="font-bold text-lg">{installment.clientName || 'غير محدد'}</p>
                  )}

                  {visibleColumns.includes('nationalId') && installment.nationalId && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-mono">
                      <CreditCard className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span>{installment.nationalId}</span>
                    </p>
                  )}

                  {visibleColumns.includes('phone') && (
                    <p className="text-muted-foreground text-sm mt-1" dir="ltr">{installment.clientPhone}</p>
                  )}

                  {visibleColumns.includes('address') && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
                      <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                      <span>{installment.address || 'العنوان غير مسجل'}</span>
                    </p>
                  )}
                </div>
                {visibleColumns.includes('status') && (
                  <span className={`px-3 py-1.5 rounded-md text-xs font-bold shadow-sm ${getStatusColor(installment.status)}`}>
                    {getStatusLabel(installment.status)}
                  </span>
                )}
              </div>

              {visibleColumns.includes('amount') && (
                <div className="flex justify-between items-center text-sm border-t border-b py-3 my-3">
                  <div>
                    <span className="text-muted-foreground block text-xs">قيمة القسط</span>
                    <span className="font-bold text-primary">{installment.installmentAmount} ج.م</span>
                  </div>
                  <div className="text-left">
                    <span className="text-muted-foreground block text-xs">تاريخ الاستحقاق</span>
                    <span className="font-medium">{new Date(installment.dueDate).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
              )}

              {visibleColumns.includes('actions') && (
                <div className="flex gap-3 pt-1 flex-wrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClientClick(installment.id);
                      onActionClick(installment.id, 'notes');
                    }}
                    className="flex-1 gap-2 text-sm bg-transparent border shadow-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  >
                    <FileText className="w-4 h-4" />
                    ملاحظات ({installment.notes.length})
                  </Button>


                  <Button variant="outline" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    onClientClick(installment.id)
                    onActionClick(installment.id, 'actions');
                  }} className="flex-1 gap-2 text-sm shadow-sm">
                    <Settings className="w-4 h-4" />
                    الإجراءات
                  </Button>

                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
