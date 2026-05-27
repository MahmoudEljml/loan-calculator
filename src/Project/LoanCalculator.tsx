import { useCallback, useEffect, useRef, useState } from "react";
import LoanDetails from "./LoanDetails";
// import MapComponent from "./Map";
import { loanData } from "./Data";
import type { PartCalculateProps, RequiredDocumentsProps, ShareWhatsAppProps } from "./types";
import FAB from "@/components/FAB";
import ArrowIcon from "@/IconSVG/ArrowIcon";
// import CurrentChipInformation from "./CurrentChipInformation";
import useLocalStorage from '@/hooks/useLocalStorage'; 


const getRequiredDocuments = (amount: number) => {
    const personalDocuments = ['صورة البطاقة الشخصية'];

    const guaranteeDocuments = amount > 30000 ? ['صورة بطاقتي الضامنين'] : ['صورة بطاقة الضامن'];

    const otherDocuments = ['وصلين (غاز/مياه/كهرباء)', 'صورة من عقد إيجار سارى منذ سنه حتى انتهاء فتره السداد'];

    const additionalDocuments = [];

    if (amount > 100000) {
        additionalDocuments.push('السجل التجاري');
        additionalDocuments.push('البطاقة الضريبية');
    }

    return [...personalDocuments, ...guaranteeDocuments, ...otherDocuments, ...additionalDocuments];
};

const ProfessionalLoanCalculator = () => {
    const [amount, setAmount] = useState(50000);
    const [months, setMonths] = useState(12);
    const [currentTier, setCurrentTier] = useState<typeof loanData[0] | null>(null);
    const [results, setResults] = useState<{
        monthlyPayment: number;
        totalInterest: number;
        totalAmount: number;
        adminFees: number;
        insuranceFees: number; // Added insurance fees
    } | null>(null);
    const [showAmountInput, setShowAmountInput] = useState(false);
    const [showMonthsInput, setShowMonthsInput] = useState(false);
    const [phoneNumber, setPhoneNumber] = useLocalStorage<string>('loanPhoneNumber', '01');
    const [shareOptions, setShareOptions] = useLocalStorage('loanShareOptions', {
        monthlyPayment: true,
        // totalInterest: false,
        // totalAmount: false,
        adminFees: false,
        insuranceFees: false, // Added insurance fees to share options
        interest: false,
        documents: true
    });

    useEffect(() => {
        const tier = loanData.find(t => amount >= t.min && amount <= t.max);
        if (tier) {
            setCurrentTier(tier);
            if (months > tier.maxMonths) setMonths(tier.maxMonths);

            // الحسابات
            const P = amount;
            const m = months;
            const totalInterest = P * (tier.interest / 100) * (m / 12);
            const totalAmount = P + totalInterest;
            const adminFees = Math.round(P * (tier.fees / 100));
            const insuranceFees = amount > 100000 ? 450 : 300; // Insurance fee calculation

            setResults({
                monthlyPayment: Math.ceil(totalAmount / m),
                totalInterest: Math.round(totalInterest),
                totalAmount: Math.round(totalAmount),
                adminFees,
                insuranceFees
            });
        }
    }, [amount, months]);

    const formatWhatsAppMessage = () => {
        if (!results || !currentTier) return '';

        let message = `*تفاصيل القرض*\n` +
            `مبلغ القرض: ${amount.toLocaleString()} ج.م\n` +
            `مدة السداد: ${months} شهر\n`;

        if (shareOptions.interest) {
            message += `الفائدة السنوية: ${currentTier.interest}%\n`;
        }

        if (shareOptions.monthlyPayment) {
            message += `القسط الشهري: ${results.monthlyPayment.toLocaleString()} ج.م\n`;
        }

        // if (shareOptions.totalInterest) {
        //     message += `إجمالي الفوائد: ${results.totalInterest.toLocaleString()} ج.م\n`;
        // }

        // if (shareOptions.totalAmount) {
        //     message += `إجمالي الاقساط: ${results.totalAmount.toLocaleString()} ج.م\n`;
        // }

        if (shareOptions.adminFees) {
            message += `المصاريف الإدارية: ${results.adminFees.toLocaleString()} ج.م (${currentTier.fees}%)\n`;
        }

        if (shareOptions.insuranceFees && results.insuranceFees > 0) {
            message += `رسوم التأمين: ${results.insuranceFees.toLocaleString()} ج.م\n`;
        }

        if (shareOptions.documents) {
            message += `\n\n*الأوراق المطلوبة:*\n`;
            const docs = getRequiredDocuments(amount);
            message += `• ${docs[0]}\n`; // صورة البطاقة الشخصية
            message += `• ${docs[1]}\n`; // صورة بطاقة الضامن/الضامنين
            message += `• ${docs[2]}\n`; // وصلين
            message += `• ${docs[3]}\n`; // عقد الإيجار
            if (docs.length > 4) {
                message += `• ${docs[4]}\n`; // السجل التجاري
            }
            if (docs.length > 5) {
                message += `• ${docs[5]}\n`; // البطاقة الضريبية
            }
        }
        return message;
    };

    const shareOnWhatsApp = () => {
        const message = formatWhatsAppMessage();
        const whatsappUrl = `https://wa.me/2${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const validateAmount = (value: number) => {
        const tier = loanData.find(t => value >= t.min && value <= t.max);
        if (!tier) {
            const closestTier = loanData.reduce((prev, curr) => {
                return Math.abs(curr.min - value) < Math.abs(prev.min - value) ? curr : prev;
            });
            return value < closestTier.min ? closestTier.min : closestTier.max;
        }
        return value;
    };

    const validateMonths = (value: number) => {
        const tier = loanData.find(t => amount >= t.min && amount <= t.max);
        return tier ? Math.min(Math.max(value, 6), tier.maxMonths) : value;
    };

    return (
        <div className="min-h-screen flex items-center justify-center font-sans bg-background text-foreground" dir="rtl">
            {/* <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md mx-4"> */}
            <div className="w-full max-w-xl relative bg-card rounded-2xl shadow-lg border border-border p-6">
                {/* <CurrentChipInformation currentTier={currentTier} /> */}

                {/* <MapComponent
                    markers={[
                    ]}
                /> */}



                <PartCalculate
                    amount={amount}
                    setAmount={setAmount}
                    months={months}
                    setMonths={setMonths}
                    showAmountInput={showAmountInput}
                    setShowAmountInput={setShowAmountInput}
                    showMonthsInput={showMonthsInput}
                    setShowMonthsInput={setShowMonthsInput}
                    currentTier={currentTier}
                    validateAmount={validateAmount}
                    validateMonths={validateMonths}
                />

                {results && (
                    <div className="bg-muted rounded-xl p-5 text-foreground border border-border">

                        <LoanDetails results={results} currentTier={currentTier} amount={amount} />
                        <RequiredDocuments amount={amount} />

                        <ShareWhatsApp
                            phoneNumber={phoneNumber}
                            setPhoneNumber={setPhoneNumber}
                            shareOptions={shareOptions}
                            setShareOptions={setShareOptions}
                            shareOnWhatsApp={shareOnWhatsApp}
                        />

                    </div>
                )}
            </div>
        </div>
    );
};


function PartCalculate({
    amount,
    setAmount,
    months,
    setMonths,
    showAmountInput,
    setShowAmountInput,
    showMonthsInput,
    setShowMonthsInput,
    currentTier,
    validateAmount,
    validateMonths
}: PartCalculateProps) {

    // تحديد الحدود الثابتة للمدخلات
    const MIN_AMOUNT = 5000;
    const MAX_AMOUNT = 292000;
    const STEP_AMOUNT = 1000;

    // Refs للتحكم في المؤقت
    const intervalRef = useRef<number | null>(null);

    // حساب الفجوات ديناميكياً من البيانات
    const getAmountStatus = () => {
        if (!currentTier) return null;

        // التحقق من النطاق الصالح
        if (amount >= currentTier.min && amount <= currentTier.max) {
            return { type: 'normal', message: null };
        }

        // حساب الفجوات بين الشرائح
        const gaps = [];
        for (let i = 0; i < loanData.length - 1; i++) {
            const current = loanData[i];
            const next = loanData[i + 1];
            if (next.min - current.max > 1) {
                gaps.push({
                    min: current.max + 1,
                    max: next.min - 1,
                    message: `النطاق غير متاح. الخيارات المتاحة: حتى ${current.max.toLocaleString()} ج.م أو من ${next.min.toLocaleString()} ج.م`
                });
            }
        }

        // التحقق مما إذا كان المبلغ في إحدى الفجوات
        for (const gap of gaps) {
            if (amount >= gap.min && amount <= gap.max) {
                return { type: 'warning', message: gap.message };
            }
        }

        // التحقق من المبالغ خارج النطاق الكلي
        const minAmount = Math.min(...loanData.map(d => d.min));
        const maxAmount = Math.max(...loanData.map(d => d.max));
        if (amount < minAmount || amount > maxAmount) {
            return {
                type: 'error',
                message: `المبلغ يجب أن يكون بين ${minAmount.toLocaleString()} و ${maxAmount.toLocaleString()} ج.م`
            };
        }

        return {
            type: 'info',
            message: 'الرجاء اختيار مبلغ ضمن إحدى الشرائح المتاحة'
        };
    };

    const amountStatus = getAmountStatus();
    const stopChange = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // 1. أضف هذا الـ Ref في بداية مكون PartCalculate
    const isProcessing = useRef(false);

    const startChange = useCallback((e: React.MouseEvent | React.TouchEvent, action: 'increase' | 'decrease') => {
        // إذا كانت الدالة تعمل بالفعل من حدث آخر (مثل touch بعده mouse)، اخرج فوراً
        if (isProcessing.current) return;

        // منع المتصفح من إرسال أحداث إضافية
        if (e.cancelable) {
            e.preventDefault();
            e.stopPropagation();
        }

        isProcessing.current = true; // تفعيل الحماية
        stopChange();

        const update = () => {
            setAmount((prev) => {
                if (action === 'increase') {
                    return Math.min(MAX_AMOUNT, prev + STEP_AMOUNT);
                } else {
                    return Math.max(MIN_AMOUNT, prev - STEP_AMOUNT);
                }
            });
        };

        update(); // الزيادة الأولى (1000 ج.م فقط)

        intervalRef.current = window.setInterval(update, 150);

        // إعادة ضبط الحماية بعد فترة قصيرة جداً (أقل من وقت استجابة الإنسان)
        setTimeout(() => {
            isProcessing.current = false;
        }, 100);
    }, [stopChange, MIN_AMOUNT, MAX_AMOUNT, STEP_AMOUNT, setAmount]);

    // تنظيف المؤقت عند إلغاء تحميل المكون
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return (
        <>
            <div className="mb-6">

                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                        <div onClick={() => setShowAmountInput(!showAmountInput)} className="cursor-pointer">
                            مبلغ القرض
                        </div>

                        <FAB
                            onClick={() => setShowAmountInput(!showAmountInput)}
                            showDetails={showAmountInput}
                            text="تغيير"
                            size={'small'}
                            icon={<ArrowIcon color="currentColor" size={20} className={`${showAmountInput ? 'rotate-180' : ''}  transition-transform duration-300`} />}
                        />

                    </div>
                    <b className="text-primary text-lg">{amount.toLocaleString()}</b>
                </div>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden
        ${showAmountInput
                        ? 'max-h-24 opacity-100 mb-2'
                        : 'max-h-0 opacity-0 mb-0'
                    }`}>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => {
                                setAmount(Number(e.target.value));
                                e.target.value = validateAmount(Number(e.target.value)).toString();
                            }}
                            className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:border-ring bg-background text-foreground"
                            placeholder="أدخل المبلغ"
                        />
                        <button
                            onClick={() => {
                                setAmount(validateAmount(amount));
                                setShowAmountInput(false);
                            }}
                            className="px-4 py-2 bg-primary/10 text-foreground border border-border rounded-lg hover:bg-primary/20 transition-colors"
                        >
                            تم
                        </button>
                    </div>
                </div>



                {/* Added Buttons Control Wrapper */}
                <div className="flex items-center gap-2 mb-2">
                    <button
                        onMouseDown={(e) => startChange(e, 'decrease')}
                        onTouchStart={(e) => startChange(e, 'decrease')}
                        onMouseUp={stopChange}
                        onTouchEnd={stopChange}
                        onMouseLeave={stopChange}
                        disabled={amount <= MIN_AMOUNT}
                        style={{ touchAction: 'manipulation' }}
                        className="select-none bg-primary/10 text-foreground border border-border font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed w-12 h-12 flex items-center justify-center select-none hover:bg-primary/20 transition-colors"
                    >
                        -
                    </button>

                    <input
                        type="range"
                        min={MIN_AMOUNT}
                        max={MAX_AMOUNT}
                        step={STEP_AMOUNT}
                        value={amount}
                        onChange={e => setAmount(Number(e.target.value))}
                        className="w-full cursor-pointer accent-primary"
                    />

                    <button
                        onMouseDown={(e) => startChange(e, 'increase')}
                        onTouchStart={(e) => startChange(e, 'increase')}
                        onMouseUp={stopChange}
                        onTouchEnd={stopChange}
                        onMouseLeave={stopChange}
                        disabled={amount >= MAX_AMOUNT}
                        style={{ touchAction: 'manipulation' }}
                        className="select-none bg-primary/10 text-foreground border border-border font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed w-12 h-12 flex items-center justify-center select-none hover:bg-primary/20 transition-colors"
                    >
                        +
                    </button>
                </div>

                {/* عرض الرسالة المناسبة بناءً على حالة المبلغ */}
                {amountStatus && amountStatus.message && (
                    <div className={`text-sm text-right rounded-lg p-2 ${amountStatus.type === 'error'
                        ? 'text-destructive bg-destructive/10 dark:bg-destructive/20'
                        : amountStatus.type === 'warning'
                            ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                        {amountStatus.message}
                    </div>
                )}

                <div className="flex justify-between items-center mb-2 mt-6">
                    <div className="flex items-center">
                        <div onClick={() => setShowMonthsInput(!showMonthsInput)} className="cursor-pointer">
                            مدة السداد
                        </div>

                        <FAB
                            onClick={() => setShowMonthsInput(!showMonthsInput)}
                            showDetails={showMonthsInput}
                            text="تغيير"
                            size={'small'}
                            icon={<ArrowIcon color="currentColor" size={20} className={`${showMonthsInput ? 'rotate-180' : ''}  transition-transform duration-300`} />}
                        />

                    </div>
                    <b className="text-primary text-lg">{months} شهر</b>
                </div>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden
                    ${showMonthsInput
                        ? 'max-h-24 opacity-100 mb-2'
                        : 'max-h-0 opacity-0 mb-0'
                    }`}>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={months}
                            onChange={e => setMonths(Number(e.target.value))}
                            className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:border-ring bg-background text-foreground"
                            placeholder="أدخل عدد الأشهر"
                        />
                        <button
                            onClick={() => {
                                setMonths(validateMonths(months));
                                setShowMonthsInput(false);
                            }}
                            className="px-4 py-2 bg-primary/10 text-foreground border border-border rounded-lg hover:bg-primary/20 transition-colors"
                        >
                            تم
                        </button>
                    </div>
                </div>

                <input
                    type="range"
                    min="6"
                    max={currentTier?.maxMonths || 36}
                    value={months}
                    onChange={e => setMonths(Number(e.target.value))}
                    className="w-full cursor-pointer accent-primary"
                />
                <div className="text-xs text-muted-foreground mt-2 text-left">
                    الحد الأدنى 6 شهور | الحد الأقصى {currentTier?.maxMonths} شهر
                </div>
            </div>
        </>
    );
}

function RequiredDocuments({ amount }: RequiredDocumentsProps) {
    return (
        <>
            <div className="mt-6 border-t border-border pt-4">
                <h3 className="text-lg font-bold mb-3">الأوراق المطلوبة:</h3>
                <div className="space-y-2">
                    <div className="flex items-start">
                        <span className="text-green-400 ml-2">•</span>
                        <span>صورة البطاقة الشخصية</span>
                    </div>
                    <div className="flex items-start">
                        <span className="text-green-400 ml-2">•</span>
                        <span>{amount > 30000 ? 'صورة بطاقتي الضامنين' : 'صورة بطاقة الضامن'}</span>
                    </div>
                    <div className="flex items-start">
                        <span className="text-green-400 ml-2">•</span>
                        <span>وصلين (غاز/مياه/كهرباء)</span>
                    </div>
                    <div className="flex items-start">
                        <span className="text-green-400 ml-2">•</span>
                        <span>صورة من عقد إيجار سارى منذ سنه وحتى انتهاء فتره السداد</span>
                    </div>
                    {amount > 100000 && (
                        <>
                            <div className="flex items-start">
                                <span className="text-green-400 ml-2">•</span>
                                <span>السجل التجاري</span>
                            </div>
                            <div className="flex items-start">
                                <span className="text-green-400 ml-2">•</span>
                                <span>البطاقة الضريبية</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

function ShareWhatsApp({
    phoneNumber,
    setPhoneNumber,
    shareOptions,
    setShareOptions,
    shareOnWhatsApp
}: ShareWhatsAppProps) {

    return (
        <>
            <div className="mt-6 border-t border-border pt-4">
                <h3 className="text-lg font-bold mb-3">مشاركة عبر واتساب:</h3>
            </div>
            <div className="mt-4">
                <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="رقم الهاتف"
                    className="w-full px-3 py-2 text-foreground bg-background border border-input rounded-lg focus:outline-none focus:border-ring"
                    pattern="[0-9]{11}"
                    maxLength={11}
                />
            </div>

            <div className="mt-4 space-y-2">
                {Object.entries(shareOptions).map(([key, value]) => (
                    <label key={key} className="flex items-center text-sm">
                        <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setShareOptions(prev => ({
                                ...prev,
                                [key]: e.target.checked
                            }))}
                            className="ml-2"
                        />
                        {key === 'monthlyPayment' && 'القسط الشهري'}
                        {key === 'totalInterest' && 'إجمالي الفوائد'}
                        {key === 'totalAmount' && 'إجمالي الاقساط'}
                        {key === 'adminFees' && 'المصاريف الإدارية'}
                        {key === 'insuranceFees' && 'رسوم التأمين'}
                        {key === 'interest' && 'الفائدة السنوية'}
                        {key === 'documents' && 'الأوراق المطلوبة'}

                    </label>
                ))}
            </div>

            <button
                onClick={shareOnWhatsApp}
                className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                مشاركة عبر WhatsApp
            </button>
        </>
    );
}

export default ProfessionalLoanCalculator;
