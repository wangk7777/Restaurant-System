
import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/api';
import type { Merchant, Survey, Lottery, Prize } from '../types';

export type CustomerStep = 'MERCHANT_SELECT' | 'SURVEY_SELECT' | 'SURVEY' | 'LOTTERY' | 'RESULT';

const generateUUID = () => crypto.randomUUID();

export const useCustomerFlow = (
    onBackExit: () => void,
    preselectedMerchantId?: string | null,
    preselectedSurveyId?: string | null,
    preselectedLotteryId?: string | null
) => {
    // Steps
    const [step, setStep] = useState<CustomerStep>('MERCHANT_SELECT');

    // Data
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [merchantSurveys, setMerchantSurveys] = useState<Survey[]>([]);
    const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
    const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);

    // Submission State
    const [customerId] = useState(generateUUID());
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    // Lottery Result State
    const [linkedLottery, setLinkedLottery] = useState<Lottery | null>(null);
    const [wonPrize, setWonPrize] = useState<Prize | null>(null);

    // --- Logic ---

    // Load specific merchant data
    const loadMerchantData = useCallback(async (merchant: Merchant, specificSurveyId?: string | null, specificLotteryId?: string | null) => {
        setSelectedMerchant(merchant);
        setLoading(true);
        try {
            // If direct lottery access
            if (specificLotteryId) {
                const lotteries = await db.getLotteries(merchant.id);
                // Also check if there are shared lotteries from owner
                // (Currently getLotteries usually handles hierarchy on backend, but ensuring we find it)
                const targetLottery = lotteries.find(l => l.id === specificLotteryId);

                if (targetLottery) {
                    setLinkedLottery(targetLottery);

                    // Since we are skipping the survey/backend submission, we must determine the prize here client-side
                    // to ensure the wheel knows where to stop.
                    const prize = calculatePrizeClientSide(targetLottery);
                    setWonPrize(prize);

                    setStep('LOTTERY');
                    return; // Stop further survey loading
                } else {
                    alert("Lottery not found.");
                }
            }

            const surveys = await db.getSurveys(merchant.id);
            setMerchantSurveys(surveys);

            if (specificSurveyId) {
                // QR Code direct link logic
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
                // Normal flow
                if (surveys.length === 0) {
                    alert(`Welcome to ${merchant.restaurant_name}. There are no active surveys right now.`);
                } else if (surveys.length === 1) {
                    setActiveSurvey(surveys[0]);
                    setStep('SURVEY');
                } else {
                    setStep('SURVEY_SELECT');
                }
            }
        } catch (e) {
            console.error(e);
            alert("Failed to load data.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Helper: Client-side weighted random for Direct Lottery Access
    const calculatePrizeClientSide = (lottery: Lottery): Prize | null => {
        if (!lottery.prizes || lottery.prizes.length === 0) return null;

        const luckyNumber = Math.random() * 100;
        let currentProb = 0;

        for (const prize of lottery.prizes) {
            currentProb += prize.probability;
            if (luckyNumber <= currentProb) {
                return prize;
            }
        }
        return null;
    };

    // Initial Load
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const list = await db.getMerchants();
                setMerchants(list);

                if (preselectedMerchantId) {
                    const matched = list.find(m => m.id === preselectedMerchantId);
                    if (matched) {
                        await loadMerchantData(matched, preselectedSurveyId, preselectedLotteryId);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [preselectedMerchantId, preselectedSurveyId, preselectedLotteryId, loadMerchantData]);

    // Handlers
    const handleMerchantSelect = (m: Merchant) => loadMerchantData(m);

    const handleSurveySelect = (s: Survey) => {
        setActiveSurvey(s);
        setStep('SURVEY');
    };

    const handleAnswerChange = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmitSurvey = async () => {
        if (!activeSurvey || !selectedMerchant) return;

        try {
            setLoading(true);
            const responsePayload = {
                id: generateUUID(),
                survey_id: activeSurvey.id,
                customer_id: customerId,
                answers,
                submitted_at: new Date().toISOString()
            };

            const result = await db.saveResponse(responsePayload);
            setWonPrize(result.prize);

            // Check if we need to show lottery wheel
            if (activeSurvey.lottery_id) {
                const lotteries = await db.getLotteries(selectedMerchant.id);
                const lot = lotteries.find(l => l.id === activeSurvey.lottery_id);

                if (lot && lot.prizes.length > 0) {
                    setLinkedLottery(lot);
                    setStep('LOTTERY');
                    setLoading(false);
                    return;
                }
            }

            setStep('RESULT');
        } catch (e) {
            console.error(e);
            alert("Failed to submit survey.");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 'SURVEY') setStep('MERCHANT_SELECT'); // Simplified back nav
        else if (step === 'SURVEY_SELECT') setStep('MERCHANT_SELECT');
        else if (step === 'LOTTERY' && preselectedLotteryId) onBackExit(); // Exit if directly linked
        else onBackExit();
    };

    const handleRestart = () => onBackExit();

    return {
        step,
        setStep,
        merchants,
        merchantSurveys,
        selectedMerchant,
        activeSurvey,
        answers,
        loading,
        linkedLottery,
        wonPrize,
        handleMerchantSelect,
        handleSurveySelect,
        handleAnswerChange,
        handleSubmitSurvey,
        handleBack,
        handleRestart
    };
};