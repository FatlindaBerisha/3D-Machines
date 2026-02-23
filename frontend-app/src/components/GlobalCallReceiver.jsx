import React, { useEffect, useState, useRef, useContext } from "react";
import { useTranslation } from "react-i18next";
import { getConnection, createConnection, safeInvoke } from "../utils/signalRConnection";
import WebRTCCall from "./WebRTCCall";
import { toast } from "react-toastify";
import { UserContext } from "../UserContext";
import "./styles/Profile.css";
import { MdPhoneInTalk, MdClose, MdCall, MdCallEnd } from "react-icons/md";

export default function GlobalCallReceiver() {
    const { t } = useTranslation();
    const { token, user } = useContext(UserContext);
    const loggedInId = user?.id;
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const ringtoneRef = useRef(null);
    const toastIdRef = useRef(null);

    useEffect(() => {
        if (incomingCall && ringtoneRef.current) {
            ringtoneRef.current.play().catch(e => console.warn("[SignalR] Ringtone blocked:", e));
            showCallToast(incomingCall);
        } else {
            if (ringtoneRef.current) {
                ringtoneRef.current.pause();
                ringtoneRef.current.currentTime = 0;
            }
            if (toastIdRef.current) {
                toast.dismiss(toastIdRef.current);
                toastIdRef.current = null;
            }
        }
    }, [incomingCall]);

    useEffect(() => {
        if (!token) {
            console.log("[SignalR Global] No token, listener not initialized.");
            return;
        }

        console.log("[SignalR Global] Initializing listener for User ID:", loggedInId);
        let conn = getConnection();
        if (!conn) {
            console.log("[SignalR Global] No connection found, creating one...");
            conn = createConnection(token);
        }

        console.log("[SignalR Global] Connection State:", conn.state);

        if (conn.state === "Disconnected") {
            console.log("[SignalR Global] Starting SignalR...");
            conn.start()
                .then(() => console.log("[SignalR Global] Connected! ConnectionId:", conn.connectionId))
                .catch(err => console.error("[SignalR Global] Start error:", err));
        }

        const handleIncomingCall = (senderId, offer, jobId, jobType, senderName, jobName) => {
            console.log("[SignalR Global] !!! INCOMING CALL RECEIVED !!!", { senderId, jobId, jobType, senderName, jobName });
            setIncomingCall({ senderId, offer, jobId, jobType, senderName, jobName });
        };

        const handleRemoteHangup = (senderId) => {
            console.log("[SignalR Global] Remote hangup from:", senderId);
            setIncomingCall(null);
            setActiveCall(null);
        };

        conn.on("ReceiveCallInvitation", handleIncomingCall);
        conn.on("ReceiveHangup", handleRemoteHangup);

        return () => {
            if (conn) {
                console.log("[SignalR Global] Cleaning up listener.");
                conn.off("ReceiveCallInvitation", handleIncomingCall);
                conn.off("ReceiveHangup", handleRemoteHangup);
            }
        };
    }, [token, loggedInId]);

    const handleAccept = () => {
        setActiveCall({
            targetUserId: incomingCall.senderId,
            isIncoming: true,
            offer: incomingCall.offer,
            jobId: incomingCall.jobId,
            jobType: incomingCall.jobType,
            jobName: incomingCall.jobName,
            senderName: incomingCall.senderName
        });
        setIncomingCall(null);
    };

    const handleDecline = () => {
        if (incomingCall) {
            safeInvoke("sendHangup", incomingCall.senderId);
        }
        setIncomingCall(null);
    };

    function showCallToast(callData) {
        if (toastIdRef.current) toast.dismiss(toastIdRef.current);

        toastIdRef.current = toast.info(
            <div className="call-toast-confirmation">
                <p>
                    {t('chat.callInvitation', {
                        senderName: callData.senderName,
                        jobName: callData.jobName || t('task.job')
                    }).split(/(\".*?\")/).map((part, i) =>
                        part.startsWith('"') || part === callData.senderName ?
                            <span key={i} className="highlight">{part}</span> : part
                    )}
                </p>
                <div className="btn-group">
                    <button
                        className="btn-prano"
                        onClick={handleAccept}
                    >
                        {t('chat.accept').toUpperCase()}
                    </button>
                    <button
                        className="btn-anulo"
                        onClick={handleDecline}
                    >
                        {t('chat.decline').toUpperCase()}
                    </button>
                </div>
            </div>,
            {
                autoClose: false,
                closeOnClick: false,
                closeButton: false,
                icon: <MdPhoneInTalk />,
                className: "call-toast-info-box",
            }
        );
    }

    if (activeCall) {
        return (
            <WebRTCCall
                {...activeCall}
                onHangup={() => setActiveCall(null)}
            />
        );
    }

    return (
        <audio ref={ringtoneRef} loop src="https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3" />
    );
}
