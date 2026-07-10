// src/components/InstallmentsTable.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
// تم تغيير الأيقونات لتكون معبرة أكثر عن الإجراءات والملاحظات
import { MessageCircle, FileText, Settings, Eye, Edit2, Trash2, Phone } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import type { Installment } from '@/hooks/useInstallmentsStorage';

interface InstallmentsTableProps {
    installments: Installment[];
    selectedClientId: string | null;
    onClientClick: (id: string) => void;
    onWhatsAppClick: (phone: string) => void;
    onActionClick: (id: string, action: 'view' | 'edit' | 'delete' | 'notes') => void;
    getStatusColor: (status: 'pending' | 'paid') => string;
    getStatusLabel: (status: 'pending' | 'paid') => string;
}

export const InstallmentsTable: React.FC<InstallmentsTableProps> = ({
    installments,
    selectedClientId,
    onClientClick,
    onWhatsAppClick,
    onActionClick,
    getStatusColor,
    getStatusLabel,
}) => {

    return (
        <div>
            {/* Desktop Table View */}
            <div className="hidden sm:block">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                        <tr>
                            <th className="px-4 py-4 text-right font-semibold text-muted-foreground">الصورة</th>
                            <th className="px-4 py-4 text-right font-semibold text-muted-foreground">اسم العميل</th>
                            <th className="px-4 py-4 text-right font-semibold text-muted-foreground">رقم الهاتف</th>
                            <th className="px-4 py-4 text-right font-semibold text-muted-foreground">قيمة القسط</th>
                            <th className="px-4 py-4 text-right font-semibold text-muted-foreground">الحالة</th>
                            <th className="px-4 py-4 text-center font-semibold text-muted-foreground">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {installments.map((installment) => (
                            <tr
                                key={installment.id}
                                className={`border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer ${selectedClientId === installment.id ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''}`}
                                onClick={() => onClientClick(installment.id)}
                            >
                                <td className="px-4 py-3">
                                    {installment.clientImages.length > 0 ? (
                                        <div className="flex gap-1">
                                            <img
                                                src={installment.clientImages[0]}
                                                alt="صورة العميل"
                                                className="w-10 h-10 object-cover rounded-lg shadow-sm"
                                                title={`${installment.clientImages.length} صورة`}
                                            />
                                            {installment.clientImages.length > 1 && (
                                                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-xs font-semibold">
                                                    +{installment.clientImages.length - 1}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 font-medium">{installment.clientName || '-'}</td>
                                <td className="px-4 py-3" dir="ltr">{installment.clientPhone || '-'}</td>
                                <td className="px-4 py-3 font-bold text-primary">{installment.installmentAmount} ج.م</td>
                                <td className="px-4 py-3">
                                    <span className={`px-3 py-1.5 rounded-md text-xs font-semibold ${getStatusColor(installment.status)}`}>
                                        {getStatusLabel(installment.status)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2 justify-center items-center">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onClientClick(installment.id);
                                                onActionClick(installment.id, 'notes');
                                            }}
                                            className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 bg-transparent border shadow-sm"
                                            title="الملاحظات"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span className="hidden sm:inline font-medium">
                                                الملاحظات ({installment.notes.length})
                                            </span>
                                        </Button>

                                        {/* نافذة الإجراءات المنبثقة المنظمة */}
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="gap-1.5 shadow-sm"
                                                    title="الإجراءات"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    <span className="hidden sm:inline font-medium">الإجراءات</span>
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[420px] rounded-xl border-0 shadow-xl" dir="rtl">
                                                <DialogHeader>
                                                    <DialogTitle className="text-right text-lg">إجراءات القسط</DialogTitle>
                                                </DialogHeader>
                                                <div className="flex flex-col gap-2.5 py-3">

                                                    {/* زر الواتساب الذي تم نقله */}
                                                    <DialogClose asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="justify-start gap-3 h-12 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 font-medium"
                                                            onClick={() => onWhatsAppClick(installment.clientPhone)}
                                                        >
                                                            <MessageCircle className="w-5 h-5" />
                                                            مراسلة عبر واتساب
                                                        </Button>
                                                    </DialogClose>

                                                    <DialogClose asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="justify-start gap-3 h-12 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30"
                                                            onClick={() => window.location.href = `tel:${installment.clientPhone}`}
                                                        >
                                                            <Phone className="w-5 h-5" />
                                                            اتصال هاتفي بالعميل
                                                        </Button>
                                                    </DialogClose>

                                                    <DialogClose asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="justify-start gap-3 h-12"
                                                            onClick={() => onActionClick(installment.id, 'view')}
                                                        >
                                                            <Eye className="w-5 h-5 text-gray-500" />
                                                            عرض التفاصيل
                                                        </Button>
                                                    </DialogClose>

                                                    <DialogClose asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="justify-start gap-3 h-12"
                                                            onClick={() => onActionClick(installment.id, 'edit')}
                                                        >
                                                            <Edit2 className="w-5 h-5 text-orange-500" />
                                                            تعديل البيانات
                                                        </Button>
                                                    </DialogClose>

                                                    <div className="border-t my-1"></div>

                                                    <DialogClose asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="justify-start gap-3 h-12 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            onClick={() => onActionClick(installment.id, 'delete')}
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                            حذف القسط
                                                        </Button>
                                                    </DialogClose>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-4 p-3 bg-muted/20">
                {installments.map((installment) => (
                    <div
                        key={installment.id}
                        className={`border rounded-xl p-5 bg-card shadow-sm hover:shadow-md transition-all cursor-pointer ${selectedClientId === installment.id ? 'ring-2 ring-orange-500 dark:ring-orange-400' : ''}`}
                        onClick={() => onClientClick(installment.id)}
                    >
                        <div className="space-y-4">
                            <div className="flex gap-3 items-start justify-between">
                                <div className="flex-1">
                                    <p className="font-bold text-lg">{installment.clientName || 'غير محدد'}</p>
                                    <p className="text-muted-foreground text-sm mt-1" dir="ltr">{installment.clientPhone}</p>
                                </div>
                                <span className={`px-3 py-1.5 rounded-md text-xs font-bold shadow-sm ${getStatusColor(installment.status)}`}>
                                    {getStatusLabel(installment.status)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center text-sm border-t border-b py-3 my-3">
                                <div>
                                    <span className="text-muted-foreground block text-xs">قيمة القسط</span>
                                    <span className="font-bold text-primary">{installment.installmentAmount} ج.م</span>
                                </div>
                                <div className="text-left">
                                    <span className="text-muted-foreground block text-xs">تاريخ الاستحقاق</span>
                                    <span className="font-medium">{new Date(installment.dueDate).toLocaleDateString('ar-EG')}</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-1 flex-wrap">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClientClick(installment.id);
                                        onActionClick(installment.id, 'notes');
                                    }}
                                    className="flex-1 gap-2 text-sm bg-transparent border shadow-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                >
                                    <FileText className="w-4 h-4" />
                                    ملاحظات ({installment.notes.length})
                                </Button>

                                {/* نافذة الإجراءات المنبثقة للموبايل */}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 gap-2 text-sm shadow-sm"
                                        >
                                            <Settings className="w-4 h-4" />
                                            الإجراءات
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[400px] w-[92%] rounded-2xl py-10" dir="rtl">
                                        <DialogHeader>
                                            <DialogTitle className="text-right text-lg">{installment.clientName}</DialogTitle>
                                        </DialogHeader>
                                        <div className="flex flex-col gap-2.5 py-2">
                                            {/* زر الواتساب */}
                                            <DialogClose asChild>
                                                <Button
                                                    variant="outline"
                                                    className="justify-start gap-3 h-12 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 font-medium"
                                                    onClick={() => onWhatsAppClick(installment.clientPhone)}
                                                >
                                                    <MessageCircle className="w-5 h-5" />
                                                    مراسلة عبر واتساب
                                                </Button>
                                            </DialogClose>

                                            <DialogClose asChild>
                                                <Button
                                                    variant="outline"
                                                    className="justify-start gap-3 h-12 hover:bg-blue-50 hover:text-blue-700"
                                                    onClick={() => window.location.href = `tel:${installment.clientPhone}`}
                                                >
                                                    <Phone className="w-5 h-5" />
                                                    اتصال هاتفي
                                                </Button>
                                            </DialogClose>
                                            <div className="border-t my-1"></div>
                                            <DialogClose asChild>
                                                <Button
                                                    variant="outline"
                                                    className="justify-start gap-3 h-12"
                                                    onClick={() => onActionClick(installment.id, 'view')}
                                                >
                                                    <Eye className="w-5 h-5 text-gray-500" />
                                                    عرض البيانات
                                                </Button>
                                            </DialogClose>

                                            <DialogClose asChild>
                                                <Button
                                                    variant="outline"
                                                    className="justify-start gap-3 h-12"
                                                    onClick={() => onActionClick(installment.id, 'edit')}
                                                >
                                                    <Edit2 className="w-5 h-5 text-orange-500" />
                                                    تعديل البيانات
                                                </Button>
                                            </DialogClose>

                                            <div className="border-t my-1"></div>

                                            <DialogClose asChild>
                                                <Button
                                                    variant="destructive"
                                                    className="justify-start gap-3 h-12 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    onClick={() => onActionClick(installment.id, 'delete')}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                    حذف القسط
                                                </Button>
                                            </DialogClose>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};