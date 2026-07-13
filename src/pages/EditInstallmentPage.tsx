import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInstallmentsStorage } from '../hooks/useInstallmentsStorage';
import { ArrowRight, MessageSquare, X, Image as ImageIcon, MapPin, Hash, CreditCard, User, ShieldCheck, FileText } from 'lucide-react';
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

  // Form states
  const [clientCode, setClientCode] = useState('');
  const [clientName, setClientName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gpsCoordinates, setGpsCoordinates] = useState('');
  const [clientImages, setClientImages] = useState<string[]>([]);
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'pending' | 'paid'>('pending');
  const [firstGuarantorName, setFirstGuarantorName] = useState('');
  const [firstGuarantorPhone, setFirstGuarantorPhone] = useState('');
  const [secondGuarantorName, setSecondGuarantorName] = useState('');
  const [secondGuarantorPhone, setSecondGuarantorPhone] = useState('');
  const [notes, setNotes] = useState(existingInstallment?.notes || []);

  // UI states
  const [showNotesSheet, setShowNotesSheet] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    if (existingInstallment) {
      setClientCode(existingInstallment.clientCode || '');
      setClientName(existingInstallment.clientName);
      setNationalId(existingInstallment.nationalId || '');
      setClientPhone(existingInstallment.clientPhone);
      setAddress(existingInstallment.address || '');

      if (existingInstallment.latitude && existingInstallment.longitude) {
        setGpsCoordinates(`${existingInstallment.latitude}, ${existingInstallment.longitude}`);
      }

      setClientImages(existingInstallment.clientImages || []);
      setInstallmentAmount(existingInstallment.installmentAmount.toString());
      setDueDate(existingInstallment.dueDate.split('T')[0]);
      setStatus(existingInstallment.status);
      setFirstGuarantorName(existingInstallment.firstGuarantorName || '');
      setFirstGuarantorPhone(existingInstallment.firstGuarantorPhone || '');
      setSecondGuarantorName(existingInstallment.secondGuarantorName || '');
      setSecondGuarantorPhone(existingInstallment.secondGuarantorPhone || '');
      setNotes(existingInstallment.notes || []);
    }
  }, [existingInstallment]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setClientImages((prev) => [...prev, reader.result as string]);
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
      toast.error('يرجى ملء جميع الحقول المطلوبة *');
      return;
    }

    let lat: number | null = null;
    let lng: number | null = null;

    if (gpsCoordinates.trim()) {
      const parts = gpsCoordinates.split(',');
      if (parts.length === 2) {
        lat = parseFloat(parts[0].trim());
        lng = parseFloat(parts[1].trim());
      }
    }

    const data = {
      clientCode,
      clientName,
      nationalId,
      clientPhone,
      address,
      latitude: lat,
      longitude: lng,
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
    } catch {
      toast.error('حدث خطأ في الحفظ');
    }
  };

  // Note Handlers
  const handleAddNote = async (noteText: string) => {
    if (!installmentId) return;
    await addNote(installmentId, noteText);
    setNotes([...notes, { id: Date.now().toString(), note: noteText, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!installmentId) return;
    await deleteNote(installmentId, noteId);
    setNotes(notes.filter(n => n.id !== noteId));
  };

  const handleUpdateNote = async (noteId: string, noteText: string) => {
    if (!installmentId) return;
    await updateNote(installmentId, noteId, noteText);
    setNotes(notes.map(n => n.id === noteId ? { ...n, note: noteText, updatedAt: new Date().toISOString() } : n));
  };

  return (
    <div className="space-y-6 text-start pb-10" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/installments')} className="gap-2">
          <ArrowRight className="w-4 h-4" /> رجوع
        </Button>
        <h1 className="text-2xl font-bold">
          {isView ? 'تفاصيل القسط' : action === 'add' ? 'إضافة قسط جديد' : 'تعديل بيانات القسط'}
        </h1>
      </div>

      {/* Basic Info Card */}
      <div className="bg-card rounded-xl p-6 border shadow-sm space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><User className="w-5 h-5 text-primary" /> بيانات العميل الأساسية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              <Hash className="w-4 h-4" /> رقم القسط (الفرع/العميل/القرض/القسط)
            </label>
            <Input dir='ltr' value={clientCode} onChange={(e) => setClientCode(e.target.value)} disabled={isView} placeholder="01/105/992/05" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">اسم العميل *</label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} disabled={isView} placeholder="اسم العميل" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1"><CreditCard className="w-4 h-4" /> الرقم القومي</label>
            <Input type='number' dir='ltr' value={nationalId} onChange={(e) => setNationalId(e.target.value)} disabled={isView} placeholder="الرقم القومي" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">رقم الهاتف *</label>
            <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} disabled={isView} type="number" placeholder="رقم الهاتف" />
          </div>
        </div>
      </div>

      {/* Location Card */}
      <div className="bg-card rounded-xl p-6 border shadow-sm space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><MapPin className="w-5 h-5 text-primary" /> بيانات الموقع</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">عنوان النشاط</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} disabled={isView} placeholder="العنوان بالتفصيل" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">إحداثيات الـ GPS (خط العرض, خط الطول)</label>
            <Input dir='ltr' value={gpsCoordinates} onChange={(e) => setGpsCoordinates(e.target.value)} disabled={isView} placeholder="31.0409, 31.3785" />
          </div>
        </div>
      </div>

      {/* Installment Card */}
      <div className="bg-card rounded-xl p-6 border shadow-sm space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-primary" /> تفاصيل القسط</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">قيمة القسط *</label>
            <Input type="number" value={installmentAmount} onChange={(e) => setInstallmentAmount(e.target.value)} disabled={isView} placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">تاريخ الاستحقاق *</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={isView} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">الحالة</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as 'pending' | 'paid')} disabled={isView} className="w-full p-2 border rounded-md bg-background">
              <option value="pending">قيد الانتظار</option>
              <option value="paid">تم السداد</option>
            </select>
          </div>
        </div>
      </div>

      {/* Guarantors Card */}
      <div className="bg-card rounded-xl p-6 border shadow-sm space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><ShieldCheck className="w-5 h-5 text-primary" /> بيانات الضامنين</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">الضامن الأول</label>
            <Input value={firstGuarantorName} onChange={(e) => setFirstGuarantorName(e.target.value)} disabled={isView} placeholder="اسم الضامن الأول" />
            <Input value={firstGuarantorPhone} onChange={(e) => setFirstGuarantorPhone(e.target.value)} disabled={isView} type="number" placeholder="رقم الهاتف" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">الضامن الثاني</label>
            <Input value={secondGuarantorName} onChange={(e) => setSecondGuarantorName(e.target.value)} disabled={isView} placeholder="اسم الضامن الثاني" />
            <Input value={secondGuarantorPhone} onChange={(e) => setSecondGuarantorPhone(e.target.value)} disabled={isView} type="number" placeholder="رقم الهاتف" />
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div className="bg-card rounded-xl p-6 border shadow-sm">
        <label className="block text-sm font-medium mb-4">صور العميل</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {clientImages.map((image, index) => (
            <div key={index} className="relative group h-32">
              <img src={image} alt={`صورة ${index + 1}`} className="w-full h-full object-cover rounded-lg border cursor-pointer" onClick={() => { setViewerIndex(index); setViewerOpen(true); }} />
              {!isView && (
                <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><X className="w-3 h-3" /></button>
              )}
            </div>
          ))}
        </div>
        {!isView && (
          <label className="block w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-muted">
            <ImageIcon className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
            <span className="text-sm">إضافة صور</span>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        )}
      </div>

      {/* Action Buttons */}
      {installmentId && !isView && (
        <Button onClick={() => setShowNotesSheet(true)} variant="outline" className="w-full gap-2">
          <MessageSquare className="w-4 h-4" /> الملاحظات ({notes.length})
        </Button>
      )}

      <div className="flex gap-4 pt-4 border-t">
        <Button onClick={() => navigate('/installments')} variant="outline" className="flex-1">
          {isView ? 'إغلاق' : 'إلغاء'}
        </Button>
        {!isView && (
          <Button onClick={handleSave} className="flex-1">حفظ التعديلات</Button>
        )}
      </div>
      <InstallmentNotesSheet open={showNotesSheet} onOpenChange={setShowNotesSheet} installmentId={installmentId} clientName={clientName} notes={notes} onAddNote={handleAddNote} onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote} />

      {/* Modals */}
      {viewerOpen && <ImageViewer images={clientImages} initialIndex={viewerIndex} onClose={() => setViewerOpen(false)} />}
    </div>
  );
}