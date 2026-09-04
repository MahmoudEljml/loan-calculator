import { useState } from "react";
import type { LoanDetailsProps } from "@/types";
import ArrowIcon from "@/components/icons/ArrowIcon";
import { CardHead } from "@/components/cardHead";


export default function LoanDetails({ results, currentTier, amount }: LoanDetailsProps) {
    const [showDetails, setShowDetails] = useState(false);


    return (



        <CardHead title={
            <div className="flex items-center gap-2 bg-background px-2" onClick={() => setShowDetails(!showDetails)}>
                <div>تفاصيل</div>
                <div onClick={() => setShowDetails(!showDetails)}>
                    {<ArrowIcon color="currentColor" size={20} className={`${showDetails ? 'rotate-180' : ''}  transition-transform duration-300`} />}
                </div>
            </div>
        }>

            <div className="text-center py-5">

                <div className="grid grid-cols-12 gap-4">
                    <div className="m-auto col-span-6">
                        <small className="text-muted-foreground text-lg">القسط الشهري</small>
                        <h1 className="text-4xl font-bold text-foreground">
                            {results.monthlyPayment.toLocaleString()}
                            <small className="text-xl mr-1">ج.م</small>
                        </h1>
                    </div>

                    <div className="m-auto col-span-6">
                        <small className="text-muted-foreground text-lg">الفائدة</small>
                        <div className="text-xl font-semibold text-foreground">{currentTier?.interest}%</div>
                    </div>

                    <div className="m-auto absolute -top-5 right-20">

                    </div>
                </div>
            </div>

            <div
                className={` transition-all duration-500 ease-in-out overflow-hidden
                    ${showDetails
                        ? 'max-h-[900px] opacity-100 mt-9 '
                        : 'max-h-0 opacity-0 py-0 my-0 '
                    } `}
            >
                <div className={`grid grid-cols-2 gap-4`}>



                    <Card title={`المصاريف الإدارية`} details={`${results.adminFees.toLocaleString()} ج.م (${currentTier?.fees}%)`} />

                    <Card title={`رسوم التأمين`} details={`${results.insuranceFees.toLocaleString()} ج.م`} />

                    <Card title={`إجمالي الفوائد`} details={`+ ${results.totalInterest.toLocaleString()} ج.م`} />

                    <Card title={`إجمالي الاقساط`} details={`${results.totalAmount.toLocaleString()} ج.م`} />



                    <div className="col-span-2 rounded-3xl border border-border bg-muted/80 p-4 text-center text-foreground">
                        <span className="text-sm text-muted-foreground block mb-2">المبلغ المستلم</span>
                        <strong className="text-2xl font-semibold text-green-400">{(amount - results.adminFees - results.monthlyPayment).toLocaleString()} ج.م</strong>
                    </div>
                </div>
            </div>
        </CardHead>

    )
}


function Card({ title, details }: { title: string, details: string }) {

    return (
        <div className="rounded-2xl border border-border bg-muted/80 p-4 text-foreground text-center ">
            <span className="text-sm text-muted-foreground">{title}</span>
            <strong className={`block mt-2 text-xl font-semibold ${details.includes("+") && "text-destructive"}`}>{details}</strong>
        </div>
    );
}