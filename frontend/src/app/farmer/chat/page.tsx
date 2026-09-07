'use client';

import { useEffect, useRef, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, useAuth, api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Message { role: 'user' | 'assistant'; content: string; timestamp: Date; }
type ContextType = 'advisory' | 'marketplace_search';

export default function ChatPage() {
  const { user, loading } = useRequireRole(['farmer', 'buyer'] as any);
  const { user: authUser } = useAuth();
  const contextType: ContextType = authUser?.role === 'farmer' ? 'advisory' : 'marketplace_search';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = contextType === 'advisory'
    ? ['What fertilizer should I use for tomatoes?', 'How to identify late blight disease?', 'Best time to sow wheat in Maharashtra?', 'PM-KISAN scheme eligibility?']
    : ['Find 500kg Grade A tomatoes under ₹25/kg', 'What onions are available near Pune?', 'Best bulk deals for potatoes this week', 'Show me rice from Tamil Nadu farmers'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    // Load chat history
    api.get(`/ai/chat/history?contextType=${contextType}&limit=10`)
      .then(({ data }) => {
        const msgs: Message[] = data.history.map((h: any) => ({
          role: h.role as 'user' | 'assistant',
          content: h.message,
          timestamp: new Date(h.createdAt),
        }));
        setMessages(msgs);
        // Build Gemini history format
        const ghist = [];
        for (let i = 0; i < msgs.length - 1; i += 2) {
          if (msgs[i] && msgs[i + 1]) {
            ghist.push({ role: 'user', parts: [{ text: msgs[i].content }] });
            ghist.push({ role: 'model', parts: [{ text: msgs[i + 1].content }] });
          }
        }
        setHistory(ghist);
      })
      .catch(() => {});
  }, [user, contextType]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || thinking) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setThinking(true);

    try {
      const { data } = await api.post('/ai/chat', { message: msg, contextType, history });
      const aiMsg: Message = { role: 'assistant', content: data.reply, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      setHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text: msg }] },
        { role: 'model', parts: [{ text: data.reply }] },
      ]);
    } catch {
      toast.error('AI is temporarily unavailable');
    } finally {
      setThinking(false);
    }
  };

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Voice input not supported in this browser');
      return;
    }
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.onresult = (e: any) => setInput(e.results[0][0].transcript);
    recognition.start();
    toast('🎤 Listening...');
  };

  if (loading || !user) return null;

  const botName = contextType === 'advisory' ? '🌿 AgriBot' : '🛒 ShopBot';
  const botDesc = contextType === 'advisory' ? 'AI Crop Advisory Assistant' : 'AI Marketplace Shopping Assistant';

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Chat header */}
        <div className="glass" style={{ padding: '16px 28px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 16, borderRadius: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-moss), var(--color-sage))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            🤖
          </div>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{botName}</h1>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>{botDesc} · Powered by Gemini 3.6 Flash</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span className="badge badge-green" style={{ fontSize: 11 }}>● Online</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🤖</div>
              <h2 className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Hello, {user.name.split(' ')[0]}!</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
                {contextType === 'advisory'
                  ? "I'm your AI crop advisor. Ask me about pest control, weather-based farming advice, government schemes, or anything agriculture!"
                  : "I'll help you find the best produce on the marketplace. Describe what you're looking for and I'll find the perfect match!"}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 600, margin: '0 auto' }}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} className="btn-secondary" style={{ fontSize: 13, padding: '8px 16px' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'} style={{ whiteSpace: 'pre-wrap' }}>
                {m.content}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, padding: '0 4px' }}>
                {m.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}

          {thinking && (
            <div style={{ alignSelf: 'flex-start' }}>
              <div className="chat-bubble-ai" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--color-leaf)', animation: 'pulse-green 1s ease-in-out infinite' }} />
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--color-leaf)', animation: 'pulse-green 1s ease-in-out 0.2s infinite' }} />
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--color-leaf)', animation: 'pulse-green 1s ease-in-out 0.4s infinite' }} />
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 4 }}>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-1)' }}>
          <div style={{ display: 'flex', gap: 10, maxWidth: 900, margin: '0 auto' }}>
            <button onClick={handleVoice} className="btn-secondary" style={{ padding: '12px 14px', flexShrink: 0 }} title="Voice input (Web Speech API)">
              🎤
            </button>
            <input
              className="input-field"
              placeholder={contextType === 'advisory' ? 'Ask about crop care, pest control, schemes...' : 'Describe what produce you need...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={thinking}
            />
            <button className="btn-primary" onClick={() => sendMessage()} disabled={!input.trim() || thinking} style={{ flexShrink: 0 }}>
              Send →
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 8 }}>
            Powered by Google Gemini 3.6 Flash · Press Enter to send · 🎤 Voice input available
          </p>
        </div>
      </main>
    </div>
  );
}
