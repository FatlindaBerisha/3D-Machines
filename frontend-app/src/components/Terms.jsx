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

export default function Terms() {
  return (
    <div style={wrapperStyle}>
      <div style={containerStyle}>
        <h1 style={h1Style}>Terms of Service</h1>
        <p style={italicSmall}>Last updated: June 2025</p>

        <h2 style={h2Style}>1. Acceptance of Terms</h2>
        <p style={pStyle}>
          By accessing and using the 3D Machines platform, you agree to comply with these Terms of Service. This platform allows you to manage your 3D printing jobs, monitor filament usage, and track printer status.
        </p>

        <h2 style={h2Style}>2. User Responsibilities</h2>
        <p style={pStyle}>
          You agree to use the platform lawfully, ensuring that your print jobs do not infringe on intellectual property rights or contain illegal content.
        </p>

        <h2 style={h2Style}>3. Account Security</h2>
        <p style={pStyle}>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
        </p>

        <h2 style={h2Style}>4. Service Availability</h2>
        <p style={pStyle}>
          We strive to keep the platform available 24/7 but do not guarantee uninterrupted service. Maintenance and updates may cause temporary downtime.
        </p>

        <h2 style={h2Style}>5. Termination</h2>
        <p style={pStyle}>
          We reserve the right to suspend or terminate your account if you violate these terms or engage in misuse of the platform.
        </p>

        <h2 style={h2Style}>6. Limitation of Liability</h2>
        <p style={pStyle}>
          3D Machines is not liable for any direct or indirect damages arising from your use of the platform or print results.
        </p>

        <h2 style={h2Style}>7. Changes to Terms</h2>
        <p style={pStyle}>
          We may update these Terms of Service at any time. Continued use after changes means you accept the new terms.
        </p>

        <h2 style={h2Style}>8. Contact Us</h2>
        <p style={pStyle}>
          For questions about these terms, please contact{' '}
          <a href="mailto:support@3dmachines.com" style={linkStyle}>
            support@3dmachines.com
          </a>.
        </p>
      </div>
    </div>
  );
}