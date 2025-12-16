import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/api';
import type { Merchant, Survey, Lottery, UUID } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export const useMerchantData = (merchant: Merchant) => {
    const { t } = useLanguage();
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [lotteries, setLotteries] = useState<Lottery[]>([]);
    const [connectionError, setConnectionError] = useState(false);

    // Admin features
    const isAdmin = merchant.username === 'admin';
    const [allMerchants, setAllMerchants] = useState<Merchant[]>([]);

    const refreshData = useCallback(async () => {
        if (!merchant) return;
        try {
            setConnectionError(false);
            const s = await db.getSurveys(merchant.id);
            const l = await db.getLotteries(merchant.id);
            setSurveys(s);
            setLotteries(l);

            if (isAdmin) {
                const ms = await db.getMerchants();
                setAllMerchants(ms);
            }
        } catch (e) {
            console.error("Failed to load data.", e);
            setConnectionError(true);
        }
    }, [merchant, isAdmin]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const getMerchantName = (mId: UUID) => {
        if (!isAdmin) return '';
        const m = allMerchants.find(x => x.id === mId);
        return m ? m.restaurant_name : t.common.unknown;
    };

    return {
        surveys,
        lotteries,
        connectionError,
        isAdmin,
        refreshData,
        getMerchantName,
        allMerchants
    };
};