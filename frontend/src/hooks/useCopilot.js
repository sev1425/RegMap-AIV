import { useState, useCallback, useEffect } from 'react';
import { querycopilot, getHistory, clearHistory } from '../api/copilotApi';

export function useCopilot() {
    const defaultWelcome = {
        role: 'assistant',
        content: "Hello! I'm RegMap AI, your enterprise regulatory intelligence assistant. I can answer questions about compliance scores, obligations, risks, deadlines, and more. What would you like to know?",
        confidence: null,
        citations: [],
        suggestedQuestions: [
            "What is the compliance score?",
            "List all high risks",
            "What are the upcoming deadlines?",
            "Summarize the document"
        ]
    };

    const [messages, setMessages] = useState([defaultWelcome]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadHistory = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getHistory();
            if (res.status === 'success' && res.history && res.history.length > 0) {
                // Prepend welcome message if not already there or just map DB history
                const mapped = res.history.map(m => ({
                    role: m.role,
                    content: m.content,
                    confidence: null,
                    citations: [],
                    suggestedQuestions: []
                }));
                setMessages([defaultWelcome, ...mapped]);
            }
        } catch (err) {
            console.error("Failed to load Copilot history", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const sendMessage = useCallback(async (query) => {
        if (!query.trim()) return;

        const userMessage = { role: 'user', content: query };
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);
        setError(null);

        try {
            const result = await querycopilot(query);

            const assistantMessage = {
                role: 'assistant',
                content: result.response,
                confidence: result.confidence,
                citations: result.citations || [],
                suggestedQuestions: result.suggested_questions || []
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            setError(err.message || 'Failed to get response from AI Copilot');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'I encountered an error processing your query. Please try again.',
                confidence: null,
                citations: [],
                suggestedQuestions: []
            }]);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearConversation = useCallback(async () => {
        try {
            await clearHistory();
            setMessages([defaultWelcome]);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to clear conversation');
        }
    }, []);

    return {
        messages,
        loading,
        error,
        sendMessage,
        clearConversation
    };
}
