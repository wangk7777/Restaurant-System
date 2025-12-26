
import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Lottery, UUID, Merchant } from '../../../types';
import { Trash2 } from 'lucide-react';
import { db } from '../../../services/api';

interface LotteryEditorProps {
    initialData: Partial<Lottery>;
    isAdmin: boolean;
    isOwner?: boolean;
    ownedRestaurants?: Merchant[];
    getMerchantName: (id: UUID) => string;
    onSave: () => void;
    onCancel: () => void;
    currentMerchantId: string;
    isNew: boolean;
}

const generateUUID = () => crypto.randomUUID();

export const LotteryEditor: React.FC<LotteryEditorProps> = ({
                                                                initialData, isAdmin, isOwner, ownedRestaurants, getMerchantName, onSave, onCancel, currentMerchantId, isNew
                                                            }) => {
    const { t } = useLanguage();
    const [lottery, setLottery] = useState<Partial<Lottery>>(initialData);

    const handleSave = async () => {
        if (!lottery.name) return;
        const payload = { ...lottery } as Lottery;
        if (!payload.merchant_id) payload.merchant_id = currentMerchantId;

        try {
            await db.saveLottery(payload, !isNew);
            onSave();
        } catch (e) {
            alert(t.common.error);
        }
    };

    const addPrize = () => setLottery({ ...lottery, prizes: [...(lottery.prizes || []), { id: generateUUID(), name: '', probability: 0 }] });

    const updatePrize = (idx: number, field: string, val: string | number) => {
        if (!lottery.prizes) return;
        const pz = [...lottery.prizes];
        (pz[idx] as any)[field] = val;
        setLottery({ ...lottery, prizes: pz });
    };

    const removePrize = (idx: number) => { const np = [...(lottery.prizes||[])]; np.splice(idx, 1); setLottery({...lottery, prizes: np}); };

    return (
        <div className="bg-white p-6 rounded shadow max-w-3xl">
            {/* Admin View Label */}
            {isAdmin && lottery.merchant_id && (
                <div className="text-xs font-mono bg-yellow-50 p-2 text-yellow-800 border border-yellow-200 rounded mb-4">
                    {t.dashboard.owner}: {getMerchantName(lottery.merchant_id)}
                </div>
            )}

            {/* Owner Selection: Shared vs Specific Store */}
            {isOwner && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.assignedTo}</label>
                    {isNew ? (
                        <select
                            className="border p-2 w-full rounded bg-gray-50"
                            value={lottery.merchant_id || currentMerchantId}
                            onChange={e => setLottery({...lottery, merchant_id: e.target.value})}
                        >
                            <option value={currentMerchantId}>{t.dashboard.sharedLottery}</option>
                            {ownedRestaurants?.map(r => (
                                <option key={r.id} value={r.id}>{r.restaurant_name}</option>
                            ))}
                        </select>
                    ) : (
                        // If editing, just show where it's assigned
                        <div className="text-sm font-mono bg-gray-100 p-2 rounded text-gray-700">
                            {lottery.merchant_id === currentMerchantId ? t.dashboard.sharedLottery : getMerchantName(lottery.merchant_id!)}
                        </div>
                    )}
                </div>
            )}

            <input className="border p-2 w-full mb-4 rounded" placeholder={t.dashboard.lotteryName} value={lottery.name} onChange={e => setLottery({...lottery, name: e.target.value})} />
            <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-500 mb-2"><span>{t.dashboard.prizes}</span><span>{t.dashboard.prob}</span></div>
                {lottery.prizes?.map((p, i) => (
                    <div key={p.id} className="flex gap-2 mb-2">
                        <input className="border p-2 flex-1 rounded" value={p.name} onChange={e => updatePrize(i, 'name', e.target.value)}/>
                        <input
                            className="border p-2 w-24 rounded"
                            type="number"
                            value={isNaN(p.probability) ? '' : p.probability}
                            onChange={e => updatePrize(i, 'probability', parseFloat(e.target.value))}
                        />
                        <button onClick={() => removePrize(i)} className="text-red-500"><Trash2 size={16}/></button>
                    </div>
                ))}
                <button onClick={addPrize} className="text-sm text-blue-500 mt-2 border border-blue-500 px-3 py-1 rounded">+ {t.dashboard.addPrize}</button>
            </div>
            <div className="flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">{t.common.cancel}</button>
                <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">{t.common.save}</button>
            </div>
        </div>
    );
};