
import React, { useState, useEffect } from 'react';
import type { Merchant } from '../types';
import { FileText, Gift, LogOut, BarChart2, ShieldAlert, AlertTriangle, Globe, Smartphone, UtensilsCrossed, Building, Store } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useMerchantData } from '../hooks/useMerchantData';
import { SurveysTab } from './merchant/tabs/SurveysTab';
import { LotteriesTab } from './merchant/tabs/LotteriesTab';
import { AnalyticsTab } from './merchant/tabs/AnalyticsTab';
import { RestaurantsTab } from './merchant/tabs/RestaurantsTab';
import { CustomerApp } from './CustomerApp';

interface MerchantDashboardProps {
    merchant: Merchant;
    onLogout: () => void;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ merchant, onLogout }) => {
    const { t, language, setLanguage } = useLanguage();
    const [activeTab, setActiveTab] = useState<'SURVEYS' | 'LOTTERIES' | 'ANALYTICS' | 'CUSTOMER_VIEW' | 'RESTAURANTS'>('SURVEYS');
    const [customerPreviewStarted, setCustomerPreviewStarted] = useState(false);

    // State to track selected store for Owner Preview
    const [previewMerchantId, setPreviewMerchantId] = useState<string>('');

    // Use the custom hook for data management
    const { surveys, lotteries, connectionError, isAdmin, isOwner, refreshData, getMerchantName, ownedRestaurants } = useMerchantData(merchant);

    // Initialize preview merchant selection for owners when data loads
    useEffect(() => {
        if (isOwner && ownedRestaurants.length > 0 && !previewMerchantId) {
            setPreviewMerchantId(ownedRestaurants[0].id);
        }
    }, [isOwner, ownedRestaurants, previewMerchantId]);

    if (!merchant) {
        return <div className="p-8 text-center text-gray-500">{t.common.loading}</div>;
    }

    // Determine which ID to pass to CustomerApp
    // 1. If owner, use the selected dropdown ID
    // 2. If regular manager, use their own ID
    // 3. If admin, pass null (let them pick)
    const getPreselectedMerchantId = () => {
        if (isOwner) return previewMerchantId || null;
        if (!isAdmin) return merchant.id;
        return null;
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col">
                <div className="mb-2">
                    <h1 className="text-2xl font-extrabold tracking-tight">DinePulse</h1>
                    <div className="text-indigo-400 font-medium text-sm tracking-wide">商家端</div>
                </div>

                <div className="text-xs text-slate-400 mb-8 flex flex-col gap-1 border-b border-slate-700 pb-4 mt-2">
                    <div className="flex items-center gap-1">
                        {isAdmin ? <ShieldAlert size={12} className="text-red-400"/> : null}
                        {isOwner ? <Building size={12} className="text-indigo-400"/> : null}
                        <span className="font-bold truncate">{merchant.restaurant_name}</span>
                    </div>
                    {isOwner && <span className="text-[10px] bg-indigo-900 text-indigo-200 px-1 rounded w-fit">{t.dashboard.owner}</span>}
                </div>

                <nav className="space-y-4 flex-1">
                    <button onClick={() => { setActiveTab('SURVEYS'); setCustomerPreviewStarted(false); }} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'SURVEYS' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                        <FileText size={18} /> {t.dashboard.tabSurveys}
                    </button>
                    <button onClick={() => { setActiveTab('LOTTERIES'); setCustomerPreviewStarted(false); }} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'LOTTERIES' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                        <Gift size={18} /> {t.dashboard.tabLotteries}
                    </button>
                    <button onClick={() => { setActiveTab('ANALYTICS'); setCustomerPreviewStarted(false); }} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'ANALYTICS' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                        <BarChart2 size={18} /> {t.dashboard.tabAnalytics}
                    </button>
                    {/* Owner Tab */}
                    {isOwner && (
                        <button onClick={() => { setActiveTab('RESTAURANTS'); setCustomerPreviewStarted(false); }} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'RESTAURANTS' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                            <Store size={18} /> {t.dashboard.tabRestaurants}
                        </button>
                    )}
                    <button onClick={() => { setActiveTab('CUSTOMER_VIEW'); setCustomerPreviewStarted(false); }} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'CUSTOMER_VIEW' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                        <Smartphone size={18} /> {t.dashboard.tabCustomerView}
                    </button>
                </nav>

                <div className="border-t border-slate-800 pt-4 mt-4">
                    <button
                        onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                        className="flex items-center gap-3 text-slate-400 hover:text-white w-full text-left p-2 rounded hover:bg-slate-800 mb-2 transition-colors"
                    >
                        <Globe size={18} />
                        {language === 'en' ? 'Language: EN' : '语言: 中文'}
                    </button>
                    <button onClick={onLogout} className="flex items-center gap-3 text-red-400 hover:text-red-300 w-full text-left p-2 rounded hover:bg-slate-800 transition-colors">
                        <LogOut size={18} /> {t.common.logout}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto flex flex-col relative">
                {connectionError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3 flex-shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                        <div>{t.dashboard.backendError}</div>
                    </div>
                )}

                {activeTab === 'SURVEYS' && (
                    <SurveysTab
                        surveys={surveys}
                        lotteries={lotteries}
                        isAdmin={isAdmin}
                        isOwner={isOwner}
                        ownedRestaurants={ownedRestaurants}
                        getMerchantName={getMerchantName}
                        onRefresh={refreshData}
                        currentMerchantId={merchant.id}
                    />
                )}

                {activeTab === 'LOTTERIES' && (
                    <LotteriesTab
                        lotteries={lotteries}
                        isAdmin={isAdmin}
                        isOwner={isOwner}
                        ownedRestaurants={ownedRestaurants}
                        getMerchantName={getMerchantName}
                        onRefresh={refreshData}
                        currentMerchantId={merchant.id}
                    />
                )}

                {activeTab === 'ANALYTICS' && (
                    <AnalyticsTab
                        surveys={surveys}
                        isAdmin={isAdmin}
                        isOwner={isOwner}
                        ownedRestaurants={ownedRestaurants}
                        getMerchantName={getMerchantName}
                    />
                )}

                {activeTab === 'RESTAURANTS' && isOwner && (
                    <RestaurantsTab
                        ownerMerchant={merchant}
                        ownedRestaurants={ownedRestaurants}
                        onRefresh={refreshData}
                    />
                )}

                {activeTab === 'CUSTOMER_VIEW' && (
                    <div className="flex-1 flex flex-col h-full">
                        {!customerPreviewStarted ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center text-center max-w-md w-full border border-gray-100">
                                    <div className="bg-indigo-100 p-6 rounded-full mb-6">
                                        <UtensilsCrossed className="w-16 h-16 text-indigo-600" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-800 mb-4">{t.home.customerTitle}</h2>

                                    {isOwner && (
                                        <div className="mb-4 w-full">
                                            <label className="block text-sm text-gray-500 mb-1">{t.dashboard.assignedTo}</label>
                                            <select
                                                className="w-full p-2 border rounded"
                                                value={previewMerchantId}
                                                onChange={(e) => setPreviewMerchantId(e.target.value)}
                                            >
                                                {ownedRestaurants.map(r => (
                                                    <option key={r.id} value={r.id}>{r.restaurant_name}</option>
                                                ))}
                                                {ownedRestaurants.length === 0 && <option value="">No restaurants found</option>}
                                            </select>
                                        </div>
                                    )}

                                    <p className="text-gray-600 text-lg mb-8">{t.home.customerDesc}</p>
                                    <button
                                        onClick={() => setCustomerPreviewStarted(true)}
                                        disabled={isOwner && !previewMerchantId}
                                        className="px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-lg disabled:bg-gray-400"
                                    >
                                        {t.home.startSurvey}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
                                <div className="absolute inset-0 overflow-y-auto">
                                    <CustomerApp
                                        onBack={() => setCustomerPreviewStarted(false)}
                                        preselectedMerchantId={getPreselectedMerchantId()}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};