import type { CurrentChipInformationProps } from "./types";


export default function CurrentChipInformation({ currentTier }: CurrentChipInformationProps) {

    return (
        <div>
            {currentTier && (
                <div className="bg-gray-100 p-3 rounded-lg mb-5 border-r-4 border-blue-500">
                    <div className="text-sm text-gray-600 mb-1 font-bold"> تفاصيل الشريحة الحالية:</div>
                    <div className="text-xs text-gray-700 flex flex-col gap-1">
                        <span>نطاق المبلغ: <b>{currentTier.min.toLocaleString()} - {currentTier.max.toLocaleString()} ج.م</b></span>
                        <span>أقصى مدة سداد: <b>{currentTier.maxMonths} شهر</b></span>
                    </div>
                </div>
            )}
        </div>
    )
}