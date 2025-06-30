import React from "react";

const wrapperStyle = {
  backgroundColor: '#f9fafb',
  padding: '40px 20px',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  boxSizing: 'border-box',
  fontFamily: "'Exo', sans-serif",
  color: '#222',
};

const containerStyle = {
  maxWidth: '800px',
  width: '100%',
  backgroundColor: '#fff',
  borderRadius: '10px',
  padding: '30px 40px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  lineHeight: 1.5,
};

const h1Style = {
  fontFamily: "'Orbitron', sans-serif",
  fontWeight: '700',
  fontSize: '2rem',
  color: '#2a4d80',
  marginBottom: '1rem',
  textAlign: 'center',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

const h2Style = {
  fontWeight: '600',
  fontSize: '1.25rem',
  color: '#345ea0',
  marginTop: '2rem',
  marginBottom: '0.5rem',
  borderBottom: '2px solid #4374ba',
  paddingBottom: '0.3rem',
};

const pStyle = {
  fontWeight: '400',
  fontSize: '16px',
  color: '#333',
  marginBottom: '1rem',
  textAlign: 'justify',
};

const italicSmall = {
  fontStyle: 'italic',
  fontSize: '0.9rem',
  color: '#666',
  textAlign: 'center',
  marginBottom: '2rem',
};

const linkStyle = {
  color: '#4374ba',
  textDecoration: 'none',
  fontWeight: '600',
};

export default function Privacy() {
  return (
    <div style={wrapperStyle}>
      <div style={containerStyle}>
        <h1 style={h1Style}>Privacy Policy</h1>
        <p style={italicSmall}>Last updated: June 2025</p>

        <h2 style={h2Style}>1. Information We Collect</h2>
        <p style={pStyle}>
          We collect information you provide when registering or using the 3D Machines platform, such as your name, email, and printer usage data to optimize your experience.
        </p>

        <h2 style={h2Style}>2. How We Use Your Information</h2>
        <p style={pStyle}>
          Your data helps us provide and improve the service, manage your print jobs, monitor filament usage, and communicate important updates.
        </p>

        <h2 style={h2Style}>3. Data Security</h2>
        <p style={pStyle}>
          We use industry-standard security measures to protect your personal data from unauthorized access or disclosure.
        </p>

        <h2 style={h2Style}>4. Sharing Your Information</h2>
        <p style={pStyle}>
          We do not sell your personal data. We only share it with trusted partners as necessary to operate the platform.
        </p>

        <h2 style={h2Style}>5. Your Rights</h2>
        <p style={pStyle}>
          You have the right to access, correct, or delete your personal information. Contact us anytime to exercise these rights.
        </p>

        <h2 style={h2Style}>6. Changes to This Policy</h2>
        <p style={pStyle}>
          We may update this Privacy Policy. Continued use after updates means acceptance of the changes.
        </p>

        <h2 style={h2Style}>7. Contact Us</h2>
        <p style={pStyle}>
          Questions? Reach out at{' '}
          <a href="mailto:support@3dmachines.com" style={linkStyle}>
            support@3dmachines.com
          </a>.
        </p>
      </div>
    </div>
  );
}