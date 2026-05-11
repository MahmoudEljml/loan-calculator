import { useState } from "react";
import type { LoanDetailsProps } from "./types";
import FAB from "../components/FAB";
import ArrowIcon from "../IconSVG/ArrowIcon";

export default function LoanDetails({ results, currentTier, amount }: LoanDetailsProps) {
    const [showDetails, setShowDetails] = useState(false);


    return (
        <div>
            <div className="text-center">
                <div className="grid grid-cols-12 gap-4">
                    <div className="m-auto col-span-6">
                        <small className="text-gray-300 text-lg">القسط الشهري</small>
                        <h1 className="text-4xl font-bold">
                            {results.monthlyPayment.toLocaleString()}
                            <small className="text-xl mr-1">ج.م</small>
                        </h1>
                    </div>

                    <div className="m-auto col-span-3">
                        <small className="text-gray-300 text-lg">الفائدة السنوية</small>
                        <div className="text-xl font-semibold">{currentTier?.interest}%</div>
                    </div>

                    <div className="m-auto col-span-3">
                        <FAB
                            onClick={() => setShowDetails(!showDetails)}
                            showDetails={showDetails}
                            text="تفاصيل"
                            size={'large'}
                            textPosition="bottom"
                            icon={<ArrowIcon color="white" size={25} className={`${showDetails ? 'rotate-180' : ''}  transition-transform duration-300`} />}
                        />
                    </div>
                </div>
            </div>

            <div
                className={` bg-gray-900 rounded-[2vw] grid grid-cols-2 gap-4 border-gray-600 transition-all duration-500 ease-in-out overflow-hidden
                    ${showDetails
                        ? 'max-h-96 opacity-100 mt-9 py-7'
                        : 'max-h-0 opacity-0 py-0 my-0'
                    } `}
            >
                <div className="flex flex-col opacity-90">
                    <span className="text-base">إجمالي الفوائد</span>
                    <strong className="text-red-400 text-lg">+ {results.totalInterest.toLocaleString()} ج.م</strong>
                </div>
                <div className="flex flex-col opacity-90">
                    <span className="text-base">إجمالي الاقساط</span>
                    <strong className="text-lg">{results.totalAmount.toLocaleString()} ج.م</strong>
                </div>
                <div className="flex flex-col opacity-90">
                    <span className="text-base">المصاريف الادارية</span>
                    <strong className="text-lg">{results.adminFees.toLocaleString()} ج.م ({currentTier?.fees}%)</strong>
                </div>
                <div className="flex flex-col opacity-90">
                    <span className="text-base">رسوم التأمين</span>
                    <strong className="text-lg">{results.insuranceFees.toLocaleString()} ج.م</strong>
                </div>
                <div className="flex flex-col opacity-90">
                    <div className="flex justify-center items-center">
                        <span className="text-base">المبلغ المستلم</span>
                    </div>
                    <strong className="text-green-400 text-lg">
                        {(amount - results.adminFees - results.monthlyPayment).toLocaleString()} ج.م
                    </strong>
                </div>
            </div>

        </div>
    )
}
