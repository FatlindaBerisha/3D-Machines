import React from 'react';
import { useTranslation } from 'react-i18next';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { t } = useTranslation();

    return (
        <div className="admin-dashboard-container">
            <div className="welcome-message">
                <h1>{t('dashboard.welcomeAdmin')}</h1>
            </div>
        </div>
    );
};

export default AdminDashboard;
