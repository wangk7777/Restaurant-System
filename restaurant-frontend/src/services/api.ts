import type { Lottery, Survey, SurveyResponse, UUID, LotteryResult } from '../types';

// ⚠️ IMPORTANT: Matches the port from your Python uvicorn command
// If your Python is running on 8000, change this to 8000
const API_BASE_URL = 'http://127.0.0.1:8001/api';

export const db = {
    // --- Lotteries ---
    getLotteries: async (): Promise<Lottery[]> => {
        const response = await fetch(`${API_BASE_URL}/lotteries/`);
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
        console.log("Request to delete lottery:", id);
        console.warn(`Delete not implemented in backend yet for ID: ${id}`);
        // await fetch(`${API_BASE_URL}/lotteries/${id}`, { method: 'DELETE' });
    },

    // --- Surveys ---
    getSurveys: async (): Promise<Survey[]> => {
        const response = await fetch(`${API_BASE_URL}/surveys/`);
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

    getActiveSurvey: async (): Promise<Survey | undefined> => {
        try {
            const response = await fetch(`${API_BASE_URL}/surveys/active`);
            if (!response.ok) return undefined;
            return await response.json();
        } catch (e) {
            console.warn("No active survey found or backend offline", e);
            return undefined;
        }
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

    // Returns the LotteryResult from backend (won/lost + prize)
    saveResponse: async (response: SurveyResponse): Promise<LotteryResult> => {
        const res = await fetch(`${API_BASE_URL}/responses/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
        });
        if (!res.ok) throw new Error('Failed to submit response');
        return await res.json();
    }
};