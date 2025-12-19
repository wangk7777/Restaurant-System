import React from 'react';
import { CheckCircle, CheckSquare, Square } from 'lucide-react';
import type { Survey } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface SurveyFormProps {
    survey: Survey;
    restaurantName: string;
    answers: Record<string, string>;
    onAnswerChange: (questionId: string, value: string) => void;
    onSubmit: () => void;
    onBack: () => void;
}

export const SurveyForm: React.FC<SurveyFormProps> = ({ survey, restaurantName, answers, onAnswerChange, onSubmit, onBack }) => {
    const { t } = useLanguage();
    const allAnswered = survey.questions.every(q => !!answers[q.id]);

    const handleToggleMulti = (qId: string, option: string) => {
        const current = answers[qId] ? answers[qId].split(', ') : [];
        let next;
        if (current.includes(option)) {
            next = current.filter(o => o !== option);
        } else {
            next = [...current, option];
        }
        onAnswerChange(qId, next.join(', '));
    };

    const isOptionSelected = (qId: string, option: string) => {
        if (!answers[qId]) return false;
        return answers[qId].split(', ').includes(option);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 border border-gray-100">
                    <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 mb-4">← {t.customer.backStart}</button>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{survey.name}</h2>
                    <p className="text-gray-500">at {restaurantName}</p>
                </div>

                <div className="space-y-6">
                    {survey.questions.map((q, idx) => (
                        <div key={q.id} className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">{idx + 1}. {q.text}</h3>

                            {q.type === 'text' ? (
                                <textarea
                                    rows={4}
                                    className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none bg-gray-50 focus:bg-white"
                                    placeholder={t.customer.typeAnswer}
                                    value={answers[q.id] || ''}
                                    onChange={(e) => onAnswerChange(q.id, e.target.value)}
                                />
                            ) : q.type === 'multi' ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {q.options.map((opt) => {
                                            const selected = isOptionSelected(q.id, opt);
                                            return (
                                                <button
                                                    key={opt}
                                                    onClick={() => handleToggleMulti(q.id, opt)}
                                                    className={`p-4 rounded-xl text-left border-2 transition-all flex justify-between items-center ${
                                                        selected
                                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                            : 'border-transparent bg-gray-50 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <span>{opt}</span>
                                                    {selected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-300" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {q.allow_other && (() => {
                                        const currentAnswers = answers[q.id] ? answers[q.id].split(', ') : [];
                                        // Identify text that is NOT in the standard options
                                        const otherParts = currentAnswers.filter(a => !q.options.includes(a));
                                        // Join them to display in input (in case multiple "other" values exist in backend data)
                                        const otherText = otherParts.join(', ');
                                        const isOtherSelected = otherParts.length > 0;

                                        return (
                                            <div
                                                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                                                    isOtherSelected
                                                        ? 'border-indigo-600 bg-indigo-50'
                                                        : 'border-transparent bg-gray-50'
                                                }`}
                                            >
                                                <button
                                                    onClick={() => {
                                                        if (isOtherSelected) {
                                                            // Clear text => Uncheck
                                                            const standardOnly = currentAnswers.filter(a => q.options.includes(a));
                                                            onAnswerChange(q.id, standardOnly.join(', '));
                                                        }
                                                    }}
                                                    className="flex-shrink-0 focus:outline-none"
                                                >
                                                    {isOtherSelected ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-gray-300" />}
                                                </button>
                                                <input
                                                    type="text"
                                                    placeholder={t.customer.otherSpecify}
                                                    className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                                                    value={otherText}
                                                    onChange={(e) => {
                                                        const newVal = e.target.value;
                                                        // Keep standard options, replace custom text
                                                        const standardOnly = currentAnswers.filter(a => q.options.includes(a));
                                                        const next = newVal ? [...standardOnly, newVal] : standardOnly;
                                                        onAnswerChange(q.id, next.join(', '));
                                                    }}
                                                />
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {q.options.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => onAnswerChange(q.id, opt)}
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
                                    {/* "Other" Option Rendering for Single Choice */}
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
                                                onChange={(e) => onAnswerChange(q.id, e.target.value)}
                                                onFocus={() => {
                                                    if (answers[q.id] === undefined || q.options.includes(answers[q.id])) {
                                                        onAnswerChange(q.id, '');
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
                        onClick={onSubmit}
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
};