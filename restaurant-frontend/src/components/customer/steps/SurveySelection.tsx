import React from 'react';
import { FileText } from 'lucide-react';
import type { Survey } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface SurveySelectionProps {
    surveys: Survey[];
    restaurantName: string;
    onSelect: (survey: Survey) => void;
    onBack: () => void;
}

export const SurveySelection: React.FC<SurveySelectionProps> = ({ surveys, restaurantName, onSelect, onBack }) => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-md mx-auto">
                <button onClick={onBack} className="mb-6 text-gray-500 hover:text-gray-800 font-medium flex items-center gap-1">← {t.customer.chooseDifferent}</button>
                <div className="text-center mb-8">
                    <FileText className="w-16 h-16 text-indigo-600 mx-auto mb-4"/>
                    <h2 className="text-3xl font-extrabold text-gray-900">{t.customer.selectSurvey}</h2>
                    <p className="text-gray-500 mt-2">{restaurantName} {t.customer.multipleSurveys}</p>
                </div>

                <div className="space-y-4">
                    {surveys.map(s => (
                        <div
                            key={s.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                            onClick={() => onSelect(s)}
                        >
                            <h3 className="font-bold text-xl text-gray-800 group-hover:text-indigo-600 mb-1">{s.name}</h3>
                            <p className="text-gray-500 text-sm">{s.questions.length} {t.customer.questionsCount}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};