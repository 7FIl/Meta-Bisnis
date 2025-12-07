"use client";

import React, { useEffect, useRef, useState } from "react";
import { saveUserSettings, getUserSettings } from '@/lib/userSettings';

export default function MenuChatAI({ businessName, onSend, userId }) {
  const [topic, setTopic] = useState("analysis"); // 'analysis' | 'finance' | 'sales'
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // {id, role, text, topic}
  const [loading, setLoading] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false); // Toggle untuk web search
  const [toast, setToast] = useState("");
  const toastRef = useRef(null);
  const listRef = useRef(null);
  const saveTimerRef = useRef(null);
  const loadedRef = useRef(false); // Track if history has been loaded in this mount
  const messagesRef = useRef(messages); // Keep reference to latest messages for unmount save

  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    return () => {
      clearTimeout(toastRef.current);
      clearTimeout(saveTimerRef.current);
      
      // Save immediately on unmount if there are unsaved messages
      if (userId && messagesRef.current.length > 0 && loadedRef.current) {
        saveUserSettings(userId, {
          chatHistory: messagesRef.current,
          lastChatUpdate: new Date().toISOString(),
        }).catch(err => {
          console.error('Failed to save chat history on unmount:', err);
        });
      }
    };
  }, [userId]);

  // Load chat history from Firebase on mount (always reload when component mounts)
  useEffect(() => {
    if (userId && !loadedRef.current) {
      loadChatHistory();
      loadedRef.current = true;
    }
    
    // Reset on unmount so it reloads on next mount
    return () => {
      loadedRef.current = false;
    };
  }, [userId]);

  // Auto-save chat history with debounce
  useEffect(() => {
    if (!userId || messages.length === 0 || !loadedRef.current) return;

    // Clear previous timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Debounce: save after 2 seconds of no changes
    saveTimerRef.current = setTimeout(() => {
      saveChatHistory();
    }, 2000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [messages, userId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(""), 2500);
  };

  const sampleReplyFor = (t, prompt) => {
    if (t === "finance") {
      return `Rekomendasi Keuangan singkat untuk "${prompt || businessName}": pisahkan catatan harian, alokasikan cadangan kas ~20%, tinjau margin per produk tiap minggu, dan coba bundling untuk menaikkan AOV.`;
    }
    if (t === "sales") {
      return `Strategi Penjualan untuk "${prompt || businessName}": fokus kanal lokal (IG/marketplace), promo hari rendah trafik, coba bundling dan testimonial untuk konversi.`;
    }
    return `Analisis singkat untuk "${prompt || businessName}": periksa pola minggu terakhir, identifikasi hari puncak, perkuat diferensiasi produk, dan benahi harga jika kompetitor menekan pasar.`;
  };

  const sendToAI = async ({ topic, prompt, history = [] }) => {
    // If parent provided onSend, use it (allows server-side/openai integration)
    if (onSend) {
      return await onSend({ topic, prompt, history, useWebSearch });
    }
    
    // Build payload (compatible with server route)
    const canned = sampleReplyFor(topic, prompt);
    const payload = {
      message: prompt,
      messages: [
        ...history.map((m) => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.text,
        })),
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 800,
      temperature: 0.7,
      topic,
      useWebSearch, // Include web search flag
    };

    // Use absolute URL to avoid issues when app runs under a basePath or proxy
    const url = typeof window !== 'undefined' ? new URL('/api/chat', window.location.origin).href : '/api/chat';

    // POST to server and let HTTP errors propagate so UI can show status/details
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let bodyText = '';
      try { bodyText = await res.text(); } catch (e) { bodyText = String(e); }
      throw new Error(`AI proxy returned ${res.status}: ${bodyText}`);
    }

    const data = await res.json().catch((e) => {
      console.error('Failed to parse /api/chat JSON', e);
      return null;
    });

    // Prefer backend's structured field, otherwise parse reply or use canned
    if (data && data.structured && typeof data.structured === 'object') {
      if (data.structured.summary) return { text: data.structured.summary };
      return { text: JSON.stringify(data.structured) };
    }

    const reply = data?.reply || '';
    try {
      const parsed = JSON.parse(reply);
      if (parsed && parsed.text) return { text: parsed.text };
      if (parsed && parsed.name) return { text: parsed.description || JSON.stringify(parsed) };
    } catch (e) {
      // not JSON — continue
    }

    // Final fallback: if server didn't error but didn't return usable reply
    return { text: reply || canned };
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg = { id: `u-${Date.now()}`, role: "user", text: trimmed, topic };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await sendToAI({ topic, prompt: trimmed, history: nextHistory });
      const aiText = (res && res.text) ? res.text : String(res || "");
      const aiMsg = { id: `a-${Date.now()}`, role: "ai", text: aiText, topic };
      const updatedMessages = [...nextHistory, aiMsg];
      setMessages(updatedMessages);
      
      // Save immediately after successful message
      if (userId) {
        saveChatHistory(updatedMessages);
      }
    } catch (err) {
      const msg = String(err?.message || 'Terjadi kesalahan saat memanggil AI.');
      const errorMessages = [
        ...nextHistory,
        { id: `a-err-${Date.now()}`, role: "ai", text: msg, topic },
      ];
      setMessages(errorMessages);
      showToast(msg);
      
      // Save even error messages
      if (userId) {
        saveChatHistory(errorMessages);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = (q) => setInput(q);

  const loadChatHistory = async () => {
    if (!userId) return;
    
    try {
      const userData = await getUserSettings(userId);
      if (userData?.chatHistory && Array.isArray(userData.chatHistory)) {
        setMessages(userData.chatHistory);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const saveChatHistory = async (messagesToSave = null) => {
    const dataToSave = messagesToSave || messages;
    if (!userId || dataToSave.length === 0) return;
    
    try {
      await saveUserSettings(userId, {
        chatHistory: dataToSave,
        lastChatUpdate: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to save chat history:', err);
    }
  };

  const handleCopy = async (text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showToast("Teks disalin");
    } catch {
      showToast("Gagal menyalin");
    }
  };

  const handleClear = async () => {
    setMessages([]);
    
    // Also clear from Firebase
    if (userId) {
      try {
        await saveUserSettings(userId, {
          chatHistory: [],
          lastChatUpdate: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to clear chat history:', err);
      }
    }
    
    showToast("Percakapan dibersihkan");
  };

  const formatText = (text) => {
    if (!text) return '';
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const bolded = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return bolded.replace(/\n/g, '<br />');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header - Fixed */}
      <div className="p-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-800">Chat AI ~ {businessName}</h3>
            <div className="text-xs text-slate-700 mt-1">Tanya jawab bisnis dengan AI yang memahami konteks usahamu</div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setTopic("analysis")} className={`px-4 py-2 text-sm rounded-lg font-medium transition ${topic === "analysis" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
            <i className="fas fa-chart-line mr-2"></i>Analisis
          </button>
          <button onClick={() => setTopic("finance")} className={`px-4 py-2 text-sm rounded-lg font-medium transition ${topic === "finance" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
            <i className="fas fa-coins mr-2"></i>Ide Keuangan
          </button>
          <button onClick={() => setTopic("sales")} className={`px-4 py-2 text-sm rounded-lg font-medium transition ${topic === "sales" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
            <i className="fas fa-handshake mr-2"></i>Penjualan
          </button>
        </div>

        {/* Web Search Toggle */}
        <div className="mt-3 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50 px-3 py-2 rounded-lg border border-indigo-100">
          <div className="flex items-center gap-2">
            <i className="fas fa-globe text-indigo-600"></i>
            <div>
              <span className="text-sm font-medium text-slate-700">Web Search</span>
              <div className="text-xs text-slate-500">Dapatkan data terkini dari internet (Tavily AI)</div>
            </div>
          </div>
          <button
            onClick={() => setUseWebSearch(!useWebSearch)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useWebSearch ? 'bg-indigo-600' : 'bg-slate-300'}`}
            title={useWebSearch ? 'Web search aktif - AI akan mencari data real-time' : 'Klik untuk aktifkan web search'}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useWebSearch ? 'translate-x-3' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Chat Messages Area - Scrollable */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
        style={{ 
          minHeight: 0,
          scrollBehavior: 'smooth'
        }}
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-end text-center">
            <div className="mb-4">
              <i className="fas fa-comments text-4xl text-slate-300"></i>
            </div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Mulai Percakapan</h4>
            <p className="text-xs text-slate-600 max-w-xs mb-4">Tanyakan tentang pasar, strategi penjualan, atau pengelolaan keuangan bisnis Anda.</p>
            <div className="grid grid-cols-1 gap-2 w-full">
              <button
                onClick={() => handleQuick("Apa yang bisa saya lakukan untuk meningkatkan penjualan bulan ini?")}
                className="px-3 py-2 text-xs bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition text-left border border-indigo-200"
              >
                💡 Tingkatkan penjualan
              </button>
              <button
                onClick={() => handleQuick("Bagaimana cara menganalisis kompetitor saya?")}
                className="px-3 py-2 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-left border border-blue-200"
              >
                📊 Analisis kompetitor
              </button>
              <button
                onClick={() => handleQuick("Bagaimana cara mengoptimalkan biaya operasional?")}
                className="px-3 py-2 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-left border border-green-200"
              >
                💰 Optimalkan keuangan
              </button>
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${m.role === "user" ? "bg-indigo-600 text-white rounded-br-none" : "bg-white text-slate-800 rounded-bl-none border border-slate-200"}`}>
              <div
                className="text-sm whitespace-pre-wrap leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatText(m.text) }}
              ></div>
              {m.role === "ai" && (
                <div className="mt-2 flex justify-end gap-2">
                  <button onClick={() => handleCopy(m.text)} className="text-xs text-slate-500 hover:text-slate-700 bg-white px-2 py-1 rounded transition hover:bg-slate-50">
                    <i className="fas fa-copy mr-1"></i>Copy
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-600 px-4 py-3 rounded-lg rounded-bl-none">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs">
                  {useWebSearch ? (
                    <>
                      <i className="fas fa-globe mr-1 text-indigo-600"></i>
                      Mencari data real-time & menganalisis...
                    </>
                  ) : (
                    'AI sedang menjawab...'
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Fixed */}
      <div className="border-t border-slate-100 p-4 space-y-3 bg-white flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              topic === "finance"
                ? "Tanyakan tentang keuangan, margin, atau biaya..."
                : topic === "sales"
                  ? "Tanyakan strategi penjualan atau promosi..."
                  : "Tanyakan tentang pasar, tren, atau analisis..."
            }
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
            {loading ? "Mengirim" : "Kirim"}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => handleQuick(topic === "analysis" ? "Analisis lokasi usaha saya" : topic === "finance" ? "Bagaimana cara menekan biaya operasional?" : "Cara meningkatkan penjualan harian?")}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            >
              <i className="fas fa-lightning-bolt mr-1"></i>Contoh
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            >
              <i className="fas fa-trash mr-1"></i>Bersihkan
            </button>
          </div>
          <div className="text-slate-500">
            <span className="font-medium text-slate-700 capitalize">{topic}</span>
            <span className="text-slate-400"> • {messages.length} pesan</span>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed right-6 bottom-6 z-50">
          <div className="bg-slate-900 text-white text-sm px-4 py-2 rounded shadow">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}