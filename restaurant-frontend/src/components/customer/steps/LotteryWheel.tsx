
import React, { useState} from 'react';
import type { Lottery, Prize } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface LotteryWheelProps {
    lottery: Lottery;
    wonPrize: Prize | null;
    onComplete: () => void;
}

const WHEEL_COLORS = ['#EEF2FF', '#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1'];

export const LotteryWheel: React.FC<LotteryWheelProps> = ({ lottery, wonPrize, onComplete }) => {
    const { t } = useLanguage();
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);

    const spinWheel = () => {
        if (isSpinning) return;
        setIsSpinning(true);

        let prizeIndex = -1;
        if (wonPrize) {
            prizeIndex = lottery.prizes.findIndex(p => p.name === wonPrize.name);
        }
        // Fallback if not found (shouldn't happen) or no win, randomish safe spot or last
        if (prizeIndex === -1) prizeIndex = lottery.prizes.length - 1;

        const segmentsCount = lottery.prizes.length;
        const segmentAngle = 360 / segmentsCount;
        const baseRotation = 360 * 5; // Spin 5 times at least
        // Calculate angle to land on the center of the segment
        const targetAngle = baseRotation + (360 - (prizeIndex * segmentAngle)) - (segmentAngle / 2);

        setRotation(targetAngle);

        setTimeout(() => {
            setIsSpinning(false);
            onComplete();
        }, 3500); // Animation duration
    };

    // SVG Construction
    const prizes = lottery.prizes;
    const radius = 150;
    const center = 150;
    let currentAngle = 0;

    const segments = prizes.map((prize, i) => {
        const sliceAngle = 360 / prizes.length;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;

        // Trig to find coords
        const x1 = center + radius * Math.cos(Math.PI * startAngle / 180);
        const y1 = center + radius * Math.sin(Math.PI * startAngle / 180);
        const x2 = center + radius * Math.cos(Math.PI * endAngle / 180);
        const y2 = center + radius * Math.sin(Math.PI * endAngle / 180);

        const largeArcFlag = sliceAngle > 180 ? 1 : 0;
        const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

        // Text positioning
        const textAngle = startAngle + sliceAngle / 2;
        const textRadius = radius * 0.65;
        const textX = center + textRadius * Math.cos(Math.PI * textAngle / 180);
        const textY = center + textRadius * Math.sin(Math.PI * textAngle / 180);

        currentAngle += sliceAngle;

        return (
            <g key={prize.id}>
                <path d={pathData} fill={WHEEL_COLORS[i % WHEEL_COLORS.length]} stroke="white" strokeWidth="2" />
                <text
                    x={textX}
                    y={textY}
                    fill="#4F46E5" fontSize="10" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle"
                    transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                >
                    {prize.name.substring(0, 12)}
                </text>
            </g>
        );
    });

    return (
        <div className="min-h-screen bg-indigo-900 flex flex-col items-center justify-center p-4 overflow-hidden relative">
            <div className="relative z-10 w-full flex justify-center">
                {/* Responsive container: max width 320px, but shrinks on small screens, maintaining aspect ratio */}
                <div className="relative w-full max-w-[320px] aspect-square rounded-full border-8 border-white shadow-2xl bg-white overflow-hidden">
                    <svg viewBox="0 0 300 300" className="w-full h-full" style={{ transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'transform 3.5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none' }}>
                        {segments}
                    </svg>
                </div>
                <div className="absolute top-1/2 right-[calc(50%-170px)] md:right-[calc(50%-180px)] transform -translate-y-1/2 -rotate-90 z-20">
                    <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[30px] border-b-yellow-400 drop-shadow-md"></div>
                </div>
            </div>
            <button onClick={spinWheel} disabled={isSpinning} className={`mt-12 py-4 px-12 rounded-full font-bold text-xl shadow-xl transition-all transform ${isSpinning ? 'bg-gray-500 cursor-default' : 'bg-yellow-400 hover:scale-105'}`}>
                {isSpinning ? t.customer.goodLuck : t.customer.spinNow}
            </button>
        </div>
    );
};
