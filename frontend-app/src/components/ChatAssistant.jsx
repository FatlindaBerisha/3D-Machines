import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDelete } from "react-icons/md";
import { useTranslation } from 'react-i18next';
import { UserContext } from '../UserContext';
import './styles/ChatAssistant.css';

const ChatAssistant = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useContext(UserContext); // Get user from context
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);

    // Get user name from context
    const getUserName = () => {
        return user?.fullName || user?.email?.split('@')[0] || "";
    };

    // Initialize/Reset chat when User or Language changes
    useEffect(() => {
        const userName = getUserName();
        const welcomeMsg = t('chat.welcomeMessage');
        const personalizedMsg = userName
            ? welcomeMsg.replace("!", `, ${userName}!`)
            : welcomeMsg;
        setMessages([{ id: 1, text: personalizedMsg, sender: 'ai' }]);
    }, [user, t]);

    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Close chat when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (chatRef.current && !chatRef.current.contains(event.target) && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Ensure chat is closed on initial load (login)
    useEffect(() => {
        setIsOpen(false);
    }, []);

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleClearHistory = () => {
        const userName = getUserName();
        const welcomeMsg = t('chat.welcomeMessage');
        const personalizedMsg = userName ? welcomeMsg.replace("!", `, ${userName}!`) : welcomeMsg;
        setMessages([{ id: 1, text: personalizedMsg, sender: 'ai' }]);
        setIsMenuOpen(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage = { id: Date.now(), text: inputText, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInputText("");
        setIsLoading(true);

        try {
            const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
            const response = await fetch('https://localhost:7178/api/chat', { // Updated port to 7178
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ message: userMessage.text }),
            });

            if (!response.ok) {
                const errorData = await response.text(); // or response.json() if your API returns JSON errors
                throw new Error(errorData || `Server error: ${response.status}`);
            }

            const data = await response.json();
            let aiText = data.response;

            // Check for navigation command
            const navMatch = aiText.match(/\[\[NAVIGATE:(.*?)\]\]/);
            if (navMatch) {
                const path = navMatch[1];
                navigate(path);
                // Remove the command from the displayed message so the user doesn't see the raw tag
                aiText = aiText.replace(navMatch[0], "").trim();
            }

            const aiMessage = { id: Date.now() + 1, text: aiText, sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            // Display the actual error message
            const errorMessage = { id: Date.now() + 1, text: `Error: ${error.message}`, sender: 'ai' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    // Helper to format text (Bold **text**)
    const formatMessage = (text) => {
        if (!text) return "";
        const parts = text.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                return <strong key={index}>{part}</strong>;
            }
            return part;
        });
    };

    return (

        <div className="chat-assistant-container" ref={chatRef}>
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <h3>{t('chat.title')}</h3>
                        <div className="header-actions">
                            <div className="menu-container">
                                <button className="icon-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                    <i className="bi bi-three-dots-vertical"></i>
                                </button>
                                {isMenuOpen && (
                                    <div className="chat-dropdown-menu">
                                        <button onClick={handleClearHistory}>
                                            <MdDelete className="delete-icon" /> {t('chat.clearHistory')}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button className="icon-btn close-btn" onClick={() => setIsOpen(false)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                    </div>
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <React.Fragment key={msg.id}>
                                <div className={`message ${msg.sender}`}>
                                    {formatMessage(msg.text)}
                                </div>
                                {index === 0 && messages.length === 1 && (
                                    <div className="suggestions-container">
                                        {(() => {
                                            const role = user?.role || "guest";
                                            const suggestionObj = t('chat.suggestions', { returnObjects: true });
                                            const activeSuggestions = suggestionObj[role] || suggestionObj["guest"] || {};

                                            return Object.entries(activeSuggestions).map(([key, value]) => {
                                                const label = typeof value === 'object' ? value.label : value;
                                                const question = typeof value === 'object' ? value.question : value;
                                                return (
                                                    <button
                                                        key={key}
                                                        className="suggestion-chip"
                                                        onClick={() => setInputText(question)}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                        {isLoading && (
                            <div className="message ai">
                                <div className="typing-indicator">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-input-area">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder={t('chat.placeholder')}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                        />
                        <button className="send-btn" onClick={handleSendMessage} disabled={isLoading || !inputText.trim()}>
                            <i className="bi bi-send-fill"></i>
                        </button>
                    </div>
                </div>
            )}
            {!isOpen && (
                <button className="chat-fab" onClick={() => setIsOpen(true)}>
                    <i className="bi bi-chat-dots-fill"></i>
                </button>
            )}
        </div>
    );
};

export default ChatAssistant;
