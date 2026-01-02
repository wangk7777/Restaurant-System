
import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Lottery, UUID, Merchant } from '../../../types';
import { Trash2, QrCode, Download, Copy, ExternalLink } from 'lucide-react';
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

    // QR Logic
    const getAppUrl = (lotteryId: string) => {
        const host = window.location.origin;
        // If owner/shared, use current merchant ID, else use the assigned merchant ID
        const targetMerchantId = lottery.merchant_id || currentMerchantId;
        return `${host}/?merchant_id=${targetMerchantId}&lottery_id=${lotteryId}`;
    };
    const getQrCodeUrl = (lotteryId: string) => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getAppUrl(lotteryId))}`;

    const downloadQrCode = async (lotteryId: string) => {
        try {
            const response = await fetch(getQrCodeUrl(lotteryId));
            const blob = await response.blob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${lottery.name || 'lottery'}_qr.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) { alert("Failed to download."); }
    };

    const copyLink = (lotteryId: string) => {
        navigator.clipboard.writeText(getAppUrl(lotteryId));
        alert(t.common.success);
    };

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

            {/* QR Section (Only show if not new, or after save) */}
            {!isNew && lottery.id && (
                <div className="mt-8 pt-6 border-t bg-gray-50 -mx-6 -mb-6 p-6 rounded-b">
                    <h4 className="font-bold mb-4 flex items-center gap-2"><QrCode size={18}/> {t.dashboard.customerAccess}</h4>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex flex-col items-center gap-2 bg-white p-4 rounded border shadow-sm">
                            <img src={getQrCodeUrl(lottery.id)} alt="Lottery QR" className="w-40 h-40 border rounded bg-white" />
                            <button onClick={() => downloadQrCode(lottery.id!)} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded flex items-center gap-2 w-full justify-center transition-colors">
                                <Download size={14} /> {t.dashboard.downloadQr}
                            </button>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">{t.dashboard.directLink}</label>
                                <div className="flex gap-2">
                                    <input type="text" readOnly value={getAppUrl(lottery.id)} className="flex-1 p-2 border rounded bg-white text-gray-600 text-sm font-mono"/>
                                    <button onClick={() => copyLink(lottery.id!)} className="bg-indigo-600 text-white px-4 rounded hover:bg-indigo-700 transition-colors flex items-center gap-2"><Copy size={16} /></button>
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-100 flex gap-2">
                                <ExternalLink className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"/>
                                <p>Scan this code to let customers play this lottery directly (skip survey).</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};