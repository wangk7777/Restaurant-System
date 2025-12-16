import React from 'react';
import { Store, Play } from 'lucide-react';
import type { Merchant } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface MerchantSelectionProps {
    merchants: Merchant[];
    onSelect: (merchant: Merchant) => void;
    onBack: () => void;
}

export const MerchantSelection: React.FC<MerchantSelectionProps> = ({ merchants, onSelect, onBack }) => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-md mx-auto">
                <button onClick={onBack} className="mb-6 text-gray-500 hover:text-gray-800 font-medium flex items-center gap-1">← {t.common.back}</button>
                <div className="text-center mb-8">
                    <Store className="w-16 h-16 text-indigo-600 mx-auto mb-4"/>
                    <h2 className="text-3xl font-extrabold text-gray-900">{t.customer.selectRestaurant}</h2>
                    <p className="text-gray-500 mt-2">{t.customer.whereDining}</p>
                </div>

                <div className="space-y-4">
                    {merchants.length === 0 && <div className="text-center text-gray-400">{t.customer.noRestaurants}</div>}
                    {merchants.map(m => (
                        <div
                            key={m.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-indigo-300 transition-all flex items-center justify-between group cursor-pointer"
                            onClick={() => onSelect(m)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-50 p-3 rounded-full text-indigo-600 font-bold">
                                    {m.restaurant_name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold text-lg text-gray-800 group-hover:text-indigo-600">{m.restaurant_name}</span>
                            </div>

                            <button
                                className="bg-gray-100 text-gray-600 p-2 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(m);
                                }}
                            >
                                <Play size={16} fill="currentColor" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};