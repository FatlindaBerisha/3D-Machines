import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { getToken } from "../../../utils/storage";
import api from "../../../utils/axiosClient";
import "../../styles/PrintLog.css";
import { MdClose, MdSend, MdAttachFile, MdInsertEmoticon, MdCall, MdSearch, MdCheck, MdPushPin, MdWarning, MdLabel, MdSettings } from "react-icons/md";
import { IoPencil, IoTrash } from "react-icons/io5";
import { HiClock, HiCog, HiPrinter, HiSparkles, HiCheckCircle, HiExclamationCircle } from "react-icons/hi2";
import { jwtDecode } from "jwt-decode";
import { useTranslation } from "react-i18next";
import classNames from 'classnames';
import EmojiPicker from 'emoji-picker-react';

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
    const [isCalling, setIsCalling] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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

    const onEmojiClick = (emojiObject) => {
        setNewComment(prev => prev + emojiObject.emoji);
    };

    // Auto-scroll chat
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
            // Auto-log start
            await api.post(`/printjob/${jobId}/comments`, {
                text: t('systemMessages.taskStarted'),
                tag: "System"
            });
            fetchJobDetails();
            onUpdate();
        } catch (err) { toast.error("Failed to start job"); }
    }

    async function handlePause() {
        try {
            await api.post(`/printjob/${jobId}/pause`);
            // Auto-log pause
            await api.post(`/printjob/${jobId}/comments`, {
                text: t('systemMessages.taskPaused'),
                tag: "System"
            });
            fetchJobDetails();
            onUpdate();
        } catch (err) { toast.error("Failed to pause job"); }
    }

    async function handleFinish() {
        try {
            await api.post(`/printjob/${jobId}/finish`);
            // Auto-log finish
            await api.post(`/printjob/${jobId}/comments`, {
                text: t('systemMessages.taskCompleted'),
                tag: "System"
            });
            fetchJobDetails();
            onUpdate();
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
            toast.success("Participant added");
            setSelectedUser("");
            fetchJobDetails();
        } catch (err) { toast.error("Failed to add participant"); }
    }

    async function handleRemoveParticipant(userId) {
        if (!window.confirm("Remove this participant?")) return;
        try {
            await api.delete(`/printjob/${jobId}/participants/${userId}`);
            toast.success("Participant removed");
            fetchJobDetails();
        } catch (err) { toast.error("Failed to remove participant"); }
    }

    const handleCall = () => {
        const others = [];
        if (job.user && job.user.id !== loggedInUserId) others.push(job.user);
        job.participants?.forEach(p => {
            if (p.user && p.user.id !== loggedInUserId) others.push(p.user);
        });

        if (others.length > 0) {
            const person = others[0];
            if (person.phone) {
                window.location.href = `tel:${person.phone}`;
                toast.success(`Calling ${person.fullName}...`);
            } else {
                toast.info(`${person.fullName} has no phone number recorded.`);
            }
        } else {
            toast.info("No other participants to call.");
        }
    };

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

    async function handleUpdateDescription() {
        try {
            await api.put(`/printjob/${jobId}`, {
                id: jobId,
                jobName: job.jobName,
                filamentId: job.filamentId,
                status: job.status,
                duration: job.duration,
                description: editedDescription
            });
            setIsEditingDescription(false);
            fetchJobDetails();
            onUpdate();
            toast.success("Description updated");
        } catch (err) { toast.error("Failed to update description"); }
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
            toast.success("Print Phase updated");
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

    if (loading) return (
        <div className="modal-overlay">
            <div className="loading-spinner" style={{ color: 'white', fontSize: '20px' }}>Loading...</div>
        </div>
    );
    if (!job) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="details-modal-split" onClick={(e) => e.stopPropagation()}>
                {/* LEFT PANEL: DETAILS */}
                <div className="details-left-panel">
                    <div className="details-left-header">
                        <h2>{job.jobName}</h2>
                        <p>{job.filament?.name || "No Filament"} • Created on {new Date(job.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* OWNER CHECK FOR EDITING */}
                    {(() => {
                        const isOwner = loggedInUserId === job.userId;

                        return (
                            <>
                                <div className="job-description-box" style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #4374ba', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                        <h4 style={{ margin: 0, fontSize: '13px', color: '#64748b', textTransform: 'uppercase' }}>{t('filaments.description')}</h4>
                                        {isOwner && (
                                            !isEditingDescription ? (
                                                <IoPencil
                                                    style={{ cursor: 'pointer', color: '#64748b' }}
                                                    onClick={() => setIsEditingDescription(true)}
                                                />
                                            ) : (
                                                <MdCheck
                                                    style={{ cursor: 'pointer', color: '#48bb78', fontSize: '18px' }}
                                                    onClick={handleUpdateDescription}
                                                />
                                            )
                                        )}
                                    </div>
                                    {isEditingDescription ? (
                                        <textarea
                                            value={editedDescription}
                                            onChange={(e) => setEditedDescription(e.target.value)}
                                            style={{
                                                width: '100%',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                padding: '8px',
                                                fontSize: '14px',
                                                fontFamily: 'inherit',
                                                minHeight: '60px'
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        <p style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap', color: job.description ? '#1e293b' : '#94a3b8', fontStyle: job.description ? 'normal' : 'italic' }}>
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
                                        <span className="info-label">{t('task.created')}:</span>
                                        <div className="info-value">
                                            <MdCheck style={{ color: '#4374ba', marginRight: '5px' }} />
                                            {new Date(job.createdAt).toLocaleString(i18n.language === 'sq' ? 'sq-AL' : i18n.language === 'de' ? 'de-DE' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}  / ID: {job.id}
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
                                                {(loggedInUserRole === 'admin' || loggedInUserId === job.userId) && (
                                                    <MdClose
                                                        className="remove-participant-icon"
                                                        onClick={() => handleRemoveParticipant(p.user.id)}
                                                        title="Remove participant"
                                                    />
                                                )}
                                            </div>
                                        ))}

                                        {(loggedInUserId === job.userId || loggedInUserRole === 'admin') && (
                                            <div className="add-participant-wrapper">
                                                <button className="add-participant-btn" onClick={() => document.getElementById('user-select').focus()}>
                                                    + {t('task.add')}
                                                </button>
                                                <select
                                                    id="user-select"
                                                    className="user-select-dropdown"
                                                    value={selectedUser}
                                                    onChange={(e) => {
                                                        setSelectedUser(e.target.value);
                                                        // Auto add on select
                                                        if (e.target.value) handleAddParticipant(e.target.value);
                                                    }}
                                                >
                                                    <option value="">{t('task.selectUser')}</option>
                                                    {users.filter(u => !job.participants?.some(p => p.userId === u.id) && u.id !== job.userId).map(u => (
                                                        <option key={u.id} value={u.id}>{u.fullName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
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
                                <div className="print-phase-section" style={{ marginTop: '12px', padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
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



                    {/* ACTION BAR */}
                    <div className="left-action-bar">
                        {/* ONLY OWNER CAN START/STOP */}
                        {loggedInUserId === job.userId && (
                            <>
                                {job.status === "Pending" && (
                                    <button className="start-btn" onClick={handleStart}>{t('task.start')}</button>
                                )}
                                {job.status === "In Progress" && (
                                    <>
                                        <button className="pause-btn" onClick={handlePause}>{t('task.pause')}</button>
                                        <button className="finish-btn" onClick={handleFinish}>{t('task.complete')}</button>
                                    </>
                                )}
                                {job.status === "Paused" && (
                                    <>
                                        <button className="start-btn" onClick={handleStart}>{t('task.resume')}</button>
                                        <button className="finish-btn" onClick={handleFinish}>{t('task.complete')}</button>
                                    </>
                                )}
                            </>
                        )}
                        {job.status === "Completed" && (
                            <div style={{ width: '100%', textAlign: 'center', color: '#48bb78', fontWeight: 'bold' }}>
                                {t('task.completedAt')} {new Date(job.endTime).toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: CHAT */}
                <div className="details-right-panel">
                    <div className="chat-header">
                        <h3>
                            <span style={{ marginRight: '10px' }}>{t('task.chat')}</span>
                            <span style={{ fontSize: '12px', color: '#777', fontWeight: 'normal' }}>
                                {job.participants ? job.participants.length + 1 : 1} {t('task.members')}
                            </span>
                        </h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <MdCall
                                style={{ color: '#0088cc', fontSize: '20px', cursor: 'pointer' }}
                                onClick={handleCall}
                                title="Start a call"
                            />
                            <MdSearch style={{ color: '#777', fontSize: '20px', cursor: 'pointer' }} />
                        </div>
                    </div>

                    <div className="chat-stream">
                        {/* Auto-generated welcome or start message could go here */}

                        {/* Group comments by Date */}
                        {(() => {
                            const grouped = {};
                            job.comments?.forEach(c => {
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
                                            return (
                                                <div key={c.id} className="chat-system-row">
                                                    <span className="system-user-badge">{c.user?.fullName}</span>
                                                    <span className="system-text">{c.text}</span>
                                                    <span className="system-time">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                                                        {c.user?.fullName?.charAt(0) || "U"}
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

                                                                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.4' }}>{c.text}</div>

                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', gap: '10px' }}>
                                                                    <span className="chat-meta" style={{ fontSize: '10px', opacity: 0.7 }}>
                                                                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                    <div className="bubble-actions" style={{ display: 'flex', gap: '4px', opacity: 0.6 }}>
                                                                        {isMe && (
                                                                            <>
                                                                                <IoPencil
                                                                                    style={{ cursor: 'pointer', fontSize: '14px', color: '#007aff' }}
                                                                                    onClick={() => { setEditingCommentId(c.id); setEditedCommentText(c.text); }}
                                                                                />
                                                                                <IoTrash
                                                                                    style={{ cursor: 'pointer', fontSize: '14px', color: '#ff3b30' }}
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
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            {showEmojiPicker && (
                                <div style={{ position: 'absolute', bottom: '45px', left: '0', zIndex: 999 }}>
                                    <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} emojiStyle="apple" />
                                </div>
                            )}
                            <MdInsertEmoticon
                                style={{ color: '#888', fontSize: '24px', cursor: 'pointer' }}
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            />
                        </div>
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
        </div>
    );
}