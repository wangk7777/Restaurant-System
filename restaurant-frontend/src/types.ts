export type UUID = string;

export interface Merchant {
    id: UUID;
    restaurant_name: string;
    username: string;
}

export interface Prize {
    id: UUID;
    name: string;
    probability: number; // 0-100
}

export interface Lottery {
    id: UUID;
    name: string;
    merchant_id: UUID; // Linked to merchant
    prizes: Prize[];
}

export interface Question {
    id: UUID;
    text: string;
    options: string[];
}

export interface Survey {
    id: UUID;
    name: string;
    // active removed
    merchant_id: UUID; // Linked to merchant
    lottery_id: UUID | null;
    questions: Question[];
    created_at: string;
}

export interface SurveyResponse {
    id: UUID;
    survey_id: UUID;
    customer_id: UUID;
    answers: Record<string, string>;
    submitted_at: string;
}

export interface LotteryResult {
    won: boolean;
    prize: Prize | null;
    message: string;
}

// Fix for 'erasableSyntaxOnly': Use const object instead of enum
export const ViewState = {
    HOME: 'HOME',
    CUSTOMER_MERCHANT_LIST: 'CUSTOMER_MERCHANT_LIST', // New step
    CUSTOMER_SURVEY: 'CUSTOMER_SURVEY',
    CUSTOMER_LOTTERY: 'CUSTOMER_LOTTERY',
    MERCHANT_LOGIN: 'MERCHANT_LOGIN',
    MERCHANT_DASHBOARD: 'MERCHANT_DASHBOARD'
} as const;

// Create a type derived from the values of the const object
export type ViewState = typeof ViewState[keyof typeof ViewState];