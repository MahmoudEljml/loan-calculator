import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInstallmentsStorage } from '../hooks/useInstallmentsStorage';
import { ArrowRight, MessageSquare, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ImageViewer } from '@/components/ImageViewer';
import { InstallmentNotesSheet } from '@/components/InstallmentNotesSheet';

export function EditInstallmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getInstallment, addInstallment, updateInstallment, addNote, updateNote, deleteNote } = useInstallmentsStorage();

  const installmentId = searchParams.get('id');
  const action = searchParams.get('action') || 'view';
  const isView = action === 'view';

  const existingInstallment = installmentId ? getInstallment(installmentId) : null;

  // Form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientImages, setClientImages] = useState<string[]>([]);
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'pending' | 'paid'>('pending');
  const [firstGuarantorName, setFirstGuarantorName] = useState('');
  const [firstGuarantorPhone, setFirstGuarantorPhone] = useState('');
  const [secondGuarantorName, setSecondGuarantorName] = useState('');
  const [secondGuarantorPhone, setSecondGuarantorPhone] = useState('');

  // Notes state
  const [notes, setNotes] = useState(existingInstallment?.notes || []);
  const [showNotesSheet, setShowNotesSheet] = useState(false);

  // Image viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    if (existingInstallment) {
      setClientName(existingInstallment.clientName);
      setClientPhone(existingInstallment.clientPhone);
      setClientImages(existingInstallment.clientImages);
      setInstallmentAmount(existingInstallment.installmentAmount.toString());
      setDueDate(existingInstallment.dueDate.split('T')[0]);
      setStatus(existingInstallment.status);
      setFirstGuarantorName(existingInstallment.firstGuarantorName);
      setFirstGuarantorPhone(existingInstallment.firstGuarantorPhone);
      setSecondGuarantorName(existingInstallment.secondGuarantorName);
      setSecondGuarantorPhone(existingInstallment.secondGuarantorPhone);
      setNotes(existingInstallment.notes);
    }
  }, [existingInstallment]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setClientImages((prev) => [...prev, result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setClientImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!clientName || !clientPhone || !installmentAmount || !dueDate) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const data = {
      clientName,
      clientPhone,
      clientImages,
      installmentAmount: parseFloat(installmentAmount),
      dueDate,
      status,
      firstGuarantorName,
      firstGuarantorPhone,
      secondGuarantorName,
      secondGuarantorPhone,
      notes,
    };

    try {
      if (installmentId) {
        await updateInstallment(installmentId, data);
        toast.success('تم تحديث القسط بنجاح');
      } else {
        await addInstallment(data);
        toast.success('تم إضافة قسط جديد بنجاح');
      }
      navigate('/installments');
    } catch (error) {
      toast.error('حدث خطأ في الحفظ');
      console.error(error);
    }
  };

  const handleAddNote = async (noteText: string) => {
    if (!installmentId) {
      toast.error('معرف القسط غير صحيح');
      return;
    }

    try {
      await addNote(installmentId, noteText);
      const now = new Date().toISOString();
      setNotes([
        ...notes,
        {
          id: Date.now().toString(),
          note: noteText,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    } catch (error) {
      toast.error('فشل في إضافة الملاحظة');
      console.error(error);
      throw error;
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!installmentId) {
      toast.error('معرف القسط غير صحيح');
      return;
    }

    try {
      await deleteNote(installmentId, noteId);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error) {
      toast.error('فشل في حذف الملاحظة');
      console.error(error);
      throw error;
    }
  };

  const handleUpdateNote = async (noteId: string, noteText: string) => {
    if (!installmentId) {
      toast.error('معرف القسط غير صحيح');
      return;
    }

    try {
      await updateNote(installmentId, noteId, noteText);
      const now = new Date().toISOString();
      const updatedNotes = notes.map(n =>
        n.id === noteId
          ? { ...n, note: noteText, updatedAt: now }
          : n
      );
      setNotes(updatedNotes);
    } catch (error) {
      toast.error('فشل في تحديث الملاحظة');
      console.error(error);
      throw error;
    }
  };

  // Notes View - استبدالها بـ Sheet
  // تم حذف isNotes logic وسيتم استخدام Sheet بدلاً منه

  // Edit/Add/View Form
  return (
    <div className="space-y-4 text-start" dir="rtl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/installments')}
          className="gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
        <h1 className="text-2xl font-semibold">
          {isView ? 'عرض القسط' : action === 'add' ? 'إضافة قسط جديد' : 'تعديل القسط'}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card rounded-lg p-4">
        {/* Client Information */}
        <div>
          <label className="block text-sm font-medium mb-2">اسم العميل *</label>
          <Input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            disabled={isView}
            placeholder="اسم العميل"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">رقم الهاتف *</label>
          <Input
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            disabled={isView}
            type="number"
            placeholder="رقم الهاتف"
          />
        </div>

        {/* Installment Details */}
        <div>
          <label className="block text-sm font-medium mb-2">قيمة القسط *</label>
          <Input
            type="number"
            value={installmentAmount}
            onChange={(e) => setInstallmentAmount(e.target.value)}
            disabled={isView}
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">تاريخ الاستحقاق *</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isView}
          />
        </div>

        {/* Status */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            الحالة
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'pending' | 'paid')}
            disabled={isView}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="pending">قيد الانتظار</option>
            <option value="paid">مدفوع</option>
          </select>
        </div>

        {/* First Guarantor */}
        <div>
          <label className="block text-sm font-medium mb-2">اسم الضامن الأول</label>
          <Input
            value={firstGuarantorName}
            onChange={(e) => setFirstGuarantorName(e.target.value)}
            disabled={isView}
            placeholder="اسم الضامن الأول"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">رقم الهاتف - الضامن الأول</label>
          <Input
            value={firstGuarantorPhone}
            onChange={(e) => setFirstGuarantorPhone(e.target.value)}
            disabled={isView}
            type="number"
            placeholder="رقم الهاتف"
          />
        </div>

        {/* Second Guarantor */}
        <div>
          <label className="block text-sm font-medium mb-2">اسم الضامن الثاني</label>
          <Input
            value={secondGuarantorName}
            onChange={(e) => setSecondGuarantorName(e.target.value)}
            disabled={isView}
            placeholder="اسم الضامن الثاني"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">رقم الهاتف - الضامن الثاني</label>
          <Input
            value={secondGuarantorPhone}
            onChange={(e) => setSecondGuarantorPhone(e.target.value)}
            disabled={isView}
            type="number"
            placeholder="رقم الهاتف"
          />
        </div>
      </div>

      {/* Notes Button */}
      {installmentId && !isView && (
        <div className="flex gap-2">
          <Button
            onClick={() => setShowNotesSheet(true)}
            variant="outline"
            className="gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            الملاحظات ({notes.length})
          </Button>
        </div>
      )}

      {/* Images Section - At the End */}
      <div className="bg-card rounded-lg p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">صور العميل</label>
          <p className="text-xs text-muted-foreground mb-3">يمكنك إضافة عدة صور للعميل</p>

          {/* Images Grid */}
          {clientImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {clientImages.map((image, index) => (
                <div key={index} className="relative group">
                  <button
                    onClick={() => {
                      setViewerIndex(index);
                      setViewerOpen(true);
                    }}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={image}
                      alt={`صورة ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  {!isView && (
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-destructive text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="حذف الصورة"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload Area */}
          {!isView && (
            <div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="text-center">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">انقر لتحميل صور أو اسحبها هنا</p>
                  <p className="text-xs text-muted-foreground mt-1">يدعم jpg, png وغيرها</p>
                </div>
              </label>
              {clientImages.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  عدد الصور: {clientImages.length}
                </p>
              )}
            </div>
          )}

          {clientImages.length === 0 && isView && (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              لا توجد صور
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {viewerOpen && clientImages.length > 0 && (
        <ImageViewer
          images={clientImages}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* Notes Sheet */}
      <InstallmentNotesSheet
        open={showNotesSheet}
        onOpenChange={setShowNotesSheet}
        installmentId={installmentId}
        clientName={clientName}
        notes={notes}
        onAddNote={handleAddNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
      />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={() => navigate('/installments')} variant="outline" className="flex-1">
          {isView ? 'إغلاق' : 'إلغاء'}
        </Button>
        {!isView && (
          <Button onClick={handleSave} className="flex-1">
            حفظ
          </Button>
        )}
      </div>
    </div>
  );
}
