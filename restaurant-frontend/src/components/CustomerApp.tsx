import React, { useState, useEffect } from 'react';
import { db } from '../services/api';
import type { Survey, Lottery, Prize, Merchant } from '../types';
import { Gift, CheckCircle, Store, Play, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CustomerAppProps {
    onBack: () => void;
    preselectedMerchantId?: string | null;
    preselectedSurveyId?: string | null;
}

const generateUUID = () => crypto.randomUUID();
const WHEEL_COLORS = ['#EEF2FF', '#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1'];

export const CustomerApp: React.FC<CustomerAppProps> = ({ onBack, preselectedMerchantId, preselectedSurveyId }) => {
    const { t } = useLanguage();
    // New Step: SURVEY_SELECT for when there are multiple surveys
    const [step, setStep] = useState<'MERCHANT_SELECT' | 'SURVEY_SELECT' | 'SURVEY' | 'LOTTERY' | 'RESULT'>('MERCHANT_SELECT');

    // Data
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [merchantSurveys, setMerchantSurveys] = useState<Survey[]>([]);
    const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
    const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);

    // State
    const [customerId] = useState(generateUUID());
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    // Lottery State
    const [linkedLottery, setLinkedLottery] = useState<Lottery | null>(null);
    const [wonPrize, setWonPrize] = useState<Prize | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);

    // Logic to select a merchant and determine which survey to show
    const selectMerchantAndLoadData = async (merchant: Merchant, specificSurveyId?: string | null) => {
        setSelectedMerchant(merchant);
        setLoading(true);
        try {
            // Fetch ALL surveys for this merchant
            const surveys = await db.getSurveys(merchant.id);
            setMerchantSurveys(surveys);

            if (specificSurveyId) {
                // Scenario A: Direct link to specific survey (QR code)
                const target = surveys.find(s => s.id === specificSurveyId);
                if (target) {
                    setActiveSurvey(target);
                    setStep('SURVEY');
                } else {
                    alert("The specific survey you scanned was not found. Please choose from the list.");
                    if (surveys.length > 0) setStep('SURVEY_SELECT');
                    else alert("This restaurant has no surveys available.");
                }
            } else {
                // Scenario B: Selected restaurant from list, or QR code only had merchant_id
                if (surveys.length === 0) {
                    alert(`Welcome to ${merchant.restaurant_name}. There are no active surveys right now.`);
                } else if (surveys.length === 1) {
                    // Auto-select if only one exists
                    setActiveSurvey(surveys[0]);
                    setStep('SURVEY');
                } else {
                    // Multiple surveys, let user choose
                    setStep('SURVEY_SELECT');
                }
            }
        } catch (e) {
            console.error(e);
            alert("Failed to load surveys. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Load merchants on mount
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // 1. Get List of Merchants
                const list = await db.getMerchants();
                setMerchants(list);

                // 2. Check if we have a preselected merchant from URL/QR
                if (preselectedMerchantId) {
                    const matched = list.find(m => m.id === preselectedMerchantId);
                    if (matched) {
                        // Automatically select it and try to load specific survey if present
                        await selectMerchantAndLoadData(matched, preselectedSurveyId);
                    } else {
                        console.warn("Preselected merchant not found in database list");
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [preselectedMerchantId, preselectedSurveyId]);

    const handleOptionSelect = (questionId: string, option: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleTextChange = (questionId: string, text: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: text }));
    };

    const handleSurveySelect = (survey: Survey) => {
        setActiveSurvey(survey);
        setStep('SURVEY');
    }

    const handleSubmitSurvey = async () => {
        if (!activeSurvey || !selectedMerchant) return;

        try {
            const responsePayload = {
                id: generateUUID(),
                survey_id: activeSurvey.id,
                customer_id: customerId,
                answers,
                submitted_at: new Date().toISOString()
            };

            const result = await db.saveResponse(responsePayload);

            setWonPrize(result.prize);

            if (activeSurvey.lottery_id) {
                const lotteries = await db.getLotteries(selectedMerchant.id);
                const lot = lotteries.find(l => l.id === activeSurvey.lottery_id);

                if (lot && lot.prizes.length > 0) {
                    setLinkedLottery(lot);
                    setStep('LOTTERY');
                    return;
                }
            }

            setStep('RESULT');
        } catch (e) {
            console.error(e);
            alert("Failed to submit survey.");
        }
    };

    const spinWheel = () => {
        if (!linkedLottery || isSpinning) return;
        setIsSpinning(true);

        let prizeIndex = -1;
        if (wonPrize) {
            prizeIndex = linkedLottery.prizes.findIndex(p => p.name === wonPrize.name);
        }
        if (prizeIndex === -1) prizeIndex = linkedLottery.prizes.length - 1;

        const segments = linkedLottery.prizes.length;
        const segmentAngle = 360 / segments;
        const baseRotation = 360 * 5;
        const targetAngle = baseRotation + (360 - (prizeIndex * segmentAngle)) - (segmentAngle / 2);

        setRotation(targetAngle);

        setTimeout(() => {
            setIsSpinning(false);
            setStep('RESULT');
        }, 3500);
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-indigo-600 font-bold">{t.common.loading}</div>;

    // --- Step 0: Select Restaurant ---
    if (step === 'MERCHANT_SELECT') {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
                <div className="max-w-md mx-auto">
                    <button onClick={onBack} className="mb-6 text-gray-500 hover:text-gray-800 font-medium flex items-center gap-1">← {t.common.back}</button>
                    <div className="text-center mb-8">
                        <Store className="w-16 h-16 text-indigo-600 mx-auto mb-4"/>
                        <h2 className="text-3xl font-extrabold text-gray-900">{t.customer.selectRestaurant}</h2>
                        <p className="text-gray-500 mt-2">{t.customer.whereDining}</p>
                    </div>

                    <div className="space-y-4">
                        {merchants.length === 0 && <div className="text-center text-gray-400">{t.customer.noRestaurants}</div>}
                        {merchants.map(m => (
                            <div
                                key={m.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-indigo-300 transition-all flex items-center justify-between group cursor-pointer"
                                onClick={() => selectMerchantAndLoadData(m)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-50 p-3 rounded-full text-indigo-600 font-bold">
                                        {m.restaurant_name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-lg text-gray-800 group-hover:text-indigo-600">{m.restaurant_name}</span>
                                </div>

                                <button
                                    className="bg-gray-100 text-gray-600 p-2 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent double trigger
                                        selectMerchantAndLoadData(m);
                                    }}
                                >
                                    <Play size={16} fill="currentColor" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // --- Step 0.5: Select Survey (if multiple) ---
    if (step === 'SURVEY_SELECT') {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
                <div className="max-w-md mx-auto">
                    <button onClick={() => setStep('MERCHANT_SELECT')} className="mb-6 text-gray-500 hover:text-gray-800 font-medium flex items-center gap-1">← {t.customer.chooseDifferent}</button>
                    <div className="text-center mb-8">
                        <FileText className="w-16 h-16 text-indigo-600 mx-auto mb-4"/>
                        <h2 className="text-3xl font-extrabold text-gray-900">{t.customer.selectSurvey}</h2>
                        <p className="text-gray-500 mt-2">{selectedMerchant?.restaurant_name} {t.customer.multipleSurveys}</p>
                    </div>

                    <div className="space-y-4">
                        {merchantSurveys.map(s => (
                            <div
                                key={s.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                                onClick={() => handleSurveySelect(s)}
                            >
                                <h3 className="font-bold text-xl text-gray-800 group-hover:text-indigo-600 mb-1">{s.name}</h3>
                                <p className="text-gray-500 text-sm">{s.questions.length} {t.customer.questionsCount}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // --- Step 1: Survey ---
    if (step === 'SURVEY') {
        if (!activeSurvey) return <div>Error loading survey.</div>;

        const allAnswered = activeSurvey.questions.every(q => !!answers[q.id]);

        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 border border-gray-100">
                        <button onClick={() => setStep('MERCHANT_SELECT')} className="text-sm text-gray-400 hover:text-gray-600 mb-4">← {t.customer.backStart}</button>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{activeSurvey.name}</h2>
                        <p className="text-gray-500">at {selectedMerchant?.restaurant_name}</p>
                    </div>

                    <div className="space-y-6">
                        {activeSurvey.questions.map((q, idx) => (
                            <div key={q.id} className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">{idx + 1}. {q.text}</h3>

                                {q.type === 'text' ? (
                                    <textarea
                                        rows={4}
                                        className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none bg-gray-50 focus:bg-white"
                                        placeholder={t.customer.typeAnswer}
                                        value={answers[q.id] || ''}
                                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {q.options.map((opt) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => handleOptionSelect(q.id, opt)}
                                                    className={`p-4 rounded-xl text-left border-2 transition-all ${
                                                        answers[q.id] === opt
                                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                            : 'border-transparent bg-gray-50 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <div className="flex justify-between">
                                                        <span>{opt}</span>
                                                        {answers[q.id] === opt && <CheckCircle className="w-5 h-5" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        {/* "Other" Option Rendering */}
                                        {q.allow_other && (
                                            <div
                                                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                                                    (answers[q.id] !== undefined && !q.options.includes(answers[q.id]))
                                                        ? 'border-indigo-600 bg-indigo-50'
                                                        : 'border-transparent bg-gray-50'
                                                }`}
                                            >
                                                {(answers[q.id] !== undefined && !q.options.includes(answers[q.id])) ? (
                                                    <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                                )}
                                                <input
                                                    type="text"
                                                    placeholder={t.customer.otherSpecify}
                                                    className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                                                    value={(!q.options.includes(answers[q.id])) ? answers[q.id] || '' : ''}
                                                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                                                    onFocus={() => {
                                                        // Ensure 'Other' is visibly selected when typing starts, even if empty initially
                                                        if (answers[q.id] === undefined || q.options.includes(answers[q.id])) {
                                                            handleTextChange(q.id, '');
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 pb-20">
                        <button
                            onClick={handleSubmitSurvey}
                            disabled={!allAnswered}
                            className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${
                                allAnswered ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'
                            }`}
                        >
                            {allAnswered ? t.customer.submitNext : t.customer.pleaseAnswer}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Step 2: Lottery Wheel ---
    if (step === 'LOTTERY' && linkedLottery) {
        // ... (Wheel logic same as before)
        const prizes = linkedLottery.prizes;
        const radius = 150; const center = 150;
        let currentAngle = 0;
        const segments = prizes.map((prize, i) => {
            const sliceAngle = 360 / prizes.length;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            const x1 = center + radius * Math.cos(Math.PI * startAngle / 180);
            const y1 = center + radius * Math.sin(Math.PI * startAngle / 180);
            const x2 = center + radius * Math.cos(Math.PI * endAngle / 180);
            const y2 = center + radius * Math.sin(Math.PI * endAngle / 180);
            const largeArcFlag = sliceAngle > 180 ? 1 : 0;
            const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
            currentAngle += sliceAngle;
            return (
                <g key={prize.id}>
                    <path d={pathData} fill={WHEEL_COLORS[i % WHEEL_COLORS.length]} stroke="white" strokeWidth="2" />
                    <text
                        x={center + (radius * 0.65) * Math.cos(Math.PI * (startAngle + sliceAngle/2) / 180)}
                        y={center + (radius * 0.65) * Math.sin(Math.PI * (startAngle + sliceAngle/2) / 180)}
                        fill="#4F46E5" fontSize="10" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle"
                        transform={`rotate(${startAngle + sliceAngle/2}, ${center + (radius * 0.65) * Math.cos(Math.PI * (startAngle + sliceAngle/2) / 180)}, ${center + (radius * 0.65) * Math.sin(Math.PI * (startAngle + sliceAngle/2) / 180)})`}
                    >
                        {prize.name.substring(0, 12)}
                    </text>
                </g>
            );
        });

        return (
            <div className="min-h-screen bg-indigo-900 flex flex-col items-center justify-center p-4 overflow-hidden relative">
                <div className="relative z-10">
                    <div className="relative w-[320px] h-[320px] rounded-full border-8 border-white shadow-2xl bg-white overflow-hidden">
                        <svg viewBox="0 0 300 300" className="w-full h-full" style={{ transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'transform 3.5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none' }}>
                            {segments}
                        </svg>
                    </div>
                    <div className="absolute top-1/2 right-[-20px] transform -translate-y-1/2 rotate-90 z-20">
                        <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[30px] border-b-yellow-400 drop-shadow-md"></div>
                    </div>
                </div>
                <button onClick={spinWheel} disabled={isSpinning} className={`mt-12 py-4 px-12 rounded-full font-bold text-xl shadow-xl transition-all transform ${isSpinning ? 'bg-gray-500 cursor-default' : 'bg-yellow-400 hover:scale-105'}`}>
                    {isSpinning ? t.customer.goodLuck : t.customer.spinNow}
                </button>
            </div>
        );
    }

    // --- Step 3: Result ---
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 text-center">
            <div className="max-w-md w-full">
                <div className="flex justify-center mb-6">
                    {wonPrize ? <Gift className="w-20 h-20 text-yellow-500" /> : <CheckCircle className="w-20 h-20 text-gray-300" />}
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{wonPrize ? t.customer.congrats : t.customer.thankYou}</h2>
                <p className="text-xl text-indigo-600 font-bold mb-8">{wonPrize ? `${t.customer.wonMsg} ${wonPrize.name}` : t.customer.noWinMsg}</p>
                <button onClick={onBack} className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold">{t.customer.backHome}</button>
            </div>
        </div>
    );
};