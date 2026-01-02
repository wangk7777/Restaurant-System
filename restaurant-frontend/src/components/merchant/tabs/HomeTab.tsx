
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Merchant, DashboardStats, DashboardTrends } from '../../../types';
import { db } from '../../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, FileText, MessageCircle, Store, TrendingUp, TrendingDown, Calendar, Activity, BarChart2 } from 'lucide-react';

interface HomeTabProps {
    merchant: Merchant;
    isAdmin: boolean;
    isOwner: boolean;
    ownedRestaurants: Merchant[];
}

export const HomeTab: React.FC<HomeTabProps> = ({ merchant, isAdmin, isOwner, ownedRestaurants }) => {
    const { t } = useLanguage();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [trends, setTrends] = useState<DashboardTrends | null>(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterStoreId, setFilterStoreId] = useState<string>('');
    const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

    // Date Selection State
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const now = new Date();
        return now.toISOString().slice(0, 7); // Default YYYY-MM
    });

    const handleViewModeChange = (mode: 'month' | 'year') => {
        setViewMode(mode);
        const now = new Date();
        if (mode === 'month') {
            setSelectedDate(now.toISOString().slice(0, 7)); // YYYY-MM
        } else {
            setSelectedDate(now.getFullYear().toString()); // YYYY
        }
    };

    // Generate Year Options (Last 5 years)
    const yearOptions = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

    // Initial Stats Load & On Filter Change
    useEffect(() => {
        const loadStats = async () => {
            try {
                const s = await db.getDashboardStats(merchant.id, filterStoreId);
                setStats(s);
            } catch (e) {
                console.error(e);
            }
        };
        loadStats();
    }, [merchant.id, filterStoreId]);

    // Trend Load (Dependent on Filters & Date)
    useEffect(() => {
        const loadTrends = async () => {
            try {
                const tr = await db.getDashboardTrends(merchant.id, viewMode, filterStoreId, selectedDate);
                setTrends(tr);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadTrends();
    }, [merchant.id, viewMode, filterStoreId, selectedDate]);

    const renderTrend = (val: number) => {
        if (val === 0) return <span className="text-gray-400 text-sm">0%</span>;
        if (val > 0) return <span className="text-green-500 text-sm flex items-center gap-1"><TrendingUp size={14}/> +{val}%</span>;
        return <span className="text-red-500 text-sm flex items-center gap-1"><TrendingDown size={14}/> {val}%</span>;
    };

    const renderDiff = (current: number, prev: number) => {
        const diff = current - prev;
        if (diff > 0) return `+${diff}`;
        return `${diff}`;
    };

    if (loading && !stats) return <div className="p-8 text-gray-500">{t.common.loading}</div>;

    return (
        <div className="space-y-10 animate-fade-in-up pb-10">
            {/* Section 1: Overview Cards */}
            <section>
                <div className="flex items-center gap-2 mb-4 px-1 pb-2 border-b border-indigo-200">
                    <Store className="text-gray-400" size={20} />
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">{t.dashboard.sectionOverview}</h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {(isAdmin || isOwner) && (
                        <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
                                <Store size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 font-medium">{t.dashboard.totalRestaurants}</div>
                                <div className="text-2xl font-bold text-gray-900">{stats?.total_restaurants || 0}</div>
                            </div>
                        </div>
                    )}

                    {isAdmin && (
                        <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="bg-purple-50 p-3 rounded-full text-purple-600">
                                <Users size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 font-medium">{t.dashboard.totalOwners}</div>
                                <div className="text-2xl font-bold text-gray-900">{stats?.total_owners || 0}</div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                            <FileText size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 font-medium">{t.dashboard.totalSurveys}</div>
                            <div className="text-2xl font-bold text-gray-900">{stats?.total_surveys || 0}</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="bg-emerald-50 p-3 rounded-full text-emerald-600">
                            <MessageCircle size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 font-medium">{t.dashboard.totalResponses}</div>
                            <div className="text-2xl font-bold text-gray-900">{stats?.total_responses || 0}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Today's Pulse */}
            <section>
                <div className="flex items-center gap-2 mb-4 px-1 pb-2 border-b border-indigo-200">
                    <Activity className="text-gray-400" size={20} />
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">{t.dashboard.sectionToday}</h2>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {/* Store Selector */}
                            {(isOwner || isAdmin) ? (
                                <select
                                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 min-w-[200px] shadow-sm"
                                    value={filterStoreId}
                                    onChange={(e) => setFilterStoreId(e.target.value)}
                                >
                                    <option value="">{t.dashboard.allRestaurants}</option>
                                    {ownedRestaurants.map(r => (
                                        <option key={r.id} value={r.id}>{r.restaurant_name}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="text-sm font-medium text-gray-500 bg-white border px-3 py-2 rounded-lg shadow-sm">
                                    {merchant.restaurant_name}
                                </div>
                            )}
                        </div>

                        {stats?.today_data && (
                            <div className="flex items-center gap-8 w-full md:w-auto justify-end">
                                <div className="text-right">
                                    <div className="text-sm text-gray-500 font-medium mb-1">{t.dashboard.responsesToday}</div>
                                    <div className="text-3xl font-extrabold text-gray-900 leading-none">
                                        {stats.today_data.today_count}
                                    </div>
                                </div>

                                <div className="h-12 w-px bg-gray-200 hidden md:block"></div>

                                <div className="flex flex-col items-end min-w-[100px]">
                                    <div className="flex items-center gap-1 mb-1">
                                        {renderTrend(stats.today_data.growth_pct)}
                                    </div>
                                    <div className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 ${stats.today_data.diff >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {stats.today_data.diff > 0 ? '+' : ''}{stats.today_data.diff} {t.dashboard.vsYesterday}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Section 3: Historical Statistics */}
            {trends && (
                <section>
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-4 px-1 pb-2 border-b border-indigo-200">
                        <div className="flex items-center gap-2">
                            <BarChart2 className="text-gray-400" size={20} />
                            <h2 className="text-lg font-bold text-gray-800 tracking-tight">{t.dashboard.sectionHistory}</h2>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                                <button
                                    onClick={() => handleViewModeChange('month')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'month' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    {t.dashboard.viewModeMonth}
                                </button>
                                <button
                                    onClick={() => handleViewModeChange('year')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'year' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    {t.dashboard.viewModeYear}
                                </button>
                            </div>

                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                {viewMode === 'month' ? (
                                    <input
                                        type="month"
                                        className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm outline-none"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                ) : (
                                    <select
                                        className="pl-9 pr-8 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-white outline-none"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    >
                                        {yearOptions.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Monthly/Period Stats Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">{t.dashboard.responsesMonth}</h3>
                            <div className="text-5xl font-extrabold text-indigo-600 mb-2">{trends.stats.month_count}</div>
                            <div className="text-sm text-gray-500 mb-6 font-mono bg-gray-50 inline-block px-2 rounded">
                                {viewMode === 'month' ? selectedDate : `Year ${selectedDate}`}
                            </div>

                            <div className="flex items-center justify-between border-t pt-4 border-gray-100">
                                <span className="text-sm text-gray-500">{t.dashboard.vsLastMonth}</span>
                                <div className="text-right">
                                    {renderTrend(trends.stats.monthly_growth_pct)}
                                    <div className="text-xs text-gray-400 mt-1">
                                        {renderDiff(trends.stats.month_count, trends.stats.last_month_count)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart (Takes up 2 cols) */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <TrendingUp className="text-indigo-600" size={20} />
                                    {t.dashboard.chartTitle}
                                </h3>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trends?.chart_data || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid stroke="#f3f4f6" vertical={false} />
                                        <XAxis
                                            dataKey="label"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                                            dy={10}
                                            interval={viewMode === 'month' ? 2 : 0}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {trends?.chart_data.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill="#4f46e5" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};
