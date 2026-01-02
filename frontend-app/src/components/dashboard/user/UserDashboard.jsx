import React from 'react';
import { useTranslation } from 'react-i18next';
import './UserDashboard.css';

const UserDashboard = () => {
    const { t } = useTranslation();

    return (
        <div className="user-dashboard-container">
            <div className="welcome-message">
                <h1>{t('dashboard.welcomeUser')}</h1>
            </div>
        </div>
    );
};

export default UserDashboard;