import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n';
import App from './App';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';

window.addEventListener('storage', (e) => {
	if (e.key === 'app-logout') {
		window.location.replace('/login');
	}
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);