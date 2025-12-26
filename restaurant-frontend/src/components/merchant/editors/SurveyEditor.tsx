
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Survey, Lottery, Question, UUID, Merchant } from '../../../types';
import {X, QrCode, Download, Copy, ExternalLink, MessageSquare, List as ListIcon, CheckSquare } from 'lucide-react';
import { db } from '../../../services/api';

interface SurveyEditorProps {
    initialData: Partial<Survey>;
    lotteries: Lottery[];
    isAdmin: boolean;
    isOwner?: boolean;
    ownedRestaurants: Merchant[];
    getMerchantName: (id: UUID) => string;
    onSave: () => void;
    onCancel: () => void;
    currentMerchantId: string;
    isNew: boolean;
}

const generateUUID = () => crypto.randomUUID();

export const SurveyEditor: React.FC<SurveyEditorProps> = ({
                                                              initialData, lotteries, isAdmin, isOwner, ownedRestaurants, getMerchantName, onSave, onCancel, currentMerchantId, isNew
                                                          }) => {
    const { t } = useLanguage();
    const [survey, setSurvey] = useState<Partial<Survey>>(initialData);

    const handleSave = async () => {
        if (!survey.name) return;
        const payload = { ...survey } as Survey;
        if (!payload.merchant_id) payload.merchant_id = currentMerchantId;

        try {
            await db.saveSurvey(payload, !isNew);
            onSave();
        } catch (e) {
            console.error(e);
            alert(t.common.error);
        }
    };

    // Question & Option Handlers
    const updateQuestion = (idx: number, field: keyof Question, val: any) => {
        if (!survey.questions) return;
        const qs = [...survey.questions];
        (qs[idx] as any)[field] = val;

        if (field === 'type' && val === 'text') {
            qs[idx].options = [];
            qs[idx].allow_other = false;
        }
        if (field === 'type' && (val === 'choice' || val === 'multi') && qs[idx].options.length === 0) {
            qs[idx].options = [t.dashboard.options + ' A', t.dashboard.options + ' B'];
        }
        setSurvey({ ...survey, questions: qs });
    };

    const addQuestion = () => setSurvey({
        ...survey,
        questions: [...(survey.questions || []), { id: generateUUID(), text: '', type: 'choice', allow_other: false, options: [t.dashboard.options + ' A', t.dashboard.options + ' B'] }]
    });

    const removeQuestion = (idx: number) => {
        if (!survey.questions) return;

        // Confirmation prompt to warn about analytics impact
        if (!window.confirm(t.dashboard.deleteQuestionConfirm)) return;

        const qs = [...survey.questions];
        qs.splice(idx, 1);
        setSurvey({ ...survey, questions: qs });
    };

    const updateOption = (qIdx: number, oIdx: number, val: string) => { if (!survey.questions) return; const qs = [...survey.questions]; qs[qIdx].options[oIdx] = val; setSurvey({ ...survey, questions: qs }); };
    const addOption = (qIdx: number) => { if (!survey.questions) return; const qs = [...survey.questions]; qs[qIdx].options.push(t.common.new + ' ' + t.dashboard.options); setSurvey({ ...survey, questions: qs }); };
    const removeOption = (qIdx: number, oIdx: number) => { if (!survey.questions) return; const qs = [...survey.questions]; qs[qIdx].options.splice(oIdx, 1); setSurvey({ ...survey, questions: qs }); };

    // QR Logic
    const getAppUrl = (surveyId: string) => {
        const host = window.location.origin;
        const targetMerchantId = survey.merchant_id || currentMerchantId;
        return `${host}/?merchant_id=${targetMerchantId}&survey_id=${surveyId}`;
    };
    const getQrCodeUrl = (surveyId: string) => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getAppUrl(surveyId))}`;

    const downloadQrCode = async (surveyId: string) => {
        try {
            const response = await fetch(getQrCodeUrl(surveyId));
            const blob = await response.blob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${survey.name || 'survey'}_qr.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) { alert("Failed to download."); }
    };

    const copyLink = (surveyId: string) => {
        navigator.clipboard.writeText(getAppUrl(surveyId));
        alert(t.common.success);
    };

    // --- Filter Lotteries Logic ---
    // Only show lotteries that belong to the selected merchant OR are shared (owned by current owner)
    const availableLotteries = useMemo(() => {
        return lotteries.filter(l => {
            // Managers/Admins logic remains mostly standard (Managers only receive valid data anyway)
            if (!isOwner && !isAdmin) return true;
            if (isAdmin) return true;

            // OWNER LOGIC:
            const targetStoreId = survey.merchant_id;

            // 1. Show if lottery is "Shared" (Belongs to the current logged-in Owner)
            if (l.merchant_id === currentMerchantId) return true;

            // 2. Show if lottery belongs to the specifically selected Target Store
            // If no store selected yet, only shared lotteries are safe to show.
            if (targetStoreId && l.merchant_id === targetStoreId) return true;

            return false;
        });
    }, [lotteries, survey.merchant_id, isOwner, isAdmin, currentMerchantId]);


    return (
        <div className="bg-white p-6 rounded shadow max-w-3xl">
            <h3 className="text-xl font-bold mb-4">{t.dashboard.editSurvey}</h3>
            <div className="space-y-4">
                {/* Store Selection for Owners/Admins */}
                {(isAdmin || isOwner) && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t.dashboard.assignedTo}</label>
                        {isNew ? (
                            <select
                                className="border p-2 w-full rounded bg-gray-50"
                                value={survey.merchant_id || ''}
                                onChange={e => setSurvey({
                                    ...survey,
                                    merchant_id: e.target.value,
                                    lottery_id: null // Reset lottery when changing store to avoid invalid links
                                })}
                            >
                                {ownedRestaurants.map(r => (
                                    <option key={r.id} value={r.id}>{r.restaurant_name}</option>
                                ))}
                                {isAdmin && !ownedRestaurants.length && <option value={survey.merchant_id}>{getMerchantName(survey.merchant_id!)}</option>}
                            </select>
                        ) : (
                            <div className="text-sm font-mono bg-gray-100 p-2 rounded text-gray-700">
                                {getMerchantName(survey.merchant_id!)}
                            </div>
                        )}
                    </div>
                )}

                <input className="border p-2 w-full rounded" placeholder={t.dashboard.surveyName} value={survey.name} onChange={e => setSurvey({...survey, name: e.target.value})} />

                <select className="border p-2 w-full rounded" value={survey.lottery_id || ''} onChange={e => setSurvey({...survey, lottery_id: e.target.value || null})}>
                    <option value="">{t.dashboard.noLottery}</option>
                    {availableLotteries.map(l => (
                        <option key={l.id} value={l.id}>
                            {l.name}
                            {isAdmin ? ` (${getMerchantName(l.merchant_id)})` : ''}
                            {/* For Owners: Label Shared lotteries explicitly */}
                            {isOwner && l.merchant_id === currentMerchantId ? ` (${t.dashboard.sharedLottery})` : ''}
                        </option>
                    ))}
                </select>
                <hr/>
                {/* Questions */}
                <div>
                    {survey.questions?.map((q, i) => (
                        <div key={q.id} className="mb-4 border p-4 rounded bg-gray-50 relative">
                            <button onClick={() => removeQuestion(i)} className="absolute top-2 right-2 text-red-400"><X size={20} /></button>

                            <div className="mb-3">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.dashboard.question}</label>
                                <input className="border p-2 w-full rounded font-medium" value={q.text} onChange={e => updateQuestion(i, 'text', e.target.value)} placeholder="e.g. How was your food?"/>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.dashboard.answerType}</label>
                                <div className="flex flex-wrap gap-3">
                                    <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded border transition-all ${q.type === 'choice' || !q.type ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" className="hidden" name={`qtype-${q.id}`} checked={q.type === 'choice' || !q.type} onChange={() => updateQuestion(i, 'type', 'choice')} />
                                        <ListIcon size={16} className={q.type === 'choice' || !q.type ? 'text-indigo-600' : 'text-gray-400'}/>
                                        <span className="text-sm font-medium">{t.dashboard.typeChoice}</span>
                                    </label>
                                    <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded border transition-all ${q.type === 'multi' ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" className="hidden" name={`qtype-${q.id}`} checked={q.type === 'multi'} onChange={() => updateQuestion(i, 'type', 'multi')} />
                                        <CheckSquare size={16} className={q.type === 'multi' ? 'text-indigo-600' : 'text-gray-400'}/>
                                        <span className="text-sm font-medium">{t.dashboard.typeMulti}</span>
                                    </label>
                                    <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded border transition-all ${q.type === 'text' ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" className="hidden" name={`qtype-${q.id}`} checked={q.type === 'text'} onChange={() => updateQuestion(i, 'type', 'text')} />
                                        <MessageSquare size={16} className={q.type === 'text' ? 'text-indigo-600' : 'text-gray-400'}/>
                                        <span className="text-sm font-medium">{t.dashboard.typeText}</span>
                                    </label>
                                </div>
                            </div>

                            {(q.type === 'choice' || q.type === 'multi' || !q.type) ? (
                                <div className="pl-4 space-y-2 border-l-2 border-indigo-100">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t.dashboard.options}</label>
                                    {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex gap-2 mb-2"><input className="border p-1 w-full text-sm rounded" value={opt} onChange={e => updateOption(i, oIdx, e.target.value)} /><button onClick={() => removeOption(i, oIdx)}><X size={14}/></button></div>
                                    ))}
                                    {q.allow_other && (
                                        <div className="flex gap-2 mb-2 items-center">
                                            <div className="border border-dashed border-gray-300 p-1.5 w-full text-sm rounded bg-gray-50 text-gray-400 italic flex items-center justify-between">
                                                <span>{t.dashboard.otherPlaceholder}</span>
                                            </div>
                                            <button onClick={() => updateQuestion(i, 'allow_other', false)} title="Remove 'Other' option"><X size={14} className="text-red-500"/></button>
                                        </div>
                                    )}
                                    <div className="flex gap-3 mt-3">
                                        <button onClick={() => addOption(i)} className="text-xs text-indigo-600 font-bold hover:bg-indigo-50 px-2 py-1 rounded border border-indigo-200">+ {t.dashboard.addOption}</button>
                                        {!q.allow_other && (
                                            <button onClick={() => updateQuestion(i, 'allow_other', true)} className="text-xs text-gray-600 font-bold hover:bg-gray-100 px-2 py-1 rounded border border-gray-300">+ {t.dashboard.addOther}</button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="pl-4 py-2 border-l-2 border-gray-100 text-sm text-gray-500 italic bg-gray-50 rounded-r">
                                    {t.dashboard.textHint}
                                </div>
                            )}
                        </div>
                    ))}
                    <button onClick={addQuestion} className="text-sm border border-blue-500 text-blue-500 px-3 py-1 rounded hover:bg-blue-50">+ {t.dashboard.addQuestion}</button>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">{t.common.cancel}</button>
                    <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">{t.common.save}</button>
                </div>

                {/* QR Section (Only show if not new, or after save) */}
                {!isNew && survey.id && (
                    <div className="mt-8 pt-6 border-t bg-gray-50 -mx-6 -mb-6 p-6 rounded-b">
                        <h4 className="font-bold mb-4 flex items-center gap-2"><QrCode size={18}/> {t.dashboard.customerAccess}</h4>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex flex-col items-center gap-2 bg-white p-4 rounded border shadow-sm">
                                <img src={getQrCodeUrl(survey.id)} alt="Survey QR" className="w-40 h-40 border rounded bg-white" />
                                <button onClick={() => downloadQrCode(survey.id!)} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded flex items-center gap-2 w-full justify-center transition-colors">
                                    <Download size={14} /> {t.dashboard.downloadQr}
                                </button>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">{t.dashboard.directLink}</label>
                                    <div className="flex gap-2">
                                        <input type="text" readOnly value={getAppUrl(survey.id)} className="flex-1 p-2 border rounded bg-white text-gray-600 text-sm font-mono"/>
                                        <button onClick={() => copyLink(survey.id!)} className="bg-indigo-600 text-white px-4 rounded hover:bg-indigo-700 transition-colors flex items-center gap-2"><Copy size={16} /></button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-100 flex gap-2">
                                    <ExternalLink className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"/>
                                    <p>{t.dashboard.qrHelp}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};