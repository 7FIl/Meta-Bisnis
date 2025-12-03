'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from './Toast';

export default function MarketingStudio(props) {
  const { businessName } = props;
  const toastRef = useRef(null);
  const [toast, setToast] = useState('');
  const [promoInput, setPromoInput] = useState('');
  // captionResult can be null, a string fallback, or an object { instagram, whatsapp }
  const [captionResult, setCaptionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null); // 'instagram' | 'whatsapp' | null

  const showToast = (msg = 'Teks berhasil disalin') => {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), 2500);
  };

  const handleCopy = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showToast('Teks berhasil disalin');
    } catch (err) {
      showToast('Gagal menyalin');
    }
  };

  const handleGenerateCaption = async () => {
    if (!promoInput) {
      toast.warning('Isi detail promo dulu!');
      return;
    }

    setLoading(true);
    setCaptionResult('AI sedang menulis...');

    try {
      // Build a system prompt that instructs the AI to return a short caption suitable for IG/WA
      const systemPrompt = `Kamu adalah seorang Marketing Specialist profesional untuk UMKM Indonesia. Berikan dua caption singkat dalam Bahasa Indonesia: satu untuk Instagram (lebih kasual, sertakan emoji dan hashtag) dan satu untuk WhatsApp (lebih personal, singkat, tanpa banyak hashtag). Gunakan nada ramah dan panggilan aksi jelas. OUTPUT REQUIREMENT: Kembalikan sebuah JSON tunggal saja, tanpa penjelasan tambahan, dengan format: { "instagram": "...", "whatsapp": "..." }. Pastikan setiap value adalah string maksimum 280 karakter.`;

      const payload = {
        max_tokens: 300,
        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Detail promo: ${promoInput}\nBusiness: ${businessName || 'UMKM'}` }
        ]
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Caption API error', data);
        setCaptionResult('Gagal membuat caption. Coba lagi.');
        setLoading(false);
        return;
      }

      // Prefer structured if provided, otherwise use reply text
      // Prefer structured (already parsed JSON) from backend
      let resultObj = null;
      if (data.structured && typeof data.structured === 'object') {
        resultObj = data.structured;
      } else {
        const replyText = (data.reply || '') + '';
        // Try parse JSON from reply text
        try {
          resultObj = JSON.parse(replyText);
        } catch (e) {
          // try extract JSON substring
          const first = replyText.indexOf('{');
          const last = replyText.lastIndexOf('}');
          if (first !== -1 && last !== -1 && last > first) {
            try {
              resultObj = JSON.parse(replyText.slice(first, last + 1));
            } catch (e2) {
              resultObj = null;
            }
          }
        }
      }

      if (resultObj && (resultObj.instagram || resultObj.whatsapp)) {
        setCaptionResult({ instagram: resultObj.instagram || '', whatsapp: resultObj.whatsapp || '' });
      } else {
        // Fallback: show raw reply text
        const fallback = data.reply || JSON.stringify(data.providerBody || data.choices || data);
        setCaptionResult({ instagram: String(fallback).trim(), whatsapp: '' });
      }
      setLoading(false);
    } catch (e) {
      console.error('Generate caption error', e);
      setCaptionResult('Gagal membuat caption. Coba lagi.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fas fa-pen-nib text-purple-500"></i> Studio Konten Otomatis
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Apa yang mau dipromosikan?
            </label>
            <textarea
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              rows="3"
              className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-500 outline-none resize-none"
              placeholder="Cth: Diskon 20% khusus hari jumat untuk menu kopi susu..."
            ></textarea>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleGenerateCaption}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white py-2 rounded-lg text-sm font-medium transition"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-1"></i> Membuat...
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic mr-1"></i> Buat Caption IG/WA
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 relative">
            <p className="text-xs font-bold text-slate-400 mb-2">HASIL GENERATE:</p>
            <div className="text-sm text-slate-600 whitespace-pre-wrap h-24 overflow-y-auto italic">
              {!captionResult && 'Hasil caption akan muncul di sini. Tulis detail promo di sebelah kiri lalu klik tombol.'}
              {captionResult && typeof captionResult === 'object' && (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">Instagram</div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleCopy(captionResult.instagram)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCopy(captionResult.instagram); }}
                      className={`p-3 rounded-md border border-slate-100 cursor-pointer hover:bg-slate-50 ${copied === 'instagram' ? 'bg-slate-200' : 'bg-white'}`}
                      title="Klik untuk menyalin caption Instagram"
                    >
                      {captionResult.instagram}
                    </div>
                    {copied === 'instagram' && <div className="text-xs text-green-600 mt-1">Disalin!</div>}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">WhatsApp</div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleCopy(captionResult.whatsapp)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCopy(captionResult.whatsapp); }}
                      className={`p-3 rounded-md border border-slate-100 cursor-pointer hover:bg-slate-50 ${copied === 'whatsapp' ? 'bg-slate-200' : 'bg-white'}`}
                      title="Klik untuk menyalin caption WhatsApp"
                    >
                      {captionResult.whatsapp}
                    </div>
                    {copied === 'whatsapp' && <div className="text-xs text-green-600 mt-1">Disalin!</div>}
                  </div>
                </div>
              )}
              {captionResult && typeof captionResult === 'string' && captionResult}
            </div>
            {/* Clicking the caption blocks copies them; feedback shown inline */}
          </div>
        </div>
      </div>

      {/* Toast notifikasi */}
      {toast && (
        <div className="fixed right-6 bottom-6 z-50">
          <div className="bg-slate-900 text-white text-sm px-4 py-2 rounded shadow">
            {toast}
          </div>
        </div>
      )}
    </>
  );
}
