'use client';

import { useEffect, useRef, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Message { role: 'user' | 'assistant'; content: string; timestamp: Date; }

export default function BuyerChat() {
  const { user, loading } = useRequireRole('buyer');
  const contextType = 'marketplace_search';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = ['Find 500kg Grade A tomatoes under ₹25/kg', 'Best bulk deals for potatoes this week', 'Show me rice from Tamil Nadu farmers', 'Fresh onions available near Bengaluru'];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!user) return;
    api.get(`/ai/chat/history?contextType=${contextType}&limit=10`)
      .then(({ data }) => {
        const msgs: Message[] = data.history.map((h: any) => ({ role: h.role as 'user' | 'assistant', content: h.message, timestamp: new Date(h.createdAt) }));
        setMessages(msgs);
        const ghist = [];
        for (let i = 0; i < msgs.length - 1; i += 2) {
          if (msgs[i] && msgs[i + 1]) {
            ghist.push({ role: 'user', parts: [{ text: msgs[i].content }] });
            ghist.push({ role: 'model', parts: [{ text: msgs[i + 1].content }] });
          }
        }
        setHistory(ghist);
      }).catch(() => {});
  }, [user]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || thinking) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date() }]);
    setThinking(true);
    try {
      const { data } = await api.post('/ai/chat', { message: msg, contextType, history });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);
      setHistory(prev => [...prev, { role: 'user', parts: [{ text: msg }] }, { role: 'model', parts: [{ text: data.reply }] }]);
    } catch { toast.error('AI temporarily unavailable'); }
    finally { setThinking(false); }
  };

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div className="glass" style={{ padding: '16px 28px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 16, borderRadius: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #4A90D9, #9B59B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛒</div>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>🛒 ShopBot</h1>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>AI Marketplace Shopping Assistant · Powered by Gemini 3.6 Flash</p>
          </div>
          <span className="badge badge-blue" style={{ marginLeft: 'auto', fontSize: 11 }}>● Online</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
              <h2 className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Hello, {user.name.split(' ')[0]}!</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>Tell me what produce you need — I'll search the marketplace and find the best options for you!</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 600, margin: '0 auto' }}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} className="btn-secondary" style={{ fontSize: 13, padding: '8px 16px' }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'} style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, padding: '0 4px' }}>{m.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          ))}
          {thinking && (
            <div style={{ alignSelf: 'flex-start' }}>
              <div className="chat-bubble-ai" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[0, 0.2, 0.4].map((d, i) => <span key={i} style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#4A90D9', animation: `pulse-green 1s ease-in-out ${d}s infinite` }} />)}
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 4 }}>Searching marketplace...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-1)' }}>
          <div style={{ display: 'flex', gap: 10, maxWidth: 900, margin: '0 auto' }}>
            <input className="input-field" placeholder="Describe what produce you need..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} disabled={thinking} />
            <button className="btn-primary" onClick={() => sendMessage()} disabled={!input.trim() || thinking} style={{ flexShrink: 0 }}>Send →</button>
          </div>
        </div>
      </main>
    </div>
  );
}
