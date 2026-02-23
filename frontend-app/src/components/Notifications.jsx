import React, { useState, useEffect } from "react";
import { FaBell, FaTimes } from "react-icons/fa";
import { getConnection, createConnection } from "../utils/signalRConnection";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

function Notifications({ token }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!token) return;

    let conn = getConnection();

    // First time → create connection
    if (!conn) {
      conn = createConnection(token);
    }

    // Start connection if not started
    conn.start()
      .catch(err => console.error("SignalR start error:", err));

    conn.on("ReceiveMessage", (user, message) => {
      let displayMessage = message;

      // Check for Template Prefix
      if (message.startsWith("NTF:")) {
        try {
          const { key, params } = JSON.parse(message.substring(4));

          // Helper to translate parameter values if they look like keys
          const translatedParams = {};
          if (params) {
            Object.keys(params).forEach(p => {
              const val = params[p];
              // If the value starts with "notifications.", treat it as a key to translate
              translatedParams[p] = (typeof val === 'string' && val.startsWith('notifications.'))
                ? t(val)
                : val;
            });
          }

          displayMessage = t(key, translatedParams);
        } catch (e) {
          console.error("Failed to parse localized notification:", e);
        }
      }

      // Add to persistent list
      setMessages(prev => [
        { id: Date.now(), user, message: displayMessage, read: false },
        ...prev
      ]);

      // Show Toast Notification - only if NOT a system message to avoid duplication
      // with the component-local toasts the user already has.
      if (!message.startsWith("NTF:")) {
        toast.info(
          <div>
            <strong>{user}</strong>
            <div>{displayMessage}</div>
          </div>,
          { autoClose: 5000 }
        );
      }
    });

    return () => {
      if (conn) {
        conn.off("ReceiveMessage");
      }
    };
  }, [token]);

  const toggleOpen = () => {
    setOpen(prev => {
      const openNow = !prev;
      if (openNow) {
        setMessages(prev => prev.map(m => ({ ...m, read: true })));
      }
      return openNow;
    });
  };

  const remove = (id) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const markAllRead = () => {
    setMessages(prev => prev.map(m => ({ ...m, read: true })));
  };

  const unread = messages.filter(m => !m.read).length;

  return (
    <div style={{ position: "relative" }}>
      <div onClick={toggleOpen} style={{ cursor: "pointer", position: "relative" }}>
        <FaBell size={24} />
        {unread > 0 && (
          <span style={{
            position: "absolute",
            top: -5, right: -5,
            background: "red", color: "white",
            borderRadius: "50%", padding: "2px 6px",
            fontSize: "10px"
          }}>
            {unread}
          </span>
        )}
      </div>

      {open && (
        <div style={{
          position: "absolute",
          top: 30, right: 0,
          background: "white",
          borderRadius: 8,
          width: 320,
          maxHeight: 400,
          overflowY: "auto",
          boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
          zIndex: 1000,
          border: "1px solid #e2e8f0"
        }}>
          <div style={{
            padding: "10px 15px",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f8fafc",
            fontWeight: "bold",
            color: "#334155"
          }}>
            <span>{t('notifications.title') || "Notifications"}</span>
            <button
              onClick={markAllRead}
              className="custom-tooltip-container"
              style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", padding: 0 }}
              title={t('notifications.markAllRead')}
            >
              <i className="bi bi-check2-all" style={{ fontSize: '1.2rem' }}></i>
            </button>
          </div>

          {messages.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>{t('notifications.noNotifications')}</div>
          ) : (
            messages.map(m => (
              <div key={m.id} style={{
                padding: "12px 15px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "10px",
                background: m.read ? "white" : "#f0f9ff",
                transition: "background 0.2s"
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.9rem", marginBottom: "2px" }}>{m.user}</div>
                  <div style={{ color: "#475569", fontSize: "0.85rem", lineHeight: "1.4" }}>{m.message}</div>
                  <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "4px" }}>
                    {new Date(m.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px", marginTop: "-4px" }}
                  onClick={(e) => { e.stopPropagation(); remove(m.id); }}
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Notifications;
