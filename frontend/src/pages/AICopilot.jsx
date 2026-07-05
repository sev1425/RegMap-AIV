import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Trash2, Wifi, WifiOff, ShieldCheck, User } from "lucide-react";
import { useCopilot } from "../hooks/useCopilot";
import "./AICopilot.css";

export default function AICopilot() {
    const { messages, loading, error, sendMessage, clearConversation } = useCopilot();
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleSend = () => {
        if (!input.trim() || loading) return;
        sendMessage(input.trim());
        setInput("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestion = (q) => {
        if (loading) return;
        sendMessage(q);
    };

    const getConfidenceClass = (conf) => {
        if (!conf) return "";
        if (conf >= 80) return "confidence-high";
        if (conf >= 60) return "confidence-medium";
        return "confidence-low";
    };

    return (
        <div className="copilot-page">
            {/* Header */}
            <div className="copilot-header glass-panel">
                <div className="copilot-header-left">
                    <h1 className="h2">Enterprise AI Copilot</h1>
                    <p className="body">Ask questions about your uploaded regulatory documents in natural language.</p>
                </div>
                <div className="copilot-header-right">
                    <div className="status-badge" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                        <WifiOff size={14} />
                        OFFLINE MODE
                    </div>
                    <div className="status-badge" style={{ background: "var(--accent-subtle)", color: "var(--accent-primary)", border: "1px solid var(--accent-border)" }}>
                        <ShieldCheck size={14} />
                        ENTERPRISE SECURE
                    </div>
                </div>
            </div>

            {/* Chat Window */}
            <div className="copilot-window glass-panel">
                <div className="chat-messages">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                                className={`message-row ${msg.role === "user" ? "user" : "ai"}`}
                            >
                                {/* Avatar */}
                                <div className={`message-avatar ${msg.role === "user" ? "user" : "ai"}`}>
                                    {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                                </div>

                                {/* Body */}
                                <div className="message-body">
                                    <div className="message-bubble">{msg.content}</div>

                                    {/* AI meta: confidence + offline badge */}
                                    {msg.role === "assistant" && msg.confidence !== null && (
                                        <div className="message-meta">
                                            <span className={`meta-badge ${getConfidenceClass(msg.confidence)}`}>
                                                {msg.confidence}% Confidence
                                            </span>
                                            <span className="meta-badge default">
                                                <Wifi size={12} /> Local Vector Engine
                                            </span>
                                        </div>
                                    )}

                                    {/* Citations */}
                                    {msg.role === "assistant" && msg.citations?.length > 0 && (
                                        <div className="citations-section">
                                            <div className="citations-label">Source References</div>
                                            <div className="citations-list">
                                                {msg.citations.map((c, i) => (
                                                    <div className="citation-item" key={i}>
                                                        {c}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Suggested follow-ups */}
                                    {msg.role === "assistant" && msg.suggestedQuestions?.length > 0 && (
                                        <div className="suggested-questions">
                                            {msg.suggestedQuestions.map((q, i) => (
                                                <motion.button
                                                    key={i}
                                                    className="suggestion-chip"
                                                    onClick={() => handleSuggestion(q)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    {q}
                                                </motion.button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Typing Indicator */}
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="message-row ai"
                        >
                            <div className="message-avatar ai">
                                <Bot size={20} />
                            </div>
                            <div className="typing-indicator-bubble">
                                <motion.div className="typing-dot" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                                <motion.div className="typing-dot" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                                <motion.div className="typing-dot" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                            </div>
                        </motion.div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="error-banner">
                            {error}
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="copilot-input-container">
                    <div className="copilot-input-bar">
                        <textarea
                            className="copilot-input"
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask RegMap AI anything... (Press Enter to send)"
                            disabled={loading}
                        />
                        <div className="input-actions">
                            <motion.button
                                className="action-btn clear-btn"
                                onClick={clearConversation}
                                title="Clear conversation"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <Trash2 size={18} />
                            </motion.button>
                            <motion.button
                                className="action-btn send-btn"
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                title="Send message"
                                whileHover={!(!input.trim() || loading) ? { scale: 1.1 } : {}}
                                whileTap={!(!input.trim() || loading) ? { scale: 0.9 } : {}}
                            >
                                <Send size={18} />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
