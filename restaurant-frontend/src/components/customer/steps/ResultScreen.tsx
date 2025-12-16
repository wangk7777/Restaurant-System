import React from 'react';
import { Gift, CheckCircle } from 'lucide-react';
import type { Prize } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ResultScreenProps {
    wonPrize: Prize | null;
    onRestart: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ wonPrize, onRestart }) => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 text-center">
            <div className="max-w-md w-full">
                <div className="flex justify-center mb-6">
                    {wonPrize ? <Gift className="w-20 h-20 text-yellow-500" /> : <CheckCircle className="w-20 h-20 text-gray-300" />}
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{wonPrize ? t.customer.congrats : t.customer.thankYou}</h2>
                <p className={`text-xl text-indigo-600 font-bold ${wonPrize ? 'mb-4' : 'mb-8'}`}>{wonPrize ? `${t.customer.wonMsg} ${wonPrize.name}` : t.customer.noWinMsg}</p>

                {wonPrize && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-8 text-yellow-800 font-medium">
                        {t.customer.showToStaff}
                    </div>
                )}

                <button onClick={onRestart} className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold">{t.customer.backHome}</button>
            </div>
        </div>
    );
};