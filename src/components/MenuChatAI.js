"use client";

import React, { useEffect, useRef, useState } from "react";

export default function MenuChatAI({ businessName, onSend }) {
  const [topic, setTopic] = useState("analysis"); // 'analysis' | 'finance' | 'sales'
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // {id, role, text, topic}
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const toastRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(toastRef.current);
  }, []);

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

  const sendToAI = async ({ topic, prompt }) => {
    // If parent provided onSend, use it (allows server-side/openai integration)
    if (onSend) {
      return await onSend({ topic, prompt });
    }
    // Build payload (compatible with server route)
    const canned = sampleReplyFor(topic, prompt);
    const payload = {
      message: prompt,
      messages: [{ role: 'user', content: prompt }],
      model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      max_tokens: 800,
      temperature: 0.7,
      topic,
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
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendToAI({ topic, prompt: trimmed });
      const aiText = (res && res.text) ? res.text : String(res || "");
      const aiMsg = { id: `a-${Date.now()}`, role: "ai", text: aiText, topic };
      setMessages((m) => [...m, aiMsg]);
    } catch (err) {
      const msg = String(err?.message || 'Terjadi kesalahan saat memanggil AI.');
      setMessages((m) => [
        ...m,
        { id: `a-err-${Date.now()}`, role: "ai", text: msg, topic },
      ]);
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = (q) => setInput(q);

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

  const handleClear = () => {
    setMessages([]);
    showToast("Percakapan dibersihkan");
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-slate-800">Chat AI</h3>
          <div className="text-xs text-slate 500">Analisis • Ide Keuangan • Penjualan — {businessName}</div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setTopic("analysis")} className={`px-3 py-1 text-xs rounded ${topic === "analysis" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>Analisis</button>
          <button onClick={() => setTopic("finance")} className={`px-3 py-1 text-xs rounded ${topic === "finance" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>Ide Keuangan</button>
          <button onClick={() => setTopic("sales")} className={`px-3 py-1 text-xs rounded ${topic === "sales" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>Penjualan</button>
        </div>
      </div>

      <div ref={listRef} className="h-56 overflow-y-auto p-3 border border-slate-100 rounded-lg bg-slate-50 mb-3 space-y-3">
        {messages.length === 0 && <div className="text-xs text-slate 500">Mulai percakapan atau pilih contoh cepat.</div>}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            <div className={`inline-block max-w-[85%] px-3 py-2 rounded-lg ${m.role === "user" ? "bg-blue-600 text-white" : "bg-white text-slate-800 border border-slate-100"}`}>
              <div className="text-sm whitespace-pre-wrap">{m.text}</div>
              {m.role === "ai" && (
                <div className="mt-2 flex justify-end gap-2">
                  <button onClick={() => handleCopy(m.text)} className="text-xs text-slate-500 hover:text-slate-700">Copy</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-left text-sm text-slate-500">AI sedang mengetik...</div>}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              topic === "finance"
                ? "Tanyakan ide pengelolaan keuangan atau optimasi margin..."
                : topic === "sales"
                ? "Tanyakan strategi sales / promosi..."
                : "Minta analisis pasar, kompetitor, atau tren..."
            }
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none"
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          />
          <button onClick={handleSend} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
            {loading ? "Mengirim..." : "Kirim"}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex gap-2">
            <button onClick={() => handleQuick(topic === "analysis" ? "Analisis lokasi usaha saya" : topic === "finance" ? "Bagaimana cara menekan biaya operasional?" : "Cara meningkatkan penjualan harian?")} className="px-2 py-1 rounded bg-slate-100">Cepat</button>
            <button onClick={handleClear} className="px-2 py-1 rounded bg-slate-100">Bersihkan</button>
          </div>
          <div>Topik: <span className="font-medium capitalize">{topic}</span></div>
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