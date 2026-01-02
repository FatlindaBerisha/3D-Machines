import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Listen for logout broadcasts from other tabs
window.addEventListener('storage', (e) => {
	if (e.key === 'app-logout') {
		// clear any in-memory state if needed, then navigate to login
		window.location.replace('/login');
	}
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);