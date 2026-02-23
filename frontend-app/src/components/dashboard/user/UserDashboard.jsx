import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/axiosClient';
import Preloader from '../../common/Preloader';
import './UserDashboard.css';

const UserDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalPrints: 0,
        totalCuts: 0,
        activeTasks: 0,
        completedTasks: 0,
        printStatusData: [],
        cutStatusData: []
    });
    const [loading, setLoading] = useState(true);
    const [hiddenSectors, setHiddenSectors] = useState({ prints: [], cuts: [] });

    const COLORS = {
        Pending: '#6B7FA6',
        InProgress: '#4F6FB5',
        Printing: '#4F6FB5',
        Cutting: '#4F6FB5',
        Preparing: '#4F6FB5',
        Testing: '#5F8F6A',
        Completed: '#C79A3A',
        Done: '#C79A3A',
        Paused: '#B55454',
        Failed: '#B55454',
        Meetings: '#2F3E63'
    };

    const DEFAULT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#64748b'];

    const handleLegendClick = (chartType, entry) => {
        const { name } = entry;
        setHiddenSectors(prev => {
            const currentHidden = prev[chartType];
            const isHidden = currentHidden.includes(name);
            return {
                ...prev,
                [chartType]: isHidden
                    ? currentHidden.filter(h => h !== name)
                    : [...currentHidden, name]
            };
        });
    };

    const handlePieClick = (path, name) => {
        navigate(`/dashboard/user/${path}?status=${name}`);
    };

    const renderCustomLegend = (props, chartType) => {
        const { payload } = props;
        return (
            <ul className="custom-legend">
                {payload.map((entry, index) => {
                    const isHidden = hiddenSectors[chartType].includes(entry.value);
                    return (
                        <li
                            key={`item-${index}`}
                            onClick={() => handleLegendClick(chartType, entry)}
                            className={`legend-item ${isHidden ? 'hidden' : ''}`}
                        >
                            <span className="legend-icon" style={{ backgroundColor: entry.color }} />
                            <span className="legend-text">{entry.value}</span>
                        </li>
                    );
                })}
            </ul>
        );
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [printsRes, cutsRes] = await Promise.allSettled([
                    api.get('/printjob/my'),
                    api.get('/cutjob/my')
                ]);

                const prints = printsRes.status === 'fulfilled' ? (printsRes.value.data || []) : [];
                const cuts = cutsRes.status === 'fulfilled' ? (cutsRes.value.data || []) : [];

                if (printsRes.status === 'rejected') console.error("Error fetching prints:", printsRes.reason);
                if (cutsRes.status === 'rejected') console.error("Error fetching cuts:", cutsRes.reason);

                const processData = (data) => {
                    const map = data.reduce((acc, job) => {
                        acc[job.status] = (acc[job.status] || 0) + 1;
                        return acc;
                    }, {});

                    return Object.keys(map).map(status => {
                        const key = status.replace(/[\s-]/g, '');
                        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
                        return {
                            name: t(`common.${camelKey}`) || status,
                            value: map[status],
                            statusKey: status,
                            color: COLORS[key] || COLORS[status] || DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]
                        };
                    });
                };

                const printStatusData = processData(prints);
                const cutStatusData = processData(cuts);

                const activePrints = prints.filter(p => ['Printing', 'Preparing', 'In Progress'].includes(p.status)).length;
                const activeCuts = cuts.filter(c => ['Cutting', 'Preparing', 'In Progress'].includes(c.status)).length;
                const completedPrints = prints.filter(p => p.status === 'Completed').length;
                const completedCuts = cuts.filter(c => c.status === 'Completed').length;

                setStats({
                    totalPrints: prints.length,
                    totalCuts: cuts.length,
                    activeTasks: activePrints + activeCuts,
                    completedTasks: completedPrints + completedCuts,
                    printStatusData,
                    cutStatusData
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [t]);

    const StatCard = ({ icon, label, value, type }) => (
        <div className="stat-card">
            <div className={`stat-icon ${type}`}>
                <i className={`bi ${icon}`}></i>
            </div>
            <div className="stat-info">
                <span className="stat-label">{label}</span>
                <span className="stat-value">{value}</span>
            </div>
        </div>
    );

    if (loading) return <Preloader />;

    const filteredPrintData = stats.printStatusData.filter(d => !hiddenSectors.prints.includes(d.name));
    const filteredCutData = stats.cutStatusData.filter(d => !hiddenSectors.cuts.includes(d.name));

    return (
        <div className="user-dashboard-container">
            <div className="stats-grid">
                <StatCard
                    icon="bi-printer"
                    label={t('dashboard.totalPrints')}
                    value={stats.totalPrints}
                    type="prints"
                />
                <StatCard
                    icon="bi-scissors"
                    label={t('dashboard.totalCuts')}
                    value={stats.totalCuts}
                    type="cuts"
                />
                <StatCard
                    icon="bi-activity"
                    label={t('dashboard.activeTasks')}
                    value={stats.activeTasks}
                    type="active"
                />
                <StatCard
                    icon="bi-check2-circle"
                    label={t('dashboard.completedJobs')}
                    value={stats.completedTasks}
                    type="completed"
                />
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <div className="chart-header">
                        <i className="bi bi-printer-fill blue"></i>
                        <h2>{t('dashboard.printStatusDist')}</h2>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={filteredPrintData}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    onClick={(data) => handlePieClick('print-log', data.statusKey)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {filteredPrintData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend
                                    content={(props) => renderCustomLegend(props, 'prints')}
                                    verticalAlign="bottom"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <i className="bi bi-scissors purple"></i>
                        <h2>{t('dashboard.cutStatusDist')}</h2>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={filteredCutData}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    onClick={(data) => handlePieClick('cut-log', data.statusKey)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {filteredCutData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend
                                    content={(props) => renderCustomLegend(props, 'cuts')}
                                    verticalAlign="bottom"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;