
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';
import { getChatResponse } from '../services/geminiService';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string, sender: 'bot' | 'user' }[]>([
    { text: "Hello! I'm BloodLife Assistant. How can I help you with blood donation today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setIsTyping(true);

    try {
      const response = await getChatResponse(userMsg, []);
      setMessages(prev => [...prev, { text: response || "I'm sorry, I couldn't process that.", sender: 'bot' }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: "Connection issue. Please try again later.", sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-rose-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-rose-700 transition-all z-50 animate-bounce"
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-h-[600px] h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col z-[60] border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-10">
          {/* Header */}
          <div className="bg-rose-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Bot size={20} />
              </div>
              <div>
                <p className="font-bold">BloodLife AI</p>
                <p className="text-xs opacity-80">Always active</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  m.sender === 'user' 
                    ? 'bg-rose-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none text-xs text-slate-400">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about donation eligibility..."
                className="flex-1 px-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                onClick={handleSend}
                className="bg-rose-600 text-white p-2 rounded-xl hover:bg-rose-700 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
