import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import api from '../../api/axios';

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi! I am your Smart Campus AI Assistant. Ask me anything about your schedule, attendance, grades, or outstanding fees!", isBot: true }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const quickQuestions = [
        "What is my attendance?",
        "Do I have any pending fees?",
        "What is my exam result?",
        "Do I have classes today?"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (textToSend) => {
        const msg = textToSend || input;
        if (!msg.trim()) return;

        // Add user message
        setMessages(prev => [...prev, { text: msg, isBot: false }]);
        if (!textToSend) setInput('');
        setLoading(true);

        try {
            const res = await api.post('ai/chatbot/', { message: msg });
            setMessages(prev => [...prev, { text: res.data.reply, isBot: true, mode: res.data.mode }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { text: "Sorry, I encountered an error checking our campus database. Please try again.", isBot: true }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Toggle Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center group relative"
                >
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <MessageSquare className="w-6 h-6 animate-pulse" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="w-80 sm:w-96 h-[480px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 backdrop-blur-md bg-opacity-95">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between shadow-md">
                        <div className="flex items-center space-x-2.5">
                            <div className="bg-white/10 p-1.5 rounded-lg text-white">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm tracking-wide text-white flex items-center">
                                    Campus AI Copilot
                                    <Sparkles className="w-3.5 h-3.5 ml-1 text-yellow-300 fill-yellow-300" />
                                </h3>
                                <p className="text-[10px] text-blue-100 font-medium">Online • Connected to DB</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="text-blue-100 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
                        {messages.map((m, idx) => (
                            <div key={idx} className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                                    m.isBot 
                                        ? 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50' 
                                        : 'bg-blue-600 text-white rounded-tr-none'
                                }`}>
                                    <p className="whitespace-pre-line">{m.text}</p>
                                    {m.isBot && m.mode && (
                                        <span className="text-[8px] block mt-1 text-slate-500 uppercase tracking-widest font-mono">
                                            Engine: {m.mode === 'openai' ? 'OpenAI GPT' : 'Campus Rule DB'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 text-slate-400 rounded-2xl rounded-tl-none p-3 text-xs flex items-center space-x-2 border border-slate-700/50">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                                    <span>Scanning student databases...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggestions */}
                    {messages.length === 1 && (
                        <div className="p-3 border-t border-slate-800 bg-slate-900/50">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Try asking:</p>
                            <div className="grid grid-cols-2 gap-1.5">
                                {quickQuestions.map((q, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleSend(q)}
                                        className="text-left text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg border border-slate-700/30 transition-all text-ellipsis overflow-hidden whitespace-nowrap"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer Input */}
                    <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask me something..."
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-600 placeholder-slate-500 transition-colors"
                        />
                        <button 
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white p-2 rounded-xl transition-all flex items-center justify-center"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIChatbot;
