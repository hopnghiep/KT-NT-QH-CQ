
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Icon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const GeminiChat: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInstance = useRef<Chat | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initChat = () => {
    if (!chatInstance.current) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatInstance.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: language === 'vi' 
            ? "Bạn là chuyên gia tư vấn AI trong hệ sinh thái AICOMPLEX. Bạn am hiểu sâu sắc về kiến trúc, nội thất, quy hoạch và phong thủy. Hãy trả lời ngắn gọn, chuyên nghiệp và hữu ích cho các kiến trúc sư."
            : "You are an AI Architecture consultant in the AICOMPLEX ecosystem. You have deep knowledge of architecture, interior design, urban planning, and feng shui. Provide concise, professional, and helpful answers for architects.",
        },
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    initChat();
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response: GenerateContentResponse = await chatInstance.current!.sendMessage({ message: userMsg });
      const modelText = response.text || (language === 'vi' ? "Tôi xin lỗi, có lỗi xảy ra." : "I'm sorry, an error occurred.");
      setMessages(prev => [...prev, { role: 'model', text: modelText }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: language === 'vi' ? "Lỗi kết nối API. Vui lòng kiểm tra lại." : "API connection error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        className="fixed bottom-8 right-8 z-[100] w-16 h-16 bg-orange-600 hover:bg-orange-500 text-white rounded-full shadow-[0_10px_40px_rgba(234,88,12,0.4)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
      >
        <Icon name="sparkles" className="w-8 h-8 group-hover:animate-pulse" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 animate-bounce"></div>
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-8 right-8 z-[100] flex flex-col bg-[#1c1c1c] border border-white/10 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-all duration-300 overflow-hidden ${
        isMinimized ? 'h-16 w-64' : 'h-[600px] w-96 md:w-[450px]'
      }`}
    >
      {/* Header */}
      <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-gradient-to-r from-orange-600/20 to-transparent border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
            <Icon name="sparkles" className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-white">Gemini AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMinimized(!isMinimized)} 
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Icon name={isMinimized ? "arrow-up-circle" : "minus"} className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
          >
            <Icon name="x-circle" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      {!isMinimized && (
        <>
          <div className="flex-grow overflow-y-auto p-6 space-y-6 thin-scrollbar bg-[#141414]">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 px-4">
                <Icon name="globe" className="w-12 h-12 mb-4 text-slate-500" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  {language === 'vi' ? 'Chào kiến trúc sư! Tôi có thể giúp gì cho bạn hôm nay?' : 'Hello Architect! How can I assist you today?'}
                </p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-orange-600 text-white rounded-tr-none shadow-lg' 
                    : 'bg-[#2a2a2a] text-slate-200 rounded-tl-none border border-white/5 shadow-inner'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-[#2a2a2a] p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#1c1c1c] border-t border-white/5">
            <div className="relative flex items-center gap-2">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={language === 'vi' ? "Hỏi Gemini về dự án của bạn..." : "Ask Gemini about your project..."}
                className="w-full bg-[#2a2a2a] border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm text-white outline-none focus:border-orange-500/50 shadow-inner transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 p-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-all disabled:opacity-20 active:scale-90"
              >
                <Icon name="arrow-up-tray" className="w-4 h-4 rotate-90" />
              </button>
            </div>
            <p className="text-[9px] text-center text-slate-600 font-bold uppercase tracking-widest mt-3">
              AICOMPLEX INTELLIGENT ASSISTANT
            </p>
          </div>
        </>
      )}
    </div>
  );
};
