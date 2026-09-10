import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Button, Card, Input } from './common';
import { aiAPI } from '../services/api';

const AIChat = ({ title }) => {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const sendMessage = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    const currentMessage = message.trim(); setMessage(''); setError(''); setLoading(true);
    try { const response = await aiAPI.chat(currentMessage); setConversation((items) => [...items, { user: currentMessage, ai: response.data.data.aiMessage }]); } catch (requestError) { setError(requestError.response?.data?.message || 'AI service is unavailable. Configure GROQ_API_KEY on the server.'); } finally { setLoading(false); }
  };
  return <Card className="mx-auto max-w-3xl"><div className="flex items-center gap-3"><MessageSquare className="text-indigo-500" /><div><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-gray-500">Ask about attendance records and trends.</p></div></div><div className="mt-6 min-h-48 space-y-4">{conversation.length === 0 && <p className="py-12 text-center text-sm text-gray-500">Ask your first attendance question.</p>}{conversation.map((item, index) => <div key={`${item.user}-${index}`} className="space-y-2"><p className="rounded-lg bg-indigo-50 p-3 text-sm dark:bg-indigo-950/40"><strong>You:</strong> {item.user}</p><p className="rounded-lg bg-gray-100 p-3 text-sm dark:bg-slate-900"><strong>AttendanceAI:</strong> {item.ai}</p></div>)}</div>{error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<form onSubmit={sendMessage} className="flex items-end gap-2"><Input label="Question" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="How is my attendance this month?" /><Button type="submit" disabled={loading} isLoading={loading}><Send size={16} /> Send</Button></form></Card>;
};

export default AIChat;