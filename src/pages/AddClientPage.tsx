import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MapComponent from '@/Project/Map';
import { useClientsStorage, type ClientData } from '../hooks/useClientsStorage';
import { ChevronRight, MapPin } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';

const emptyClient = (): Omit<ClientData, 'id'> => ({
  client_information: {
    full_name: { val: '', label: 'اسم مقدم الطلب' },
    phone_number: { val: '', label: 'رقم الهاتف' },
    permanent_address: { val: '', label: 'عنوان الإقامة الدائم' },
    landmark: { val: '', label: 'علامة مميزة' },
  },
  business_details: {
    coordinates: { val: '', label: 'إحداثيات خطوط الطول والعرض' },
    business_type: { val: '', label: 'نوع النشاط' },
    start_date: { val: '', label: 'تاريخ بدء النشاط' },
    address: { val: '', label: 'العنوان' },
    landmark: { val: '', label: 'علامة مميزة' },
  },
  guarantors_details: {
    first_guarantor: {
      full_name: { val: '', label: 'الأسم' },
      phone_number: { val: '', label: 'رقم هاتف' },
      permanent_address: { val: '', label: 'عنوان الإقامة الدائم' },
      address_landmark: { val: '', label: 'علامة مميزة' },
      job_details: {
        job_title: { val: '', label: 'المهنة' },
        workplace: { val: '', label: 'اسم جهة العمل' },
        years_of_experience: { val: '', label: 'عدد سنوات الخبرة' },
      },
    },
    second_guarantor: {
      full_name: { val: '', label: 'الأسم' },
      phone_number: { val: '', label: 'رقم هاتف' },
      permanent_address: { val: '', label: 'عنوان الإقامة الدائم' },
      address_landmark: { val: '', label: 'علامة مميزة' },
      job_details: {
        job_title: { val: '', label: 'المهنة' },
        workplace: { val: '', label: 'اسم جهة العمل' },
        years_of_experience: { val: '', label: 'عدد سنوات الخبرة' },
      },
    },
  },
});

export function AddClientPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addClient, updateClient, getClient } = useClientsStorage();
  const [formData, setFormData] = useState<Omit<ClientData, 'id'>>(emptyClient());
  const [isEditing, setIsEditing] = useState(false);
  const [savedCalculatorNumber] = useLocalStorage<string>('loanPhoneNumber', '');

  const clientId = searchParams.get('id');

  useEffect(() => {
    if (clientId) {
      const client = getClient(clientId);
      if (client) {
        const { id: _, ...clientWithoutId } = client;
        setFormData(clientWithoutId);
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
  // 1. هذه الدالة الجديدة ستستقبل الإحداثيات من الخريطة وتحدث النموذج
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



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && clientId) {
      updateClient(clientId, formData);
    } else {
      addClient(formData);
    }
    navigate('/customers');
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
        {/* معلومات مقدم الطلب */}
        <Section title="معلومات مقدم الطلب">
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
          <Button type="button" onClick={() => {
            // التحقق من وجود رقم صالح (وليس مجرد علامات تنصيص)
            if (savedCalculatorNumber && savedCalculatorNumber.length > 2) {
              updateNestedValue('client_information.phone_number', savedCalculatorNumber);
            } else {
              alert('لا يوجد رقم هاتف صالح محفوظ');
            }
          }}
          >اضافة الرقم المسجل فى الحاسبة
          </Button>

          <FieldInput
            label="عنوان الإقامة الدائم"
            value={formData.client_information.permanent_address.val}
            onChange={(val) => updateNestedValue('client_information.permanent_address', val)}
          />
          <FieldInput
            label="علامة مميزة"
            value={formData.client_information.landmark.val}
            onChange={(val) => updateNestedValue('client_information.landmark', val)}
          />
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
          <FieldInput
            label="تاريخ بدء النشاط"
            value={formData.business_details.start_date.val}
            onChange={(val) => updateNestedValue('business_details.start_date', val)}
            type="date"
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

        {/* بيانات الضامن الأول */}
        <Section title="بيانات الضامن الأول">
          <FieldInput
            label="الاسم"
            value={formData.guarantors_details.first_guarantor.full_name.val}
            onChange={(val) => updateNestedValue('guarantors_details.first_guarantor.full_name', val)}
          />
          <FieldInput
            label="رقم هاتف"
            value={formData.guarantors_details.first_guarantor.phone_number.val}
            onChange={(val) => updateNestedValue('guarantors_details.first_guarantor.phone_number', val)}
            type="tel"
          />
          <FieldInput
            label="عنوان الإقامة الدائم"
            value={formData.guarantors_details.first_guarantor.permanent_address.val}
            onChange={(val) => updateNestedValue('guarantors_details.first_guarantor.permanent_address', val)}
          />
          <FieldInput
            label="علامة مميزة"
            value={formData.guarantors_details.first_guarantor.address_landmark.val}
            onChange={(val) => updateNestedValue('guarantors_details.first_guarantor.address_landmark', val)}
          />

          <div className="space-y-3 pl-4 border-r-2 border-muted">
            <h4 className="font-medium text-sm">تفاصيل الوظيفة</h4>
            <FieldInput
              label="المهنة"
              value={formData.guarantors_details.first_guarantor.job_details.job_title.val}
              onChange={(val) => updateNestedValue('guarantors_details.first_guarantor.job_details.job_title', val)}
            />
            <FieldInput
              label="اسم جهة العمل"
              value={formData.guarantors_details.first_guarantor.job_details.workplace.val}
              onChange={(val) => updateNestedValue('guarantors_details.first_guarantor.job_details.workplace', val)}
            />
            <FieldInput
              label="عدد سنوات الخبرة"
              value={formData.guarantors_details.first_guarantor.job_details.years_of_experience.val}
              onChange={(val) => updateNestedValue('guarantors_details.first_guarantor.job_details.years_of_experience', val)}
              type="number"
            />
          </div>
        </Section>

        {/* بيانات الضامن الثاني */}
        <Section title="بيانات الضامن الثاني">
          <FieldInput
            label="الاسم"
            value={formData.guarantors_details.second_guarantor.full_name.val}
            onChange={(val) => updateNestedValue('guarantors_details.second_guarantor.full_name', val)}
          />
          <FieldInput
            label="رقم هاتف"
            value={formData.guarantors_details.second_guarantor.phone_number.val}
            onChange={(val) => updateNestedValue('guarantors_details.second_guarantor.phone_number', val)}
            type="tel"
          />
          <FieldInput
            label="عنوان الإقامة الدائم"
            value={formData.guarantors_details.second_guarantor.permanent_address.val}
            onChange={(val) => updateNestedValue('guarantors_details.second_guarantor.permanent_address', val)}
          />
          <FieldInput
            label="علامة مميزة"
            value={formData.guarantors_details.second_guarantor.address_landmark.val}
            onChange={(val) => updateNestedValue('guarantors_details.second_guarantor.address_landmark', val)}
          />

          <div className="space-y-3 pl-4 border-r-2 border-muted">
            <h4 className="font-medium text-sm">تفاصيل الوظيفة</h4>
            <FieldInput
              label="المهنة"
              value={formData.guarantors_details.second_guarantor.job_details.job_title.val}
              onChange={(val) => updateNestedValue('guarantors_details.second_guarantor.job_details.job_title', val)}
            />
            <FieldInput
              label="اسم جهة العمل"
              value={formData.guarantors_details.second_guarantor.job_details.workplace.val}
              onChange={(val) => updateNestedValue('guarantors_details.second_guarantor.job_details.workplace', val)}
            />
            <FieldInput
              label="عدد سنوات الخبرة"
              value={formData.guarantors_details.second_guarantor.job_details.years_of_experience.val}
              onChange={(val) => updateNestedValue('guarantors_details.second_guarantor.job_details.years_of_experience', val)}
              type="number"
            />
          </div>
        </Section>

        {/* أزرار التحكم */}
        <div className="flex gap-2 sticky bottom-0 bg-background/95 backdrop-blur py-4 border-t">
          <Button type="button" variant="outline" onClick={() => navigate('/customers')} className="flex-1">
            إلغاء
          </Button>
          <Button type="submit" className="flex-1">
            {isEditing ? 'تحديث' : 'حفظ'}
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
