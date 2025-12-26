
import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/api';
import type { Merchant, Survey, Lottery, UUID } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export const useMerchantData = (merchant: Merchant) => {
    const { t } = useLanguage();
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [lotteries, setLotteries] = useState<Lottery[]>([]);
    const [connectionError, setConnectionError] = useState(false);

    // Admin & Owner features
    const isAdmin = merchant.username === 'admin';
    const isOwner = merchant.role === 'owner';
    const [allMerchants, setAllMerchants] = useState<Merchant[]>([]);
    const [ownedRestaurants, setOwnedRestaurants] = useState<Merchant[]>([]);

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
            } else if (isOwner) {
                // Fetch restaurants owned by this user
                const subs = await db.getMerchants(merchant.id);
                setOwnedRestaurants(subs);
                // We also add ourselves to this list so we can assign stuff to the "HQ" if needed,
                // though typically owners assign to stores.
                // setOwnedRestaurants(prev => [merchant, ...prev]);
            }
        } catch (e) {
            console.error("Failed to load data.", e);
            setConnectionError(true);
        }
    }, [merchant, isAdmin, isOwner]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const getMerchantName = (mId: UUID) => {
        if (isAdmin) {
            const m = allMerchants.find(x => x.id === mId);
            return m ? m.restaurant_name : t.common.unknown;
        }
        if (isOwner) {
            const m = ownedRestaurants.find(x => x.id === mId);
            // Also check if it's me
            if (mId === merchant.id) return merchant.restaurant_name;
            return m ? m.restaurant_name : t.common.unknown;
        }
        return '';
    };

    return {
        surveys,
        lotteries,
        connectionError,
        isAdmin,
        isOwner,
        refreshData,
        getMerchantName,
        allMerchants,
        ownedRestaurants
    };
};