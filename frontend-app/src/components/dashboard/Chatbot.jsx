import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { FaRobot, FaPaperPlane, FaTimes, FaCommentDots } from 'react-icons/fa';
import '../styles/Chatbot.css';

const Chatbot = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', content: t('chatbot_welcome') }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        const userMessage = { role: 'user', content: message };
        setChatHistory(prev => [...prev, userMessage]);
        setMessage('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:5246/api/Chat/message', {
                message: userMessage.content
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const assistantMessage = { role: 'assistant', content: response.data.reply };
            setChatHistory(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chatbot error:', error);
            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again later.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`chatbot-wrapper ${isOpen ? 'open' : ''}`}>
            {!isOpen && (
                <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
                    <FaCommentDots />
                </button>
            )}

            {isOpen && (
                <div className="chatbot-container">
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <FaRobot className="chatbot-icon" />
                            <span>{t('chatbot_title')}</span>
                        </div>
                        <button className="chatbot-close" onClick={() => setIsOpen(false)}>
                            <FaTimes />
                        </button>
                    </div>

                    <div className="chatbot-messages">
                        {chatHistory.map((msg, index) => (
                            <div key={index} className={`message ${msg.role}`}>
                                <div className="message-content">{msg.content}</div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message assistant loading">
                                <div className="dot-pulse"></div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <form className="chatbot-input-area" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            placeholder={t('chatbot_placeholder')}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !message.trim()}>
                            <FaPaperPlane />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
