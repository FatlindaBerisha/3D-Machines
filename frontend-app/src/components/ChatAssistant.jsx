import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './styles/ChatAssistant.css';

const ChatAssistant = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi! I'm your AI assistant. How can I help you regarding 3D Machines today?", sender: 'ai' }
    ]);
    // Effect to update the welcome message when language changes
    useEffect(() => {
        setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0 && newMessages[0].id === 1) {
                // Get user name from localStorage
                let userName = "";
                try {
                    const userStr = localStorage.getItem("user");
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        userName = user.fullName ? ` ${user.fullName}` : "";
                    }
                } catch (e) {
                    console.error("Error parsing user from storage", e);
                }

                // Personalized welcome message
                newMessages[0].text = t('chat.welcomeMessage').replace("!", `${userName}!`);
            }
            return newMessages;
        });
    }, [t]);

    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

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
            const aiMessage = { id: Date.now() + 1, text: data.response, sender: 'ai' };
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
        // Split by **bold** markers
        const parts = text.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, index) => {
            // Odd indices are the captured groups (bold text)
            if (index % 2 === 1) {
                return <strong key={index}>{part}</strong>;
            }
            return part;
        });
    };

    return (

        <div className="chat-assistant-container">
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <h3>{t('chat.title')}</h3>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>
                            <i className="bi bi-x-lg"></i>
                        </button>
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
                                            const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
                                            let role = "guest";
                                            if (userStr) {
                                                try {
                                                    role = JSON.parse(userStr).role || "user";
                                                } catch (e) {
                                                    role = "guest";
                                                }
                                            }
                                            const suggestionObj = t('chat.suggestions', { returnObjects: true });
                                            const activeSuggestions = suggestionObj[role] || suggestionObj["guest"] || {};

                                            return Object.entries(activeSuggestions).map(([key, value]) => (
                                                <button
                                                    key={key}
                                                    className="suggestion-chip"
                                                    onClick={() => setInputText(value)}
                                                >
                                                    {value}
                                                </button>
                                            ));
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
            <button className="chat-fab" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <i className="bi bi-x-lg"></i> : <i className="bi bi-chat-dots-fill"></i>}
            </button>
        </div>
    );
};

export default ChatAssistant;
