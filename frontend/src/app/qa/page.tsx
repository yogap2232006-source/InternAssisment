"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function QAPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! I am your AI Librarian. Ask me any question about the books in our database." }
  ]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage: Message = { role: "user", content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage.content })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "ai", content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: "ai", content: "Sorry, I encountered an error. Please try again." }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "ai", content: "Failed to connect to the backend server." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[80vh] border border-slate-800 bg-slate-950/80 rounded-3xl overflow-hidden shadow-2xl relative">
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>
      
      <div className="p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 text-transparent bg-clip-text">Library Assistant</h1>
          <p className="text-xs text-slate-400">Powered by Claude & RAG Vectors</p>
        </div>
        <Link href="/" className="text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
          Exit Chat
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-5 rounded-2xl ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700 shadow-md prose prose-invert prose-p:leading-relaxed prose-sm'
            }`}>
              {m.role === 'ai' ? (
                <ReactMarkdown>{m.content}</ReactMarkdown>
              ) : (
                <p>{m.content}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-5 rounded-2xl bg-slate-800 text-slate-400 rounded-bl-none border border-slate-700">
              <span className="flex items-center gap-2 text-sm">
                 <span className="animate-pulse h-2 w-2 bg-indigo-400 rounded-full"></span>
                 <span className="animate-pulse h-2 w-2 bg-indigo-400 rounded-full delay-75"></span>
                 <span className="animate-pulse h-2 w-2 bg-indigo-400 rounded-full delay-150"></span>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-900/80 border-t border-slate-800 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about a book, genre, or recommendation..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-5 pr-14 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm placeholder:text-slate-500 shadow-inner"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-lg disabled:opacity-50 transition-colors font-medium flex items-center justify-center"
          >
            &rarr;
          </button>
        </form>
      </div>
    </div>
  );
}
