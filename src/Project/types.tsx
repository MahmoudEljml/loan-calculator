import type { Dispatch, SetStateAction } from "react";

export interface LoanTier {
    product: string;
    min: number;
    max: number;
    interest: number;
    fees: number;
    maxMonths: number;
}

export interface ShareOptions {
    monthlyPayment: boolean;
    // totalInterest: boolean;
    // totalAmount: boolean;
    adminFees: boolean;
    insuranceFees: boolean;
    interest: boolean;
    documents: boolean;
}

export interface CurrentChipInformationProps {
    currentTier: LoanTier | null;
}

export interface PartCalculateProps {
    amount: number;
    setAmount: Dispatch<SetStateAction<number>>;

    months: number;
    setMonths: Dispatch<SetStateAction<number>>;
    showAmountInput: boolean;
    setShowAmountInput: (value: boolean) => void;
    showMonthsInput: boolean;
    setShowMonthsInput: (value: boolean) => void;
    currentTier: LoanTier | null;
    validateAmount: (value: number) => number;
    validateMonths: (value: number) => number;
}

export interface ShareWhatsAppProps {
    phoneNumber: string;
    setPhoneNumber: (value: string) => void;
    shareOptions: ShareOptions;
    setShareOptions: (value: React.SetStateAction<ShareOptions>) => void;
    shareOnWhatsApp: () => void;
}

export interface RequiredDocumentsProps {
    amount: number;
}

export interface LoanDetailsProps {
    results: {
        monthlyPayment: number;
        totalInterest: number;
        totalAmount: number;
        adminFees: number;
        insuranceFees: number;
    };
    currentTier: LoanTier | null;
    amount: number;
}
