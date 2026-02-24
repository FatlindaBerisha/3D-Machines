import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { MdSchool, MdEngineering, MdBrush } from "react-icons/md";
import api from '../../../utils/axiosClient';
import { getUser } from '../../../utils/storage';
import '../../styles/AdminDashboard.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

const AdminDashboard = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalPrints: 0, totalCuts: 0,
        activePrints: 0, activeCuts: 0,
        completedJobs: 0, failedJobs: 0,
        printStatusData: [], cutStatusData: [],
        monthlyData: [],
        recentJobs: [],
        team: [],
    });
    const [loading, setLoading] = useState(true);

    const professionIcons = {
        student: <MdSchool />,
        engineer: <MdEngineering />,
        designer: <MdBrush />,
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [printsRes, cutsRes, teamRes] = await Promise.allSettled([
                    api.get('/printjob'),
                    api.get('/cutjob'),
                    api.get('/team'),
                ]);

                const prints = printsRes.status === 'fulfilled' ? (printsRes.value.data || []) : [];
                const cuts = cutsRes.status === 'fulfilled' ? (cutsRes.value.data || []) : [];
                const team = teamRes.status === 'fulfilled' ? (teamRes.value.data || []) : [];

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
                    return {
                        month: d.toLocaleDateString(i18n.language, { month: 'short' }),
                        prints: 0,
                        cuts: 0,
                        _year: d.getFullYear(),
                        _month: d.getMonth()
                    };
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

                // -- Recent jobs (last 6, mixed) --
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
                    team: team.slice(0, 5), // Show top 5
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
            icon: 'bi-people-fill',
            label: t('dashboard.totalCapacity'),
            value: stats.totalUsers || stats.team.length, // use totalUsers if available
            active: stats.completedJobs,
            activeLabel: t('dashboard.completedJobs'),
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

    const user = getUser();
    const userName = user?.fullName || user?.name || 'Administrator';

    return (
        <div className="adm-container">

            {/* Stat Cards */}
            <div className="adm-stat-row">
                {statCards.map((c, i) => (
                    <div className={`adm-stat-card ${c.gradient}`} key={i}>
                        <div className="adm-stat-icon"><i className={`bi ${c.icon}`} /></div>
                        <div className="adm-stat-body">
                            <div className="adm-stat-label">{c.label}</div>
                            <div className="adm-stat-value">{loading ? '—' : c.value}</div>
                            <div className="adm-stat-sub">
                                <span className="adm-stat-sub-dot" />
                                {c.active} {c.activeLabel}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="adm-main-row">
                <div className="adm-card adm-area-card">
                    <div className="adm-card-header">
                        <div>
                            <div className="adm-card-title">{t('dashboard.systemActivity')}</div>
                            <div className="adm-card-sub">{t('dashboard.last6Months')}</div>
                        </div>
                        <div className="adm-legend-row">
                            <span className="adm-legend-dot" style={{ background: '#f472b6' }} />
                            <span className="adm-legend-label">{t('sidebar.printing')}</span>
                            <span className="adm-legend-dot" style={{ background: '#4374BA' }} />
                            <span className="adm-legend-label">{t('sidebar.cutting')}</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gPrint" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0.02} />
                                </linearGradient>
                                <linearGradient id="gCut" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4374BA" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#4374BA" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip />
                            <Area type="monotone" dataKey="prints" name={t('sidebar.printing')} stroke="#f472b6" strokeWidth={2.5} fill="url(#gPrint)" dot={false} />
                            <Area type="monotone" dataKey="cuts" name={t('sidebar.cutting')} stroke="#4374BA" strokeWidth={2.5} fill="url(#gCut)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="adm-card adm-donut-card">
                    <div className="adm-card-header">
                        <div className="adm-card-title">{t('dashboard.overallStatus')}</div>
                    </div>
                    <div className="adm-donut-wrap">
                        <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                                <Pie data={donutData} innerRadius={50} outerRadius={65} dataKey="value">
                                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="adm-donut-center">
                            <span className="adm-donut-total">{allJobsTotal}</span>
                            <span className="adm-donut-label">{t('common.total')}</span>
                        </div>
                    </div>
                    <div className="adm-donut-legend">
                        {donutData.map((d, i) => (
                            <div className="adm-donut-leg-item" key={i}>
                                <span className="adm-donut-leg-dot" style={{ background: d.color }} />
                                <span className="adm-donut-leg-label">{d.name}</span>
                                <span className="adm-donut-leg-value">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Jobs & Team */}
            <div className="adm-bottom-row">
                <div className="adm-card adm-jobs-card">
                    <div className="adm-card-header">
                        <div className="adm-card-title">{t('dashboard.recentJobs')}</div>
                        <button className="adm-see-all" onClick={() => navigate('/dashboard/admin/print-logs')}>{t('common.seeAll')}</button>
                    </div>
                    <div className="adm-jobs-list">
                        {loading ? <div className="adm-empty">{t('common.loading')}...</div> : stats.recentJobs.map((j, i) => (
                            <div className="adm-job-row" key={i} onClick={() => navigate(j.type === 'Print' ? '/dashboard/admin/print-logs' : '/dashboard/admin/cut-logs')}>
                                <div className={`adm-job-icon ${j.type === 'Print' ? 'icon-print' : 'icon-cut'}`}>
                                    <i className={`bi ${j.type === 'Print' ? 'bi-printer' : 'bi-scissors'}`} />
                                </div>
                                <div className="adm-job-info">
                                    <div className="adm-job-name">{j.jobName || j.name || `${t('task.job')} #${j.id}`}</div>
                                    <div className="adm-job-user">{j.user?.fullName} • {new Date(j.createdAt).toLocaleDateString(i18n.language)}</div>
                                </div>
                                <span className={`adm-badge ${statusBadge(j.status)}`}>{t(`common.${j.status.replace(/[\s-]/g, '').charAt(0).toLowerCase() + j.status.replace(/[\s-]/g, '').slice(1)}`) || j.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="adm-card adm-team-card">
                    <div className="adm-card-header">
                        <div className="adm-card-title">{t('dashboard.teamMembers')}</div>
                        <button className="adm-see-all" onClick={() => navigate('/dashboard/admin/users')}>{t('common.seeAll')}</button>
                    </div>
                    <div className="adm-team-list">
                        {loading ? <div className="adm-empty">{t('common.loading')}...</div> : stats.team.map((u, i) => {
                            const initials = u.fullName?.charAt(0).toUpperCase() || '?';
                            const profession = u.profession?.toLowerCase() || 'default';
                            return (
                                <div className="adm-team-row" key={u.id}>
                                    <div className={`adm-avatar adm-avatar-${i % 5}`}>{initials}</div>
                                    <div className="adm-team-info">
                                        <div className="adm-team-name">{u.fullName}</div>
                                        <div className="adm-team-meta">
                                            <span className={`profession-label profession-${profession}`}>
                                                {professionIcons[profession]} {t(`common.${profession}`) || profession}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="adm-team-status">
                                        <span className="status-dot active" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
