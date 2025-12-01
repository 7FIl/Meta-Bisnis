'use client';

import { useState } from 'react';

export default function MarketingStudio({ businessName }) {
  const [promoInput, setPromoInput] = useState('');
  const [captionResult, setCaptionResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateCaption = async () => {
    if (!promoInput) {
      alert('Isi detail promo dulu!');
      return;
    }

    setLoading(true);
    setCaptionResult('AI sedang menulis...');

    try {
      // Simulasi generate caption
      // Dalam implementasi real, ini akan memanggil Gemini API
      setTimeout(() => {
        const captions = [
          `Haii! 🎉\n\n${promoInput}\n\nJangan lewatkan kesempatan emas ini! 🚀\n\n#${businessName.replace(/\s+/g, '')} #PromoSeru #SupportLokal #BelanjaSekarang`,
          `Yuk gabung dengan ribuan pelanggan puas kami! 💪\n\n${promoInput}\n\nBerlaku terbatas, jadi segera hubungi kami sebelum kehabisan stok! 📱\n\n#${businessName.replace(/\s+/g, '')} #DealTerbaik #YuDiskon`,
          `Waktunya upgrade bisnis Anda! ✨\n\n${promoInput}\n\nKunjungi kami atau order online sekarang juga!\n\n#${businessName.replace(/\s+/g, '')} #IndonesiaSupport #UKMCuan`,
        ];
        setCaptionResult(captions[Math.floor(Math.random() * captions.length)]);
        setLoading(false);
      }, 1500);
    } catch (e) {
      setCaptionResult('Gagal membuat caption. Coba lagi.');
      setLoading(false);
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(captionResult);
    alert('Caption disalin!');
  };

  return (
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
            {captionResult ||
              'Hasil caption akan muncul di sini. Tulis detail promo di sebelah kiri lalu klik tombol.'}
          </div>
          {captionResult && (
            <button
              onClick={handleCopyCaption}
              className="absolute top-2 right-2 text-slate-400 hover:text-purple-600"
              title="Copy caption"
            >
              <i className="fas fa-copy"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
