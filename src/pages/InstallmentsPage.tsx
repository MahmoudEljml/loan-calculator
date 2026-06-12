import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInstallmentsStorage } from '../hooks/useInstallmentsStorage';
import { useExportImportInstallments } from '../hooks/useExportImportInstallments';
import useLocalStorage from '../hooks/useLocalStorage';
import { Plus, Trash2, Edit2, Search, Eye, MessageSquare, Download, Upload, MoreVertical, MessageCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';



export function InstallmentsPage() {
  const navigate = useNavigate();
  const { installments, isLoaded, deleteInstallment } = useInstallmentsStorage();
  const { exportInstallments, importInstallments } = useExportImportInstallments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // استخدام useLocalStorage hook لحفظ الفلاتر
  const [filters, setFilters] = useLocalStorage('loan_calculator_filters', {
    searchTerm: '',
    dateFilter: 'all',
    statusFilter: 'all',
  });

  // استخدام useLocalStorage hook لحفظ العميل المحدد
  const [selectedClientId, setSelectedClientId] = useLocalStorage<string | null>('selected_client_id', null);

  // استخدام useLocalStorage hook لحفظ حالة إظهار إجمالي الأقساط
  const [showTotalAmount, setShowTotalAmount] = useState(false);

  // تحديث الفلاتر عند تغييرها
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm);
  const [dateFilter, setDateFilter] = useState(filters.dateFilter);
  const [statusFilter, setStatusFilter] = useState(filters.statusFilter);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // حفظ الفلاتر عند تغييرها
  useEffect(() => {
    const newFilters = {
      searchTerm,
      dateFilter,
      statusFilter,
    };

    setFilters(newFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, dateFilter, statusFilter]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importInstallments(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredInstallments = useMemo(() => {
    let filtered = [...installments];

    // تطبيق فلترة البحث
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        installment =>
          installment.clientName.toLowerCase().includes(term) ||
          installment.clientPhone.toLowerCase().includes(term) ||
          installment.firstGuarantorName.toLowerCase().includes(term)
      );
    }

    // تطبيق فلترة التاريخ
    if (dateFilter !== 'all') {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      filtered = filtered.filter(installment => {
        const dueDate = new Date(installment.dueDate);
        const dueDay = dueDate.getDate();

        if (dateFilter === 'days1-9') {
          return dueDay >= 1 && dueDay <= 9 && dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
        } else if (dateFilter === 'days10-19') {
          return dueDay >= 10 && dueDay <= 19 && dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
        } else if (dateFilter === 'days20-end') {
          return dueDay >= 20 && dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
        }
        return true;
      });
    }

    // تطبيق فلترة الحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter(installment => installment.status === statusFilter);
    }

    return filtered;
  }, [installments, searchTerm, dateFilter, statusFilter]);

  // Calculate total amount of filtered installments
  const totalAmount = useMemo(() => {
    return filteredInstallments.reduce((total, installment) => {
      return total + Number(installment.installmentAmount);
    }, 0);
  }, [filteredInstallments]);

  const handleDelete = async (id: string) => {
    try {
      await deleteInstallment(id);
      setDeleteConfirm(null);
      // إذا تم حذف العميل المحدد، قم بإلغاء تحديده
      if (id === selectedClientId) {
        setSelectedClientId(null);
      }
    } catch (error) {
      console.error('Failed to delete installment:', error);
      toast.error('فشل في حذف القسط');
    }
  };

  const handleWhatsAppClick = (phone: string) => {
    // تحويل رقم الهاتف إلى التنسيق الصحيح للواتساب
    const formattedPhone = phone.replace(/^0/, '20').replace(/\s/g, '');
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const getStatusColor = (status: 'pending' | 'paid') => {
    return status === 'paid'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  };

  const getStatusLabel = (status: 'pending' | 'paid') => {
    return status === 'paid' ? 'مدفوع' : 'قيد الانتظار';
  };

  // دالة لمعالجة النقر على العميل
  const handleClientClick = (id: string) => {
    // تحديد أو إلغاء تحديد العميل
    setSelectedClientId(selectedClientId === id ? null : id);
  };

  if (!isLoaded) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4 text-start overflow-y-visible" dir="rtl" >
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

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-muted rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-2">فلترة حسب تاريخ الاستحقاق</label>
          <select
            className="w-full p-2 border rounded-md bg-background"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">كل التواريخ</option>
            <option value="days1-9">من يوم 1 إلى يوم 9</option>
            <option value="days10-19">من يوم 10 إلى يوم 19</option>
            <option value="days20-end">من يوم 20 إلى آخر الشهر</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">فلترة حالة الدفع</label>
          <select
            className="w-full p-2 border rounded-md bg-background"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">كل الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="paid">مدفوع</option>
          </select>
        </div>
      </div>

      {/* Total Amount Display */}
      <div className="mb-6 relative">
        <div
          className={`bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg transition-all duration-500 ease-in-out overflow-hidden
            ${showTotalAmount
              ? 'max-h-[500px] opacity-100 mb-4'
              : 'max-h-0 opacity-0 my-0'
            }`}
        >
          <div className="flex justify-between items-center">
            <span className="font-medium">إجمالي الأقساط المعروضة:</span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {totalAmount.toLocaleString()} ج.م
            </span>
          </div>
        </div>
        <div className="flex justify-center absolute top-0 left-5 transform -translate-x-1/2">
          <button
            onClick={() => setShowTotalAmount(!showTotalAmount)}
          >

            <ChevronDown className={`w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform duration-300 ${showTotalAmount ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>


      {/* Table - Desktop View */}
      <div
        ref={tableRef}
        className="hidden sm:block overflow-x-auto rounded-lg border"
      >
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
              <tr
                key={installment.id}
                className={`border-t hover:bg-muted/50 transition-colors cursor-pointer ${selectedClientId === installment.id ? 'border-2 border-orange-500 dark:border-orange-400' : ''}`}
                onClick={() => handleClientClick(installment.id)}
              >
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
                  <div className="flex gap-1 justify-center items-center">
                    {/* زر الواتساب */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClientClick(installment.id);
                        handleWhatsAppClick(installment.clientPhone);
                      }}
                      className="gap-1 hover:text-green-700"
                      title="واتساب"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>

                    {/* زر الملاحظات */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClientClick(installment.id);
                        navigate(`/edit-installment?id=${installment.id}&action=notes`);
                      }}
                      className="gap-1"
                      title="ملاحظات"

                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs">
                        {installment.notes.length}
                      </span>
                    </Button>

                    {/* القائمة المنسدلة */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === installment.id ? null : installment.id);
                        }}
                        className="gap-1"
                        title="الإجراءات"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>

                      {/* خيارات القائمة المنسدلة */}
                      {activeDropdown === installment.id && (
                        <div className="absolute left-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-10">
                          <div className="py-1">
                            <button
                              className="block w-full text-right px-4 py-2 text-sm hover:bg-muted"
                              onClick={() => {
                                navigate(`/edit-installment?id=${installment.id}&action=view`);
                                setActiveDropdown(null);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                <span>عرض</span>
                              </div>
                            </button>
                            <button
                              className="block w-full text-right px-4 py-2 text-sm hover:bg-muted"
                              onClick={() => {
                                navigate(`/edit-installment?id=${installment.id}&action=edit`);
                                setActiveDropdown(null);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Edit2 className="w-4 h-4" />
                                <span>تعديل</span>
                              </div>
                            </button>
                            <button
                              className="block w-full text-right px-4 py-2 text-sm text-destructive hover:bg-muted"
                              onClick={() => {
                                setDeleteConfirm(installment.id);
                                setActiveDropdown(null);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                <span>حذف</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card View - Mobile */}
      <div
        ref={tableRef}
        className="sm:hidden space-y-3" >
        {filteredInstallments.map((installment) => (
          <div
            key={installment.id}
            className={`border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors cursor-pointer ${selectedClientId === installment.id ? 'border-2 border-orange-500 dark:border-orange-400' : ''}`}
            onClick={() => handleClientClick(installment.id)}
          >
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
                {/* زر الواتساب */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClientClick(installment.id)
                    handleWhatsAppClick(installment.clientPhone);
                  }}
                  className="flex-1 gap-1 text-xs hover:text-green-700"
                >
                  <MessageCircle className="w-3 h-3" />
                  واتساب
                </Button>

                {/* زر الملاحظات */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClientClick(installment.id)
                    navigate(`/edit-installment?id=${installment.id}&action=notes`);
                  }}
                  className="flex-1 gap-1 text-xs"
                >
                  <MessageSquare className="w-3 h-3" />
                  ({installment.notes.length})
                </Button>

                {/* القائمة المنسدلة */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === installment.id ? null : installment.id);
                    }}
                    className="flex-1 gap-1 text-xs"
                  >
                    <MoreVertical className="w-3 h-3" />
                    الإجراءات
                  </Button>

                  {/* خيارات القائمة المنسدلة */}
                  {activeDropdown === installment.id && (
                    <div className="absolute left-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-10">
                      <div className="py-1">
                        <button
                          className="block w-full text-right px-4 py-2 text-sm hover:bg-muted"
                          onClick={() => {
                            navigate(`/edit-installment?id=${installment.id}&action=view`);
                            setActiveDropdown(null);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>عرض</span>
                          </div>
                        </button>
                        <button
                          className="block w-full text-right px-4 py-2 text-sm hover:bg-muted"
                          onClick={() => {
                            navigate(`/edit-installment?id=${installment.id}&action=edit`);
                            setActiveDropdown(null);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Edit2 className="w-4 h-4" />
                            <span>تعديل</span>
                          </div>
                        </button>
                        <button
                          className="block w-full text-right px-4 py-2 text-sm text-destructive hover:bg-muted"
                          onClick={() => {
                            setDeleteConfirm(installment.id);
                            setActiveDropdown(null);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            <span>حذف</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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

      {/* Import/Export Buttons */}
      <div className="flex gap-3 justify-end py-6 border-t mt-8 pt-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleImportClick}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          استيراد بيانات
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportInstallments()}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          تصدير بيانات
        </Button>
      </div>

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
