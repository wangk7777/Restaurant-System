import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Survey, Lottery, UUID } from '../../../types';
import { Plus, Settings, Trash2 } from 'lucide-react';
import { db } from '../../../services/api';
import { SurveyEditor } from '../editors/SurveyEditor';

interface SurveysTabProps {
    surveys: Survey[];
    lotteries: Lottery[];
    isAdmin: boolean;
    getMerchantName: (id: UUID) => string;
    onRefresh: () => void;
    currentMerchantId: string;
}

const generateUUID = () => crypto.randomUUID();

export const SurveysTab: React.FC<SurveysTabProps> = ({ surveys, lotteries, isAdmin, getMerchantName, onRefresh, currentMerchantId }) => {
    const { t } = useLanguage();
    const [editingSurvey, setEditingSurvey] = useState<Partial<Survey> | null>(null);
    const [isNew, setIsNew] = useState(false);

    const handleCreate = () => {
        setIsNew(true);
        setEditingSurvey({
            id: generateUUID(),
            merchant_id: currentMerchantId,
            name: '',
            lottery_id: null,
            questions: [],
            created_at: new Date().toISOString()
        });
    };

    const handleEdit = (s: Survey) => {
        setIsNew(false);
        setEditingSurvey(s);
    };

    const handleDelete = async (id: UUID) => {
        if (window.confirm(t.common.confirmDelete)) {
            try { await db.deleteSurvey(id); onRefresh(); } catch (e) { alert(t.common.error); }
        }
    };

    if (editingSurvey) {
        return (
            <SurveyEditor
                initialData={editingSurvey}
                lotteries={lotteries}
                isAdmin={isAdmin}
                getMerchantName={getMerchantName}
                onSave={() => { setEditingSurvey(null); onRefresh(); }}
                onCancel={() => setEditingSurvey(null)}
                currentMerchantId={currentMerchantId}
                isNew={isNew}
            />
        );
    }

    return (
        <div>
            <div className="flex justify-between mb-4">
                <h2 className="text-2xl font-bold">{t.dashboard.tabSurveys} {isAdmin && t.dashboard.allRestaurants}</h2>
                <button onClick={handleCreate} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2">
                    <Plus size={18} /> {t.common.new}
                </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {surveys.map(s => (
                    <div key={s.id} className="bg-white p-4 rounded border flex justify-between items-center shadow-sm">
                        <div>
                            <div className="font-bold text-lg flex items-center gap-2">
                                {s.name}
                                {isAdmin && (
                                    <span className="text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                        {getMerchantName(s.merchant_id)}
                                    </span>
                                )}
                            </div>
                            <div className="text-sm text-gray-500">{s.questions.length} {t.customer.questionsCount}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleEdit(s)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Settings size={18} /></button>
                            <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};