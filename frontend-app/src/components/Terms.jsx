import React, { useEffect } from "react";

export default function Terms() {
  useEffect(() => {
    window.scrollTo(0, 0);

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

    const wrapper = document.getElementById("terms-wrapper");
    const h1 = document.getElementById("terms-title");

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
    <div id="terms-wrapper" style={wrapperStyle}>
      <div style={innerStyle}>
        <h1 id="terms-title" style={h1Style}>Terms of Service</h1>
        <p style={italicSmall}>Last updated: June 2025</p>

        <h2 style={h2Style}>1. Acceptance of Terms</h2>
        <p style={pStyle}>
          By accessing and using the 3D Machines platform, you agree to comply
          with these Terms of Service. This platform allows you to manage your
          3D printing jobs, monitor filament usage, and track printer status.
        </p>

        <h2 style={h2Style}>2. User Responsibilities</h2>
        <p style={pStyle}>
          You agree to use the platform lawfully, ensuring that your print jobs
          do not infringe on intellectual property rights or contain illegal
          content.
        </p>

        <h2 style={h2Style}>3. Account Security</h2>
        <p style={pStyle}>
          You are responsible for maintaining the confidentiality of your
          account credentials and for all activities that occur under your
          account.
        </p>

        <h2 style={h2Style}>4. Service Availability</h2>
        <p style={pStyle}>
          We strive to keep the platform available 24 / 7 but do not guarantee
          uninterrupted service. Maintenance and updates may cause temporary
          downtime.
        </p>

        <h2 style={h2Style}>5. Termination</h2>
        <p style={pStyle}>
          We reserve the right to suspend or terminate your account if you
          violate these terms or engage in misuse of the platform.
        </p>

        <h2 style={h2Style}>6. Limitation of Liability</h2>
        <p style={pStyle}>
          3D Machines is not liable for any direct or indirect damages arising
          from your use of the platform or printing results.
        </p>

        <h2 style={h2Style}>7. Changes to Terms</h2>
        <p style={pStyle}>
          We may update these Terms of Service at any time. Continued use after
          changes means you accept the new terms.
        </p>

        <h2 style={h2Style}>8. Contact Us</h2>
        <p style={pStyle}>
          For questions about these terms, please contact{" "}
          <a href="mailto:support@3dmachines.com" style={linkStyle}>
            support@3dmachines.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}