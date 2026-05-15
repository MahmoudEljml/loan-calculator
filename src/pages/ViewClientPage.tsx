import { useSearchParams, useNavigate } from 'react-router-dom';
import { useClientsStorage } from '../hooks/useClientsStorage';
import { Button } from '../components/ui/button';
import { ChevronRight, Edit2, ArrowLeft, Phone, MapPin, Briefcase, User, Calendar } from 'lucide-react';

// function isJobDetails(value: any): value is {
//   job_title: { val: string; label: string };
//   workplace: { val: string; label: string };
//   years_of_experience: { val: string; label: string };
// } {
//   return value && typeof value === 'object' && 'job_title' in value;
// }

export function ViewClientPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getClient } = useClientsStorage();

  const clientId = searchParams.get('id');
  const client = clientId ? getClient(clientId) : null;

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen" dir="rtl">
        <div className="text-center space-y-4 p-6">
          <div className="text-6xl">😕</div>
          <p className="text-lg font-semibold">العميل غير موجود</p>
          <p className="text-sm text-muted-foreground">لم نتمكن من العثور على بيانات هذا العميل</p>
          <Button onClick={() => navigate('/customers')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/customers')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{client.client_information.full_name.val || 'عميل بدون اسم'}</h1>
              <p className="text-sm text-muted-foreground">عرض بيانات العميل</p>
            </div>
          </div>
          <Button onClick={() => navigate(`/add-client?id=${client.id}`)} className="gap-2">
            <Edit2 className="w-4 h-4" />
            تعديل
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* معلومات مقدم الطلب */}
        <Section
          title="معلومات مقدم الطلب"
          icon={<User className="w-5 h-5" />}
          subtitle="البيانات الشخصية للمتقدم"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField
              label="الاسم الكامل"
              value={client.client_information.full_name.val}
              icon={<User className="w-4 h-4" />}
            />
            <InfoField
              label="رقم الهاتف"
              value={client.client_information.phone_number.val}
              icon={<Phone className="w-4 h-4" />}
            />
            <InfoField
              label="عنوان الإقامة الدائم"
              value={client.client_information.permanent_address.val}
              icon={<MapPin className="w-4 h-4" />}
            />
            <InfoField
              label="علامة مميزة"
              value={client.client_information.landmark.val}
            />
          </div>
        </Section>

        {/* تفاصيل النشاط */}
        <Section
          title="تفاصيل النشاط"
          icon={<Briefcase className="w-5 h-5" />}
          subtitle="معلومات النشاط التجاري"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField
              label="نوع النشاط"
              value={client.business_details.business_type.val}
              icon={<Briefcase className="w-4 h-4" />}
            />
            <InfoField
              label="تاريخ بدء النشاط"
              value={client.business_details.start_date.val}
              icon={<Calendar className="w-4 h-4" />}
            />
            <div className="md:col-span-2">
              <InfoField
                label="العنوان"
                value={client.business_details.address.val}
                icon={<MapPin className="w-4 h-4" />}
              />
            </div>
            <div className="md:col-span-2">
              <InfoField
                label="علامة مميزة"
                value={client.business_details.landmark.val}
              />
            </div>
            <div className="md:col-span-2">
              <InfoField
                dir="ltr"
                label="إحداثيات خطوط الطول والعرض"
                value={client.business_details.coordinates.val}
                icon={<MapPin className="w-4 h-4" />}
                highlight
              />
            </div>
          </div>
        </Section>

        {/* بيانات الكفيل الأول */}
        <Section
          title="بيانات الكفيل الأول"
          icon={<User className="w-5 h-5" />}
          subtitle="معلومات الكفيل الأول"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField
                label="الاسم"
                value={client.guarantors_details.first_guarantor.full_name.val}
                icon={<User className="w-4 h-4" />}
              />
              <InfoField
                label="رقم الهاتف"
                value={client.guarantors_details.first_guarantor.phone_number.val}
                icon={<Phone className="w-4 h-4" />}
              />
              <InfoField
                label="عنوان الإقامة الدائم"
                value={client.guarantors_details.first_guarantor.permanent_address.val}
                icon={<MapPin className="w-4 h-4" />}
              />
              <InfoField
                label="علامة مميزة"
                value={client.guarantors_details.first_guarantor.address_landmark.val}
              />
            </div>

            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
              <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                تفاصيل الوظيفة
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoField
                  label="المهنة"
                  value={client.guarantors_details.first_guarantor.job_details.job_title.val}
                />
                <InfoField
                  label="اسم جهة العمل"
                  value={client.guarantors_details.first_guarantor.job_details.workplace.val}
                />
                <InfoField
                  label="عدد سنوات الخبرة"
                  value={client.guarantors_details.first_guarantor.job_details.years_of_experience.val}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* بيانات الكفيل الثاني */}
        <Section
          title="بيانات الكفيل الثاني"
          icon={<User className="w-5 h-5" />}
          subtitle="معلومات الكفيل الثاني"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField
                label="الاسم"
                value={client.guarantors_details.second_guarantor.full_name.val}
                icon={<User className="w-4 h-4" />}
              />
              <InfoField
                label="رقم الهاتف"
                value={client.guarantors_details.second_guarantor.phone_number.val}
                icon={<Phone className="w-4 h-4" />}
              />
              <InfoField
                label="عنوان الإقامة الدائم"
                value={client.guarantors_details.second_guarantor.permanent_address.val}
                icon={<MapPin className="w-4 h-4" />}
              />
              <InfoField
                label="علامة مميزة"
                value={client.guarantors_details.second_guarantor.address_landmark.val}
              />
            </div>

            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
              <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                تفاصيل الوظيفة
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoField
                  label="المهنة"
                  value={client.guarantors_details.second_guarantor.job_details.job_title.val}
                />
                <InfoField
                  label="اسم جهة العمل"
                  value={client.guarantors_details.second_guarantor.job_details.workplace.val}
                />
                <InfoField
                  label="عدد سنوات الخبرة"
                  value={client.guarantors_details.second_guarantor.job_details.years_of_experience.val}
                />
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="max-w-6xl mx-auto px-4 py-4 flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/customers')}
            className="flex-1 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          <Button
            onClick={() => navigate(`/add-client?id=${client.id}`)}
            className="flex-1 gap-2"
          >
            <Edit2 className="w-4 h-4" />
            تعديل البيانات
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b px-6 py-4">
        <div className="flex items-center gap-3">
          {icon && <div className="text-primary">{icon}</div>}
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

function InfoField({
  label,
  value,
  icon,
  highlight = false,
  dir
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  dir?: string;
}) {
  return (
    <div
      className={`space-y-2 p-3 rounded-lg transition-colors ${highlight
        ? 'bg-primary/10 border border-primary/20'
        : 'bg-muted/50 hover:bg-muted'
        }`}
    >
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </label>
      <p dir={dir}
        className={`text-sm font-medium ${value ? 'text-foreground' : 'text-muted-foreground italic'
          }`}
      >
        {value || 'not set'}
      </p>
    </div>
  );
}
