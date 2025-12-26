
import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Merchant } from '../../../types';
import { db } from '../../../services/api';
import { Plus, Trash2, Edit, Key, Store, Eye, EyeOff } from 'lucide-react';

interface RestaurantsTabProps {
    ownerMerchant: Merchant;
    ownedRestaurants: Merchant[];
    onRefresh: () => void;
}

export const RestaurantsTab: React.FC<RestaurantsTabProps> = ({ ownerMerchant, ownedRestaurants, onRefresh }) => {
    const { t } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [editId, setEditId] = useState<string | null>(null);
    const [formName, setFormName] = useState('');
    const [formUser, setFormUser] = useState('');
    const [formPass, setFormPass] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const startNew = () => {
        setIsEditing(true);
        setEditId(null);
        setFormName('');
        setFormUser('');
        setFormPass('');
        setShowPassword(false);
    };

    const startEdit = (m: Merchant) => {
        setIsEditing(true);
        setEditId(m.id);
        setFormName(m.restaurant_name);
        setFormUser(m.username);
        // Note: Password will only populate if the backend schema includes it in the response.
        // We have updated the backend schema to include `password` for this purpose.
        setFormPass(m.password || '');
        setShowPassword(false);
    };

    const handleSave = async () => {
        if (!formName || !formUser || !formPass) {
            alert("All fields are required");
            return;
        }

        try {
            if (editId) {
                // Update
                await db.saveMerchant({
                    id: editId,
                    restaurant_name: formName,
                    username: formUser,
                    password: formPass
                }, true);
            } else {
                // Create
                await db.saveMerchant({
                    restaurant_name: formName,
                    username: formUser,
                    password: formPass,
                    role: 'manager',
                    owner_id: ownerMerchant.id
                });
            }
            setIsEditing(false);
            onRefresh();
        } catch (e: any) {
            alert(e.message || t.common.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(t.common.confirmDelete)) {
            try {
                await db.deleteMerchant(id);
                onRefresh();
            } catch (e) {
                alert(t.common.error);
            }
        }
    };

    if (isEditing) {
        return (
            <div className="bg-white p-6 rounded shadow max-w-lg">
                <h3 className="text-xl font-bold mb-4">{editId ? t.dashboard.editRestaurant : t.dashboard.addNewRestaurant}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t.auth.restaurantName}</label>
                        <input className="border p-2 w-full rounded" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Burger King - Downtown" />
                    </div>
                    <div className="bg-indigo-50 p-4 rounded border border-indigo-100">
                        <h4 className="font-bold text-sm text-indigo-800 mb-2 flex items-center gap-2"><Key size={14}/> {t.dashboard.credsTitle}</h4>
                        <p className="text-xs text-indigo-600 mb-3">{t.dashboard.credsDesc}</p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t.auth.username}</label>
                                <input className="border p-2 w-full rounded" value={formUser} onChange={e => setFormUser(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t.auth.password}</label>
                                <div className="relative">
                                    <input
                                        className="border p-2 w-full rounded pr-10"
                                        value={formPass}
                                        onChange={e => setFormPass(e.target.value)}
                                        type={showPassword ? "text" : "password"}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-2.5 text-gray-500 hover:text-indigo-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 rounded">{t.common.cancel}</button>
                    <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">{t.common.save}</button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between mb-4">
                <h2 className="text-2xl font-bold">{t.dashboard.restaurantList}</h2>
                <button onClick={startNew} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2">
                    <Plus size={18} /> {t.common.new}
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ownedRestaurants.map(m => (
                    <div key={m.id} className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-indigo-100 p-3 rounded-full">
                                <Store className="text-indigo-600 w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => startEdit(m)} className="text-blue-500 hover:bg-blue-50 p-2 rounded transition-colors" title={t.common.edit}>
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors" title={t.common.delete}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 className="font-bold text-lg text-gray-900 mb-1">{m.restaurant_name}</h3>
                        <div className="text-sm text-gray-500 flex items-center gap-2 mb-3">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{m.username}</span>
                        </div>
                    </div>
                ))}
                {ownedRestaurants.length === 0 && (
                    <div className="col-span-full py-10 text-center text-gray-400 bg-gray-50 border border-dashed rounded-xl">
                        No restaurants added yet.
                    </div>
                )}
            </div>
        </div>
    );
};