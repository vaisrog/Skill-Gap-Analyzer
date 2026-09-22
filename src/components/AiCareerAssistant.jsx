import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  HelpCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export const AiCareerAssistant = ({ isOpen, onClose, initialQuestion = '' }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your career advisor assistant. I can help explain your skill gap priorities, evaluate your role readiness, or suggest targeted learning strategies based on your profile data.',
      mode: 'ai_powered',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const promptSuggestions = [
    'What should I learn next?',
    'Am I ready for entry-level roles?',
    'Why is my top skill prioritized?',
    'What are my strongest skills?',
  ];

  useEffect(() => {
    if (initialQuestion && initialQuestion.trim().length > 0) {
      handleSend(initialQuestion);
    }
  }, [initialQuestion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText) => {
    const query = (questionText || input).trim();
    if (!query || loading) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/career-guidance', { question: query });
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: res.data.answer,
          mode: res.data.mode,
          context: res.data.context_summary,
        },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            'AI guidance is currently operating in offline mode. Your verified skill analysis, recommendations, and roadmaps remain fully available in your dashboard.',
          mode: 'offline_deterministic',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl h-[640px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-200">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-wide">AI Career Advisor</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/40 text-indigo-100 border border-indigo-300/30">
                  Grounded in Your Data
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Objective guidance based on your real skills & benchmarks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/60">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line prose prose-xs max-w-none">
                    {msg.content}
                  </div>

                  {!isUser && msg.mode === 'offline_deterministic' && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Guidance generated in offline deterministic mode</span>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-slate-500 italic p-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Analyzing your career benchmarks and formulating guidance...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Suggested:</span>
          {promptSuggestions.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-full text-[11px] font-medium text-slate-700 hover:text-indigo-600 transition whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your skills, roadmap, or target role..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <p className="text-[10px] text-slate-400 text-center mt-1.5">
            Guidance is anchored strictly to your recorded skills and does not guarantee employment.
          </p>
        </div>
      </div>
    </div>
  );
};
