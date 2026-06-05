import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MapComponent from '@/Project/Map';
import { useClientsStorage, type ClientData } from '../hooks/useClientsStorage';
import { ChevronRight, MapPin, X, Image as ImageIcon } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { ImageViewer } from '@/components/ImageViewer';
import { toast } from 'sonner';

const emptyClient = (): Omit<ClientData, 'id' | 'createdAt' | 'updatedAt'> => ({
  client_information: {
    full_name: { val: '', label: 'اسم مقدم الطلب' },
    phone_number: { val: '', label: 'رقم الهاتف' },
  },
  business_details: {
    coordinates: { val: '', label: 'إحداثيات خطوط الطول والعرض' },
    business_type: { val: '', label: 'نوع النشاط' },
    start_date: { val: '', label: 'تاريخ بدء النشاط' },
    address: { val: '', label: 'العنوان' },
    landmark: { val: '', label: 'علامة مميزة' },
  },
  clientImages: [],
});

export function AddClientPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addClient, updateClient, getClient } = useClientsStorage();
  const [formData, setFormData] = useState<Omit<ClientData, 'id' | 'createdAt' | 'updatedAt'>>(emptyClient());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCalculatorNumber] = useLocalStorage<string>('loanPhoneNumber', '');
  const [clientImages, setClientImages] = useState<string[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const clientId = searchParams.get('id');

  useEffect(() => {
    if (clientId) {
      const client = getClient(clientId);
      if (client) {
        const { id: _, createdAt: __, updatedAt: ___, ...clientWithoutMetadata } = client;
        setFormData(clientWithoutMetadata);
        setClientImages(client.clientImages);
        setIsEditing(true);
      }
    }
  }, [clientId, getClient]);

  const mapMarkers = useMemo(() => [
    {
      position: [0.058302, 0.409740] as [number, number],
      title: 'موقع النشاط'
    }
  ], []);

  const handleMapLocationSelect = useCallback((location: { lat: number; lng: number }) => {
    const coordinatesString = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
    updateNestedValue('business_details.coordinates', coordinatesString);
  }, []);

  const updateNestedValue = (path: string, value: string) => {
    setFormData((prev) => {
      const keys = path.split('.');
      const newData = JSON.parse(JSON.stringify(prev));
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      const lastKey = keys[keys.length - 1];
      if (current[lastKey] && typeof current[lastKey] === 'object') {
        current[lastKey].val = value;
      }

      return newData;
    });
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_information.full_name.val || !formData.client_information.phone_number.val) {
      toast.error('يرجى ملء الاسم ورقم الهاتف');
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        clientImages,
      };

      if (isEditing && clientId) {
        await updateClient(clientId, dataToSave);
        toast.success('تم تحديث بيانات العميل بنجاح');
      } else {
        await addClient(dataToSave);
        toast.success('تم إضافة العميل بنجاح');
      }
      navigate('/customers');
    } catch (error) {
      toast.error('حدث خطأ في الحفظ');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-start" dir="rtl">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold">
          {isEditing ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        {/* معلومات العميل */}
        <Section title="معلومات العميل">
          <FieldInput
            label={formData.client_information.full_name.label}
            value={formData.client_information.full_name.val}
            onChange={(val) => updateNestedValue('client_information.full_name', val)}
          />
          <FieldInput
            label={formData.client_information.phone_number.label}
            value={formData.client_information.phone_number.val}
            onChange={(val) => updateNestedValue('client_information.phone_number', val)}
            type="tel"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (savedCalculatorNumber && savedCalculatorNumber.length > 2) {
                updateNestedValue('client_information.phone_number', savedCalculatorNumber);
              } else {
                toast.error('لا يوجد رقم هاتف صالح محفوظ');
              }
            }}
          >
            اضافة الرقم المسجل فى الحاسبة
          </Button>
        </Section>

        {/* تفاصيل النشاط */}
        <Section title="تفاصيل النشاط">
          <FieldInput
            dir="ltr"
            label="إحداثيات خطوط الطول والعرض"
            value={formData.business_details.coordinates.val}
            onChange={(val) => updateNestedValue('business_details.coordinates', val)}
            readOnly
          />

          <div className="rounded-lg border overflow-hidden">
            <div className="flex items-center gap-2 p-3 bg-muted/50">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">انقر على الخريطة لاختيار الموقع</span>
            </div>
            <MapComponent
              showUserLocation={true}
              markers={mapMarkers}
              onLocationSelect={handleMapLocationSelect}
            />
          </div>

          <FieldInput
            label="نوع النشاط"
            value={formData.business_details.business_type.val}
            onChange={(val) => updateNestedValue('business_details.business_type', val)}
          />

          {/* Start Date with Flexible Input */}
          <StartDateInput
            value={formData.business_details.start_date.val}
            onChange={(val) => updateNestedValue('business_details.start_date', val)}
          />

          <FieldInput
            label="العنوان"
            value={formData.business_details.address.val}
            onChange={(val) => updateNestedValue('business_details.address', val)}
          />
          <FieldInput
            label="علامة مميزة"
            value={formData.business_details.landmark.val}
            onChange={(val) => updateNestedValue('business_details.landmark', val)}
          />
        </Section>

        {/* صور العميل */}
        <Section title="صور العميل">
          <p className="text-sm text-muted-foreground mb-4">
            يمكنك إضافة عدة صور للعميل
          </p>

          {/* Images Grid */}
          {clientImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {clientImages.map((image, index) => (
                <div key={index} className="relative group">
                  <button
                    type="button"
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
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-destructive text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="حذف الصورة"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Area */}
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

          {clientImages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              لا توجد صور
            </div>
          )}
        </Section>

        {/* Image Viewer Modal */}
        {viewerOpen && clientImages.length > 0 && (
          <ImageViewer
            images={clientImages}
            initialIndex={viewerIndex}
            onClose={() => setViewerOpen(false)}
          />
        )}

        {/* أزرار التحكم */}
        <div className="flex gap-2 sticky bottom-0 bg-background/95 backdrop-blur py-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/customers')}
            className="flex-1"
            disabled={isSaving}
          >
            إلغاء
          </Button>
          <Button type="submit" className="flex-1" disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : isEditing ? 'تحديث' : 'حفظ'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border p-4 bg-card/50">
      <h2 className="text-base font-semibold border-b pb-2">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
  readOnly = false,
  dir,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  readOnly?: boolean;
  dir?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        readOnly={readOnly}
        dir={dir}
        className="w-full"
      />
    </div>
  );
}

function StartDateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length >= 1) setYear(parts[0]);
      if (parts.length >= 2) setMonth(parts[1]);
      if (parts.length === 3) setDay(parts[2]);
    }
  }, [value]);

  const handleDateChange = (y: string, m: string, d: string) => {
    setYear(y);
    setMonth(m);
    setDay(d);

    // Build date string
    let dateStr = y;
    if (m) dateStr += `-${m.padStart(2, '0')}`;
    if (d && m) dateStr += `-${d.padStart(2, '0')}`;

    onChange(dateStr);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div>
      <label className="block text-sm font-medium mb-2">تاريخ بدء النشاط</label>
      <p className="text-xs text-muted-foreground mb-3">
        يمكنك إدخال السنة فقط، أو السنة والشهر، أو التاريخ كاملاً
      </p>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">السنة *</label>
          <select
            value={year}
            onChange={(e) => handleDateChange(e.target.value, month, day)}
            className="w-full p-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">اختر السنة</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">الشهر</label>
          <select
            value={month}
            onChange={(e) => handleDateChange(year, e.target.value, day)}
            className="w-full p-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={!year}
          >
            <option value="">اختر الشهر</option>
            {months.map((m) => (
              <option key={m} value={String(m).padStart(2, '0')}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">اليوم</label>
          <select
            value={day}
            onChange={(e) => handleDateChange(year, month, e.target.value)}
            className="w-full p-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={!month}
          >
            <option value="">اختر اليوم</option>
            {days.map((d) => (
              <option key={d} value={String(d).padStart(2, '0')}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
