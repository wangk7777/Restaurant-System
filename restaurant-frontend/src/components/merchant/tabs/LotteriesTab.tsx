
import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Lottery, UUID, Merchant } from '../../../types';
import { Plus, Settings, Trash2 } from 'lucide-react';
import { db } from '../../../services/api';
import { LotteryEditor } from '../editors/LotteryEditor';

interface LotteriesTabProps {
    lotteries: Lottery[];
    isAdmin: boolean;
    isOwner?: boolean;
    ownedRestaurants?: Merchant[];
    getMerchantName: (id: UUID) => string;
    onRefresh: () => void;
    currentMerchantId: string;
}

const generateUUID = () => crypto.randomUUID();

export const LotteriesTab: React.FC<LotteriesTabProps> = ({ lotteries, isAdmin, isOwner, ownedRestaurants, getMerchantName, onRefresh, currentMerchantId }) => {
    const { t } = useLanguage();
    const [editingLottery, setEditingLottery] = useState<Partial<Lottery> | null>(null);
    const [isNew, setIsNew] = useState(false);

    const [filterStoreId, setFilterStoreId] = useState<string>('');

    const handleCreate = () => {
        setIsNew(true);
        // Default to currentMerchantId (Shared) for owners
        setEditingLottery({ id: generateUUID(), merchant_id: currentMerchantId, name: '', prizes: [] });
    };

    const handleEdit = (l: Lottery) => {
        setIsNew(false);
        setEditingLottery(l);
    };

    const handleDelete = async (id: UUID) => {
        if (window.confirm(t.common.confirmDelete)) {
            try { await db.deleteLottery(id); onRefresh(); } catch (e) { alert(t.common.error); }
        }
    };

    if (editingLottery) {
        return (
            <LotteryEditor
                initialData={editingLottery}
                isAdmin={isAdmin}
                isOwner={isOwner}
                ownedRestaurants={ownedRestaurants}
                getMerchantName={getMerchantName}
                onSave={() => { setEditingLottery(null); onRefresh(); }}
                onCancel={() => setEditingLottery(null)}
                currentMerchantId={currentMerchantId}
                isNew={isNew}
            />
        );
    }

    const displayedLotteries = filterStoreId
        ? lotteries.filter(s => s.merchant_id === filterStoreId)
        : lotteries;


    return (
        <div>
            <div className="flex justify-between mb-4 items-end">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">{t.dashboard.tabLotteries} {isAdmin && t.dashboard.allRestaurants}</h2>
                    {isOwner && ownedRestaurants && (
                        <select
                            className="border p-1 rounded text-sm bg-white"
                            value={filterStoreId}
                            onChange={(e) => setFilterStoreId(e.target.value)}
                        >
                            <option value="">{t.dashboard.allRestaurants}</option>
                            <option value={currentMerchantId}>{t.dashboard.sharedLottery}</option>
                            {ownedRestaurants.map(r => (
                                <option key={r.id} value={r.id}>{r.restaurant_name}</option>
                            ))}
                        </select>
                    )}
                </div>
                <button onClick={handleCreate} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={18} /> {t.common.new}</button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {displayedLotteries.map(l => (
                    <div key={l.id} className="bg-white p-4 rounded border shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="font-bold text-lg flex items-center gap-2">
                                    {l.name}
                                    {/* Restored label for Owner, with "Shared" logic */}
                                    {(isAdmin || isOwner) && (
                                        <span className={`text-xs font-normal px-2 py-0.5 rounded ${l.merchant_id === currentMerchantId ? 'bg-purple-50 text-purple-700' : 'bg-indigo-50 text-indigo-600'}`}>
                                            {l.merchant_id === currentMerchantId ? t.dashboard.sharedLottery : getMerchantName(l.merchant_id)}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">{l.prizes.length} {t.dashboard.prizes}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleEdit(l)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Settings size={18} /></button>
                                <button onClick={() => handleDelete(l.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};