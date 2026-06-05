import * as Dialog from '@radix-ui/react-dialog';
import { QRCodeSVG } from 'qrcode.react';
import { X, Share2 } from 'lucide-react';
import { Button } from './ui/button';

// هنا قمنا بجعل القيمة الافتراضية تستخدم الصفحة الرئيسية للاستضافة فقط
const ShareDialog = ({ url = typeof window !== 'undefined' ? window.location.origin : "" }) => {
    return (
        <Dialog.Root>
            {/* زر فتح النافذة */}
            <Dialog.Trigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="relative shrink-0 size-10"
                >
                    <Share2 size={18} />
                </Button>
            </Dialog.Trigger>

            <Dialog.Portal >
                {/* الخلفية المعتمة مع تأثير Blur */}
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-overlay-show z-50" />

                {/* محتوى النافذة */}
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[90vw] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-8 shadow-2xl animate-content-show focus:outline-none">

                    <div className="flex flex-col items-center text-center">
                        <Dialog.Title className="text-xl font-bold text-zinc-900 mb-2">
                            مسح رمز QR
                        </Dialog.Title>
                        <Dialog.Description className="text-zinc-500 text-sm mb-6">
                            استخدم كاميرا هاتفك لمسح الرمز والوصول السريع للتطبيق
                        </Dialog.Description>

                        {/* منطقة الـ QR Code */}
                        <div className="p-4 bg-white border-2 border-zinc-100 rounded-xl shadow-inner mb-6">
                            <QRCodeSVG
                                value={url}
                                size={200}
                                level={"H"} // جودة عالية لضمان القراءة حتى لو تم تصغيرها
                                includeMargin={true}
                            />
                        </div>

                        {/* الرابط النصي القابل للنسخ (تفعيل اختياري في حال رغبت بظهوره ليقرأ نفس الرابط الديناميكي) */}
                        <div className="w-full p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-between">
                            <span className="text-xs text-zinc-600 truncate">{url}</span>
                            <button
                                onClick={() => navigator.clipboard.writeText(url)}
                                className="text-xs font-bold text-indigo-600 hover:underline"
                            >
                                نسخ
                            </button>
                        </div>
                    </div>

                    {/* زر الإغلاق X */}
                    <Dialog.Close className="absolute right-4 top-4 p-1 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors">
                        <X size={20} />
                        <span className="sr-only">إغلاق</span>
                    </Dialog.Close>

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default ShareDialog;