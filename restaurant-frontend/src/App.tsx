
import React, { useState, useEffect } from 'react';
import { ViewState, type Merchant } from './types';
import { CustomerApp } from './components/CustomerApp';
import { MerchantDashboard } from './components/MerchantDashboard';
import { Store, Globe } from 'lucide-react';
import { db } from './services/api';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const AppContent: React.FC = () => {
    const { t, language, setLanguage } = useLanguage();
    // Default to MERCHANT_LOGIN instead of HOME
    const [currentView, setCurrentView] = useState<ViewState>(ViewState.MERCHANT_LOGIN);

    // Merchant Auth State
    const [isRegistering, setIsRegistering] = useState(false);
    const [isOwnerRegister, setIsOwnerRegister] = useState(false); // New state for Owner checkbox
    const [authError, setAuthError] = useState('');
    const [loggedInMerchant, setLoggedInMerchant] = useState<Merchant | null>(null);

    // Form inputs
    const [restaurantName, setRestaurantName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Preselected Params from URL (QR Code)
    const [urlMerchantId, setUrlMerchantId] = useState<string | null>(null);
    const [urlSurveyId, setUrlSurveyId] = useState<string | null>(null);

    // Check for QR code link (?merchant_id=...&survey_id=...) on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mId = params.get('merchant_id');
        const sId = params.get('survey_id');

        if (mId) {
            setUrlMerchantId(mId);
            if (sId) setUrlSurveyId(sId);

            // Directly jump to customer flow
            setCurrentView(ViewState.CUSTOMER_MERCHANT_LIST);
        }
    }, []);

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'zh' : 'en');
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        try {
            if (isRegistering) {
                if (!restaurantName) throw new Error("Restaurant name required");
                const merchant = await db.registerMerchant({
                    restaurant_name: restaurantName,
                    username,
                    password,
                    role: isOwnerRegister ? 'owner' : 'manager'
                });
                // Auto login after register
                setLoggedInMerchant(merchant);
                setCurrentView(ViewState.MERCHANT_DASHBOARD);
            } else {
                const merchant = await db.loginMerchant(username, password);
                setLoggedInMerchant(merchant);
                setCurrentView(ViewState.MERCHANT_DASHBOARD);
            }
            // Clear forms
            setUsername(''); setPassword(''); setRestaurantName(''); setIsOwnerRegister(false);
        } catch (err: any) {
            setAuthError(err.message || t.common.error);
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case ViewState.CUSTOMER_SURVEY:
            case ViewState.CUSTOMER_LOTTERY:
            case ViewState.CUSTOMER_MERCHANT_LIST:
                // CustomerApp handles its own internal routing now starting with Merchant List
                return <CustomerApp
                    onBack={() => {
                        // If we are backing out from QR mode, we might just stay here or reload,
                        // but let's default to login screen if they somehow exit
                        setUrlMerchantId(null);
                        setUrlSurveyId(null);
                        setCurrentView(ViewState.MERCHANT_LOGIN);
                    }}
                    preselectedMerchantId={urlMerchantId}
                    preselectedSurveyId={urlSurveyId}
                />;

            case ViewState.MERCHANT_DASHBOARD:
                // Fix: Check if merchant is logged in before rendering to prevent crash
                if (!loggedInMerchant) {
                    return (
                        <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-gray-50">
                            <div className="text-red-500 font-semibold">{t.auth.sessionExpired}</div>
                            <button onClick={() => setCurrentView(ViewState.MERCHANT_LOGIN)} className="text-indigo-600 underline hover:text-indigo-800">
                                {t.auth.returnLogin}
                            </button>
                        </div>
                    );
                }
                return <MerchantDashboard merchant={loggedInMerchant} onLogout={() => {
                    setLoggedInMerchant(null);
                    setCurrentView(ViewState.MERCHANT_LOGIN);
                }} />;

            case ViewState.HOME: // Fallback to login
            case ViewState.MERCHANT_LOGIN:
            default:
                return (
                    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                        {/* Branding Header */}
                        <div className="mb-8 text-center animate-fade-in-down">
                            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight mb-2 drop-shadow-sm">
                                DinePulse
                            </h1>
                            <p className="text-xl text-gray-500 font-medium tracking-wide">食刻脉动</p>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-xl border border-indigo-50 max-w-md w-full">
                            <div className="text-center mb-6">
                                <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Store className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">{isRegistering ? t.auth.registerTitle : t.auth.loginTitle}</h2>
                                <p className="text-gray-500 text-sm mt-2">{t.auth.subTitle}</p>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-4">
                                {isRegistering && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t.auth.restaurantName}</label>
                                        <input type="text" className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} required />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t.auth.username}</label>
                                    <input type="text" className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500" value={username} onChange={e => setUsername(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t.auth.password}</label>
                                    <input type="password" className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500" value={password} onChange={e => setPassword(e.target.value)} required />
                                </div>

                                {isRegistering && (
                                    <div className="flex items-start gap-2 pt-2">
                                        <input
                                            id="ownerCheck"
                                            type="checkbox"
                                            className="mt-1"
                                            checked={isOwnerRegister}
                                            onChange={e => setIsOwnerRegister(e.target.checked)}
                                        />
                                        <label htmlFor="ownerCheck" className="text-sm text-indigo-700 font-medium cursor-pointer">
                                            {t.auth.roleOwner}
                                        </label>
                                    </div>
                                )}

                                {authError && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{authError}</p>}

                                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold transition-colors shadow-md">
                                    {isRegistering ? t.auth.registerBtn : t.auth.loginBtn}
                                </button>
                            </form>

                            <div className="mt-6 text-center space-y-4">
                                <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); setIsOwnerRegister(false); }} className="text-indigo-600 hover:underline text-sm font-medium">
                                    {isRegistering ? t.auth.toLogin : t.auth.toRegister}
                                </button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <>
            {/* Global Language Toggle - Fixed to Top Right (Hidden on Merchant Dashboard) */}
            {currentView !== ViewState.MERCHANT_DASHBOARD && (
                <div className="fixed top-4 right-4 z-50">
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-2 bg-white/90 backdrop-blur shadow-md border border-gray-200 px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-50 text-indigo-700 transition-all"
                    >
                        <Globe size={16} />
                        {language === 'en' ? 'English' : '中文'}
                    </button>
                </div>
            )}
            {renderContent()}
        </>
    );
};

const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    );
};

export default App;