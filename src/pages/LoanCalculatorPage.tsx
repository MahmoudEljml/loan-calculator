import ProfessionalLoanCalculator from "../Project/LoanCalculator.tsx";

export function LoanCalculatorPage() {
  return (
    <div className="space-y-4 text-start">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">حاسبة القروض</h1>
        <p className="text-sm text-muted-foreground">
          احسب القسط والفوائد والمصاريف وفق شرائح المنتج.
        </p>
      </div>
      <ProfessionalLoanCalculator />
    </div>
  );
}
