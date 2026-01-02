
export type UUID = string;

export interface Merchant {
    id: UUID;
    restaurant_name: string;
    username: string;
    role: 'admin' | 'owner' | 'manager';
    owner_id?: UUID | null;
    password?: string; // Only used for displaying in Owner view
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
    type: 'choice' | 'multi' | 'text';
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

// --- Dashboard Types ---

export interface TodayStats {
    today_count: number;
    yesterday_count: number;
    diff: number;
    growth_pct: number;
}

export interface DashboardStats {
    total_restaurants: number;
    total_surveys: number;
    total_responses: number;
    total_owners?: number; // Admin only
    today_data?: TodayStats;
}

export interface ChartPoint {
    label: string;
    value: number;
    full_date?: string;
}

export interface GrowthStats {
    today_count: number;
    yesterday_count: number;
    daily_growth_pct: number;
    month_count: number;
    last_month_count: number;
    monthly_growth_pct: number;
}

export interface DashboardTrends {
    stats: GrowthStats;
    chart_data: ChartPoint[];
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
