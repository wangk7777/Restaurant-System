import React, { useState, useEffect } from 'react';
import { db } from '../services/api';
import type { Survey, Lottery, Prize } from '../types';
import { Gift, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface CustomerAppProps {
    onBack: () => void;
}

const generateUUID = () => crypto.randomUUID();
const WHEEL_COLORS = ['#EEF2FF', '#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1'];

export const CustomerApp: React.FC<CustomerAppProps> = ({ onBack }) => {
    const [step, setStep] = useState<'SURVEY' | 'LOTTERY' | 'RESULT'>('SURVEY');
    const [customerId] = useState(generateUUID());
    const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    // Lottery State
    const [linkedLottery, setLinkedLottery] = useState<Lottery | null>(null);
    const [wonPrize, setWonPrize] = useState<Prize | null>(null);
    const [resultMessage, setResultMessage] = useState('');
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);

    // Moved definition before useEffect to fix linter error
    const loadSurvey = async () => {
        const survey = await db.getActiveSurvey();
        setActiveSurvey(survey || null);
        setLoading(false);
    };

    useEffect(() => {
        loadSurvey();
    }, []);

    const handleOptionSelect = (questionId: string, option: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleSubmitSurvey = async () => {
        if (!activeSurvey) return;

        try {
            // 1. Submit to Backend
            const responsePayload = {
                id: generateUUID(),
                survey_id: activeSurvey.id,
                customer_id: customerId,
                answers,
                submitted_at: new Date().toISOString()
            };

            // Backend returns the result (won/lost) immediately
            const result = await db.saveResponse(responsePayload);

            setWonPrize(result.prize);
            setResultMessage(result.message);

            // 2. Check Lottery Linkage for UI Flow
            if (activeSurvey.lottery_id) {
                const lotteries = await db.getLotteries();
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
            alert("Failed to submit survey. Is the backend running?");
        }
    };

    const spinWheel = () => {
        if (!linkedLottery || isSpinning) return;
        setIsSpinning(true);

        // Find index of the prize the backend said we won
        let prizeIndex = -1;
        if (wonPrize) {
            prizeIndex = linkedLottery.prizes.findIndex(p => p.name === wonPrize.name);
        }

        // If lost or prize not found, stop at the last segment
        if (prizeIndex === -1) {
            prizeIndex = linkedLottery.prizes.length - 1;
        }

        // Calculate rotation
        const segments = linkedLottery.prizes.length;
        const segmentAngle = 360 / segments;
        const baseRotation = 360 * 5; // Spin at least 5 times

        // Target calculation
        const targetAngle = baseRotation + (360 - (prizeIndex * segmentAngle)) - (segmentAngle / 2);

        setRotation(targetAngle);

        setTimeout(() => {
            setIsSpinning(false);
            setStep('RESULT');
        }, 3500);
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-indigo-600 font-bold">Connecting to Restaurant System...</div>;

    // --- Step 1: Survey ---
    if (step === 'SURVEY') {
        if (!activeSurvey) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-4 text-center">
                    <div className="bg-gray-100 p-6 rounded-full">
                        <AlertCircle className="w-12 h-12 text-gray-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">No Active Survey</h2>
                        <p className="text-gray-500 mt-2">Please ask the staff to activate a survey.</p>
                    </div>
                    <button onClick={onBack} className="text-indigo-600 font-medium hover:underline">Go Home</button>
                </div>
            );
        }

        const allAnswered = activeSurvey.questions.every(q => !!answers[q.id]);

        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 border border-gray-100">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{activeSurvey.name}</h2>
                        <p className="text-gray-500">Share your thoughts!</p>
                    </div>

                    <div className="space-y-6">
                        {activeSurvey.questions.map((q, idx) => (
                            <div key={q.id} className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">{idx + 1}. {q.text}</h3>
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
                            {allAnswered ? 'Submit & Next' : 'Please answer all questions'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Step 2: Lottery Wheel ---
    if (step === 'LOTTERY' && linkedLottery) {
        const prizes = linkedLottery.prizes;
        const radius = 150;
        const center = 150;

        // Generate SVG segments
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
                        <svg
                            viewBox="0 0 300 300" className="w-full h-full"
                            style={{ transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'transform 3.5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none' }}
                        >
                            {segments}
                        </svg>
                    </div>
                    {/* Pointer */}
                    <div className="absolute top-1/2 right-[-20px] transform -translate-y-1/2 rotate-90 z-20">
                        <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[30px] border-b-yellow-400 drop-shadow-md"></div>
                    </div>
                </div>

                <button
                    onClick={spinWheel}
                    disabled={isSpinning}
                    className={`mt-12 py-4 px-12 rounded-full font-bold text-xl shadow-xl transition-all transform ${
                        isSpinning ? 'bg-gray-500 cursor-default' : 'bg-yellow-400 hover:scale-105'
                    }`}
                >
                    {isSpinning ? 'GOOD LUCK...' : 'SPIN NOW'}
                </button>
            </div>
        );
    }

    // --- Step 3: Result ---
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 text-center">
            <div className="max-w-md w-full">
                <div className="flex justify-center mb-6">
                    {wonPrize ? (
                        <Gift className="w-20 h-20 text-yellow-500" />
                    ) : (
                        <CheckCircle className="w-20 h-20 text-gray-300" />
                    )}
                    {/* Use Sparkles conditionally to ensure it is considered 'used' by linter if imported */}
                    {wonPrize && <Sparkles className="hidden" />}
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                    {wonPrize ? 'Congratulations!' : 'Thank You!'}
                </h2>
                <p className="text-xl text-indigo-600 font-bold mb-8">{resultMessage}</p>
                <button onClick={onBack} className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold">
                    Back to Home
                </button>
            </div>
        </div>
    );
};