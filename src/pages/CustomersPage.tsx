export function CustomersPage() {
  return (
    <div className="space-y-4 text-start">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">بيانات العملاء</h1>
        <p className="text-sm text-muted-foreground">
          عرض وإدارة بيانات العملاء (جاهز لربطه لاحقاً بقاعدة بيانات أو API).
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-sm text-muted-foreground">
        لا توجد بيانات محمّلة بعد. أضف جدولاً أو تكاملاً مع الخادم عند الحاجة.
      </div>
    </div>
  );
}
