import React, { useState, useEffect, useRef } from "react";
import { MdMic, MdMicOff, MdVideocam, MdVideocamOff, MdCallEnd } from "react-icons/md";
import { HiVideoCameraSlash } from "react-icons/hi2";
import { getConnection, safeInvoke } from "../utils/signalRConnection";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// STUN + TURN for NAT/Firewall traversal
const RTC_CONFIG = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
        { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
        { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
    ],
    iceCandidatePoolSize: 10,
};

const C = {
    primary: "#4374BA",
    primaryDark: "#2F3E63",
    primaryMid: "#5384cc",
    danger: "#e53935",
    dangerGlow: "rgba(229,57,53,0.45)",
    white: "#ffffff",
    surface: "rgba(30, 40, 70, 0.96)",
    glass: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.12)",
    textMuted: "rgba(255,255,255,0.45)",
    green: "#00e676",
    amber: "#fbbf24",
};

const WebRTCCall = ({
    targetUserId, targetUserName, senderUserId, senderName,
    isIncoming, offer, onHangup,
    jobId, jobType, jobName
}) => {
    const { t } = useTranslation();

    const [isCalling, setIsCalling] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(true);
    const [remoteAudioEnabled, setRemoteAudioEnabled] = useState(true);
    const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState(t('webRTC.status.connecting'));

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(new MediaStream());
    const iceQueueRef = useRef([]);
    const remoteDescSet = useRef(false);
    const isCallingRef = useRef(false);

    // ── Duration timer ────────────────────────────────────────────────────────
    useEffect(() => {
        let timer;
        if (isCalling) {
            isCallingRef.current = true;
            timer = setInterval(() => setCallDuration(d => d + 1), 1000);
        }
        return () => clearInterval(timer);
    }, [isCalling]);

    const fmt = (s) =>
        `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    // ── Main WebRTC init ──────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                toast.error("Camera/mic not available in non-secure context.");
                onHangup();
                return;
            }

            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            } catch (err) {
                toast.error("Could not access camera or microphone.");
                onHangup();
                return;
            }
            if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

            localStreamRef.current = stream;
            setIsVideoEnabled(true);
            setIsAudioEnabled(true);
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            const pc = new RTCPeerConnection(RTC_CONFIG);
            pcRef.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.onicecandidate = ({ candidate }) => {
                if (candidate) safeInvoke("sendSignal", targetUserId.toString(), JSON.stringify({ ice: candidate }));
            };

            pc.oniceconnectionstatechange = () => {
                const s = pc.iceConnectionState;
                setConnectionStatus(t('webRTC.status.ice', { status: s }));
                if ((s === "connected" || s === "completed") && !isCallingRef.current) setIsCalling(true);
                if (s === "failed") pc.restartIce();
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === "connected") setIsCalling(true);
            };

            pc.ontrack = (event) => {
                if (cancelled) return;
                if (!remoteStreamRef.current.getTracks().find(t => t.id === event.track.id)) {
                    remoteStreamRef.current.addTrack(event.track);
                }
                if (remoteVideoRef.current) {
                    if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
                        remoteVideoRef.current.srcObject = remoteStreamRef.current;
                    }
                    remoteVideoRef.current.play().catch(e => {
                        if (e.name !== "AbortError") console.warn("[WebRTC] play:", e.message);
                    });
                }
                setHasRemoteVideo(true);
                setIsCalling(true);
            };

            setConnectionStatus(t('webRTC.status.connecting'));
            const conn = getConnection();
            if (!conn) { onHangup(); return; }

            if (isIncoming && offer) {
                await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)));
                remoteDescSet.current = true;
                while (iceQueueRef.current.length > 0)
                    await pc.addIceCandidate(new RTCIceCandidate(iceQueueRef.current.shift())).catch(() => { });
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                safeInvoke("sendCallResponse", targetUserId.toString(), JSON.stringify(answer));
            } else if (!isIncoming) {
                const offerSdp = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
                await pc.setLocalDescription(offerSdp);
                safeInvoke("sendCallInvitation",
                    targetUserId.toString(), JSON.stringify(offerSdp),
                    jobId?.toString() || "", jobType || "",
                    senderName || "Unknown", jobName || ""
                );
            }
        };

        const conn = getConnection();

        const onSignal = async (sender, signal) => {
            if (sender.toString() !== targetUserId.toString()) return;
            try {
                const data = JSON.parse(signal);
                if (data.ice && pcRef.current) {
                    remoteDescSet.current
                        ? await pcRef.current.addIceCandidate(new RTCIceCandidate(data.ice))
                        : iceQueueRef.current.push(data.ice);
                }
                // Handle camera & audio status from remote peer
                if (data.cameraStatus !== undefined) {
                    setRemoteVideoEnabled(data.cameraStatus);
                }
                if (data.audioStatus !== undefined) {
                    setRemoteAudioEnabled(data.audioStatus);
                }
            } catch { /* ignore */ }
        };

        const onResponse = async (sender, answer) => {
            if (sender.toString() !== targetUserId.toString()) return;
            if (!pcRef.current || pcRef.current.signalingState === "stable") return;
            try {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer)));
                remoteDescSet.current = true;
                while (iceQueueRef.current.length > 0)
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(iceQueueRef.current.shift())).catch(() => { });
                setIsCalling(true);
            } catch (e) { console.error("[WebRTC] setRemoteDesc:", e); }
        };

        const onHangupSignal = (sender) => {
            if (sender.toString() === targetUserId.toString()) onHangup();
        };

        if (conn) {
            conn.on("ReceiveSignal", onSignal);
            conn.on("ReceiveCallResponse", onResponse);
            conn.on("ReceiveHangup", onHangupSignal);
        }

        init();

        return () => {
            cancelled = true;
            if (conn) {
                conn.off("ReceiveSignal", onSignal);
                conn.off("ReceiveCallResponse", onResponse);
                conn.off("ReceiveHangup", onHangupSignal);
            }
            if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
            // Only stop local tracks, never inside toggle functions
            if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Actions ───────────────────────────────────────────────────────────────

    // ONLY this function ends the call
    const hangup = (e) => {
        e && e.stopPropagation();
        safeInvoke("sendHangup", targetUserId.toString());
        onHangup();
    };

    // Toggle audio — NEVER ends the call, just mutes/unmutes
    const toggleAudio = (e) => {
        e && e.stopPropagation();
        const track = localStreamRef.current?.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setIsAudioEnabled(track.enabled);
            // Notify other peer about our audio status
            safeInvoke("sendSignal", targetUserId.toString(), JSON.stringify({ audioStatus: track.enabled }));
            console.log(`[WebRTC] Audio ${track.enabled ? "enabled" : "disabled"} locally`);
        }
    };

    // Toggle video — NEVER ends the call, just enables/disables the track
    const toggleVideo = (e) => {
        e && e.stopPropagation();
        const track = localStreamRef.current?.getVideoTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setIsVideoEnabled(track.enabled);
            // Notify other peer about our camera status
            safeInvoke("sendSignal", targetUserId.toString(), JSON.stringify({ cameraStatus: track.enabled }));
            console.log(`[WebRTC] Video ${track.enabled ? "enabled" : "disabled"} locally`);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    const participantName = isIncoming ? senderName : targetUserName;
    const callerLabel = participantName || t('common.user');

    return (
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 12000,
                background: `linear-gradient(160deg, ${C.primaryDark} 0%, #111827 60%, #0a0f1e 100%)`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                fontFamily: "'Exo', 'Segoe UI', sans-serif", color: C.white, userSelect: "none",
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* ── Top status pill ── */}
            <div style={{
                position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
                background: C.glass, border: `1px solid ${C.border}`,
                padding: "7px 20px", borderRadius: 40, fontSize: 13, fontWeight: 700,
                color: isCalling ? C.green : C.amber,
                display: "flex", alignItems: "center", gap: 8,
                backdropFilter: "blur(20px)", whiteSpace: "nowrap",
                boxShadow: "0 4px 18px rgba(0,0,0,0.35)"
            }}>
                <span style={{
                    width: 8, height: 8, borderRadius: "50%", display: "inline-block",
                    background: isCalling ? C.green : C.amber,
                    boxShadow: `0 0 8px ${isCalling ? C.green : C.amber}`,
                    animation: isCalling ? "none" : "blink 1.4s infinite"
                }} />
                {isCalling ? `${t('webRTC.status.connected')} · ${fmt(callDuration)}` : connectionStatus}
            </div>

            {/* ── Main video frame ── */}
            <div style={{
                position: "relative", width: "88%", maxWidth: 1200, height: "73vh",
                borderRadius: 20, overflow: "hidden",
                background: C.primaryDark,
                boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px ${C.border}`,
            }}>
                {/* Remote video */}
                <video ref={remoteVideoRef} autoPlay playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

                {/* VISIBLE STATUS OVERLAYS (NON-BLOCKING) */}
                {((!remoteVideoEnabled && hasRemoteVideo) || (!remoteAudioEnabled && isCalling)) && (
                    <div style={{
                        position: "absolute", inset: 0, zIndex: 5,
                        background: !remoteVideoEnabled ? "rgba(10, 15, 30, 0.95)" : "transparent",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        pointerEvents: "none" // Crucial: don't block button clicks below
                    }}>
                        {/* Status Icons Container */}
                        <div style={{ display: "flex", gap: 30, marginBottom: 20 }}>
                            {!remoteVideoEnabled && (
                                <div style={{
                                    width: 100, height: 100, borderRadius: "50%",
                                    background: "rgba(255,255,255,0.05)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    border: `2px dashed ${C.textMuted}`
                                }}>
                                    <MdVideocamOff size={50} style={{ color: C.textMuted }} />
                                </div>
                            )}
                        </div>

                        {/* Status Text (Camera only since mic has been moved) */}
                        {!remoteVideoEnabled && (
                            <p style={{ color: C.textMuted, fontSize: 16, fontWeight: 700, letterSpacing: 1, textAlign: "center", maxWidth: "80%" }}>
                                {t('webRTC.overlays.cameraDisabled', { name: callerLabel.toUpperCase() })}
                            </p>
                        )}
                    </div>
                )}

                {/* VISIBLE MUTE ICON IN TOP-LEFT (AS REQUESTED) */}
                {isCalling && !remoteAudioEnabled && (
                    <div style={{
                        position: "absolute", top: 15, left: 15, zIndex: 10,
                        background: C.danger,
                        width: 38, height: 38, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
                    }}>
                        <MdMicOff size={22} color="#fff" />
                    </div>
                )}

                {/* Waiting overlay */}
                {!hasRemoteVideo && (
                    <div style={{
                        position: "absolute", inset: 0,
                        background: `linear-gradient(180deg, ${C.primaryDark} 0%, #0d1526 100%)`,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
                    }}>
                        {/* Centered Avatar + Pulse Container */}
                        <div style={{
                            position: "relative", width: 100, height: 100, marginBottom: 24,
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            {/* Pulsing rings - Centered on avatar */}
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} style={{
                                    position: "absolute",
                                    top: 0, left: 0, width: "100%", height: "100%",
                                    borderRadius: "50%",
                                    border: `2px solid ${C.primary}`,
                                    animation: `expandRingNew 3s cubic-bezier(0, 0, 0.2, 1) ${i * 0.75}s infinite`,
                                    pointerEvents: "none"
                                }} />
                            ))}
                            {/* Avatar */}
                            <div style={{
                                width: 100, height: 100, borderRadius: "50%",
                                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMid})`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 40, fontWeight: 900,
                                boxShadow: `0 0 40px rgba(67, 116, 186, 0.5)`,
                                animation: "avatarPulse 2s ease-in-out infinite",
                                position: "relative", zIndex: 2
                            }}>
                                {callerLabel.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        <p style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px", zIndex: 2 }}>
                            {callerLabel}
                        </p>
                        <p style={{ fontSize: 12, color: C.textMuted, letterSpacing: 2, zIndex: 2 }}>
                            {isIncoming ? t('webRTC.overlays.incoming') : t('webRTC.overlays.calling')}
                        </p>
                    </div>
                )}

                {/* Local video PiP — bottom right, above controls */}
                <div style={{
                    position: "absolute", bottom: 90, right: 18, width: 190, height: 132,
                    borderRadius: 14, overflow: "hidden", zIndex: 15,
                    border: `2px solid ${C.border}`,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.55)", background: "#000"
                }}>
                    <video ref={localVideoRef} autoPlay playsInline muted
                        style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
                    {!isVideoEnabled && (
                        <div style={{
                            position: "absolute", inset: 0, background: C.primaryDark,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: C.textMuted
                        }}>
                            <HiVideoCameraSlash size={24} />
                        </div>
                    )}
                    {/* Local Mute Overlay */}
                    {!isAudioEnabled && (
                        <div style={{
                            position: "absolute", top: 6, left: 6, zIndex: 16,
                            background: "rgba(229, 57, 53, 0.8)",
                            padding: 4, borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <MdMicOff size={12} color="#fff" />
                        </div>
                    )}
                    <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        background: "linear-gradient(transparent, rgba(0,0,0,0.65))",
                        textAlign: "center", fontSize: 10, fontWeight: 700,
                        letterSpacing: 1.5, color: C.textMuted, padding: "8px 0 4px"
                    }}>{t('webRTC.overlays.you')}</div>
                </div>

                {/* ── Control bar — lives INSIDE the video frame, at the bottom ── */}
                <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
                    padding: "32px 0 18px",
                    background: "linear-gradient(transparent, rgba(10,15,40,0.92))",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 18
                }}>
                    {/* Mute */}
                    <CtrlBtn
                        onClick={toggleAudio}
                        active={isAudioEnabled}
                        label={isAudioEnabled ? t('webRTC.controls.mute') : t('webRTC.controls.unmute')}
                        icon={isAudioEnabled ? <MdMic size={24} /> : <MdMicOff size={24} />}
                    />

                    {/* End Call — ONLY this ends the call */}
                    <CtrlBtn
                        onClick={hangup}
                        isHangup
                        label={t('webRTC.controls.endCall')}
                        icon={<MdCallEnd size={28} />}
                    />

                    {/* Camera */}
                    <CtrlBtn
                        onClick={toggleVideo}
                        active={isVideoEnabled}
                        label={isVideoEnabled ? t('webRTC.controls.camera') : t('webRTC.controls.noCamera')}
                        icon={isVideoEnabled ? <MdVideocam size={24} /> : <MdVideocamOff size={24} />}
                    />
                </div>
            </div>

            {/* Name below frame */}
            <div style={{ textAlign: "center", marginTop: 16 }}>
                <h2 style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 800, letterSpacing: 0.3 }}>
                    {callerLabel}
                </h2>
                <p style={{ margin: 0, fontSize: 11, color: C.textMuted, letterSpacing: 2, textTransform: "uppercase" }}>
                    {isIncoming ? t('webRTC.overlays.incomingVideoCall') : t('webRTC.overlays.outgoingVideoCall')}
                </p>
            </div>

            <style>{`
                @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
                @keyframes expandRingNew {
                    0%   { transform: scale(1); opacity: 0.8; border-width: 2px; }
                    50%  { opacity: 0.3; }
                    100% { transform: scale(4); opacity: 0; border-width: 0.5px; }
                }
                @keyframes avatarPulse {
                    0%,100%{ box-shadow:0 0 40px rgba(67, 116, 186, 0.45); }
                    50%    { box-shadow:0 0 80px rgba(67, 116, 186, 0.9);  }
                }
            `}</style>
        </div>
    );
};

// ── Small reusable control button ─────────────────────────────────────────────
const CtrlBtn = ({ onClick, active, isHangup, label, icon }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
        <button
            onClick={onClick}
            onMouseOver={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; }}
            style={{
                width: isHangup ? 66 : 54, height: isHangup ? 66 : 54,
                borderRadius: "50%", border: "none", cursor: "pointer", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.18s ease",
                background: isHangup
                    ? "linear-gradient(135deg, #e53935, #c62828)"
                    : active
                        ? "rgba(255,255,255,0.13)"
                        : "#e53935",
                boxShadow: isHangup
                    ? "0 0 28px rgba(229,57,53,0.6)"
                    : active ? "none" : "0 0 18px rgba(229,57,53,0.45)",
                backdropFilter: "blur(8px)",
            }}
        >
            {icon}
        </button>
        <span style={{
            fontSize: 11, fontWeight: 700,
            color: isHangup ? "#e53935" : "rgba(255,255,255,0.45)",
            letterSpacing: 0.5
        }}>{label}</span>
    </div>
);

export default WebRTCCall;
