import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInstallmentsStorage } from '../hooks/useInstallmentsStorage';
import { useExportImportInstallments } from '../hooks/useExportImportInstallments';
import useLocalStorage from '../hooks/useLocalStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, Download, Upload, ChevronDown, Lock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { InstallmentsTable } from '@/components/InstallmentsTable';
import { InstallmentNotesSheet } from '@/components/InstallmentNotesSheet';

export function InstallmentsPage() {
  const navigate = useNavigate();
  const { installments, isLoaded, deleteInstallment, updateInstallment, updateNote, deleteAllInstallments } = useInstallmentsStorage();
  const { exportInstallments, importInstallments } = useExportImportInstallments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  
  // استخدام useLocalStorage hook لحفظ الفلاتر
  const [filters, setFilters] = useLocalStorage('loan_calculator_filters', {
    searchTerm: '',
    dateFilter: 'all',
    statusFilter: 'all',
  });

  // استخدام useLocalStorage hook لحفظ العميل المحدد
  const [selectedClientId, setSelectedClientId] = useLocalStorage<string | null>('selected_client_id', null);

  // Password protection for total amount
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  // كلمة المرور الثابتة في الكود
  const [storedPassword] = useState("qwe");
  // حفظ كلمة المرور في localStorage للمقارنة
  const [savedPassword, setSavedPassword] = useLocalStorage<string | null>('total_amount_password', null);
  // حفظ حالة المصادقة في localStorage
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('total_amount_authenticated', false);

  // استخدام useLocalStorage hook لحفظ حالة إظهار إجمالي الأقساط
  const [showTotalAmount, setShowTotalAmount] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkExtendScope, setBulkExtendScope] = useState<'all' | 'paid' | 'pending'>('paid');

  // تحديث الفلاتر عند تغييرها
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm);
  const [dateFilter, setDateFilter] = useState(filters.dateFilter);
  const [statusFilter, setStatusFilter] = useState(filters.statusFilter);
  // const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [targetMonth, setTargetMonth] = useState<number>(new Date().getMonth());
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear());
  const [isBulkExtending, setIsBulkExtending] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // New state for delete all data confirmation
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  // Notes Sheet state
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);
  const [selectedNotesInstallmentId, setSelectedNotesInstallmentId] = useState<string | null>(null);
  
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

  // التحقق من تطابق كلمة المرور المحفوظة مع كلمة المرور الحالية
  useEffect(() => {
    // إذا كانت كلمة المرور المحفوظة مختلفة عن كلمة المرور الحالية، قم بإعادة تعيين حالة المصادقة
    if (savedPassword && savedPassword !== storedPassword) {
      setIsAuthenticated(false);
    }
  }, [savedPassword, storedPassword, setIsAuthenticated]);

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

  // Calculate counts of paid and pending installments
  const installmentCounts = useMemo(() => {
    const paidCount = filteredInstallments.filter(installment => installment.status === 'paid').length;
    const pendingCount = filteredInstallments.filter(installment => installment.status === 'pending').length;
    return { paidCount, pendingCount };
  }, [filteredInstallments]);

  const handleDelete = async (id: string) => {
    try {
      await deleteInstallment(id);
      setDeleteId(null);
      // إذا تم حذف العميل المحدد، قم بإلغاء تحديده
      if (id === selectedClientId) {
        setSelectedClientId(null);
      }
    } catch (error) {
      console.error('Failed to delete installment:', error);
      toast.error('فشل في حذف القسط');
    }
  };
  
  // New handler for deleting all data
  const handleDeleteAll = async () => {
    try {
      await deleteAllInstallments();
      setShowDeleteAllDialog(false);
      toast.success('تم حذف جميع البيانات بنجاح');
      setSelectedClientId(null);
    } catch (error) {
      console.error('Failed to delete all installments:', error);
      toast.error('فشل في حذف جميع البيانات');
    }
  };

  const handleBulkExtendDueDates = async () => {
    // التحقق من صحة الشهر والسنة
    if (isNaN(targetMonth) || targetMonth < 0 || targetMonth > 11) {
      toast.error('يرجى اختيار شهر صحيح');
      return;
    }

    if (isNaN(targetYear) || targetYear < new Date().getFullYear()) {
      toast.error('يرجى إدخال سنة صحيحة (السنة الحالية أو المستقبلية)');
      return;
    }

    const targetInstallments = bulkExtendScope === 'paid'
      ? installments.filter((installment) => installment.status === 'paid')
      : bulkExtendScope === 'pending'
        ? installments.filter((installment) => installment.status === 'pending')
        : installments;

    if (targetInstallments.length === 0) {
      toast.error('لا توجد أقساط مطابقة للاختيار');
      return;
    }

    // بدء عملية التحميل
    setIsBulkExtending(true);

    try {
      // معالجة الأقساط بشكل متزامن ولكن مع تحديث التقدم
      let processedCount = 0;
      const totalCount = targetInstallments.length;

      for (const installment of targetInstallments) {
        // الحصول على التاريخ الحالي للقسط
        const currentDate = new Date(installment.dueDate);

        // استخراج اليوم من التاريخ الأصلي
        const day = currentDate.getDate();

        // إنشاء تاريخ جديد بناءً على الشهر والسنة المحددين مع اليوم الأصلي
        // نستخدم UTC لتجنب مشاكل التوقيت المحلي
        const newDate = new Date(Date.UTC(targetYear, targetMonth, day));

        // استخدام دالة updateInstallment الموجودة
        await updateInstallment(installment.id, {
          clientCode: installment.clientCode,
          clientName: installment.clientName,
          nationalId: installment.nationalId,
          clientPhone: installment.clientPhone,
          address: installment.address,
          latitude: installment.latitude,
          longitude: installment.longitude,
          clientImages: installment.clientImages,
          installmentAmount: installment.installmentAmount,
          dueDate: newDate.toISOString(),
          status: installment.status,
          firstGuarantorName: installment.firstGuarantorName,
          firstGuarantorPhone: installment.firstGuarantorPhone,
          secondGuarantorName: installment.secondGuarantorName,
          secondGuarantorPhone: installment.secondGuarantorPhone,
          notes: installment.notes,
        });



        // تحديث عداد المعالجة
        processedCount++;

        // عرض تقدم العملية كل 10 أقساط أو عند الانتهاء
        if (processedCount % 10 === 0 || processedCount === totalCount) {
          const progress = Math.round((processedCount / totalCount) * 100);
          toast.loading(`جاري ترحيل الأقساط... ${progress}%`, {
            id: 'bulk-extend-progress',
          });
        }
      }

      const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      toast.success(`تم ترحيل الاستحقاقات بنجاح إلى ${monthNames[targetMonth]} ${targetYear}`, {
        id: 'bulk-extend-progress',
      });
      setBulkDialogOpen(false);
    } catch (error) {
      console.error('Failed to bulk extend due dates:', error);
      toast.error('فشل في ترحيل الاستحقاقات', {
        id: 'bulk-extend-progress',
      });
    } finally {
      // إنهاء حالة التحميل
      setIsBulkExtending(false);
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
    setSelectedClientId(id);
  };

  // Handle password verification
  const handlePasswordSubmit = () => {
    // التحقق من كلمة المرور
    if (passwordInput === storedPassword) {
      // حفظ كلمة المرور في localStorage
      setSavedPassword(storedPassword);
      setIsAuthenticated(true);
      setShowPasswordDialog(false);
      setPasswordInput('');
      toast.success('تم التحقق بنجاح');
    } else {
      toast.error('كلمة المرور غير صحيحة');
      setPasswordInput('');
    }
  };

  // Show password dialog when trying to view total amount
  const handleViewTotalAmount = () => {
    if (!isAuthenticated) {
      setShowPasswordDialog(true);
    } else {
      // إذا تم المصادقة بالفعل، قم بتبديل حالة عرض إجمالي الأقساط
      setShowTotalAmount(!showTotalAmount);
    }
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

      {/* Bulk Extend Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="sm:max-w-[500px] text-right" dir="rtl">
          <DialogHeader className="text-right sm:text-right mt-4">
            <DialogTitle className="text-right">ترحيل الأقساط</DialogTitle>
            <DialogDescription className="text-right">
              اختر الأقساط التي تريد ترحيلها والشهر والسنة للترحيل إليهم.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* إدخال الشهر والسنة */}
            <div className="space-y-2">
              <label className="text-sm font-medium">شهر وسنة الترحيل</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="month-input" className="text-xs text-muted-foreground">الشهر</label>
                  <select
                    id="month-input"
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-md bg-background"
                    disabled={isBulkExtending}
                  >
                    <option value="0">يناير</option>
                    <option value="1">فبراير</option>
                    <option value="2">مارس</option>
                    <option value="3">أبريل</option>
                    <option value="4">مايو</option>
                    <option value="5">يونيو</option>
                    <option value="6">يوليو</option>
                    <option value="7">أغسطس</option>
                    <option value="8">سبتمبر</option>
                    <option value="9">أكتوبر</option>
                    <option value="10">نوفمبر</option>
                    <option value="11">ديسمبر</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor="year-input" className="text-xs text-muted-foreground">السنة</label>
                  <Input
                    id="year-input"
                    type="number"
                    min={new Date().getFullYear()}
                    value={targetYear}
                    onChange={(e) => setTargetYear(parseInt(e.target.value))}
                    className="w-full"
                    disabled={isBulkExtending}
                  />
                </div>
              </div>
            </div>

            {/* خيارات نطاق الترحيل */}
            <div className="space-y-3">
              <label className="text-sm font-medium">نطاق الترحيل</label>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted">
                <input
                  type="radio"
                  name="bulk-extend-scope"
                  value="paid"
                  checked={bulkExtendScope === 'paid'}
                  onChange={() => setBulkExtendScope('paid')}
                  className="mt-1 h-4 w-4"
                  disabled={isBulkExtending}
                />
                <div>
                  <p className="font-medium">الأقساط المدفوعة فقط</p>
                  <p className="text-sm text-muted-foreground">سيتم ترحيل تاريخ الاستحقاق للأقساط التي تم دفعها فقط.</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted">
                <input
                  type="radio"
                  name="bulk-extend-scope"
                  value="pending"
                  checked={bulkExtendScope === 'pending'}
                  onChange={() => setBulkExtendScope('pending')}
                  className="mt-1 h-4 w-4"
                  disabled={isBulkExtending}
                />
                <div>
                  <p className="font-medium">الأقساط غير المدفوعة فقط</p>
                  <p className="text-sm text-muted-foreground">سيتم ترحيل تاريخ الاستحقاق للأقساط غير المدفوعة فقط.</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted">
                <input
                  type="radio"
                  name="bulk-extend-scope"
                  value="all"
                  checked={bulkExtendScope === 'all'}
                  onChange={() => setBulkExtendScope('all')}
                  className="mt-1 h-4 w-4"
                  disabled={isBulkExtending}
                />
                <div>
                  <p className="font-medium">جميع الأقساط</p>
                  <p className="text-sm text-muted-foreground">سيتم ترحيل تاريخ الاستحقاق لجميع الأقساط في الجدول.</p>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDialogOpen(false)}
              disabled={isBulkExtending}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleBulkExtendDueDates}
              disabled={isBulkExtending}
            >
              {isBulkExtending ? 'جاري الترحيل...' : 'ترحيل'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Responsive Table/Card View */}
      <div ref={tableRef}>
        <InstallmentsTable
          installments={filteredInstallments}
          selectedClientId={selectedClientId}
          onClientClick={handleClientClick}
          onWhatsAppClick={handleWhatsAppClick}
          onActionClick={(id, action) => {
            if (action === 'view') navigate(`/edit-installment?id=${id}&action=view`);
            if (action === 'edit') navigate(`/edit-installment?id=${id}&action=edit`);
            if (action === 'delete') setDeleteId(id);
            if (action === 'notes') {
              setSelectedNotesInstallmentId(id);
              setNotesSheetOpen(true);
            }
          }}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
        />
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
          <div className="grid grid-cols-2 gap-4 mt-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <span className="text-sm text-green-700 dark:text-green-300">الأقساط المدفوعة:</span>
              <div className="text-lg font-bold text-green-700 dark:text-green-300">
                {installmentCounts.paidCount}
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <span className="text-sm text-yellow-700 dark:text-yellow-300">الأقساط قيد الانتظار:</span>
              <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                {installmentCounts.pendingCount}
              </div>
            </div>
          </div>

          <div className="flex items-end my-auto">
            <Button
              onClick={() => setBulkDialogOpen(true)}
              className="w-full"
              variant="outline"
            >
              ترحيل الأقساط
            </Button>
          </div>
          {/* Import/Export/Delete All Buttons Component */}
          <ImportExportButtons
            onImport={handleFileChange}
            onExport={exportInstallments}
            onDeleteAll={() => setShowDeleteAllDialog(true)}
          />
        </div>

        {/* Button to toggle total amount display - only visible after authentication */}
        {isAuthenticated && (
          <div className="flex justify-center absolute top-0 left-5 transform -translate-x-1/2">
            <button
              onClick={() => setShowTotalAmount(!showTotalAmount)}
            >
              <ChevronDown className={`w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform duration-300 ${showTotalAmount ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        {/* Button to view total amount with password protection - only visible before authentication */}
        {!isAuthenticated && (
          <div className="flex justify-center mb-6 absolute top-0 left-5 transform -translate-x-1/2">
            <Button
              onClick={handleViewTotalAmount}
              className="gap-2"
              variant="outline"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* نافذة تأكيد الحذف */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px] pt-12" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-right">تأكيد حذف القسط</DialogTitle>
            <DialogDescription className="text-right">
              هل أنت متأكد من رغبتك في حذف هذا القسط ؟
              <br />
              لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex !flex-row gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="flex-1 sm:flex-none" // يأخذ عرض كامل في الهاتف، وحجم طبيعي في الشاشات الكبيرة
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              className="flex-1 sm:flex-none"
              onClick={() => {
                if (deleteId) {
                  handleDelete(deleteId);
                }
              }}
            >
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete All Data Confirmation Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="sm:max-w-[425px] pt-12" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-right">تأكيد حذف جميع البيانات</DialogTitle>
            <DialogDescription className="text-right">
              هل أنت متأكد من رغبتك في حذف جميع البيانات؟
              <br />
              لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex !flex-row gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteAllDialog(false)}
              className="flex-1 sm:flex-none"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              className="flex-1 sm:flex-none"
              onClick={handleDeleteAll}
            >
              حذف الكل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-sm w-full text-center" dir="rtl">
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
              <Lock className="w-5 h-5" />
              تأكيد الهوية
            </h3>
            <p className="text-muted-foreground mb-6">
              يرجى إدخال كلمة المرور
            </p>
            <Input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="كلمة المرور"
              className="mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePasswordSubmit();
                }
              }}
            />
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPasswordInput('');
                }}
              >
                إلغاء
              </Button>
              <Button
                onClick={handlePasswordSubmit}
              >
                تأكيد
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Sheet */}
      {selectedNotesInstallmentId && (
        <InstallmentNotesSheet
          open={notesSheetOpen}
          onOpenChange={setNotesSheetOpen}
          installmentId={selectedNotesInstallmentId}
          clientName={
            installments.find(i => i.id === selectedNotesInstallmentId)?.clientName || ''
          }
          notes={
            installments.find(i => i.id === selectedNotesInstallmentId)?.notes || []
          }
          onAddNote={async (noteText) => {
            const installment = installments.find(i => i.id === selectedNotesInstallmentId);
            if (installment) {
              await updateInstallment(selectedNotesInstallmentId, {
                ...installment,
                notes: [
                  ...installment.notes,
                  {
                    id: Date.now().toString(),
                    note: noteText,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                ],
              });
            }
          }}
          onUpdateNote={async (noteId, noteText) => {
            await updateNote(selectedNotesInstallmentId, noteId, noteText);
          }}
          onDeleteNote={async (noteId) => {
            const installment = installments.find(i => i.id === selectedNotesInstallmentId);
            if (installment) {
              await updateInstallment(selectedNotesInstallmentId, {
                ...installment,
                notes: installment.notes.filter(n => n.id !== noteId),
              });
            }
          }}
        />
      )}
    </div>
  );
}


interface ImportExportButtonsProps {
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onExport: () => void;
  onDeleteAll: () => void;
}

const ImportExportButtons: React.FC<ImportExportButtonsProps> = ({
  onImport,
  onExport,
  onDeleteAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await onImport(event);
    // Reset the file input after import
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
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
        onClick={onExport}
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        تصدير بيانات
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={onDeleteAll}
        className="gap-2"
      >
        <Trash2 className="w-4 h-4" />
        حذف جميع البيانات
      </Button>
    </div>
  );
};
