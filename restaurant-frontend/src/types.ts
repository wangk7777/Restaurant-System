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
    type: 'choice' | 'text';
    allow_other: boolean;
    options: string[];
}

export interface Survey {
    id: UUID;
    name: string;
    // active removed from backend schema, handling it optional or ignored if needed
    merchant_id: UUID;
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

export const ViewState = {
    HOME: 'HOME',
    CUSTOMER_MERCHANT_LIST: 'CUSTOMER_MERCHANT_LIST',
    CUSTOMER_SURVEY: 'CUSTOMER_SURVEY',
    CUSTOMER_LOTTERY: 'CUSTOMER_LOTTERY',
    MERCHANT_LOGIN: 'MERCHANT_LOGIN',
    MERCHANT_DASHBOARD: 'MERCHANT_DASHBOARD'
} as const;

export type ViewState = typeof ViewState[keyof typeof ViewState];