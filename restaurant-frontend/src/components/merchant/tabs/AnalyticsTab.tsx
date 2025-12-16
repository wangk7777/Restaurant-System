import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Survey, SurveyResponse, UUID } from '../../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { db } from '../../../services/api';

interface AnalyticsTabProps {
    surveys: Survey[];
    isAdmin: boolean;
    getMerchantName: (id: UUID) => string;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ surveys, isAdmin, getMerchantName }) => {
    const { t } = useLanguage();
    const [selectedSurveyId, setSelectedSurveyId] = useState<UUID | ''>('');
    const [responses, setResponses] = useState<SurveyResponse[]>([]);

    const handleLoadAnalytics = async () => {
        if (!selectedSurveyId) return;
        try { const res = await db.getResponses(selectedSurveyId); setResponses(res); } catch (e) { alert(t.common.error); }
    };

    const selectedSurvey = surveys.find(s => s.id === selectedSurveyId);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">{t.dashboard.tabAnalytics}</h2>
            <div className="flex gap-4 mb-6">
                <select className="border p-2 rounded w-64" value={selectedSurveyId} onChange={e => setSelectedSurveyId(e.target.value)}>
                    <option value="">{t.dashboard.selectSurvey}</option>
                    {surveys.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.name} {isAdmin ? `(${getMerchantName(s.merchant_id)})` : ''}
                        </option>
                    ))}
                </select>
                <button onClick={handleLoadAnalytics} disabled={!selectedSurveyId} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:bg-gray-300">{t.dashboard.loadReport}</button>
            </div>
            {responses.length > 0 && selectedSurvey ? (
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="col-span-full bg-blue-50 p-4 rounded text-blue-900">{t.dashboard.totalResponses}: <strong>{responses.length}</strong></div>
                    {selectedSurvey.questions.map(q => {
                        // Analytics for Text type questions
                        if (q.type === 'text') {
                            const textAnswers = responses.map(r => r.answers[q.id]).filter(Boolean);
                            return (
                                <div key={q.id} className="bg-white p-4 rounded border shadow-sm lg:col-span-2">
                                    <h4 className="font-bold mb-4">{q.text}</h4>
                                    <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-50 p-2 rounded">
                                        {textAnswers.length > 0 ? textAnswers.map((txt, i) => (
                                            <div key={i} className="p-2 bg-white border rounded text-sm text-gray-700 italic">"{txt}"</div>
                                        )) : <div className="text-gray-400 text-sm">{t.dashboard.noTextResponses}</div>}
                                    </div>
                                </div>
                            )
                        }

                        // Analytics for Choice type questions
                        const data = q.options.map(opt => ({ name: opt, value: responses.filter(r => r.answers[q.id] === opt).length }));

                        let otherResponses: string[] = [];
                        if (q.allow_other) {
                            otherResponses = responses
                                .map(r => r.answers[q.id])
                                .filter(ans => ans && !q.options.includes(ans));

                            if (otherResponses.length > 0) {
                                data.push({ name: 'Other', value: otherResponses.length });
                            }
                        }

                        return (
                            <div key={q.id} className="bg-white p-4 rounded border shadow-sm">
                                <h4 className="font-bold mb-4">{q.text}</h4>
                                <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({name, value}) => `${name}: ${value}`}>{data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>

                                {otherResponses.length > 0 && (
                                    <div className="mt-4 pt-4 border-t">
                                        <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">{t.dashboard.otherResponses}</h5>
                                        <div className="max-h-32 overflow-y-auto space-y-1">
                                            {otherResponses.map((txt, i) => (
                                                <div key={i} className="text-xs bg-gray-50 p-1.5 rounded text-gray-700">{txt}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (<div className="text-gray-500">{t.dashboard.noData}</div>)}
        </div>
    );
};