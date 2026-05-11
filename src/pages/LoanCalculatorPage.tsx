import ProfessionalLoanCalculator from "../Project/LoanCalculator.tsx";

export function LoanCalculatorPage() {
  return (
    <div className="space-y-4 text-start">
      <div dir="rtl">
        <h1 className="text-2xl font-semibold tracking-tight">حاسبة القروض</h1>
      </div>
      <ProfessionalLoanCalculator />
    </div>
  );
}
