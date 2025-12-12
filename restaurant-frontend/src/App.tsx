import React, { useState } from 'react';
import { ViewState } from './types';
import { CustomerApp } from './components/CustomerApp';
import { MerchantDashboard } from './components/MerchantDashboard';
import { UtensilsCrossed, Store, User } from 'lucide-react';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
    const [loginError, setLoginError] = useState('');

    // Mock Merchant Login
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleMerchantLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'admin' && password === 'admin') {
            setCurrentView(ViewState.MERCHANT_DASHBOARD);
            setLoginError('');
            setUsername('');
            setPassword('');
        } else {
            setLoginError('Invalid credentials (try admin/admin)');
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case ViewState.CUSTOMER_SURVEY:
            case ViewState.CUSTOMER_LOTTERY:
                return <CustomerApp onBack={() => setCurrentView(ViewState.HOME)} />;

            case ViewState.MERCHANT_DASHBOARD:
                return <MerchantDashboard onLogout={() => setCurrentView(ViewState.HOME)} />;

            case ViewState.MERCHANT_LOGIN:
                return (
                    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                            <div className="text-center mb-6">
                                <Store className="w-12 h-12 text-indigo-600 mx-auto mb-2" />
                                <h2 className="text-2xl font-bold text-gray-900">Merchant Access</h2>
                                <p className="text-gray-500 text-sm">Manage your restaurant surveys</p>
                            </div>

                            <form onSubmit={handleMerchantLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Username</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder="admin"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="admin"
                                    />
                                </div>

                                {loginError && <p className="text-red-500 text-sm">{loginError}</p>}

                                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold transition-colors">
                                    Sign In
                                </button>
                            </form>

                            <button onClick={() => setCurrentView(ViewState.HOME)} className="w-full mt-4 text-gray-500 text-sm hover:underline">
                                Back to Home
                            </button>
                        </div>
                    </div>
                );

            case ViewState.HOME:
            default:
                return (
                    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
                        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">

                            {/* Customer Card */}
                            <div
                                onClick={() => setCurrentView(ViewState.CUSTOMER_SURVEY)}
                                className="bg-white p-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1 flex flex-col items-center text-center group"
                            >
                                <div className="bg-indigo-100 p-6 rounded-full mb-6 group-hover:bg-indigo-200 transition-colors">
                                    <UtensilsCrossed className="w-16 h-16 text-indigo-600" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-4">I'm a Customer</h2>
                                <p className="text-gray-600 text-lg">
                                    Dined with us recently? Take a quick survey and get a chance to <span className="text-indigo-600 font-bold">WIN</span> prizes!
                                </p>
                                <button className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold group-hover:bg-indigo-700 transition-colors">
                                    Start Survey
                                </button>
                            </div>

                            {/* Merchant Card */}
                            <div
                                onClick={() => setCurrentView(ViewState.MERCHANT_LOGIN)}
                                className="bg-slate-900 p-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1 flex flex-col items-center text-center group"
                            >
                                <div className="bg-slate-700 p-6 rounded-full mb-6 group-hover:bg-slate-600 transition-colors">
                                    <User className="w-16 h-16 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-4">I'm a Merchant</h2>
                                <p className="text-slate-300 text-lg">
                                    Log in to the dashboard to manage surveys, update prizes, and view customer insights.
                                </p>
                                <button className="mt-8 px-8 py-3 bg-white text-slate-900 rounded-full font-semibold group-hover:bg-gray-100 transition-colors">
                                    Merchant Login
                                </button>
                            </div>

                        </div>
                    </div>
                );
        }
    };

    return (
        <>
            {renderContent()}
        </>
    );
};

export default App;