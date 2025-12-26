
import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Survey, SurveyResponse, UUID, Merchant } from '../../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { db } from '../../../services/api';
import { Sparkles, Loader2, Bot, Archive, AlertCircle, HelpCircle, Merge } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

interface AnalyticsTabProps {
    surveys: Survey[];
    isAdmin: boolean;
    isOwner?: boolean;
    ownedRestaurants?: Merchant[];
    getMerchantName: (id: UUID) => string;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ surveys, isAdmin, isOwner, ownedRestaurants, getMerchantName }) => {
    const { t, language } = useLanguage();
    const [selectedSurveyId, setSelectedSurveyId] = useState<UUID | ''>('');
    const [responses, setResponses] = useState<SurveyResponse[]>([]);

    // AI State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState<string | null>(null);

    const selectedSurvey = surveys.find(s => s.id === selectedSurveyId);

    // Create a Set of active IDs for fast lookup
    const activeQuestionIds = new Set(selectedSurvey ? selectedSurvey.questions.map(q => q.id) : []);

    const handleLoadAnalytics = async () => {
        if (!selectedSurveyId) return;
        setAiResult(null);
        try {
            const res = await db.getResponses(selectedSurveyId);
            setResponses(res);
        } catch (e) {
            alert(t.common.error);
        }
    };

    const handleAiAnalyze = async () => {
        if (!selectedSurveyId || !selectedSurvey || responses.length === 0) return;
        setIsAnalyzing(true);
        setAiResult(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            // Collect active data (including smart merged data essentially, represented by text)
            const activeData = selectedSurvey.questions.map(q => {
                // We use the same smart merge logic here to get full context
                let answers: string[] = [];
                responses.forEach(r => {
                    const direct = r.answers?.[q.id];
                    if (direct) answers.push(direct);

                    // Smart Merge for AI Context
                    Object.keys(r.answers || {}).forEach(key => {
                        if (key === q.id || activeQuestionIds.has(key)) return;
                        const val = r.answers[key];
                        if (q.type === 'choice' && q.options.includes(val)) answers.push(val);
                        if (q.type === 'multi' && val.split(', ').some(v => q.options.includes(v))) answers.push(val);
                    });
                });
                return `Question: ${q.text} (Type: ${q.type})\nAnswers: ${answers.join(' | ')}`;
            }).join('\n\n');

            const unlinked = getUnlinkedData();
            const unlinkedData = unlinked.map(u => `Historical Question (ID: ${u.id}): ${u.answers.join(' | ')}`).join('\n\n');

            const prompt = `
                You are a world-class restaurant business consultant. Analyze the following survey data for "${selectedSurvey.name}".
                
                DATA OVERVIEW:
                ${activeData}

                HISTORICAL CONTEXT (Old versions of questions):
                ${unlinkedData}
                
                Please provide your analysis in ${language === 'zh' ? 'Chinese' : 'English'} using Markdown format.
                
                Strictly follow this structure for your analysis:

                ### 1. User Persona & Growth Strategy (用户画像与增长策略)
                - **User Persona**: Analyze the main consumer demographics (e.g., dining purpose, group size, preferences) based on the answers.
                - **Growth Strategy**: Provide specific strategies on how to attract more consumers matching this persona.

                ### 2. Performance Diagnosis (经营表现深度诊断)
                *Combine Overall Satisfaction, Strengths, and Weaknesses here.*
                - **Overall Satisfaction**: Brief summary of the sentiment trend.
                - **Key Strengths**: What are customers happiest about?
                - **Critical Weaknesses**: (Focus heavily here) Deeply analyze the most complained points. Dig into the root causes based on the data.

                ### 3. Recommended New Survey Questions (建议新增的问卷问题)
                - Based on the "Critical Weaknesses" identified above, design **3 specific new questions** to include in the next survey.
                - The goal is to gather more complete feedback to solve the identified weaknesses.
                - Explain *why* each question is needed.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { temperature: 0.7 }
            });

            if (response.text) {
                setAiResult(response.text);
            } else {
                throw new Error("Empty response from AI");
            }

        } catch (e) {
            console.error("AI Analysis Error:", e);
            const errorMsg = e instanceof Error ? e.message : String(e);
            alert(`${t.common.error}: ${errorMsg}.`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Check if an orphan value was merged into ANY chart
    // If it matches options of ANY current choice question, we consider it "Merged" and hide it from the bottom list
    const isValueMerged = (val: string) => {
        if (!selectedSurvey) return false;
        for (const q of selectedSurvey.questions) {
            if (q.type === 'text') continue;
            if (q.options?.includes(val)) return true;
            if (q.type === 'multi') {
                const parts = val.split(', ');
                // If at least one part is recognized, we treat it as partially merged
                if (parts.some(p => q.options.includes(p))) return true;
            }
        }
        return false;
    };

    // Recover orphaned data that was NOT merged
    const getUnlinkedData = () => {
        if (!selectedSurvey || responses.length === 0) return [];

        const allResponseKeys = new Set<string>();
        responses.forEach(r => {
            if (r.answers) Object.keys(r.answers).forEach(k => allResponseKeys.add(k));
        });

        const deletedIds = Array.from(allResponseKeys).filter(id => !activeQuestionIds.has(id));

        return deletedIds.map(id => {
            const answers = responses
                .map(r => r.answers?.[id])
                .filter(ans => ans !== undefined && ans !== null && ans !== '')
                .filter(ans => !isValueMerged(ans)); // HIDE if it was merged to chart
            return { id, answers };
        }).filter(item => item.answers.length > 0);
    };

    const unlinkedData = getUnlinkedData();

    // Group surveys by merchant for Owner view
    const renderSurveyOptions = () => {
        if (!isOwner || !ownedRestaurants) {
            return surveys.map(s => (
                <option key={s.id} value={s.id}>
                    {s.name} {isAdmin ? `(${getMerchantName(s.merchant_id)})` : ''}
                </option>
            ));
        }

        // Grouping for Owner
        return ownedRestaurants.map(store => {
            const storeSurveys = surveys.filter(s => s.merchant_id === store.id);
            if (storeSurveys.length === 0) return null;
            return (
                <optgroup key={store.id} label={store.restaurant_name}>
                    {storeSurveys.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
            );
        });
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">{t.dashboard.tabAnalytics}</h2>
            <div className="flex flex-wrap gap-4 mb-6 items-end">
                <div className="flex-1 min-w-[200px]">
                    <select className="border p-2.5 rounded w-full bg-white shadow-sm" value={selectedSurveyId} onChange={e => { setSelectedSurveyId(e.target.value); setAiResult(null); }}>
                        <option value="">{t.dashboard.selectSurvey}</option>
                        {renderSurveyOptions()}
                    </select>
                </div>
                <button
                    onClick={handleLoadAnalytics}
                    disabled={!selectedSurveyId}
                    className="bg-gray-800 text-white px-6 py-2.5 rounded shadow hover:bg-gray-900 disabled:bg-gray-300 font-medium transition-colors"
                >
                    {t.dashboard.loadReport}
                </button>

                {responses.length > 0 && (
                    <button
                        onClick={handleAiAnalyze}
                        disabled={isAnalyzing || !selectedSurveyId}
                        className={`px-6 py-2.5 rounded shadow font-medium flex items-center gap-2 transition-all ${
                            isAnalyzing
                                ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105 active:scale-95'
                        }`}
                    >
                        {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                        {isAnalyzing ? t.dashboard.aiAnalyzing : t.dashboard.aiAnalyze}
                    </button>
                )}
            </div>

            {aiResult && (
                <div className="mb-8 bg-white border border-indigo-100 rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-indigo-100 flex items-center gap-3">
                        <div className="bg-white p-2 rounded-full shadow-sm">
                            <Bot className="text-indigo-600" size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-indigo-900">{t.dashboard.aiTitle}</h3>
                            <p className="text-xs text-indigo-600">{t.dashboard.aiDisclaimer}</p>
                        </div>
                    </div>
                    <div className="p-6 bg-white text-gray-700 leading-relaxed space-y-4">
                        <ReactMarkdown
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-indigo-900 mb-4 border-b pb-2" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-xl font-bold text-indigo-800 mt-6 mb-3" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-lg font-bold text-indigo-700 mt-4 mb-2" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 my-2" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1 my-2" {...props} />,
                                li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-indigo-900 bg-indigo-50 px-1 rounded" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-300 pl-4 italic text-gray-600 my-4" {...props} />,
                                p: ({node, ...props}) => <p className="mb-2" {...props} />
                            }}
                        >
                            {aiResult}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            {responses.length > 0 && selectedSurvey ? (
                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded text-blue-900 flex justify-between items-center border border-blue-100">
                        <span>{t.dashboard.totalResponses}: <strong>{responses.length}</strong></span>
                        <div className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-blue-200 text-blue-600">
                            <Merge size={14} />
                            <span>{t.dashboard.smartMergeActive}</span>
                        </div>
                    </div>

                    {/* Active Questions Loop */}
                    {selectedSurvey.questions.map(q => {
                        // Analytics for Text type questions
                        if (q.type === 'text') {
                            const textAnswers = responses.map(r => r.answers?.[q.id]).filter(Boolean);
                            return (
                                <div key={q.id} className="bg-white p-4 rounded border shadow-sm">
                                    <h4 className="font-bold mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-indigo-500 rounded"></div> {q.text}</h4>
                                    <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-50 p-2 rounded border border-gray-100">
                                        {textAnswers.length > 0 ? textAnswers.map((txt, i) => (
                                            <div key={i} className="p-3 bg-white border rounded text-sm text-gray-700 shadow-sm">"{txt}"</div>
                                        )) : <div className="text-gray-400 text-sm p-2">{t.dashboard.noTextResponses}</div>}
                                    </div>
                                </div>
                            )
                        }

                        // Analytics for Choice type questions (Smart Merge Implemented)
                        const allSelections: string[] = [];
                        let mergedCount = 0;

                        responses.forEach(r => {
                            // 1. Direct ID Match
                            const ans = r.answers?.[q.id];
                            if (ans && typeof ans === 'string') {
                                const split = ans.split(', ');
                                allSelections.push(...split);
                            }

                            // 2. Smart Merge (Orphan Recovery)
                            // Look for answers with OTHER keys (orphaned IDs)
                            Object.keys(r.answers || {}).forEach(key => {
                                if (key === q.id) return; // Already handled
                                if (activeQuestionIds.has(key)) return; // Belongs to another active question, don't steal it

                                const val = r.answers[key];
                                if (!val) return;

                                // If the orphan value matches an option in THIS question, count it!
                                if (q.type === 'multi') {
                                    const parts = val.split(', ');
                                    // Filter parts that match valid options for this question
                                    const matches = parts.filter(p => q.options.includes(p));
                                    if (matches.length > 0) {
                                        allSelections.push(...matches);
                                        mergedCount++;
                                    }
                                } else {
                                    // Single choice match
                                    if (q.options.includes(val)) {
                                        allSelections.push(val);
                                        mergedCount++;
                                    }
                                }
                            });
                        });

                        const data = q.options.map(opt => ({
                            name: opt,
                            value: allSelections.filter(sel => sel === opt).length
                        }));

                        let otherResponses: string[] = [];
                        if (q.allow_other) {
                            otherResponses = allSelections.filter(sel => sel && !q.options.includes(sel));
                            if (otherResponses.length > 0) {
                                data.push({ name: 'Other', value: otherResponses.length });
                            }
                        }

                        const totalVotes = data.reduce((acc, curr) => acc + curr.value, 0);

                        return (
                            <div key={q.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold flex items-center gap-2">
                                        <div className={`w-1 h-6 ${q.type === 'multi' ? 'bg-purple-500' : 'bg-indigo-500'} rounded`}></div>
                                        {q.text}
                                    </h4>
                                    {mergedCount > 0 && (
                                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1" title={`${mergedCount} ${t.dashboard.mergedTooltip}`}>
                                            <Merge size={10} /> +{mergedCount} {t.dashboard.mergedTag}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mb-6 uppercase font-bold tracking-wider">
                                    {q.type === 'multi' ? t.dashboard.typeMulti : t.dashboard.typeChoice}
                                </p>

                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="w-full h-48 md:h-56 md:w-1/2 relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                                                    {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <span className="text-2xl font-bold text-gray-700">{totalVotes}</span>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-1/2 space-y-2">
                                        {data.map((entry, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-100">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                                                    <span className="truncate text-gray-700 font-medium">{entry.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3 pl-2">
                                                    <span className="font-bold text-gray-900">{entry.value}</span>
                                                    <span className="text-xs text-gray-500 w-10 text-right">{totalVotes > 0 ? (entry.value / totalVotes * 100).toFixed(1) : '0.0'}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* RESTORED: Unlinked / Historical Data Section (Only shows truly lost data now) */}
                    {unlinkedData.length > 0 && (
                        <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-300">
                            <div className="flex items-center gap-2 mb-4 text-gray-600">
                                <Archive size={20} />
                                <h3 className="font-bold text-lg">{t.dashboard.unlinkedTitle}</h3>
                            </div>

                            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm flex gap-3 items-start mb-6 border border-yellow-200">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-600" />
                                <div>
                                    <p className="font-bold mb-1">{t.dashboard.dataDisclaimer}</p>
                                    <p>{t.dashboard.dataDisclaimerDesc}</p>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {unlinkedData.map((item) => (
                                    <div key={item.id} className="bg-gray-100 p-4 rounded border border-gray-300 relative group">
                                        <div className="absolute top-2 right-2 text-gray-400 group-hover:text-gray-600 cursor-help" title={`Original Question ID: ${item.id}`}>
                                            <HelpCircle size={16} />
                                        </div>
                                        <h4 className="font-bold text-gray-500 mb-3 text-sm uppercase tracking-wide">{t.dashboard.orphanedResponses}</h4>
                                        <div className="max-h-48 overflow-y-auto space-y-2 bg-white p-2 rounded border border-gray-200">
                                            {item.answers.map((ans, i) => (
                                                <div key={i} className="p-2 border-b border-gray-100 last:border-0 text-sm text-gray-700">
                                                    {String(ans)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            ) : (<div className="text-gray-500 text-center py-10 bg-gray-50 rounded border border-dashed">{t.dashboard.noData}</div>)}
        </div>
    );
};