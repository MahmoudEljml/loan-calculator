import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInstallmentsStorage } from '../hooks/useInstallmentsStorage';
import { Plus, Trash2, Edit2, Search, Eye, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export function InstallmentsPage() {
  const navigate = useNavigate();
  const { installments, isLoaded, deleteInstallment } = useInstallmentsStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredInstallments = useMemo(() => {
    if (!searchTerm) return installments;
    const term = searchTerm.toLowerCase();
    return installments.filter(
      installment =>
        installment.clientName.toLowerCase().includes(term) ||
        installment.clientPhone.toLowerCase().includes(term) ||
        installment.firstGuarantorName.toLowerCase().includes(term)
    );
  }, [installments, searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      await deleteInstallment(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete installment:', error);
      toast.error('فشل في حذف القسط');
    }
  };

  const getStatusColor = (status: 'pending' | 'paid') => {
    return status === 'paid'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  };

  const getStatusLabel = (status: 'pending' | 'paid') => {
    return status === 'paid' ? 'مدفوع' : 'قيد الانتظار';
  };

  if (!isLoaded) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4 text-start" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">إدارة الأقساط</h1>
        <Button onClick={() => navigate('/edit-installment?action=add')} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          قسط جديد
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="ابحث باسم العميل أو رقم الهاتف أو اسم الضامن..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-4 pr-10"
        />
      </div>

      {/* Table - Desktop View */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-right font-semibold">الصورة</th>
              <th className="px-4 py-3 text-right font-semibold">اسم العميل</th>
              <th className="px-4 py-3 text-right font-semibold">رقم الهاتف</th>
              <th className="px-4 py-3 text-right font-semibold">قيمة القسط</th>
              <th className="px-4 py-3 text-right font-semibold">الحالة</th>
              <th className="px-4 py-3 text-center font-semibold">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredInstallments.map((installment) => (
              <tr key={installment.id} className="border-t hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  {installment.clientImages.length > 0 ? (
                    <div className="flex gap-1">
                      <img
                        src={installment.clientImages[0]}
                        alt="صورة العميل"
                        className="w-10 h-10 object-cover rounded"
                        title={`${installment.clientImages.length} صورة`}
                      />
                      {installment.clientImages.length > 1 && (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs font-semibold">
                          +{installment.clientImages.length - 1}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3">{installment.clientName || '-'}</td>
                <td className="px-4 py-3">{installment.clientPhone || '-'}</td>
                <td className="px-4 py-3">{installment.installmentAmount} ج.م</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(installment.status)}`}>
                    {getStatusLabel(installment.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/edit-installment?id=${installment.id}&action=view`)}
                      className="gap-1"
                      title="عرض"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">عرض</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/edit-installment?id=${installment.id}&action=edit`)}
                      className="gap-1"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="hidden sm:inline">تعديل</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/edit-installment?id=${installment.id}&action=notes`)}
                      className="gap-1"
                      title="ملاحظات"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs">
                        {installment.notes.length}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(installment.id)}
                      className="gap-1 text-destructive hover:text-destructive"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">حذف</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card View - Mobile */}
      <div className="sm:hidden space-y-3">
        {filteredInstallments.map((installment) => (
          <div key={installment.id} className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors">
            <div className="space-y-3">
              <div className="flex gap-3 items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold">{installment.clientName || 'غير محدد'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(installment.status)}`}>
                  {getStatusLabel(installment.status)}
                </span>
              </div>
              <div className="text-sm space-y-1 border-t pt-2">
                <p>
                  <span className="font-medium">رقم الهاتف:</span> {installment.clientPhone}
                </p>
                <p>
                  <span className="font-medium">القسط:</span> {installment.installmentAmount} ج.م
                </p>
                <p>
                  <span className="font-medium">الاستحقاق:</span> {new Date(installment.dueDate).toLocaleDateString('ar-EG')}
                </p>

              </div>
              <div className="flex gap-2 pt-2 border-t flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/edit-installment?id=${installment.id}&action=view`)}
                  className="flex-1 gap-1 text-xs"
                >
                  <Eye className="w-3 h-3" />
                  عرض
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/edit-installment?id=${installment.id}&action=edit`)}
                  className="flex-1 gap-1 text-xs"
                >
                  <Edit2 className="w-3 h-3" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/edit-installment?id=${installment.id}&action=notes`)}
                  className="flex-1 gap-1 text-xs"
                >
                  <MessageSquare className="w-3 h-3" />
                  ({installment.notes.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(installment.id)}
                  className="flex-1 gap-1 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                  حذف
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredInstallments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد أقساط حالياً'}
          </p>
          {!searchTerm && (
            <Button onClick={() => navigate('/edit-installment?action=add')}>
              <Plus className="w-4 h-4 mr-2" />
              إضافة قسط جديد
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-sm w-full text-center" dir="rtl">
            <h3 className="text-lg font-semibold mb-4">تأكيد الحذف</h3>
            <p className="text-muted-foreground mb-6">
              هل أنت متأكد من رغبتك في حذف هذا القسط؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-20 justify-center ">
              <Button
                className="right-0 "
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                إلغاء
              </Button>
              <Button
                className="left-0 "
                variant="destructive"
                onClick={() => handleDelete(deleteConfirm)}
              >
                حذف
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
