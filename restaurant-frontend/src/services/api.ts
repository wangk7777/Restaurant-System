
import type { Lottery, Survey, SurveyResponse, UUID, LotteryResult, Merchant, DashboardStats, DashboardTrends } from '../types';

// 在开发环境使用 localhost，在生产环境使用 VITE_API_URL 环境变量
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api';

export const db = {
    // --- Auth ---
    registerMerchant: async (data: Partial<Merchant> & {password: string}): Promise<Merchant> => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Registration failed');
        }
        return await response.json();
    },

    loginMerchant: async (username: string, password: string): Promise<Merchant> => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) throw new Error('Login failed');
        return await response.json();
    },

    getMerchants: async (ownerId?: UUID): Promise<Merchant[]> => {
        let url = `${API_BASE_URL}/merchants`;
        if (ownerId) url += `?owner_id=${ownerId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch merchants');
        return await response.json();
    },

    saveMerchant: async (data: Partial<Merchant> & {password?: string}, isUpdate: boolean = false) => {
        // If updating, data.id must be present
        if (isUpdate && !data.id) throw new Error("ID required for update");

        const url = isUpdate
            ? `${API_BASE_URL}/merchants/${data.id}`
            : `${API_BASE_URL}/auth/register`; // Create uses register endpoint

        const method = isUpdate ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to save merchant');
        }
        return await response.json();
    },

    deleteMerchant: async (id: UUID) => {
        const response = await fetch(`${API_BASE_URL}/merchants/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete merchant');
    },

    // --- Lotteries ---
    getLotteries: async (merchantId: UUID): Promise<Lottery[]> => {
        const response = await fetch(`${API_BASE_URL}/lotteries/?merchant_id=${merchantId}`);
        if (!response.ok) throw new Error('Failed to fetch lotteries');
        return await response.json();
    },

    saveLottery: async (lottery: Lottery, isUpdate: boolean = false) => {
        const url = isUpdate
            ? `${API_BASE_URL}/lotteries/${lottery.id}`
            : `${API_BASE_URL}/lotteries/`;

        const method = isUpdate ? 'PUT' : 'POST';

        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lottery),
        });
    },

    deleteLottery: async (id: UUID) => {
        const response = await fetch(`${API_BASE_URL}/lotteries/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete lottery');
    },

    // --- Surveys ---
    getSurveys: async (merchantId: UUID): Promise<Survey[]> => {
        const response = await fetch(`${API_BASE_URL}/surveys/?merchant_id=${merchantId}`);
        if (!response.ok) throw new Error('Failed to fetch surveys');
        return await response.json();
    },

    saveSurvey: async (survey: Survey, isUpdate: boolean = false) => {
        const url = isUpdate
            ? `${API_BASE_URL}/surveys/${survey.id}`
            : `${API_BASE_URL}/surveys/`;

        const method = isUpdate ? 'PUT' : 'POST';

        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(survey),
        });
    },

    deleteSurvey: async (id: UUID) => {
        const response = await fetch(`${API_BASE_URL}/surveys/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete survey');
    },

    // --- Responses ---
    getResponses: async (surveyId?: UUID): Promise<SurveyResponse[]> => {
        let url = `${API_BASE_URL}/responses/`;
        if (surveyId) {
            url += `?survey_id=${surveyId}`;
        }
        const response = await fetch(url);
        if (!response.ok) return [];
        return await response.json();
    },

    saveResponse: async (response: SurveyResponse): Promise<LotteryResult> => {
        const res = await fetch(`${API_BASE_URL}/responses/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
        });
        if (!res.ok) throw new Error('Failed to submit response');
        return await res.json();
    },

    // --- AI Analytics ---
    analyzeSurvey: async (surveyId: UUID, language: string = 'en'): Promise<string> => {
        const response = await fetch(`${API_BASE_URL}/analytics/analyze?survey_id=${surveyId}&language=${language}`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Analysis failed');
        const data = await response.json();
        return data.analysis;
    },

    // --- Dashboard Analytics ---
    getDashboardStats: async (merchantId: UUID, filterStoreId?: string): Promise<DashboardStats> => {
        let url = `${API_BASE_URL}/analytics/dashboard-stats?merchant_id=${merchantId}`;
        if (filterStoreId) url += `&filter_merchant_id=${filterStoreId}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load stats");
        return await response.json();
    },

    getDashboardTrends: async (merchantId: UUID, viewMode: 'month'|'year', filterStoreId?: string, targetDate?: string): Promise<DashboardTrends> => {
        let url = `${API_BASE_URL}/analytics/trends?merchant_id=${merchantId}&view_mode=${viewMode}`;
        if (filterStoreId) url += `&filter_merchant_id=${filterStoreId}`;
        if (targetDate) url += `&target_date=${targetDate}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load trends");
        return await response.json();
    }
};
