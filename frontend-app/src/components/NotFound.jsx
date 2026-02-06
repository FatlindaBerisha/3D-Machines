import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo.png';
import './styles/NotFound.css';

const NotFound = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <img src={logo} alt="3D Machines Logo" className="not-found-logo" />
                <h2 className="not-found-title">{t('notFound.title')}</h2>
                <p className="not-found-text">{t('notFound.description')}</p>
                <button
                    className="not-found-btn"
                    onClick={() => navigate('/')}
                >
                    <i className="bi bi-house-door-fill"></i>
                    {t('notFound.backHome')}
                </button>
            </div>
        </div>
    );
};

export default NotFound;