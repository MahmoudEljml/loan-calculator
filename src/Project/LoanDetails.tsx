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
                        <small className="text-muted-foreground text-lg">القسط الشهري</small>
                        <h1 className="text-4xl font-bold text-foreground">
                            {results.monthlyPayment.toLocaleString()}
                            <small className="text-xl mr-1">ج.م</small>
                        </h1>
                    </div>

                    <div className="m-auto col-span-3">
                        <small className="text-muted-foreground text-lg">الفائدة السنوية</small>
                        <div className="text-xl font-semibold text-foreground">{currentTier?.interest}%</div>
                    </div>

                    <div className="m-auto col-span-3">
                        <FAB
                            onClick={() => setShowDetails(!showDetails)}
                            showDetails={showDetails}
                            text="تفاصيل"
                            size={'large'}
                            textPosition="bottom"
                            icon={<ArrowIcon color="currentColor" size={25} className={`${showDetails ? 'rotate-180' : ''}  transition-transform duration-300`} />}
                        />
                    </div>
                </div>
            </div>

            <div
                className={`bg-card rounded-3xl border border-border transition-all duration-500 ease-in-out overflow-hidden
                    ${showDetails
                        ? 'max-h-[900px] opacity-100 mt-9 py-7 px-4'
                        : 'max-h-0 opacity-0 py-0 my-0 px-4'
                    } `}
            >
                <div className="grid grid-cols-2 gap-4">

                    <div className="rounded-3xl border border-border bg-muted/80 p-4 text-foreground">
                        <span className="text-sm text-muted-foreground">المصاريف الإدارية</span>
                        <strong className="block mt-2 text-xl font-semibold">{results.adminFees.toLocaleString()} ج.م ({currentTier?.fees}%)</strong>
                    </div>
                    <div className="rounded-3xl border border-border bg-muted/80 p-4 text-foreground">
                        <span className="text-sm text-muted-foreground">رسوم التأمين</span>
                        <strong className="block mt-2 text-xl font-semibold">{results.insuranceFees.toLocaleString()} ج.م</strong>
                    </div>
                    <div className="rounded-3xl border border-border bg-muted/80 p-4 text-foreground">
                        <span className="text-sm text-muted-foreground">إجمالي الفوائد</span>
                        <strong className="block mt-2 text-xl font-semibold text-destructive">+ {results.totalInterest.toLocaleString()} ج.م</strong>
                    </div>
                    <div className="rounded-3xl border border-border bg-muted/80 p-4 text-foreground">
                        <span className="text-sm text-muted-foreground">إجمالي الاقساط</span>
                        <strong className="block mt-2 text-xl font-semibold">{results.totalAmount.toLocaleString()} ج.م</strong>
                    </div>
                    <div className="col-span-2 rounded-3xl border border-border bg-muted/80 p-4 text-center text-foreground">
                        <span className="text-sm text-muted-foreground block mb-2">المبلغ المستلم</span>
                        <strong className="text-2xl font-semibold text-green-400">{(amount - results.adminFees - results.monthlyPayment).toLocaleString()} ج.م</strong>
                    </div>
                </div>
            </div>

        </div>
    )
}
