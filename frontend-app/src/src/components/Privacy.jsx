import React, { useEffect } from "react";

export default function Privacy() {
  useEffect(() => {
    window.scrollTo(0, 0);

    // Reset any global styles from dashboard/login
    const html = document.querySelector("html");
    const body = document.querySelector("body");
    const oldHtmlStyles = html.style.cssText;
    const oldBodyStyles = body.style.cssText;

    html.style.height = "auto";
    body.style.height = "auto";
    body.style.display = "block";
    body.style.alignItems = "unset";
    body.style.justifyContent = "unset";
    body.style.overflowY = "auto";
    body.style.backgroundColor = "#ffffff";

    return () => {
      html.style.cssText = oldHtmlStyles;
      body.style.cssText = oldBodyStyles;
    };
  }, []);

  const wrapperStyle = {
    backgroundColor: "#ffffff",
    color: "#222",
    fontFamily: "'Exo', sans-serif",
    minHeight: "100vh",
    width: "100%",
    padding: "40px 80px",
    boxSizing: "border-box",
    lineHeight: 1.8,
  };

  const innerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const h1Style = {
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: 700,
    fontSize: "2.6rem",
    color: "#2a4d80",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    marginBottom: "3rem",
  };

  const h2Style = {
    fontWeight: 600,
    fontSize: "1.35rem",
    color: "#345ea0",
    marginTop: "2.8rem",
    marginBottom: "0.8rem",
    borderBottom: "2px solid #4374ba",
    paddingBottom: "0.3rem",
    letterSpacing: "0.3px",
  };

  const pStyle = {
    fontSize: "17px",
    color: "#333",
    marginBottom: "1.4rem",
    textAlign: "justify",
  };

  const italicSmall = {
    fontStyle: "italic",
    fontSize: "0.95rem",
    color: "#666",
    textAlign: "center",
    marginBottom: "3rem",
  };

  const linkStyle = {
    color: "#4374ba",
    textDecoration: "none",
    fontWeight: 600,
  };

  const applyResponsiveStyles = () => {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;

    const wrapper = document.getElementById("privacy-wrapper");
    const h1 = document.getElementById("privacy-title");

    if (wrapper && h1) {
      if (isMobile) {
        wrapper.style.padding = "30px 25px";
        h1.style.fontSize = "1.8rem";
      } else if (isTablet) {
        wrapper.style.padding = "40px 50px";
        h1.style.fontSize = "2.2rem";
      } else {
        wrapper.style.padding = "50px 80px";
        h1.style.fontSize = "2.6rem";
      }
    }
  };

  useEffect(() => {
    applyResponsiveStyles();
    window.addEventListener("resize", applyResponsiveStyles);
    return () => window.removeEventListener("resize", applyResponsiveStyles);
  }, []);

  return (
    <div id="privacy-wrapper" style={wrapperStyle}>
      <div style={innerStyle}>
        <h1 id="privacy-title" style={h1Style}>Privacy Policy</h1>
        <p style={italicSmall}>Last updated: June 2025</p>

        <h2 style={h2Style}>1. Information We Collect</h2>
        <p style={pStyle}>
          We collect information you provide when registering or using the 3D
          Machines platform, such as your name, email, and printer usage data to
          optimize your experience and enhance service quality.
        </p>

        <h2 style={h2Style}>2. How We Use Your Information</h2>
        <p style={pStyle}>
          Your data helps us provide and improve the service, manage your print
          jobs, monitor filament usage, and communicate important updates or
          support information.
        </p>

        <h2 style={h2Style}>3. Data Security</h2>
        <p style={pStyle}>
          We use industry-standard security measures to protect your personal
          data from unauthorized access, disclosure, or destruction. Our systems
          are monitored to ensure continued protection.
        </p>

        <h2 style={h2Style}>4. Sharing Your Information</h2>
        <p style={pStyle}>
          We do not sell your personal data. Information is only shared with
          trusted service providers when necessary to operate the platform or
          comply with legal obligations.
        </p>

        <h2 style={h2Style}>5. Cookies and Analytics</h2>
        <p style={pStyle}>
          The platform may use cookies and analytics tools to improve
          performance, analyze traffic, and personalize your experience. You can
          control cookie settings in your browser.
        </p>

        <h2 style={h2Style}>6. Your Rights</h2>
        <p style={pStyle}>
          You have the right to access, correct, or delete your personal data.
          To exercise these rights or request more details, contact us at the
          email address below.
        </p>

        <h2 style={h2Style}>7. Changes to This Policy</h2>
        <p style={pStyle}>
          We may update this Privacy Policy periodically. Continued use of the
          platform after changes indicates your acceptance of the updated
          version.
        </p>

        <h2 style={h2Style}>8. Contact Us</h2>
        <p style={pStyle}>
          For questions or concerns about this Privacy Policy, please contact{" "}
          <a href="mailto:support@3dmachines.com" style={linkStyle}>
            support@3dmachines.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}