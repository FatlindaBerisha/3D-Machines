import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { UserContext } from '../../../UserContext';
import api from '../../../utils/axiosClient';
import { getUser } from '../../../utils/storage';
import '../../styles/UserDashboard.css';

const STATUS_COLORS = {
    Pending: '#94a3b8',
    InProgress: '#4374BA',
    Printing: '#4374BA',
    Cutting: '#7c3aed',
    Preparing: '#f59e0b',
    Completed: '#10b981',
    Done: '#10b981',
    Paused: '#f97316',
    Failed: '#ef4444',
};
const FALLBACK_COLORS = ['#4374BA', '#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#64748b'];

const UserDashboard = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user } = useContext(UserContext);

    const [stats, setStats] = useState({
        totalPrints: 0, totalCuts: 0,
        activePrints: 0, activeCuts: 0,
        completedJobs: 0, failedJobs: 0,
        printStatusData: [], cutStatusData: [],
        monthlyData: [],
        recentJobs: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [printsRes, cutsRes] = await Promise.allSettled([
                    api.get('/printjob/my'),
                    api.get('/cutjob/my'),
                ]);

                const prints = printsRes.status === 'fulfilled' ? (printsRes.value.data || []) : [];
                const cuts = cutsRes.status === 'fulfilled' ? (cutsRes.value.data || []) : [];

                // -- Status distribution --
                const buildStatusData = (jobs) => {
                    const map = {};
                    jobs.forEach(j => { map[j.status] = (map[j.status] || 0) + 1; });
                    return Object.entries(map).map(([status, value], i) => {
                        const key = status.replace(/[\s-]/g, '');
                        return {
                            name: t(`common.${key.charAt(0).toLowerCase() + key.slice(1)}`) || status,
                            value,
                            statusKey: status,
                            color: STATUS_COLORS[key] || STATUS_COLORS[status] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                        };
                    });
                };

                // -- Monthly area chart data (last 6 months) --
                const now = new Date();
                const monthlyData = Array.from({ length: 6 }, (_, i) => {
                    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
                    return { month: d.toLocaleDateString(i18n.language, { month: 'short' }), prints: 0, cuts: 0, _year: d.getFullYear(), _month: d.getMonth() };
                });
                [...prints].forEach(j => {
                    const d = new Date(j.createdAt);
                    const slot = monthlyData.find(m => m._year === d.getFullYear() && m._month === d.getMonth());
                    if (slot) slot.prints++;
                });
                [...cuts].forEach(j => {
                    const d = new Date(j.createdAt);
                    const slot = monthlyData.find(m => m._year === d.getFullYear() && m._month === d.getMonth());
                    if (slot) slot.cuts++;
                });

                // -- Recent jobs (last 3, mixed) --
                const allJobs = [
                    ...prints.map(j => ({ ...j, type: 'Print' })),
                    ...cuts.map(j => ({ ...j, type: 'Cut' })),
                ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);

                setStats({
                    totalPrints: prints.length,
                    totalCuts: cuts.length,
                    activePrints: prints.filter(p => ['Printing', 'Preparing', 'In Progress'].includes(p.status)).length,
                    activeCuts: cuts.filter(c => ['Cutting', 'Preparing', 'In Progress'].includes(c.status)).length,
                    completedJobs: [...prints, ...cuts].filter(j => ['Completed', 'Done'].includes(j.status)).length,
                    failedJobs: [...prints, ...cuts].filter(j => j.status === 'Failed').length,
                    printStatusData: buildStatusData(prints),
                    cutStatusData: buildStatusData(cuts),
                    monthlyData,
                    recentJobs: allJobs,
                });
            } catch (err) {
                console.error('Dashboard error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [t, i18n.language]);

    const statusBadge = (status) => {
        const map = {
            Completed: 'badge-green', Done: 'badge-green',
            Failed: 'badge-red', Paused: 'badge-orange',
            Printing: 'badge-blue', Cutting: 'badge-purple',
            Preparing: 'badge-yellow', Pending: 'badge-gray',
            'In Progress': 'badge-blue',
        };
        return map[status] || 'badge-gray';
    };

    const allJobsTotal = stats.completedJobs + stats.failedJobs + stats.activePrints + stats.activeCuts;

    const donutData = [
        { name: t('common.completed'), value: stats.completedJobs, color: '#10b981' },
        { name: t('common.inProgress'), value: stats.activePrints + stats.activeCuts, color: '#4374BA' },
        { name: t('common.failed'), value: stats.failedJobs, color: '#ef4444' },
    ].filter(d => d.value > 0);

    const statCards = [
        {
            icon: 'bi-printer-fill',
            label: t('dashboard.totalPrints'),
            value: stats.totalPrints,
            active: stats.activePrints,
            activeLabel: t('dashboard.activePrints'),
            gradient: 'grad-pink',
        },
        {
            icon: 'bi-scissors',
            label: t('dashboard.totalCuts'),
            value: stats.totalCuts,
            active: stats.activeCuts,
            activeLabel: t('dashboard.activeCuts'),
            gradient: 'grad-yellow',
        },
        {
            icon: 'bi-check2-circle',
            label: t('dashboard.completedJobs'),
            value: stats.completedJobs,
            active: stats.failedJobs,
            activeLabel: t('dashboard.failedJobs'),
            gradient: 'grad-green',
        },
        {
            icon: 'bi-activity',
            label: t('dashboard.systemHealth'),
            value: stats.activePrints + stats.activeCuts,
            active: stats.totalPrints + stats.totalCuts,
            activeLabel: t('dashboard.totalJobs'),
            gradient: 'grad-blue',
        },
    ];

    const userName = user?.fullName || user?.name || 'User';

    return (
        <div className="usr-container">

            {/* ── Stat Cards ── */}
            <div className="usr-stat-row">
                {statCards.map((c, i) => (
                    <div className={`usr-stat-card ${c.gradient}`} key={i}>
                        <div className="usr-stat-icon"><i className={`bi ${c.icon}`} /></div>
                        <div className="usr-stat-body">
                            <div className="usr-stat-label">{c.label}</div>
                            <div className="usr-stat-value">{loading ? '—' : c.value}</div>
                            <div className="usr-stat-sub">
                                <span className="usr-stat-sub-dot" />
                                {c.active} {c.activeLabel}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main row: Area chart + Donut ── */}
            <div className="usr-main-row">
                <div className="usr-card usr-area-card">
                    <div className="usr-card-header">
                        <div>
                            <div className="usr-card-title">{t('dashboard.myActivity')}</div>
                            <div className="usr-card-sub">{t('dashboard.last6Months')}</div>
                        </div>
                        <div className="usr-legend-row">
                            <span className="usr-legend-dot" style={{ background: '#f472b6' }} />
                            <span className="usr-legend-label">{t('sidebar.printing')}</span>
                            <span className="usr-legend-dot" style={{ background: '#4374BA' }} />
                            <span className="usr-legend-label">{t('sidebar.cutting')}</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradPrint" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0.02} />
                                </linearGradient>
                                <linearGradient id="gradCut" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4374BA" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#4374BA" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="prints" name={t('sidebar.printing')} stroke="#f472b6" strokeWidth={2.5} fill="url(#gradPrint)" dot={false} activeDot={{ r: 5 }} />
                            <Area type="monotone" dataKey="cuts" name={t('sidebar.cutting')} stroke="#4374BA" strokeWidth={2.5} fill="url(#gradCut)" dot={false} activeDot={{ r: 5 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="usr-card usr-donut-card">
                    <div className="usr-card-header">
                        <div>
                            <div className="usr-card-title">{t('dashboard.jobOverview')}</div>
                            <div className="usr-card-sub">{t('dashboard.allJobsCombined')}</div>
                        </div>
                    </div>
                    <div className="usr-donut-wrap">
                        <ResponsiveContainer width="100%" height={170}>
                            <PieChart>
                                <Pie data={donutData} innerRadius={52} outerRadius={72} paddingAngle={4} dataKey="value">
                                    {donutData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 10, border: 'none' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="usr-donut-center">
                            <span className="usr-donut-total">{allJobsTotal}</span>
                            <span className="usr-donut-total-label">{t('common.total')}</span>
                        </div>
                    </div>
                    <div className="usr-donut-legend">
                        {donutData.map((d, i) => (
                            <div className="usr-donut-leg-item" key={i}>
                                <span className="usr-donut-leg-dot" style={{ background: d.color }} />
                                <span className="usr-donut-leg-label">{d.name}</span>
                                <span className="usr-donut-leg-value">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="usr-bottom-row">
                <div className="usr-card usr-jobs-card">
                    <div className="usr-card-header">
                        <div className="usr-card-title">{t('dashboard.recentJobs')}</div>
                        <button className="usr-see-all" onClick={() => navigate('/dashboard/user/print-log')}>{t('common.seeAll')}</button>
                    </div>
                    <div className="usr-jobs-list">
                        {loading ? (
                            <div className="usr-empty">{t('common.loading')}...</div>
                        ) : stats.recentJobs.length === 0 ? (
                            <div className="usr-empty">{t('dashboard.noData')}</div>
                        ) : stats.recentJobs.map((job, i) => (
                            <div className="usr-job-row" key={i}
                                onClick={() => navigate(job.type === 'Print' ? `/dashboard/user/print-log` : `/dashboard/user/cut-log`)}>
                                <div className={`usr-job-type-badge ${job.type === 'Print' ? 'type-print' : 'type-cut'}`}>
                                    <i className={`bi ${job.type === 'Print' ? 'bi-printer' : 'bi-scissors'}`} />
                                </div>
                                <div className="usr-job-info">
                                    <div className="usr-job-name">{job.jobName || job.name || `${t('task.job')} #${job.id}`}</div>
                                    <div className="usr-job-meta">
                                        {new Date(job.createdAt).toLocaleDateString(i18n.language)}
                                    </div>
                                </div>
                                <span className={`usr-badge ${statusBadge(job.status)}`}>{t(`common.${job.status.replace(/[\s-]/g, '').charAt(0).toLowerCase() + job.status.replace(/[\s-]/g, '').slice(1)}`) || job.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
