export function CustomersPage() {
  return (
    <div className="space-y-4 text-start">
      <div dir="rtl">
        <h1 className="text-2xl font-semibold tracking-tight">بيانات العملاء</h1>
      </div>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-sm text-muted-foreground">
        رقم الهاتف
      </div>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-sm text-muted-foreground">
        الاسم
      </div>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-sm text-muted-foreground">
        العنوان
      </div>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-sm text-muted-foreground">
        gps
      </div>
    </div>
  );
}
