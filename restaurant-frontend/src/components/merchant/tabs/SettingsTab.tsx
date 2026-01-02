
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Merchant } from '../../../types';
import { db } from '../../../services/api';
import { Eye, EyeOff, Save } from 'lucide-react';

interface SettingsTabProps {
    merchant: Merchant;
    onUpdate: (updatedMerchant: Merchant) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ merchant, onUpdate }) => {
    const { t } = useLanguage();

    // Form State
    const [name, setName] = useState(merchant.restaurant_name);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initial load
    useEffect(() => {
        setName(merchant.restaurant_name);
        // Note: Password might not be available depending on API response security,
        // but for editing self, we often want to leave it blank unless changing.
        // However, based on previous requirements, we are fetching it.
        setPassword(merchant.password || '');
    }, [merchant]);

    const handleSave = async () => {
        if (!name || !password) {
            alert("Name and password are required.");
            return;
        }

        setIsSaving(true);
        try {
            const updated = await db.saveMerchant({
                id: merchant.id,
                restaurant_name: name,
                username: merchant.username, // Username usually shouldn't change, but we pass it to satisfy schema
                password: password
            }, true);

            alert(t.dashboard.updateSuccess);
            onUpdate(updated);
        } catch (e: any) {
            alert(e.message || t.common.error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-8">
            <h2 className="text-2xl font-bold mb-6">{t.dashboard.settingsTitle}</h2>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="space-y-6">
                    {/* Username (Read Only) */}
                    <div>
                        <label className="block text-sm font-bold text-gray-500 uppercase mb-1">{t.auth.username}</label>
                        <input
                            className="border p-3 w-full rounded bg-gray-100 text-gray-500 cursor-not-allowed"
                            value={merchant.username}
                            disabled
                        />
                        <p className="text-xs text-gray-400 mt-1">Username cannot be changed.</p>
                    </div>

                    {/* Restaurant Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase mb-1">{t.auth.restaurantName}</label>
                        <input
                            className="border p-3 w-full rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase mb-1">{t.auth.password}</label>
                        <div className="relative">
                            <input
                                className="border p-3 w-full rounded pr-12 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                type={showPassword ? "text" : "password"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3.5 text-gray-400 hover:text-indigo-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Make sure to use a strong password.</p>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:shadow-none"
                    >
                        <Save size={18} />
                        {isSaving ? t.common.loading : t.common.save}
                    </button>
                </div>
            </div>
        </div>
    );
};
