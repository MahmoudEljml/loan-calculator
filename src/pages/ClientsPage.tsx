import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClientsStorage } from '../hooks/useClientsStorage';
import { useExportImportClients } from '../hooks/useExportImportClients';
import { Plus, Trash2, Edit2, Eye, Download, Upload, Minus, X } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { ClientsPDF } from '@/components/ClientsPDF';
import FAB from '@/components/FAB';
// دالة لتنسيق التاريخ
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function ClientsPage() {
  const navigate = useNavigate();
  const { clients, isLoaded, deleteClient } = useClientsStorage();
  const { exportClients, importClients } = useExportImportClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterDay, setFilterDay] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importClients(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch =
        client.client_information.full_name.val.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.client_information.phone_number.val.includes(searchTerm);

      if (!matchesSearch) return false;

      // فلترة التاريخ (السنة، الشهر، اليوم)
      if (client.createdAt) {
        const clientDate = new Date(client.createdAt);
        const cYear = clientDate.getFullYear();
        const cMonth = clientDate.getMonth() + 1;
        const cDay = clientDate.getDate();

        if (filterYear !== null && cYear !== filterYear) return false;
        if (filterMonth !== null && cMonth !== filterMonth) return false;
        if (filterDay !== null && cDay !== filterDay) return false;
      } else {
        if (filterYear !== null || filterMonth !== null || filterDay !== null) return false;
      }

      return true;
    });
  }, [clients, searchTerm, filterYear, filterMonth, filterDay]);

  const handleDelete = (id: string) => {
    deleteClient(id);
    setDeleteConfirm(null);
  };

  if (!isLoaded) {
    return <div className="text-center py-8" dir="rtl">جاري التحميل...</div>;
  }

  // دالة لزيادة أو نقص يوم واحد
  const handleShiftDay = (amount: number) => {
    // استخدام التاريخ الحالي أو التاريخ المحدد كمرجع
    const y = filterYear || new Date().getFullYear();
    const m = filterMonth ? filterMonth - 1 : new Date().getMonth();
    const d = filterDay || new Date().getDate();

    const date = new Date(y, m, d + amount);
    setFilterYear(date.getFullYear());
    setFilterMonth(date.getMonth() + 1);
    setFilterDay(date.getDate());
  };

  // زر لإلغاء وتفريغ الفلتر الزمني
  const handleResetDateFilter = () => {
    setFilterYear(null);
    setFilterMonth(null);
    setFilterDay(null);
  };
  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);

      // توليد ملف الـ PDF بشكل برمجي وتحويله إلى Blob
      const blob = await pdf(<ClientsPDF clients={filteredClients} />).toBlob();

      // إنشاء رابط وهمي لتحميل الملف تلقائياً على جهاز المستخدم
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clients-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('خطأ أثناء توليد ملف الـ PDF:', error);
      alert('حدث خطأ أثناء تجهيز ملف الـ PDF، يجدر مراجعة الـ Console.');
    } finally {
      setIsGenerating(false);
    }
  };
  return (
    <div className="space-y-4 text-start" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">إدارة العملاء</h1>
        <Button onClick={() => navigate('/add-client')} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          عميل جديد
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <Input
          placeholder="ابحث باسم العميل أو رقم الهاتف أو نوع النشاط..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-4 pr-10"
        />
      </div>
      {/* Date Filter & Shift Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-lg border shadow-sm mb-6" dir="rtl">
        <div className="text-sm font-medium text-muted- whitespace-nowrap w-full">فلترة بالتاريخ:</div>

        {filterYear !== null && filterMonth !== null && filterDay !== null && (
          <div className="text-sm">
            {["الأحد", "الاثنين", "الثلاثاء", "الاربعاء", "الخميس", "الجمعه", "السبت"][
              new Date(filterYear, filterMonth - 1, filterDay).getDay()
            ]}
          </div>
        )}

        <div className='flex flex-wrap justify-center gap-3 w-full '>
          <div className='flex flex-wrap items-center gap-3'>
            {/* خانة السنة */}
            <Input
              type="number"
              placeholder="السنة"
              value={filterYear ?? ''}
              onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value) : null)}
              className="w-32"
            />
            {/* خانة الشهر */}
            <Input
              type="number"
              placeholder="الشهر"
              min="1"
              max="12"
              value={filterMonth ?? ''}
              onChange={(e) => setFilterMonth(e.target.value ? parseInt(e.target.value) : null)}
              className="w-28"
            />
            {/* خانة اليوم */}
            <Input
              type="number"
              placeholder="اليوم"
              min="1"
              max="31"
              value={filterDay ?? ''}
              onChange={(e) => setFilterDay(e.target.value ? parseInt(e.target.value) : null)}
              className="w-28"
            />
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            {/* أزرار زيادة ونقصان اليوم */}
            <FAB
              text='-'
              size="small"
              icon={<Minus name="chevron-left" size={20} />}
              // title="تأخير يوم سابق"
              onClick={() => handleShiftDay(-1)}

            />
            <div className=''>

              {/* زر إعادة ضبط الفلتر */}
              {(filterYear || filterMonth || filterDay) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetDateFilter}
                  className="text-destructive hover:text-destructive"
                >
                  إلغاء الفلتر
                </Button>
              )}
            </div>
            <FAB
              text='+'
              size="small"
              icon={<Plus name="chevron-right" size={20} />}
              // title="تقدم يوم تالي"
              onClick={() => handleShiftDay(1)}
            />
          </div>
        </div>
      </div>
      {/* Table - Desktop View */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-right font-semibold">الصورة</th>
              <th className="px-4 py-3 text-right font-semibold">اسم العميل</th>
              <th className="px-4 py-3 text-right font-semibold">رقم الهاتف</th>
              <th className="px-4 py-3 text-right font-semibold">نوع النشاط</th>
              <th className="px-4 py-3 text-right font-semibold">العنوان</th>
              <th className="px-4 py-3 text-right font-semibold">تاريخ الإنشاء</th>
              <th className="px-4 py-3 text-right font-semibold">تاريخ التحديث</th>
              <th className="px-4 py-3 text-center font-semibold">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id} className="border-t hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  {client.clientImages.length > 0 ? (
                    <div className="flex gap-1">
                      <img
                        src={client.clientImages[0]}
                        alt="صورة العميل"
                        className="w-10 h-10 object-cover rounded"
                        title={`${client.clientImages.length} صورة`}
                      />
                      {client.clientImages.length > 1 && (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs font-semibold">
                          +{client.clientImages.length - 1}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {client.client_information.full_name.val || '-'}
                </td>
                <td className="px-4 py-3">
                  {client.client_information.phone_number.val || '-'}
                </td>
                <td className="px-4 py-3">
                  {client.business_details.business_type.val || '-'}
                </td>
                <td className="px-4 py-3">
                  {client.business_details.address.val || '-'}
                </td>
                <td className="px-4 py-3">
                  {formatDate(client.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {formatDate(client.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/view-client?id=${client.id}`)}
                      className="gap-1"
                      title="عرض"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">عرض</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/add-client?id=${client.id}`)}
                      className="gap-1"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="hidden sm:inline">تعديل</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(client.id)}
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
        {filteredClients.map((client) => (
          <div key={client.id} className="border border-black dark:border-white rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors">
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <p className="font-semibold">
                    {client.client_information.full_name.val || 'غير محدد'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {client.client_information.phone_number.val}
                  </p>
                </div>
                {client.clientImages.length > 0 && (
                  <div className="flex gap-1">
                    <img
                      src={client.clientImages[0]}
                      alt="صورة العميل"
                      className="w-12 h-12 object-cover rounded"
                      title={`${client.clientImages.length} صورة`}
                    />
                  </div>
                )}
              </div>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">النشاط:</span> {client.business_details.business_type.val || '-'}
                </p>
                <p>
                  <span className="font-medium">العنوان:</span> {client.business_details.address.val || '-'}
                </p>
                <p>
                  <span className="font-medium">تاريخ الإنشاء:</span> {formatDate(client.createdAt)}
                </p>
                <p>
                  <span className="font-medium">تاريخ التحديث:</span> {formatDate(client.updatedAt)}
                </p>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/view-client?id=${client.id}`)}
                  className="flex-1 gap-1"
                >
                  <Eye className="w-4 h-4" />
                  عرض
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/add-client?id=${client.id}`)}
                  className="flex-1 gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(client.id)}
                  className="flex-1 gap-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد عملاء حالياً'}
          </p>
          {!searchTerm && (
            <Button onClick={() => navigate('/add-client')}>
              <Plus className="w-4 h-4 mr-2" />
              إضافة عميل جديد
            </Button>
          )}
        </div>
      )}

      {/* Import/Export Buttons */}
      {/* Import/Export Buttons */}
      <div className="flex gap-3 justify-end py-6 border-t mt-8 pt-6 flex-wrap">
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
          onClick={() => exportClients()}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          تصدير بيانات JSON
        </Button>

        {/* زر تصدير الـ PDF */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleDownloadPDF}
          disabled={isGenerating}
        >
          <Download className="w-4 h-4" />
          {isGenerating ? 'جاري تجهيز PDF...' : 'تصدير PDF'}
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-sm w-full text-center" dir="rtl">
            <h3 className="text-lg font-semibold mb-4">تأكيد الحذف</h3>
            <p className="text-muted-foreground mb-6">
              هل أنت متأكد من رغبتك في حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-20 justify-center ">
              <Button
                className='right-0 '
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                إلغاء
              </Button>
              <Button
                className='left-0 '
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
