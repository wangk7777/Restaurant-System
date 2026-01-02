
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCustomerFlow } from '../hooks/useCustomerFlow';
import { MerchantSelection } from './customer/steps/MerchantSelection';
import { SurveySelection } from './customer/steps/SurveySelection';
import { SurveyForm } from './customer/steps/SurveyForm';
import { LotteryWheel } from './customer/steps/LotteryWheel';
import { ResultScreen } from './customer/steps/ResultScreen';

interface CustomerAppProps {
    onBack: () => void;
    preselectedMerchantId?: string | null;
    preselectedSurveyId?: string | null;
    preselectedLotteryId?: string | null;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({ onBack, preselectedMerchantId, preselectedSurveyId, preselectedLotteryId }) => {
    const { t } = useLanguage();

    // Use the custom hook to manage all state and logic
    const {
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
    } = useCustomerFlow(onBack, preselectedMerchantId, preselectedSurveyId, preselectedLotteryId);

    if (loading) {
        return <div className="flex h-screen items-center justify-center text-indigo-600 font-bold">{t.common.loading}</div>;
    }

    // Render logic based on current step
    switch (step) {
        case 'MERCHANT_SELECT':
            return (
                <MerchantSelection
                    merchants={merchants}
                    onSelect={handleMerchantSelect}
                    onBack={handleBack}
                />
            );

        case 'SURVEY_SELECT':
            return (
                <SurveySelection
                    surveys={merchantSurveys}
                    restaurantName={selectedMerchant?.restaurant_name || ''}
                    onSelect={handleSurveySelect}
                    onBack={handleBack}
                />
            );

        case 'SURVEY':
            if (!activeSurvey) return <div>Error: No active survey</div>;
            return (
                <SurveyForm
                    survey={activeSurvey}
                    restaurantName={selectedMerchant?.restaurant_name || ''}
                    answers={answers}
                    onAnswerChange={handleAnswerChange}
                    onSubmit={handleSubmitSurvey}
                    onBack={handleBack}
                />
            );

        case 'LOTTERY':
            if (!linkedLottery) return <div>Error: No linked lottery</div>;
            return (
                <LotteryWheel
                    lottery={linkedLottery}
                    wonPrize={wonPrize}
                    onComplete={() => setStep('RESULT')}
                />
            );

        case 'RESULT':
            return (
                <ResultScreen
                    wonPrize={wonPrize}
                    onRestart={handleRestart}
                />
            );

        default:
            return <div>Unknown Step</div>;
    }
};