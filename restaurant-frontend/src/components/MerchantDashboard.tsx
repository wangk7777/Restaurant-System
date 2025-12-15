import React, { useState, useEffect } from 'react';
import { db } from '../services/api';
import type { Survey, Lottery, Question, SurveyResponse, UUID, Merchant } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Plus, Trash2, BarChart2, Settings, FileText, Gift, LogOut, AlertTriangle, X, QrCode, Download, Copy, ExternalLink, MessageSquare, List as ListIcon, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface MerchantDashboardProps {
    merchant: Merchant;
    onLogout: () => void;
}

const generateUUID = () => crypto.randomUUID();
const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ merchant, onLogout }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'SURVEYS' | 'LOTTERIES' | 'ANALYTICS'>('SURVEYS');
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [lotteries, setLotteries] = useState<Lottery[]>([]);
    const [connectionError, setConnectionError] = useState(false);

    // Admin features
    const isAdmin = merchant.username === 'admin';
    const [allMerchants, setAllMerchants] = useState<Merchant[]>([]);

    // Forms
    const [editingSurvey, setEditingSurvey] = useState<Partial<Survey> | null>(null);
    const [editingLottery, setEditingLottery] = useState<Partial<Lottery> | null>(null);

    // Analytics
    const [selectedAnalyticsSurvey, setSelectedAnalyticsSurvey] = useState<UUID | ''>('');
    const [responses, setResponses] = useState<SurveyResponse[]>([]);

    const refreshData = async () => {
        if (!merchant) return;
        try {
            setConnectionError(false);
            // Fetch surveys and lotteries. Backend handles Admin logic to return ALL if admin.
            const s = await db.getSurveys(merchant.id);
            const l = await db.getLotteries(merchant.id);
            setSurveys(s);
            setLotteries(l);

            // If Admin, also fetch merchant list to map names
            if (isAdmin) {
                const ms = await db.getMerchants();
                setAllMerchants(ms);
            }
        } catch (e) {
            console.error("Failed to load data.", e);
            setConnectionError(true);
        }
    };

    useEffect(() => {
        if (merchant) {
            refreshData();
        }
    }, [merchant?.id]);

    if (!merchant) {
        return <div className="p-8 text-center text-gray-500">{t.common.loading}</div>;
    }

    // Helper for Admin display
    const getMerchantName = (mId: UUID) => {
        if (!isAdmin) return '';
        const m = allMerchants.find(x => x.id === mId);
        return m ? m.restaurant_name : t.common.unknown;
    };

    const handleCreateSurvey = () => {
        setEditingSurvey({
            id: generateUUID(),
            merchant_id: merchant.id,
            name: '',
            lottery_id: null,
            questions: [],
            created_at: new Date().toISOString()
        });
    };

    const handleSaveSurvey = async () => {
        if (!editingSurvey?.name) return;
        const isUpdate = surveys.some(s => s.id === editingSurvey.id);
        // If admin is editing someone else's survey, keep original merchant_id
        const payload = { ...editingSurvey } as Survey;

        // If creating new, default to current user (admin). If editing, backend/frontend keeps ID.
        if (!payload.merchant_id) payload.merchant_id = merchant.id;

        try {
            await db.saveSurvey(payload, isUpdate);
            setEditingSurvey(null);
            refreshData();
        } catch (e) {
            alert(t.common.error);
        }
    };

    const handleDeleteSurvey = async (id: UUID) => {
        if (window.confirm(t.common.confirmDelete)) {
            try {
                await db.deleteSurvey(id);
                refreshData();
            } catch (e) { alert(t.common.error); }
        }
    };

    // Question & Option Handlers
    const addQuestion = () => setEditingSurvey({
        ...editingSurvey,
        questions: [...(editingSurvey?.questions || []), { id: generateUUID(), text: '', type: 'choice', allow_other: false, options: [t.dashboard.options + ' A', t.dashboard.options + ' B'] }]
    });

    const removeQuestion = (idx: number) => { if (!editingSurvey?.questions) return; const qs = [...editingSurvey.questions]; qs.splice(idx, 1); setEditingSurvey({ ...editingSurvey, questions: qs }); };

    // Generic update for top-level question fields (text, type, allow_other)
    const updateQuestion = (idx: number, field: keyof Question, val: any) => {
        if (!editingSurvey?.questions) return;
        const qs = [...editingSurvey.questions];
        (qs[idx] as any)[field] = val;

        // Reset options if switching to text
        if (field === 'type' && val === 'text') {
            qs[idx].options = [];
            qs[idx].allow_other = false;
        }
        // Add default options if switching to choice and empty
        if (field === 'type' && val === 'choice' && qs[idx].options.length === 0) {
            qs[idx].options = [t.dashboard.options + ' A', t.dashboard.options + ' B'];
        }

        setEditingSurvey({ ...editingSurvey, questions: qs });
    };

    const updateOption = (qIdx: number, oIdx: number, val: string) => { if (!editingSurvey?.questions) return; const qs = [...editingSurvey.questions]; qs[qIdx].options[oIdx] = val; setEditingSurvey({ ...editingSurvey, questions: qs }); };
    const addOption = (qIdx: number) => { if (!editingSurvey?.questions) return; const qs = [...editingSurvey.questions]; qs[qIdx].options.push(t.common.new + ' ' + t.dashboard.options); setEditingSurvey({ ...editingSurvey, questions: qs }); };
    const removeOption = (qIdx: number, oIdx: number) => { if (!editingSurvey?.questions) return; const qs = [...editingSurvey.questions]; qs[qIdx].options.splice(oIdx, 1); setEditingSurvey({ ...editingSurvey, questions: qs }); };

    // Lottery Handlers
    const handleCreateLottery = () => { setEditingLottery({ id: generateUUID(), merchant_id: merchant.id, name: '', prizes: [] }); };
    const handleSaveLottery = async () => {
        if (!editingLottery?.name) return;
        const isUpdate = lotteries.some(l => l.id === editingLottery.id);
        const payload = { ...editingLottery } as Lottery;
        if (!payload.merchant_id) payload.merchant_id = merchant.id;

        try { await db.saveLottery(payload, isUpdate); setEditingLottery(null); refreshData(); } catch (e) { alert(t.common.error); }
    };
    const handleDeleteLottery = async (id: UUID) => { if (window.confirm(t.common.confirmDelete)) { try { await db.deleteLottery(id); refreshData(); } catch (e) { alert(t.common.error); } } };
    const addPrize = () => setEditingLottery({ ...editingLottery, prizes: [...(editingLottery?.prizes || []), { id: generateUUID(), name: '', probability: 0 }] });
    const updatePrize = (idx: number, field: string, val: string | number) => { if (!editingLottery?.prizes) return; const pz = [...editingLottery.prizes]; (pz[idx] as any)[field] = val; setEditingLottery({ ...editingLottery, prizes: pz }); };

    const handleLoadAnalytics = async () => {
        if (!selectedAnalyticsSurvey) return;
        try { const res = await db.getResponses(selectedAnalyticsSurvey); setResponses(res); } catch (e) { alert(t.common.error); }
    };

    // --- QR Code & Link Logic ---
    const getAppUrl = (surveyId: string) => {
        const host = window.location.origin;
        // If admin is viewing someone else's survey, use THAT merchant's ID for the link
        const targetMerchantId = surveys.find(s => s.id === surveyId)?.merchant_id || merchant.id;
        return `${host}/?merchant_id=${targetMerchantId}&survey_id=${surveyId}`;
    };

    const getQrCodeUrl = (surveyId: string) => {
        const appUrl = getAppUrl(surveyId);
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}`;
    };

    const downloadQrCode = async (surveyId: string) => {
        try {
            const url = getQrCodeUrl(surveyId);
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(blob);
            // File name
            const surveyName = surveys.find(s => s.id === surveyId)?.name || 'survey';
            downloadLink.download = `${surveyName}_qr.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        } catch (e) {
            console.error(e);
            alert("Failed to download image.");
        }
    };

    const copyLink = (surveyId: string) => {
        navigator.clipboard.writeText(getAppUrl(surveyId));
        alert(t.common.success);
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col">
                <h1 className="text-xl font-bold mb-2">MERCHANT<span className="text-indigo-400">HUB</span></h1>
                <p className="text-xs text-slate-400 mb-8 flex items-center gap-1">
                    {isAdmin ? <ShieldAlert size={12} className="text-red-400"/> : null}
                    {isAdmin ? t.dashboard.sysAdmin : `${t.common.welcome}, ${merchant.restaurant_name}`}
                </p>
                <nav className="space-y-4 flex-1">
                    <button onClick={() => setActiveTab('SURVEYS')} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'SURVEYS' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                        <FileText size={18} /> {t.dashboard.tabSurveys}
                    </button>
                    <button onClick={() => setActiveTab('LOTTERIES')} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'LOTTERIES' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                        <Gift size={18} /> {t.dashboard.tabLotteries}
                    </button>
                    <button onClick={() => setActiveTab('ANALYTICS')} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'ANALYTICS' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                        <BarChart2 size={18} /> {t.dashboard.tabAnalytics}
                    </button>
                </nav>
                <button onClick={onLogout} className="flex items-center gap-3 text-red-400 mt-8 hover:text-red-300">
                    <LogOut size={18} /> {t.common.logout}
                </button>
            </aside>
            <main className="flex-1 p-8 overflow-auto">
                {connectionError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6" />
                        <div>{t.dashboard.backendError}</div>
                    </div>
                )}

                {activeTab === 'SURVEYS' && (
                    <div>
                        {!editingSurvey && (
                            <div className="flex justify-between mb-4">
                                <h2 className="text-2xl font-bold">{t.dashboard.tabSurveys} {isAdmin && t.dashboard.allRestaurants}</h2>
                                <button onClick={handleCreateSurvey} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2">
                                    <Plus size={18} /> {t.common.new}
                                </button>
                            </div>
                        )}
                        {editingSurvey ? (
                            <div className="bg-white p-6 rounded shadow max-w-3xl">
                                <h3 className="text-xl font-bold mb-4">{t.dashboard.editSurvey}</h3>
                                <div className="space-y-4">
                                    {isAdmin && editingSurvey.merchant_id && (
                                        <div className="text-xs font-mono bg-yellow-50 p-2 text-yellow-800 border border-yellow-200 rounded">
                                            {t.dashboard.owner}: {getMerchantName(editingSurvey.merchant_id)} ({editingSurvey.merchant_id})
                                        </div>
                                    )}
                                    <input className="border p-2 w-full rounded" placeholder={t.dashboard.surveyName} value={editingSurvey.name} onChange={e => setEditingSurvey({...editingSurvey, name: e.target.value})} />
                                    <select className="border p-2 w-full rounded" value={editingSurvey.lottery_id || ''} onChange={e => setEditingSurvey({...editingSurvey, lottery_id: e.target.value || null})}>
                                        <option value="">{t.dashboard.noLottery}</option>
                                        {lotteries.map(l => <option key={l.id} value={l.id}>{l.name} {isAdmin ? `(${getMerchantName(l.merchant_id)})` : ''}</option>)}
                                    </select>
                                    <hr/>
                                    {/* Question Editor */}
                                    <div>
                                        {editingSurvey.questions?.map((q, i) => (
                                            <div key={q.id} className="mb-4 border p-4 rounded bg-gray-50 relative">
                                                <button onClick={() => removeQuestion(i)} className="absolute top-2 right-2 text-red-400"><X size={20} /></button>

                                                {/* Question Text */}
                                                <div className="mb-3">
                                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.dashboard.question}</label>
                                                    <input className="border p-2 w-full rounded font-medium" value={q.text} onChange={e => updateQuestion(i, 'text', e.target.value)} placeholder="e.g. How was your food?"/>
                                                </div>

                                                {/* Question Type Toggle */}
                                                <div className="mb-4">
                                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.dashboard.answerType}</label>
                                                    <div className="flex gap-4">
                                                        <label className={`flex items-center gap-2 cursor-pointer p-2 rounded border ${q.type === 'choice' || !q.type ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' : 'bg-white border-gray-200'}`}>
                                                            <input type="radio" className="hidden" name={`qtype-${q.id}`} checked={q.type === 'choice' || !q.type} onChange={() => updateQuestion(i, 'type', 'choice')} />
                                                            <ListIcon size={16} className={q.type === 'choice' || !q.type ? 'text-indigo-600' : 'text-gray-400'}/>
                                                            <span className="text-sm">{t.dashboard.typeChoice}</span>
                                                        </label>
                                                        <label className={`flex items-center gap-2 cursor-pointer p-2 rounded border ${q.type === 'text' ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' : 'bg-white border-gray-200'}`}>
                                                            <input type="radio" className="hidden" name={`qtype-${q.id}`} checked={q.type === 'text'} onChange={() => updateQuestion(i, 'type', 'text')} />
                                                            <MessageSquare size={16} className={q.type === 'text' ? 'text-indigo-600' : 'text-gray-400'}/>
                                                            <span className="text-sm">{t.dashboard.typeText}</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Option Editor (Only for choice) */}
                                                {(q.type === 'choice' || !q.type) ? (
                                                    <div className="pl-4 space-y-2 border-l-2 border-indigo-100">
                                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t.dashboard.options}</label>

                                                        {q.options.map((opt, oIdx) => (
                                                            <div key={oIdx} className="flex gap-2 mb-2"><input className="border p-1 w-full text-sm rounded" value={opt} onChange={e => updateOption(i, oIdx, e.target.value)} /><button onClick={() => removeOption(i, oIdx)}><X size={14}/></button></div>
                                                        ))}

                                                        {/* Render "Other" as a fake option if enabled */}
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
                                        <button onClick={() => setEditingSurvey(null)} className="px-4 py-2 bg-gray-200 rounded">{t.common.cancel}</button>
                                        <button onClick={handleSaveSurvey} className="bg-green-600 text-white px-4 py-2 rounded">{t.common.save}</button>
                                    </div>

                                    {/* QR Code & Link Section */}
                                    {surveys.some(s => s.id === editingSurvey.id) && editingSurvey.id && (
                                        <div className="mt-8 pt-6 border-t bg-gray-50 -mx-6 -mb-6 p-6 rounded-b">
                                            <h4 className="font-bold mb-4 flex items-center gap-2"><QrCode size={18}/> {t.dashboard.customerAccess}</h4>

                                            <div className="flex flex-col md:flex-row gap-6">
                                                {/* QR Column */}
                                                <div className="flex flex-col items-center gap-2 bg-white p-4 rounded border shadow-sm">
                                                    <img src={getQrCodeUrl(editingSurvey.id)} alt="Survey QR" className="w-40 h-40 border rounded bg-white" />
                                                    <button
                                                        onClick={() => downloadQrCode(editingSurvey.id!)}
                                                        className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded flex items-center gap-2 w-full justify-center transition-colors"
                                                    >
                                                        <Download size={14} /> {t.dashboard.downloadQr}
                                                    </button>
                                                </div>

                                                {/* Link Column */}
                                                <div className="flex-1 space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-500 mb-1">{t.dashboard.directLink}</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                readOnly
                                                                value={getAppUrl(editingSurvey.id)}
                                                                className="flex-1 p-2 border rounded bg-white text-gray-600 text-sm font-mono"
                                                            />
                                                            <button
                                                                onClick={() => copyLink(editingSurvey.id!)}
                                                                className="bg-indigo-600 text-white px-4 rounded hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                                                title="Copy to Clipboard"
                                                            >
                                                                <Copy size={16} />
                                                            </button>
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
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {surveys.map(s => (
                                    <div key={s.id} className="bg-white p-4 rounded border flex justify-between items-center shadow-sm">
                                        <div>
                                            <div className="font-bold text-lg flex items-center gap-2">
                                                {s.name}
                                                {isAdmin && (
                                                    <span className="text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                        {getMerchantName(s.merchant_id)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500">{s.questions.length} {t.customer.questionsCount}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setEditingSurvey(s)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Settings size={18} /></button>
                                            <button onClick={() => handleDeleteSurvey(s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'LOTTERIES' && (
                    <div>
                        <div className="flex justify-between mb-4">
                            <h2 className="text-2xl font-bold">{t.dashboard.tabLotteries} {isAdmin && t.dashboard.allRestaurants}</h2>
                            <button onClick={handleCreateLottery} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={18} /> {t.common.new}</button>
                        </div>
                        {editingLottery ? (
                            <div className="bg-white p-6 rounded shadow max-w-3xl">
                                {isAdmin && editingLottery.merchant_id && (
                                    <div className="text-xs font-mono bg-yellow-50 p-2 text-yellow-800 border border-yellow-200 rounded mb-4">
                                        {t.dashboard.owner}: {getMerchantName(editingLottery.merchant_id)}
                                    </div>
                                )}
                                <input className="border p-2 w-full mb-4 rounded" placeholder={t.dashboard.lotteryName} value={editingLottery.name} onChange={e => setEditingLottery({...editingLottery, name: e.target.value})} />
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm text-gray-500 mb-2"><span>{t.dashboard.prizes}</span><span>{t.dashboard.prob}</span></div>
                                    {editingLottery.prizes?.map((p, i) => (
                                        <div key={p.id} className="flex gap-2 mb-2">
                                            <input className="border p-2 flex-1 rounded" value={p.name} onChange={e => updatePrize(i, 'name', e.target.value)}/>
                                            <input className="border p-2 w-24 rounded" type="number" value={p.probability} onChange={e => updatePrize(i, 'probability', parseFloat(e.target.value))}/>
                                            <button onClick={() => { const np = [...(editingLottery.prizes||[])]; np.splice(i, 1); setEditingLottery({...editingLottery, prizes: np}); }} className="text-red-500"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                    <button onClick={addPrize} className="text-sm text-blue-500 mt-2 border border-blue-500 px-3 py-1 rounded">+ {t.dashboard.addPrize}</button>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingLottery(null)} className="px-4 py-2 bg-gray-200 rounded">{t.common.cancel}</button>
                                    <button onClick={handleSaveLottery} className="bg-green-600 text-white px-4 py-2 rounded">{t.common.save}</button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {lotteries.map(l => (
                                    <div key={l.id} className="bg-white p-4 rounded border shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-lg flex items-center gap-2">
                                                    {l.name}
                                                    {isAdmin && (
                                                        <span className="text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                            {getMerchantName(l.merchant_id)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">{l.prizes.length} {t.dashboard.prizes}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setEditingLottery(l)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Settings size={18} /></button>
                                                <button onClick={() => handleDeleteLottery(l.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'ANALYTICS' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">{t.dashboard.tabAnalytics}</h2>
                        <div className="flex gap-4 mb-6">
                            <select className="border p-2 rounded w-64" value={selectedAnalyticsSurvey} onChange={e => setSelectedAnalyticsSurvey(e.target.value)}>
                                <option value="">{t.dashboard.selectSurvey}</option>
                                {surveys.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} {isAdmin ? `(${getMerchantName(s.merchant_id)})` : ''}
                                    </option>
                                ))}
                            </select>
                            <button onClick={handleLoadAnalytics} disabled={!selectedAnalyticsSurvey} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:bg-gray-300">{t.dashboard.loadReport}</button>
                        </div>
                        {responses.length > 0 ? (
                            <div className="grid lg:grid-cols-2 gap-6">
                                <div className="col-span-full bg-blue-50 p-4 rounded text-blue-900">{t.dashboard.totalResponses}: <strong>{responses.length}</strong></div>
                                {surveys.find(s => s.id === selectedAnalyticsSurvey)?.questions.map(q => {
                                    // Analytics for Text type questions
                                    if (q.type === 'text') {
                                        const textAnswers = responses.map(r => r.answers[q.id]).filter(Boolean);
                                        return (
                                            <div key={q.id} className="bg-white p-4 rounded border shadow-sm lg:col-span-2">
                                                <h4 className="font-bold mb-4">{q.text}</h4>
                                                <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-50 p-2 rounded">
                                                    {textAnswers.length > 0 ? textAnswers.map((txt, i) => (
                                                        <div key={i} className="p-2 bg-white border rounded text-sm text-gray-700 italic">"{txt}"</div>
                                                    )) : <div className="text-gray-400 text-sm">{t.dashboard.noTextResponses}</div>}
                                                </div>
                                            </div>
                                        )
                                    }

                                    // Analytics for Choice type questions
                                    const data = q.options.map(opt => ({ name: opt, value: responses.filter(r => r.answers[q.id] === opt).length }));

                                    let otherResponses: string[] = [];
                                    if (q.allow_other) {
                                        otherResponses = responses
                                            .map(r => r.answers[q.id])
                                            .filter(ans => ans && !q.options.includes(ans));

                                        if (otherResponses.length > 0) {
                                            data.push({ name: 'Other', value: otherResponses.length });
                                        }
                                    }

                                    return (
                                        <div key={q.id} className="bg-white p-4 rounded border shadow-sm">
                                            <h4 className="font-bold mb-4">{q.text}</h4>
                                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({name, value}) => `${name}: ${value}`}>{data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>

                                            {otherResponses.length > 0 && (
                                                <div className="mt-4 pt-4 border-t">
                                                    <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">{t.dashboard.otherResponses}</h5>
                                                    <div className="max-h-32 overflow-y-auto space-y-1">
                                                        {otherResponses.map((txt, i) => (
                                                            <div key={i} className="text-xs bg-gray-50 p-1.5 rounded text-gray-700">{txt}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (<div className="text-gray-500">{t.dashboard.noData}</div>)}
                    </div>
                )}
            </main>
        </div>
    );
};