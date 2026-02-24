import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { getToken } from "../../../utils/storage";
import api from "../../../utils/axiosClient";
// Preloader import removed
import "../../styles/PrintLog.css";
import { MdClose, MdSend, MdAttachFile, MdInsertEmoticon, MdCall, MdSearch, MdCheck, MdPushPin, MdWarning, MdLabel, MdSettings, MdAdd } from "react-icons/md";
import { IoPencil, IoTrash } from "react-icons/io5";
import { HiClock, HiCog, HiPrinter, HiSparkles, HiCheckCircle, HiExclamationCircle, HiPhone, HiPencilSquare, HiTrash } from "react-icons/hi2";
import { jwtDecode } from "jwt-decode";
import { useTranslation } from "react-i18next";
import classNames from 'classnames';
import { getConnection, safeInvoke } from "../../../utils/signalRConnection";
import WebRTCCall from "../../WebRTCCall";


export default function PrintJobDetailsModal({ jobId, onClose, onUpdate }) {
    const { t, i18n } = useTranslation();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [loggedInUserId, setLoggedInUserId] = useState(null);
    const [loggedInUserRole, setLoggedInUserRole] = useState("");
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editedCommentText, setEditedCommentText] = useState("");
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedDescription, setEditedDescription] = useState("");
    const [callData, setCallData] = useState(null);
    const [showParticipantSelector, setShowParticipantSelector] = useState(false);
    const [participantsToCall, setParticipantsToCall] = useState([]);

    const [messageTag, setMessageTag] = useState("");
    const [isEditingSettings, setIsEditingSettings] = useState(false);
    const [printSettings, setPrintSettings] = useState({
        printer: "",
        layerHeight: "",
        nozzle: "",
        infill: "",
        timeEstimate: ""
    });
    const [printPhase, setPrintPhase] = useState("Preparing");
    const [chatSearchQuery, setChatSearchQuery] = useState("");
    const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
    const [isEditingMainInfo, setIsEditingMainInfo] = useState(false);
    const [editedJobName, setEditedJobName] = useState("");


    // Auto-scroll chat
    const renderHighlightedText = (text, highlight) => {
        if (!highlight || !highlight.trim()) return text;
        const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === highlight.toLowerCase() ?
                <span key={i} style={{ backgroundColor: '#fde047', color: '#000', borderRadius: '2px', padding: '0 2px' }}>{part}</span> : part
        );
    };

    const chatEndRef = useRef(null);

    useEffect(() => {
        const token = getToken();
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const id = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded.sub || decoded.id;
                const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role;
                if (id) setLoggedInUserId(parseInt(id, 10));
                if (role) setLoggedInUserRole(role);
            } catch (e) { console.error("Token decode error", e); }
        }
    }, []);

    useEffect(() => {
        fetchJobDetails();
        fetchUsers();
    }, [jobId]);

    // Scroll to bottom when comments change
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [job?.comments]);

    async function fetchJobDetails() {
        try {
            const res = await api.get(`/printjob/${jobId}`);
            setJob(res.data);
            setEditedJobName(res.data.jobName || "");
            setEditedDescription(res.data.description || "");
            setPrintSettings({
                printer: res.data.printer || "",
                layerHeight: res.data.layerHeight || "",
                nozzle: res.data.nozzle || "",
                infill: res.data.infill || "",
                timeEstimate: res.data.timeEstimate || ""
            });
            setPrintPhase(res.data.printPhase || "Preparing");
        } catch (err) {
            toast.error(t('toasts.jobDetailsFailed') || "Failed to load details");
            onClose();
        } finally {
            setLoading(false);
        }
    }

    async function fetchUsers() {
        try {
            const res = await api.get("/user");
            setUsers(res.data);
        } catch (e) { console.warn("Could not fetch users list"); }
    }

    async function handleStart() {
        try {
            await api.post(`/printjob/${jobId}/start`);
            fetchJobDetails();
            onUpdate();
            toast.success(t('toasts.jobStarted') || "Job started");
        } catch (err) { toast.error("Failed to start job"); }
    }

    async function handlePause() {
        try {
            await api.post(`/printjob/${jobId}/pause`);
            fetchJobDetails();
            onUpdate();
            toast.success(t('toasts.jobPaused') || "Job paused");
        } catch (err) { toast.error("Failed to pause job"); }
    }

    async function handleFinish() {
        try {
            await api.post(`/printjob/${jobId}/finish`);
            fetchJobDetails();
            onUpdate();
            toast.success(t('toasts.jobCompleted') || "Job completed");
        } catch (err) { toast.error("Failed to finish job"); }
    }

    async function handleAddComment(e) {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await api.post(`/printjob/${jobId}/comments`, {
                text: newComment,
                tag: messageTag || null
            });
            setNewComment("");
            setMessageTag("");
            fetchJobDetails();
        } catch (err) { toast.error("Failed to add comment"); }
    }

    async function handleAddParticipant(userIdOrEvent) {
        let uid = userIdOrEvent;
        // If event, ignore (used in click handler without args usually, but here we pass value)
        if (typeof userIdOrEvent === 'object' && userIdOrEvent.preventDefault) return;

        // If passed as string from select
        if (typeof userIdOrEvent === 'string') uid = parseInt(userIdOrEvent, 10);

        // Fallback to state if not passed (though we changed logic to pass it)
        if (!uid && selectedUser) uid = parseInt(selectedUser, 10);

        if (!uid) return;

        try {
            await api.post(`/printjob/${jobId}/participants`, { userId: uid });
            toast.success(t('toasts.participantAdded'));
            setSelectedUser("");
            fetchJobDetails();
        } catch (err) { toast.error(t('toasts.genericUpdateFailed')); }
    }

    async function handleRemoveParticipant(userId) {
        if (!window.confirm(t('task.removeParticipantConfirm'))) return;
        try {
            await api.delete(`/printjob/${jobId}/participants/${userId}`);
            toast.success(t('toasts.participantRemoved'));
            fetchJobDetails();
        } catch (err) { toast.error(t('toasts.genericUpdateFailed')); }
    }

    const handleCall = (targetUserId) => {
        if (!targetUserId) {
            toast.info("Please select a user to call.");
            return;
        }
        const targetUser = users.find(u => u.id === parseInt(targetUserId, 10));
        const targetUserName = targetUser?.fullName || "User " + targetUserId;
        const senderName = users.find(u => u.id === loggedInUserId)?.fullName || "User " + loggedInUserId;
        setCallData({
            targetUserId,
            targetUserName,
            senderUserId: loggedInUserId,
            senderName,
            isIncoming: false,
            jobId: job?.id,
            jobType: 'print',
            jobName: job?.jobName || "Print Job"
        });
        setShowParticipantSelector(false);
    };

    const handleInitiateCall = () => {
        const others = [];
        if (job.userId && job.userId !== loggedInUserId && job.user) {
            others.push(job.user);
        }
        job.participants?.forEach(p => {
            if (p.userId !== loggedInUserId && p.user && !others.some(o => o.id === p.userId)) {
                others.push(p.user);
            }
        });
        if (loggedInUserId !== 1 && !others.some(o => o.id === 1)) {
            const admin = users.find(u => u.id === 1);
            if (admin) others.push(admin);
        }

        if (others.length === 0) {
            toast.info("No participants available to call.");
        } else if (others.length === 1) {
            handleCall(others[0].id);
        } else {
            setShowParticipantSelector(true);
        }
    };

    // SignalR Incoming Call Listener
    useEffect(() => {
        const conn = getConnection();
        if (!conn) return;

        const handleCallInvitation = (senderId, offer, jobIdParam, jobTypeParam, senderNameParam, jobNameParam) => {
            console.log("[SignalR] Incoming call from:", senderId, "for job:", jobNameParam);

            // Auto-accept if this modal is for the same job, or if sender is part of this job
            const isSameJob = jobId == jobIdParam;
            const isCreator = job?.userId == senderId;
            const isParticipant = job?.participants?.some(p => p.userId == senderId);

            if (isSameJob || isCreator || isParticipant) {
                setCallData({
                    targetUserId: senderId,
                    senderUserId: loggedInUserId,
                    isIncoming: true,
                    offer,
                    jobId: jobIdParam,
                    jobName: jobNameParam,
                    senderName: senderNameParam
                });
            }
        };

        conn.on("CallInvitation", handleCallInvitation);
        return () => {
            conn.off("CallInvitation", handleCallInvitation);
        };
    }, [job, loggedInUserId]);

    async function handleEditComment(commentId) {
        if (!editedCommentText.trim()) return;
        try {
            await api.put(`/printjob/${jobId}/comments/${commentId}`, { text: editedCommentText });
            setEditingCommentId(null);
            setEditedCommentText("");
            fetchJobDetails();
            toast.success("Comment updated");
        } catch (err) { toast.error("Failed to update comment"); }
    }

    async function handleDeleteComment(commentId) {
        if (!window.confirm("Delete this comment?")) return;
        try {
            await api.delete(`/printjob/${jobId}/comments/${commentId}`);
            fetchJobDetails();
            toast.success("Comment deleted");
        } catch (err) { toast.error("Failed to delete comment"); }
    }

    async function handleUpdateMainInfo() {
        try {
            await api.put(`/printjob/${jobId}`, {
                id: jobId,
                jobName: editedJobName,
                filamentId: job.filamentId,
                status: job.status,
                duration: job.duration,
                description: editedDescription
            });
            setIsEditingMainInfo(false);
            fetchJobDetails();
            onUpdate();
            toast.success("Job updated");
        } catch (err) { toast.error("Failed to update job"); }
    }

    async function handleUpdatePrintSettings() {
        try {
            await api.put(`/printjob/${jobId}`, {
                id: jobId,
                jobName: job.jobName,
                filamentId: job.filamentId,
                status: job.status,
                duration: job.duration,
                description: job.description,
                ...printSettings
            });
            setIsEditingSettings(false);
            fetchJobDetails();
            onUpdate();
            toast.success(t('toasts.printJobUpdated') || "Print settings updated");
        } catch (err) { toast.error("Failed to update print settings"); }
    }



    async function handleUpdatePrintPhase(newPhase) {
        try {
            await api.put(`/printjob/${jobId}`, {
                id: jobId,
                jobName: job.jobName,
                filamentId: job.filamentId,
                status: job.status,
                duration: job.duration,
                description: job.description,
                printPhase: newPhase
            });
            setPrintPhase(newPhase);

            // Auto-log phase change to chat (localized)
            const phaseKey = newPhase.charAt(0).toLowerCase() + newPhase.slice(1).replace("-", "").replace(" ", "");
            const translatedPhase = t(`printWorkflow.printPhases.${phaseKey}`);
            await api.post(`/printjob/${jobId}/comments`, {
                text: t('systemMessages.phaseUpdated', { phase: translatedPhase }),
                tag: "Phase Update"
            });

            fetchJobDetails();
            toast.success(t('toasts.printPhaseUpdated') || "Print Phase updated");
        } catch (err) { toast.error("Failed to update print phase"); }
    }

    async function handlePinMessage(commentText) {
        try {
            await api.put(`/printjob/${jobId}`, {
                id: jobId,
                jobName: job.jobName,
                filamentId: job.filamentId,
                status: job.status,
                duration: job.duration,
                description: commentText
            });
            fetchJobDetails();
            onUpdate();
            toast.success("Message pinned to description");
        } catch (err) { toast.error("Failed to pin message"); }
    }

    if (loading || !job) return null;
    const isOwner = Number(loggedInUserId) === Number(job.userId);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="details-modal-split" onClick={(e) => e.stopPropagation()}>
                {/* LEFT PANEL: DETAILS */}
                <div className="details-left-panel">
                    <div className="details-left-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '15px' }}>
                        <div style={{ flex: 1 }}>
                            {isEditingMainInfo ? (
                                <input
                                    value={editedJobName}
                                    onChange={(e) => setEditedJobName(e.target.value)}
                                    style={{
                                        fontSize: '24px',
                                        fontWeight: 'bold',
                                        width: '100%',
                                        marginBottom: '5px',
                                        padding: '2px 8px',
                                        borderRadius: '8px',
                                        border: '1px solid transparent',
                                        background: 'transparent',
                                        marginLeft: '-8px',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        color: '#1e293b'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                                    onMouseLeave={(e) => { if (document.activeElement !== e.target) e.target.style.background = 'transparent'; }}
                                    onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }}
                                    onBlur={(e) => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; }}
                                    autoFocus
                                />
                            ) : (
                                <h2 style={{ margin: 0 }}>{job.jobName}</h2>
                            )}
                            <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                                {job.filament?.name || t('filaments.noFilament')} • {t('task.createdOn')} {new Date(job.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {/* Action Buttons in Header */}
                            {isOwner && (
                                <div className="header-action-group" style={{ display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                                    {job.status === "Pending" && (
                                        <button className="header-btn start" onClick={handleStart} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                                            {t('task.start')}
                                        </button>
                                    )}
                                    {job.status === "In Progress" && (
                                        <>
                                            <button className="header-btn pause" onClick={handlePause} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                {t('task.pause')}
                                            </button>
                                            <button className="header-btn finish" onClick={handleFinish} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                {t('task.complete')}
                                            </button>
                                        </>
                                    )}
                                    {job.status === "Paused" && (
                                        <>
                                            <button className="header-btn start" onClick={handleStart} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                {t('task.resume')}
                                            </button>
                                            <button className="header-btn finish" onClick={handleFinish} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                {t('task.complete')}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Header Edit Button */}
                            {isOwner && (
                                <div
                                    className="header-edit-toggle"
                                    onClick={() => isEditingMainInfo ? handleUpdateMainInfo() : setIsEditingMainInfo(true)}
                                    style={{
                                        width: '36px', height: '36px', borderRadius: '10px',
                                        background: isEditingMainInfo ? '#dcfce7' : '#f1f5f9',
                                        color: isEditingMainInfo ? '#166534' : '#64748b',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    {isEditingMainInfo ? <MdCheck size={20} /> : <HiPencilSquare size={20} />}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* OWNER CHECK FOR EDITING */}
                    {(() => {
                        // isOwner, isAdmin, canEdit now defined at top level of render

                        return (
                            <>
                                <div className="job-description-box" style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h4 style={{ margin: 0, fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('filaments.description')}</h4>
                                    </div>
                                    {isEditingMainInfo ? (
                                        <textarea
                                            value={editedDescription}
                                            onChange={(e) => setEditedDescription(e.target.value)}
                                            style={{
                                                width: '100%',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '10px',
                                                padding: '12px',
                                                fontSize: '14px',
                                                lineHeight: '1.6',
                                                fontFamily: 'inherit',
                                                minHeight: '100px',
                                                outline: 'none',
                                                background: '#f8fafc',
                                                transition: 'all 0.2s',
                                                resize: 'vertical'
                                            }}
                                            onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    ) : (
                                        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: job.description ? '#334155' : '#94a3b8', fontStyle: job.description ? 'normal' : 'italic' }}>
                                            {job.description || "No description provided."}
                                        </p>
                                    )}
                                </div>

                                <div className="info-grid">
                                    <div className="info-row">
                                        <span className="info-label">{t('task.owner')}:</span>
                                        <div className="info-value">
                                            <div className="user-avatar-small">
                                                {job.user?.fullName?.charAt(0) || "U"}
                                            </div>
                                            <span className="user-name-link">{job.user?.fullName}</span>
                                        </div>
                                    </div>

                                    <div className="info-row">
                                        <span className="info-label">{t('task.assignee')}:</span>
                                        <div className="info-value">
                                            <div className="user-avatar-small assignee-avatar">
                                                {job.user?.fullName?.charAt(0) || "U"}
                                            </div>
                                            <span className="user-name-link">
                                                {job.user?.fullName}
                                            </span>
                                        </div>
                                    </div>



                                    <div className="info-row">
                                        <span className="info-label">{t('task.stage')}:</span>
                                        <div className="info-value">
                                            <span className={`status-badge status-${job.status.toLowerCase().replace(" ", "-")}`}>
                                                {t(`common.${job.status.charAt(0).toLowerCase() + job.status.slice(1).replace(" ", "")}`) || job.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="participants-section">
                                    <h4 className="participants-title">{t('task.participants')}:</h4>
                                    <div className="participants-list">
                                        {job.participants && job.participants.map(p => (
                                            <div key={p.id} className="participant-chip">
                                                <div className="user-avatar-mini" title={p.user?.fullName}>
                                                    {p.user?.fullName?.charAt(0)}
                                                </div>
                                                <span className="participant-name">{p.user?.fullName}</span>
                                                {isOwner && (
                                                    <MdClose
                                                        className="remove-participant-icon"
                                                        onClick={() => handleRemoveParticipant(p.user.id)}
                                                        title="Remove participant"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {/* ADD PARTICIPANT - Only Owner */}
                                    {isOwner && (
                                        <div style={{ marginTop: '15px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                {t('task.add')}
                                            </label>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <select
                                                    value={selectedUser}
                                                    onChange={(e) => setSelectedUser(e.target.value)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '8px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #cbd5e1',
                                                        fontSize: '13px'
                                                    }}
                                                >
                                                    <option value="">{t('task.selectUser')}</option>
                                                    {users
                                                        .filter(u => u.id !== job?.userId && !job.participants?.some(p => p.userId === u.id))
                                                        .map(u => (
                                                            <option key={u.id} value={u.id}>{u.fullName}</option>
                                                        ))}
                                                </select>
                                                <button
                                                    onClick={() => handleAddParticipant(selectedUser)}
                                                    disabled={!selectedUser}
                                                    style={{
                                                        padding: '8px 16px',
                                                        background: !selectedUser ? '#ccc' : '#2563eb',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '20px',
                                                        cursor: !selectedUser ? 'not-allowed' : 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '500',
                                                        transition: 'background 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '5px'
                                                    }}
                                                >
                                                    <MdAdd /> {t('common.add')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* PRINT SETTINGS PANEL */}
                                <div className="print-settings-section" style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h4 style={{ margin: 0, fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <MdSettings style={{ color: '#4374ba' }} />
                                            {t('printWorkflow.printSettings.title')}
                                        </h4>
                                        {isOwner && (
                                            !isEditingSettings ? (
                                                <IoPencil
                                                    style={{ cursor: 'pointer', color: '#64748b', fontSize: '18px' }}
                                                    onClick={() => setIsEditingSettings(true)}
                                                />
                                            ) : (
                                                <MdCheck
                                                    style={{ cursor: 'pointer', color: '#48bb78', fontSize: '20px' }}
                                                    onClick={handleUpdatePrintSettings}
                                                />
                                            )
                                        )}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                                        <div>
                                            <label style={{ color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                                                {t('printWorkflow.printSettings.printer')}:
                                            </label>
                                            {isEditingSettings ? (
                                                <input
                                                    type="text"
                                                    value={printSettings.printer}
                                                    onChange={(e) => setPrintSettings({ ...printSettings, printer: e.target.value })}
                                                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            ) : (
                                                <span style={{ color: '#1e293b' }}>{printSettings.printer || '-'}</span>
                                            )}
                                        </div>
                                        <div>
                                            <label style={{ color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                                                {t('printWorkflow.printSettings.layerHeight')}:
                                            </label>
                                            {isEditingSettings ? (
                                                <input
                                                    type="text"
                                                    value={printSettings.layerHeight}
                                                    onChange={(e) => setPrintSettings({ ...printSettings, layerHeight: e.target.value })}
                                                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                    placeholder="e.g., 0.2mm"
                                                />
                                            ) : (
                                                <span style={{ color: '#1e293b' }}>{printSettings.layerHeight || '-'}</span>
                                            )}
                                        </div>
                                        <div>
                                            <label style={{ color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                                                {t('printWorkflow.printSettings.nozzle')}:
                                            </label>
                                            {isEditingSettings ? (
                                                <input
                                                    type="text"
                                                    value={printSettings.nozzle}
                                                    onChange={(e) => setPrintSettings({ ...printSettings, nozzle: e.target.value })}
                                                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                    placeholder="e.g., 0.4mm"
                                                />
                                            ) : (
                                                <span style={{ color: '#1e293b' }}>{printSettings.nozzle || '-'}</span>
                                            )}
                                        </div>
                                        <div>
                                            <label style={{ color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                                                {t('printWorkflow.printSettings.infill')}:
                                            </label>
                                            {isEditingSettings ? (
                                                <input
                                                    type="text"
                                                    value={printSettings.infill}
                                                    onChange={(e) => setPrintSettings({ ...printSettings, infill: e.target.value })}
                                                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                    placeholder="e.g., 20%"
                                                />
                                            ) : (
                                                <span style={{ color: '#1e293b' }}>{printSettings.infill || '-'}</span>
                                            )}
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                                                {t('printWorkflow.printSettings.timeEstimate')}:
                                            </label>
                                            {isEditingSettings ? (
                                                <input
                                                    type="text"
                                                    value={printSettings.timeEstimate}
                                                    onChange={(e) => setPrintSettings({ ...printSettings, timeEstimate: e.target.value })}
                                                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                    placeholder="e.g., 3h 45m"
                                                />
                                            ) : (
                                                <span style={{ color: '#1e293b' }}>{printSettings.timeEstimate || '-'}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* PRINT PHASE (New Section) */}
                                <div className="print-phase-section" style={{ marginTop: '16px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#0369a1', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <HiPrinter /> Print Phase
                                    </h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span className="phase-badge" style={{ padding: '4px 12px', borderRadius: '20px', background: '#0284c7', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                                            {t(`printWorkflow.printPhases.${printPhase.charAt(0).toLowerCase() + printPhase.slice(1).replace("-", "").replace(" ", "")}`) || printPhase}
                                        </span>
                                        {isOwner ? (
                                            <select
                                                value={printPhase}
                                                onChange={(e) => handleUpdatePrintPhase(e.target.value)}
                                                style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#334155', flex: 1 }}
                                            >
                                                <option value="Preparing">{t('printWorkflow.printPhases.preparing')}</option>
                                                <option value="File Ready">{t('printWorkflow.printPhases.fileReady')}</option>
                                                <option value="Slicing">{t('printWorkflow.printPhases.slicing')}</option>
                                                <option value="Printer Setup">{t('printWorkflow.printPhases.printerSetup')}</option>
                                                <option value="Printing">{t('printWorkflow.printPhases.printing')}</option>
                                                <option value="Cooling">{t('printWorkflow.printPhases.cooling')}</option>
                                                <option value="Post-Processing">{t('printWorkflow.printPhases.postProcessing')}</option>
                                                <option value="Test Print">{t('printWorkflow.printPhases.testPrint')}</option>
                                                <option value="Reprint Needed">{t('printWorkflow.printPhases.reprintNeeded')}</option>
                                                <option value="Done">{t('printWorkflow.printPhases.done')}</option>
                                            </select>
                                        ) : (
                                            <span style={{ fontSize: '13px', color: '#64748b' }}></span>
                                        )}
                                    </div>
                                </div>
                            </>
                        );
                    })()}



                </div>

                {/* RIGHT PANEL: CHAT */}
                <div className="details-right-panel">
                    <div className="chat-header">
                        <h3>
                            <span style={{ marginRight: '10px' }}>{t('task.chat')}</span>
                            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 'normal' }}>
                                {job.participants ? job.participants.length + 1 : 1} {t('task.members')}
                            </span>
                        </h3>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {/* Call Button */}
                            {(() => {
                                const others = [];
                                if (job.userId && job.userId !== loggedInUserId && job.user) {
                                    others.push(job.user);
                                }
                                job.participants?.forEach(p => {
                                    if (p.userId !== loggedInUserId && p.user && !others.some(o => o.id === p.userId)) {
                                        others.push(p.user);
                                    }
                                });

                                // Always allow calling User 1 (Administrator) if not me
                                if (loggedInUserId !== 1 && !others.some(o => o.id === 1)) {
                                    const admin = users.find(u => u.id === 1);
                                    if (admin) others.push(admin);
                                }

                                if (others.length > 0) {
                                    return (
                                        <div className="call-dropdown-container" style={{ position: 'relative' }}>
                                            <HiPhone
                                                style={{ color: 'white', fontSize: '20px', cursor: 'pointer', opacity: 0.8 }}
                                                onClick={handleInitiateCall}
                                                title={t('chat.startCall', 'Start Video Call')}
                                            />
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {isChatSearchOpen ? (
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        value={chatSearchQuery}
                                        onChange={(e) => setChatSearchQuery(e.target.value)}
                                        placeholder={t('common.search')}
                                        autoFocus
                                        style={{
                                            padding: '6px 32px 6px 12px',
                                            borderRadius: '20px',
                                            border: 'none',
                                            fontSize: '13px',
                                            width: '160px',
                                            outline: 'none',
                                            background: 'rgba(255, 255, 255, 0.2)',
                                            color: 'white',
                                            backdropFilter: 'blur(4px)'
                                        }}
                                        onBlur={() => { if (!chatSearchQuery) setIsChatSearchOpen(false); }}
                                    />
                                    <MdClose
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            cursor: 'pointer',
                                            color: 'rgba(255, 255, 255, 0.8)',
                                            fontSize: '16px'
                                        }}
                                        onClick={() => { setChatSearchQuery(""); setIsChatSearchOpen(false); }}
                                    />
                                </div>
                            ) : (
                                <div
                                    style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    onClick={() => setIsChatSearchOpen(true)}
                                >
                                    <MdSearch style={{ color: 'white', fontSize: '20px' }} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="chat-stream">
                        {/* Auto-generated welcome or start message could go here */}

                        {/* Group comments by Date */}
                        {(() => {
                            const grouped = {};
                            const filteredComments = job.comments?.filter(c =>
                                c.text.toLowerCase().includes(chatSearchQuery.toLowerCase())
                            ) || [];

                            filteredComments.forEach(c => {
                                const date = new Date(c.createdAt).toLocaleDateString();
                                if (!grouped[date]) grouped[date] = [];
                                grouped[date].push(c);
                            });

                            return Object.keys(grouped).map(date => (
                                <React.Fragment key={date}>
                                    <div className="chat-date-separator">
                                        <span>{date}</span>
                                    </div>
                                    {grouped[date].map(c => {
                                        const isMe = c.userId === loggedInUserId;
                                        const isSystem = c.text.includes("paused the task") || c.text.includes("resumed the task") || c.text.includes("started the task") || c.text.includes("finished the task") || c.tag === "System" || c.tag === "Phase Update" || c.text.includes("changed status to");

                                        if (isSystem) {
                                            let displaySystemText = c.text;
                                            if (c.text.includes("changed status to")) {
                                                const parts = c.text.split("changed status to ");
                                                if (parts.length > 1) {
                                                    const status = parts[1].replace('.', '').trim();
                                                    const statusMap = {
                                                        "To Do": "to do",
                                                        "In Progress": "inProgress",
                                                        "Testing": "testing",
                                                        "Done": "done",
                                                        "On Hold": "onHold",
                                                        "Meetings": "meetings"
                                                    };
                                                    const key = statusMap[status] || status.toLowerCase();
                                                    displaySystemText = `${t('systemMessages.statusChanged')} ${t(`kanban.${key}`)}`;
                                                }
                                            } else if (c.text.includes("started the task")) {
                                                displaySystemText = t('systemMessages.taskStarted');
                                            } else if (c.text.includes("paused the task")) {
                                                displaySystemText = t('systemMessages.taskPaused');
                                            } else if (c.text.includes("resumed the task")) {
                                                displaySystemText = t('systemMessages.taskResumed');
                                            } else if (c.text.includes("completed the task") || c.text.includes("finished the task")) {
                                                displaySystemText = t('systemMessages.taskCompleted');
                                            } else if (c.text.includes("requested recut")) {
                                                displaySystemText = t('systemMessages.taskRecut');
                                            }

                                            return (
                                                <div key={c.id} className="chat-system-row">
                                                    <span className="system-user-badge">{c.user?.fullName}</span>
                                                    <span className="system-text">{displaySystemText}</span>
                                                    <span className="system-time">{new Date(c.createdAt + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            );
                                        }

                                        const isIssue = c.tag === "Printer Issue" || c.tag === "Failed";
                                        const isSuccess = c.tag === "Completed";

                                        return (
                                            <div key={c.id} className={`chat-bubble-row ${isMe ? 'right' : 'left'}`} style={{ marginBottom: '12px' }}>
                                                <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px' }}>
                                                    {/* AVATAR */}
                                                    <div className="user-avatar-small" style={{ width: '28px', height: '28px', fontSize: '12px', minWidth: '28px' }}>
                                                        {c.user?.fullName?.charAt(0).toUpperCase() || "U"}
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                                            <span className="chat-name" style={{ fontSize: '11px', color: '#64748b' }}>{c.user?.fullName}</span>
                                                            {c.updatedAt && new Date(c.updatedAt) > new Date(c.createdAt) && (
                                                                <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>({t('common.edited')})</span>
                                                            )}
                                                        </div>

                                                        {editingCommentId === c.id ? (
                                                            <div className="chat-edit-container">
                                                                <input
                                                                    type="text"
                                                                    value={editedCommentText}
                                                                    onChange={(e) => setEditedCommentText(e.target.value)}
                                                                    onKeyPress={(e) => e.key === 'Enter' && handleEditComment(c.id)}
                                                                    autoFocus
                                                                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid #4374ba', width: '100%' }}
                                                                />
                                                                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                                                    <button onClick={() => handleEditComment(c.id)} style={{ padding: '4px 10px', background: '#4374ba', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' }}>{t('profile.save')}</button>
                                                                    <button onClick={() => setEditingCommentId(null)} style={{ padding: '4px 10px', background: '#e2e8f0', color: '#64748b', border: 'none', borderRadius: '4px', fontSize: '12px' }}>{t('profile.cancel')}</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className={`chat-bubble ${isMe ? 'right' : 'left'}`}
                                                                style={{
                                                                    background: isIssue ? '#fee2e2' : isSuccess ? '#dcfce7' : isMe ? '#e0f2fe' : '#f1f5f9',
                                                                    border: isIssue ? '1px solid #fca5a5' : isSuccess ? '1px solid #86efac' : 'none',
                                                                    color: isIssue ? '#991b1b' : isSuccess ? '#166534' : 'inherit',
                                                                    padding: '10px 14px',
                                                                    borderRadius: '12px',
                                                                    borderBottomRightRadius: isMe ? '0' : '12px',
                                                                    borderBottomLeftRadius: isMe ? '12px' : '0'
                                                                }}
                                                            >
                                                                {c.tag && (
                                                                    <div style={{
                                                                        fontSize: '10px',
                                                                        fontWeight: 'bold',
                                                                        textTransform: 'uppercase',
                                                                        marginBottom: '4px',
                                                                        color: isIssue ? '#ef4444' : isSuccess ? '#10b981' : '#64748b',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}>
                                                                        {isIssue && <MdWarning />}
                                                                        {isSuccess && <MdCheck />}
                                                                        {!isIssue && !isSuccess && <MdLabel />}
                                                                        {c.tag}
                                                                    </div>
                                                                )}

                                                                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                                                    {renderHighlightedText(c.text, chatSearchQuery)}
                                                                </div>

                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', gap: '10px' }}>
                                                                    <span className="chat-meta" style={{ fontSize: '10px', opacity: 0.7 }}>
                                                                        {new Date(c.createdAt + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                    <div className="bubble-actions" style={{ display: 'flex', gap: '4px', opacity: 0.6 }}>
                                                                        {isMe && (
                                                                            <>
                                                                                <HiPencilSquare
                                                                                    style={{ cursor: 'pointer', fontSize: '16px', color: '#007aff' }}
                                                                                    onClick={() => { setEditingCommentId(c.id); setEditedCommentText(c.text); }}
                                                                                />
                                                                                <HiTrash
                                                                                    style={{ cursor: 'pointer', fontSize: '16px', color: '#ff3b30' }}
                                                                                    onClick={() => handleDeleteComment(c.id)}
                                                                                />
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ));
                        })()}
                        <div ref={chatEndRef} />
                    </div>



                    <form className="chat-input-wrapper" onSubmit={handleAddComment}>

                        <input
                            type="file"
                            id="chat-file-input"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                if (e.target.files.length > 0) {
                                    toast.success(`File "${e.target.files[0].name}" selected (Upload not yet active)`);
                                }
                            }}
                        />
                        <MdAttachFile
                            style={{ color: '#888', fontSize: '24px', cursor: 'pointer', transform: 'rotate(45deg)' }}
                            onClick={() => document.getElementById('chat-file-input').click()}
                        />
                        <input
                            type="text"
                            placeholder="Enter @ to mention a person or chat"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button type="submit" className="chat-send-btn">
                            <MdSend />
                        </button>
                    </form>
                </div>
            </div>
            {showParticipantSelector && (
                <div
                    className="modal-overlay"
                    style={{ zIndex: 12000 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowParticipantSelector(false);
                    }}
                >
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '400px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '20px',
                        padding: '25px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px', fontWeight: '800' }}>
                                {t('chat.selectParticipant', 'Select Participant')}
                            </h3>
                            <MdClose style={{ cursor: 'pointer', fontSize: '24px', color: '#64748b' }} onClick={() => setShowParticipantSelector(false)} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
                            {(() => {
                                const others = [];
                                if (job.userId && job.userId !== loggedInUserId && job.user) others.push(job.user);
                                job.participants?.forEach(p => {
                                    if (p.userId !== loggedInUserId && p.user && !others.some(o => o.id === p.userId)) others.push(p.user);
                                });
                                if (loggedInUserId !== 1 && !others.some(o => o.id === 1)) {
                                    const admin = users.find(u => u.id === 1);
                                    if (admin) others.push(admin);
                                }

                                return others.map(u => (
                                    <div
                                        key={u.id}
                                        onClick={() => setParticipantsToCall([u.id])}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '15px', padding: '12px',
                                            borderRadius: '12px', border: participantsToCall.includes(u.id) ? '2px solid #3d5afe' : '1px solid #e2e8f0',
                                            background: participantsToCall.includes(u.id) ? '#f0f4ff' : 'white',
                                            cursor: 'pointer', transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '50%',
                                            background: '#4374ba', color: 'white', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold'
                                        }}>
                                            {u.fullName?.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{u.fullName}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {u.id}</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={participantsToCall.includes(u.id)}
                                            readOnly
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                    </div>
                                ));
                            })()}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setShowParticipantSelector(false)}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px', background: '#f1f5f9',
                                    border: 'none', color: '#64748b', fontWeight: '800', cursor: 'pointer'
                                }}
                            >
                                {t('profile.cancel')}
                            </button>
                            <button
                                onClick={() => participantsToCall.length > 0 && handleCall(participantsToCall[0])}
                                disabled={participantsToCall.length === 0}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px', background: '#3d5afe',
                                    border: 'none', color: 'white', fontWeight: '800', cursor: 'pointer',
                                    opacity: participantsToCall.length === 0 ? 0.5 : 1,
                                    boxShadow: '0 4px 12px rgba(61, 90, 254, 0.3)'
                                }}
                            >
                                {t('chat.call', 'Call')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {callData && (
                <WebRTCCall
                    {...callData}
                    onHangup={() => setCallData(null)}
                />
            )}
        </div>
    );
}