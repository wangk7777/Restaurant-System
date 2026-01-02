
import React, { useState, useEffect } from 'react';
import type { Merchant } from '../types';
import { FileText, Gift, LogOut, BarChart2, ShieldAlert, AlertTriangle, Globe, Smartphone, UtensilsCrossed, Building, Store, Menu, X, Settings, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useMerchantData } from '../hooks/useMerchantData';
import { SurveysTab } from './merchant/tabs/SurveysTab';
import { LotteriesTab } from './merchant/tabs/LotteriesTab';
import { AnalyticsTab } from './merchant/tabs/AnalyticsTab';
import { RestaurantsTab } from './merchant/tabs/RestaurantsTab';
import { SettingsTab } from './merchant/tabs/SettingsTab';
import { HomeTab } from './merchant/tabs/HomeTab';
import { CustomerApp } from './CustomerApp';

interface MerchantDashboardProps {
    merchant: Merchant;
    onLogout: () => void;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ merchant: initialMerchant, onLogout }) => {
    const { t, language, setLanguage } = useLanguage();
    // Set HOME as default
    const [activeTab, setActiveTab] = useState<'HOME' | 'SURVEYS' | 'LOTTERIES' | 'ANALYTICS' | 'CUSTOMER_VIEW' | 'RESTAURANTS' | 'SETTINGS'>('HOME');
    const [customerPreviewStarted, setCustomerPreviewStarted] = useState(false);

    // Maintain local merchant state to update UI immediately after settings change
    const [merchant, setMerchant] = useState(initialMerchant);
    useEffect(() => { setMerchant(initialMerchant); }, [initialMerchant]);

    // Mobile Sidebar State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    const getPreselectedMerchantId = () => {
        if (isOwner) return previewMerchantId || null;
        if (!isAdmin) return merchant.id;
        return null;
    };

    const handleTabChange = (tab: typeof activeTab) => {
        setActiveTab(tab);
        setCustomerPreviewStarted(false);
        setIsMobileMenuOpen(false); // Close mobile menu on selection
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white z-40 flex items-center px-4 justify-between shadow-md">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-1">
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-lg">DinePulse</span>
                </div>
                <div className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 truncate max-w-[120px]">
                    {merchant.restaurant_name}
                </div>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white p-6 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
                    md:relative md:translate-x-0 md:shadow-none
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="flex justify-between items-center mb-6 md:mb-2">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight">DinePulse</h1>
                        <div className="text-indigo-400 font-medium text-sm tracking-wide">商家端</div>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
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
                    <button onClick={() => handleTabChange('HOME')} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'HOME' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                        <LayoutDashboard size={18} /> {t.dashboard.tabHome}
                    </button>
                    <button onClick={() => handleTabChange('SURVEYS')} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'SURVEYS' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                        <FileText size={18} /> {t.dashboard.tabSurveys}
                    </button>
                    <button onClick={() => handleTabChange('LOTTERIES')} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'LOTTERIES' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                        <Gift size={18} /> {t.dashboard.tabLotteries}
                    </button>
                    <button onClick={() => handleTabChange('ANALYTICS')} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'ANALYTICS' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                        <BarChart2 size={18} /> {t.dashboard.tabAnalytics}
                    </button>
                    {/* Owner Tab */}
                    {isOwner && (
                        <button onClick={() => handleTabChange('RESTAURANTS')} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'RESTAURANTS' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                            <Store size={18} /> {t.dashboard.tabRestaurants}
                        </button>
                    )}
                    <button onClick={() => handleTabChange('CUSTOMER_VIEW')} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'CUSTOMER_VIEW' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                        <Smartphone size={18} /> {t.dashboard.tabCustomerView}
                    </button>
                </nav>

                <div className="border-t border-slate-800 pt-4 mt-4">
                    <button onClick={() => handleTabChange('SETTINGS')} className={`flex items-center gap-3 w-full text-left p-2 rounded mb-2 transition-colors ${activeTab === 'SETTINGS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                        <Settings size={18} /> {t.dashboard.tabSettings}
                    </button>

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
            <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto overflow-x-hidden flex flex-col relative h-full w-full">
                {connectionError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3 flex-shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                        <div>{t.dashboard.backendError}</div>
                    </div>
                )}

                {activeTab === 'HOME' && (
                    <HomeTab
                        merchant={merchant}
                        isAdmin={isAdmin}
                        isOwner={isOwner}
                        ownedRestaurants={ownedRestaurants}
                    />
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

                {activeTab === 'SETTINGS' && (
                    <SettingsTab
                        merchant={merchant}
                        onUpdate={(updated) => setMerchant(updated)}
                    />
                )}

                {activeTab === 'CUSTOMER_VIEW' && (
                    <div className="flex-1 flex flex-col h-full min-h-[500px]">
                        {!customerPreviewStarted ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl flex flex-col items-center text-center max-w-md w-full border border-gray-100 mx-auto">
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
                                        className="px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-lg disabled:bg-gray-400 w-full md:w-auto"
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
