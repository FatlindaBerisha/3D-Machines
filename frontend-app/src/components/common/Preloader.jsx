import React from 'react';
import '../styles/Preloader.css';

const Preloader = ({ fullPage = false }) => {
    return (
        <div className={`loader-container ${fullPage ? 'full-page' : ''}`}>
            <span className="loader"></span>
        </div>
    );
};

export default Preloader;
