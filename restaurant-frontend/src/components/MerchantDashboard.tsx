import React, { useState, useEffect } from 'react';
import { db } from '../services/api';
import type { Survey, Lottery, Prize, Question, SurveyResponse, UUID } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Plus, Trash2, BarChart2, Settings, FileText, Gift, LogOut, Save } from 'lucide-react';

interface MerchantDashboardProps { onLogout: () => void; }
const generateUUID = () => crypto.randomUUID();
const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<'SURVEYS' | 'LOTTERIES' | 'ANALYTICS'>('SURVEYS');
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [lotteries, setLotteries] = useState<Lottery[]>([]);

    // Forms
    const [editingSurvey, setEditingSurvey] = useState<Partial<Survey> | null>(null);
    const [editingLottery, setEditingLottery] = useState<Partial<Lottery> | null>(null);

    // Analytics
    const [selectedAnalyticsSurvey, setSelectedAnalyticsSurvey] = useState<UUID | ''>('');
    const [responses, setResponses] = useState<SurveyResponse[]>([]);

    // Moved definition before useEffect
    const refreshData = async () => {
        try {
            const s = await db.getSurveys();
            const l = await db.getLotteries();
            setSurveys(s);
            setLotteries(l);
        } catch (e) {
            console.error("Failed to load data. Is backend running?", e);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleCreateSurvey = () => {
        setEditingSurvey({
            id: generateUUID(),
            name: '',
            active: false,
            lottery_id: null,
            questions: [],
            created_at: new Date().toISOString()
        });
    };

    const handleSaveSurvey = async () => {
        if (!editingSurvey?.name) return;

        // Check if we are updating an existing survey (ID exists in current list)
        // Note: When creating new, we generate a random UUID which won't be in the list yet
        const isUpdate = surveys.some(s => s.id === editingSurvey.id);

        await db.saveSurvey(editingSurvey as Survey, isUpdate);
        setEditingSurvey(null);
        refreshData();
    };

    const addQuestion = () => {
        const q: Question = { id: generateUUID(), text: '', options: ['Option A', 'Option B'] };
        setEditingSurvey({ ...editingSurvey, questions: [...(editingSurvey?.questions || []), q] });
    };

    // Fixed explicit any types
    const updateQuestion = (idx: number, field: string, val: string) => {
        if (!editingSurvey?.questions) return;
        const qs = [...editingSurvey.questions];
        (qs[idx] as any)[field] = val;
        setEditingSurvey({ ...editingSurvey, questions: qs });
    };

    const updateOption = (qIdx: number, oIdx: number, val: string) => {
        if (!editingSurvey?.questions) return;
        const qs = [...editingSurvey.questions];
        qs[qIdx].options[oIdx] = val;
        setEditingSurvey({ ...editingSurvey, questions: qs });
    };

    const addOption = (qIdx: number) => {
        if (!editingSurvey?.questions) return;
        const qs = [...editingSurvey.questions];
        qs[qIdx].options.push('New Option');
        setEditingSurvey({ ...editingSurvey, questions: qs });
    };

    const handleCreateLottery = () => {
        setEditingLottery({ id: generateUUID(), name: '', prizes: [] });
    };

    const handleSaveLottery = async () => {
        if (!editingLottery?.name) return;

        // Check if updating
        const isUpdate = lotteries.some(l => l.id === editingLottery.id);

        await db.saveLottery(editingLottery as Lottery, isUpdate);
        setEditingLottery(null);
        refreshData();
    };

    const addPrize = () => {
        const p: Prize = { id: generateUUID(), name: '', probability: 0 };
        setEditingLottery({ ...editingLottery, prizes: [...(editingLottery?.prizes || []), p] });
    };

    // Fixed explicit any types
    const updatePrize = (idx: number, field: string, val: string | number) => {
        if (!editingLottery?.prizes) return;
        const pz = [...editingLottery.prizes];
        (pz[idx] as any)[field] = val;
        setEditingLottery({ ...editingLottery, prizes: pz });
    };

    const handleLoadAnalytics = async () => {
        if (!selectedAnalyticsSurvey) return;
        const res = await db.getResponses(selectedAnalyticsSurvey);
        setResponses(res);
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col">
                <h1 className="text-xl font-bold mb-8">MERCHANT<span className="text-indigo-400">HUB</span></h1>
                <nav className="space-y-4 flex-1">
                    <button onClick={() => setActiveTab('SURVEYS')} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'SURVEYS' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                        <FileText size={18} /> Surveys
                    </button>
                    <button onClick={() => setActiveTab('LOTTERIES')} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'LOTTERIES' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                        <Gift size={18} /> Lotteries
                    </button>
                    <button onClick={() => setActiveTab('ANALYTICS')} className={`flex items-center gap-3 w-full text-left p-2 rounded ${activeTab === 'ANALYTICS' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
                        <BarChart2 size={18} /> Analytics
                    </button>
                </nav>
                <button onClick={onLogout} className="flex items-center gap-3 text-red-400 mt-8 hover:text-red-300">
                    <LogOut size={18} /> Sign Out
                </button>
            </aside>
            <main className="flex-1 p-8 overflow-auto">
                {activeTab === 'SURVEYS' && (
                    <div>
                        <div className="flex justify-between mb-4">
                            <h2 className="text-2xl font-bold">Surveys</h2>
                            <button onClick={handleCreateSurvey} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2">
                                <Plus size={18} /> New
                            </button>
                        </div>
                        {editingSurvey ? (
                            <div className="bg-white p-6 rounded shadow max-w-3xl">
                                <input className="border p-2 w-full mb-4 rounded" placeholder="Survey Name" value={editingSurvey.name} onChange={e => setEditingSurvey({...editingSurvey, name: e.target.value})} />
                                <label className="flex gap-2 items-center mb-4">
                                    <input type="checkbox" checked={editingSurvey.active} onChange={e => setEditingSurvey({...editingSurvey, active: e.target.checked})} />
                                    Set Active
                                </label>
                                <label className="block text-sm text-gray-600 mb-1">Linked Lottery</label>
                                <select className="border p-2 w-full mb-4 rounded" value={editingSurvey.lottery_id || ''} onChange={e => setEditingSurvey({...editingSurvey, lottery_id: e.target.value || null})}>
                                    <option value="">No Lottery</option>
                                    {lotteries.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>

                                <div className="mb-4">
                                    <h4 className="font-bold mb-2">Questions</h4>
                                    {editingSurvey.questions?.map((q, i) => (
                                        <div key={q.id} className="mb-4 border p-4 rounded bg-gray-50">
                                            <input className="border p-1 w-full mb-2 rounded" value={q.text} onChange={e => updateQuestion(i, 'text', e.target.value)} placeholder="Question text"/>
                                            <div className="pl-4">
                                                {q.options.map((opt, oIdx) => (
                                                    <input key={oIdx} className="border p-1 w-full mb-1 rounded text-sm" value={opt} onChange={e => updateOption(i, oIdx, e.target.value)} />
                                                ))}
                                                <button onClick={() => addOption(i)} className="text-xs text-indigo-600">+ Add Option</button>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={addQuestion} className="text-sm text-blue-500 mt-2 border border-blue-500 px-3 py-1 rounded hover:bg-blue-50">+ Add Question</button>
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setEditingSurvey(null)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                                    <button onClick={handleSaveSurvey} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
                                        <Save size={18}/> Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {surveys.map(s => (
                                    <div key={s.id} className="bg-white p-4 rounded border flex justify-between items-center shadow-sm">
                                        <div>
                                            <div className="font-bold text-lg">{s.name}</div>
                                            <div className="text-sm text-gray-500">{s.questions.length} questions</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {s.active && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Active</span>}
                                            <button onClick={() => setEditingSurvey(s)} className="text-blue-500 hover:bg-blue-50 p-2 rounded">
                                                <Settings size={18} />
                                            </button>
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
                            <h2 className="text-2xl font-bold">Lotteries</h2>
                            <button onClick={handleCreateLottery} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2">
                                <Plus size={18} /> New
                            </button>
                        </div>
                        {editingLottery ? (
                            <div className="bg-white p-6 rounded shadow max-w-3xl">
                                <input className="border p-2 w-full mb-4 rounded" placeholder="Lottery Name" value={editingLottery.name} onChange={e => setEditingLottery({...editingLottery, name: e.target.value})} />
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                                        <span>Prizes</span>
                                        <span>Probability %</span>
                                    </div>
                                    {editingLottery.prizes?.map((p, i) => (
                                        <div key={p.id} className="flex gap-2 mb-2">
                                            <input className="border p-2 flex-1 rounded" placeholder="Prize Name" value={p.name} onChange={e => updatePrize(i, 'name', e.target.value)}/>
                                            <input className="border p-2 w-24 rounded" type="number" placeholder="%" value={p.probability} onChange={e => updatePrize(i, 'probability', parseFloat(e.target.value))}/>
                                            <button onClick={() => {
                                                const newPrizes = [...(editingLottery.prizes || [])];
                                                newPrizes.splice(i, 1);
                                                setEditingLottery({...editingLottery, prizes: newPrizes});
                                            }} className="text-red-500 p-2"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                    <button onClick={addPrize} className="text-sm text-blue-500 mt-2 border border-blue-500 px-3 py-1 rounded hover:bg-blue-50">+ Add Prize</button>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setEditingLottery(null)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                                    <button onClick={handleSaveLottery} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
                                        <Save size={18} /> Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {lotteries.map(l => (
                                    <div key={l.id} className="bg-white p-4 rounded border shadow-sm">
                                        <div className="flex justify-between">
                                            <div className="font-bold text-lg">{l.name}</div>
                                            <button onClick={() => setEditingLottery(l)} className="text-blue-500">
                                                <Settings size={18} />
                                            </button>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-2">{l.prizes.length} Prizes</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'ANALYTICS' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Analytics</h2>
                        <div className="flex gap-4 mb-6">
                            <select className="border p-2 rounded w-64" value={selectedAnalyticsSurvey} onChange={e => setSelectedAnalyticsSurvey(e.target.value)}>
                                <option value="">Select Survey</option>
                                {surveys.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <button onClick={handleLoadAnalytics} disabled={!selectedAnalyticsSurvey} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:bg-gray-300">Load Report</button>
                        </div>

                        {responses.length > 0 ? (
                            <div className="grid lg:grid-cols-2 gap-6">
                                <div className="col-span-full bg-blue-50 p-4 rounded text-blue-900">
                                    Total Responses: <strong>{responses.length}</strong>
                                </div>
                                {surveys.find(s => s.id === selectedAnalyticsSurvey)?.questions.map(q => {
                                    const data = q.options.map(opt => ({
                                        name: opt,
                                        value: responses.filter(r => r.answers[q.id] === opt).length
                                    }));
                                    return (
                                        <div key={q.id} className="bg-white p-4 rounded border shadow-sm">
                                            <h4 className="font-bold mb-4">{q.text}</h4>
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={data} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({name, value}) => `${name}: ${value}`}>
                                                            {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-gray-500">Select a survey and click load to see data.</div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};