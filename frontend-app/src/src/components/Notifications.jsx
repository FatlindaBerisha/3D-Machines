import React, { useState, useEffect } from "react";
import { FaBell, FaTimes } from "react-icons/fa";
import { getConnection, createConnection } from "../utils/signalRConnection";

function Notifications({ token }) {
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
      setMessages(prev => [
        ...prev,
        { id: Date.now(), user, message, read: false }
      ]);
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
            borderRadius: "50%", padding: "2px 6px"
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
          width: 280,
          maxHeight: 300,
          overflowY: "auto",
          boxShadow: "0px 4px 8px rgba(0,0,0,0.1)"
        }}>
          <div style={{
            padding: 8,
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold"
          }}>
            Notifications
            <button
              onClick={markAllRead}
              style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer" }}
            >
              Mark all as read
            </button>
          </div>

          {messages.length === 0 ? (
            <div style={{ padding: 10, textAlign: "center", color: "#777" }}>No notifications</div>
          ) : (
            messages.map(m => (
              <div key={m.id} style={{
                padding: 10,
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                fontWeight: m.read ? "normal" : "bold",
                color: m.read ? "#666" : "#000"
              }}>
                <span><strong>{m.user}:</strong> {m.message}</span>
                <button
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#999" }}
                  onClick={() => remove(m.id)}
                >
                  <FaTimes />
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
