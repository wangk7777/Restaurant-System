import React, { useState, useEffect } from 'react';
import { ViewState, type Merchant } from './types';
import { CustomerApp } from './components/CustomerApp';
import { MerchantDashboard } from './components/MerchantDashboard';
import { UtensilsCrossed, Store, User } from 'lucide-react';
import { db } from './services/api';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);

    // Merchant Auth State
    const [isRegistering, setIsRegistering] = useState(false);
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

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        try {
            if (isRegistering) {
                if (!restaurantName) throw new Error("Restaurant name required");
                const merchant = await db.registerMerchant({ restaurant_name: restaurantName, username, password });
                // Auto login after register
                setLoggedInMerchant(merchant);
                setCurrentView(ViewState.MERCHANT_DASHBOARD);
            } else {
                const merchant = await db.loginMerchant(username, password);
                setLoggedInMerchant(merchant);
                setCurrentView(ViewState.MERCHANT_DASHBOARD);
            }
            // Clear forms
            setUsername(''); setPassword(''); setRestaurantName('');
        } catch (err: any) {
            setAuthError(err.message || "Authentication failed");
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
                        // If we are backing out, we should probably clear the URL param state to allow full navigation
                        setUrlMerchantId(null);
                        setUrlSurveyId(null);
                        setCurrentView(ViewState.HOME);
                    }}
                    preselectedMerchantId={urlMerchantId}
                    preselectedSurveyId={urlSurveyId}
                />;

            case ViewState.MERCHANT_DASHBOARD:
                // Fix: Check if merchant is logged in before rendering to prevent crash
                if (!loggedInMerchant) {
                    return (
                        <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-gray-50">
                            <div className="text-red-500 font-semibold">Session expired or invalid.</div>
                            <button onClick={() => setCurrentView(ViewState.MERCHANT_LOGIN)} className="text-indigo-600 underline hover:text-indigo-800">
                                Return to Login
                            </button>
                        </div>
                    );
                }
                return <MerchantDashboard merchant={loggedInMerchant} onLogout={() => {
                    setLoggedInMerchant(null);
                    setCurrentView(ViewState.HOME);
                }} />;

            case ViewState.MERCHANT_LOGIN:
                return (
                    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                            <div className="text-center mb-6">
                                <Store className="w-12 h-12 text-indigo-600 mx-auto mb-2" />
                                <h2 className="text-2xl font-bold text-gray-900">{isRegistering ? 'Register Restaurant' : 'Merchant Login'}</h2>
                                <p className="text-gray-500 text-sm mt-2">Manage surveys & lotteries</p>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-4">
                                {isRegistering && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
                                        <input type="text" className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} required />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Username</label>
                                    <input type="text" className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500" value={username} onChange={e => setUsername(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input type="password" className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500" value={password} onChange={e => setPassword(e.target.value)} required />
                                </div>

                                {authError && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{authError}</p>}

                                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold transition-colors">
                                    {isRegistering ? 'Create Account' : 'Sign In'}
                                </button>
                            </form>

                            <div className="mt-6 text-center space-y-4">
                                <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }} className="text-indigo-600 hover:underline text-sm font-medium">
                                    {isRegistering ? 'Already have an account? Login' : 'New here? Register Restaurant'}
                                </button>

                                <button onClick={() => setCurrentView(ViewState.HOME)} className="w-full text-gray-400 text-sm hover:text-gray-600 block">
                                    ← Back to Home
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case ViewState.HOME:
            default:
                return (
                    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
                        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
                            {/* Customer Card */}
                            <div onClick={() => setCurrentView(ViewState.CUSTOMER_MERCHANT_LIST)} className="bg-white p-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1 flex flex-col items-center text-center group">
                                <div className="bg-indigo-100 p-6 rounded-full mb-6 group-hover:bg-indigo-200 transition-colors"><UtensilsCrossed className="w-16 h-16 text-indigo-600" /></div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-4">I'm a Customer</h2>
                                <p className="text-gray-600 text-lg">Dined with us? Find your restaurant, take a survey, and <span className="text-indigo-600 font-bold">WIN</span> prizes!</p>
                                <button className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold group-hover:bg-indigo-700 transition-colors">Start Survey</button>
                            </div>

                            {/* Merchant Card */}
                            <div onClick={() => setCurrentView(ViewState.MERCHANT_LOGIN)} className="bg-slate-900 p-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1 flex flex-col items-center text-center group">
                                <div className="bg-slate-700 p-6 rounded-full mb-6 group-hover:bg-slate-600 transition-colors"><User className="w-16 h-16 text-white" /></div>
                                <h2 className="text-3xl font-bold text-white mb-4">I'm a Merchant</h2>
                                <p className="text-slate-300 text-lg">Log in to manage your restaurant's surveys, lotteries, and view customer insights.</p>
                                <button className="mt-8 px-8 py-3 bg-white text-slate-900 rounded-full font-semibold group-hover:bg-gray-100 transition-colors">Merchant Access</button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return <>{renderContent()}</>;
};

export default App;