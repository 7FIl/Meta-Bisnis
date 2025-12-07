// src/app/api/chat/route.js
import { NextResponse } from 'next/server';

/**
 * Ekstrak primary business type term (sebelum parentheses)
 * Contoh: "F&B (Bakso, Mie, Restoran...)" → "F&B"
 */
function extractPrimaryBusinessType(businessType = '') {
  if (!businessType) return '';
  return businessType.split('(')[0].trim();
}

// --- FUNGSI BARU: Integrasi Tavily API untuk Data Real-Time ---
async function searchWeb(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("Tavily API Key belum diset!");
    return null;
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic", // 'basic' lebih cepat & hemat kuota
        include_answer: true,  // Minta jawaban langsung (to-the-point)
        max_results: 3         // Ambil 3 sumber teratas saja
      })
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Format hasil agar mudah dibaca oleh AI
    return `
[DATA DARI INTERNET / REAL-TIME]:
- Ringkasan: ${data.answer || 'Tidak ada ringkasan'}
- Sumber Terkait:
${data.results?.map(r => `  * ${r.title}: ${r.content}`).join('\n') || 'Tidak ada hasil'}
    `;
  } catch (error) {
    console.error("Error searching web:", error);
    return null;
  }
}

export async function POST(req) {
  try {
    // 1. Terima payload dari Frontend
    const body = await req.json();
    // Accept either `message` (string) or `messages` (array of {role,content}) from frontend.
    const {
      message,
      history,
      businessName = '',
      businessType = '',
      businessLocation = '',
      brandTone = '',
      targetAudience = '',
      uniqueSellingPoints = '',
    } = body;
    const { platform = '' } = body;
    const messagesFromBody = Array.isArray(body.messages) ? body.messages : null;
    console.log('[api/chat] incoming request', { hasMessage: !!message, hasMessagesArray: !!messagesFromBody, model: body.model, max_tokens: body.max_tokens, topic: body.topic, businessType });
    
    // history opsional: array percakapan sebelumnya jika frontend support context aware

    // Coba cari data real-time dari Tavily untuk query tertentu
    // (khususnya untuk topik analysis dan sales yang mungkin butuh konteks pasar)
    let webData = '';
    if (message && (body.topic === 'analysis' || body.topic === 'sales')) {
      const webSearchResult = await searchWeb(message);
      if (webSearchResult) {
        webData = webSearchResult;
        console.log('[api/chat] Tavily web search completed');
      }
    }

    // === FASE GROQ: Jalur khusus untuk topik pembuatan konten ===
    if (body.topic === 'content_creation') {
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        console.error('[api/chat] Missing GROQ_API_KEY');
        return NextResponse.json({ success: false, error: 'Server missing GROQ_API_KEY' }, { status: 500 });
      }

      // Extract social media usernames
      const instagramUsername = body.instagramUsername || '';
      const tiktokUsername = body.tiktokUsername || '';
      const whatsappNumber = body.whatsappNumber || '';

      const platformPrompt = (() => {
        switch ((platform || '').toLowerCase()) {
          case 'instagram':
            const igCTA = instagramUsername 
              ? `Ajak follow atau DM ke @${instagramUsername}.` 
              : `Ajak follow atau DM.`;
            return `Kamu adalah Social Media Manager khusus Instagram. Buat caption singkat, persuasif, dengan emoji relevan dan 5-8 hashtag populer & kontekstual.
Wajib pakai alur AIDA (Attention → Interest → Desire → Action):
- Attention: buka dengan hook kuat.
- Interest: bangun rasa ingin tahu pakai masalah/statistik singkat.
- Desire: jelaskan solusi & keunggulan produk.
- Action: ${igCTA}
Bahasa Indonesia, nada ramah, tidak terlalu panjang.`;
          case 'tiktok':
            const ttCTA = tiktokUsername
              ? `Follow @${tiktokUsername} untuk konten lainnya atau hubungi untuk info lebih lanjut.`
              : `Follow untuk konten lainnya atau hubungi untuk info lebih lanjut.`;
            return `Kamu adalah Penulis Naskah Video TikTok. Buat skrip detik-per-detik maksimal 60 detik.

            Format WAJIB:
            beri tulisan awalan seperti berikut Konten tiktok yang bisa anda gunakan untuk mempromosikan (isi konten) anda.
            Visual = [rentang detik]: [deskripsi visual]
            Audio = [rentang detik]: [teks audio/VO atau caption layar]
            Tuliskan blok sesuai kebutuhan ide; jumlah blok bebas, namun setiap baris harus mengikuti format Visual= / Audio= di atas.
            Terapkan alur AIDA: mulai dengan hook (Attention), munculkan masalah/statistik (Interest), tunjukkan solusi & keunggulan produk (Desire), tutup dengan CTA jelas (Action: ${ttCTA}).
            Mulai dengan hook kuat, sisipkan CTA, akhiri dengan closing yang kuat.
            Bahasa Indonesia, ringkas, energik, mudah dipindai.`;
          case 'whatsapp':
            const waCTA = whatsappNumber
              ? `Chat via WhatsApp ke ${whatsappNumber} untuk info lebih lanjut.`
              : `Balas pesan ini atau kunjungi lokasi kami untuk info lebih lanjut.`;
            return `Kamu adalah Copywriter Direct Marketing untuk WhatsApp. Buat pesan personal, ramah, to-the-point (80-140 kata) dengan alur AIDA: hook pembuka (Attention), masalah/statistik singkat (Interest), solusi & keunggulan produk (Desire), CTA jelas (Action: ${waCTA}), lalu tutup dengan sapaan hangat. Hindari hashtag berlebihan, gunakan 1-2 emoji seperlunya.`;
          default:
            return `Kamu adalah asisten konten serbaguna. Buat materi promosi singkat dan jelas sesuai platform umum.
Ikuti alur AIDA: Attention (hook), Interest (masalah/statistik), Desire (solusi/keunggulan produk), Action (CTA spesifik: beli/daftar/download/kunjungi).
Gunakan Bahasa Indonesia, nada ramah, sertakan CTA.`;
        }
      })();

      const brandContextParts = [];
      if (businessName) brandContextParts.push(`Nama brand: ${businessName}`);
      if (businessType) brandContextParts.push(`Kategori/jenis: ${businessType}`);
      if (businessLocation) brandContextParts.push(`Lokasi: ${businessLocation}`);
      if (targetAudience) brandContextParts.push(`Target audiens: ${targetAudience}`);
      if (uniqueSellingPoints) brandContextParts.push(`Keunggulan: ${uniqueSellingPoints}`);
      if (brandTone) brandContextParts.push(`Gaya komunikasi brand: ${brandTone}`);
      
      // Add social media handles to brand context
      const socialMediaParts = [];
      if (instagramUsername) socialMediaParts.push(`Instagram: @${instagramUsername}`);
      if (tiktokUsername) socialMediaParts.push(`TikTok: @${tiktokUsername}`);
      if (whatsappNumber) socialMediaParts.push(`WhatsApp: ${whatsappNumber}`);
      
      if (socialMediaParts.length > 0) {
        brandContextParts.push(`Akun sosial media: ${socialMediaParts.join(', ')}`);
      }
      
      const brandContextText = brandContextParts.length
        ? `Gunakan konteks brand berikut untuk menjaga konsistensi identitas:
${brandContextParts.map((p) => `- ${p}`).join('\n')}`
        : '';

      const userPrompt = message || body.prompt || 'Buatkan konten promosi singkat.';

      const groqMessages = [
        { role: 'system', content: [platformPrompt, brandContextText].filter(Boolean).join('\n\n') },
        { role: 'user', content: userPrompt }
      ];

      const model = 'llama-3.3-70b-versatile';
      const max_tokens = body.max_tokens || 800;
      const temperature = typeof body.temperature !== 'undefined' ? body.temperature : 0.7;

      let groqRes;
      let groqData;
      try {
        groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey}`
          },
          body: JSON.stringify({
            model,
            messages: groqMessages,
            max_tokens,
            temperature
          })
        });

        groqData = await groqRes.json().catch(() => null);
      } catch (err) {
        console.error('[api/chat] error calling Groq', err);
        return NextResponse.json({ success: false, error: 'Groq request failed', details: String(err) }, { status: 502 });
      }

      if (!groqRes.ok) {
        console.error('[api/chat] Groq error', groqRes.status, groqData);
        return NextResponse.json({ success: false, error: groqData?.error || 'Groq error', providerStatus: groqRes.status, providerBody: groqData }, { status: 502 });
      }

      const replyText = groqData?.choices?.[0]?.message?.content || '';

      return NextResponse.json({ success: true, reply: replyText });
    }

    // 2. Setup Payload ke Groq (pengganti Kolosal)
    // System prompt berubah berdasarkan topik supaya client bisa meminta
    // teks analisis biasa (plain text) untuk `analysis`, atau JSON untuk
    // topik lain seperti `finance`.
    // Tambahkan konteks businessType untuk personalisasi respons (hanya primary term)
    let systemPrompt;
    const primaryBusinessType = extractPrimaryBusinessType(businessType);
    const businessContext = primaryBusinessType ? ` Kamu sedang membantu bisnis tipe "${primaryBusinessType}".` : '';
    // Provide tailored, plain-text prompts per topic so frontend receives readable
    // answers for all three contexts: analysis, finance, sales.
    switch (body.topic) {
      case 'analysis':
        systemPrompt = `Kamu adalah 'Meta Bisnis', asisten analisis bisnis untuk UMKM Indonesia.${businessContext} Untuk permintaan user, berikan ANALISIS BISNIS yang rapi dan mudah dibaca dalam Bahasa Indonesia. 

Struktur jawaban menjadi:
1. Mulai dengan pengantar singkat yang memberikan konteks (1-2 kalimat penjelasan umum tentang topik)
2. Tuliskan analisis utama dalam paragraf singkat (2-3 kalimat) yang menjelaskan insight atau temuan penting
3. Lanjutkan dengan "Poin-poin penting:" diikuti 3-5 bullet poin
4. Tutup dengan "Rekomendasi:" dan berikan 2-4 saran aksi praktis dalam format bullet

Gunakan bahasa yang friendly dan sederhana. Jangan bungkus jawaban dengan JSON atau kode - berikan teks murni saja.`;
        break;
      case 'finance':
        systemPrompt = `Kamu adalah 'Meta Bisnis', asisten keuangan untuk UMKM Indonesia.${businessContext} Berikan jawaban TEKS dalam Bahasa Indonesia yang terstruktur dan mudah dipahami.

Struktur jawaban:
1. Mulai dengan penjelasan singkat tentang masalah keuangan yang dihadapi (1-2 kalimat)
2. Berikan pemahaman dasar tentang solusi (1-2 paragraf penjelasan)
3. Tuliskan "Langkah-langkah praktis:" diikuti 3-5 bullet poin dengan tindakan konkrit
4. Tambahkan "Prioritas pengelolaan:" dengan 2-3 poin paling penting
5. Jika relevan, jelaskan "Dampak yang dapat diharapkan:" dalam 1-2 poin

Gunakan contoh nyata jika membantu. Jangan keluarkan JSON atau format kode - hanya teks.`;
        break;
      case 'sales':
        systemPrompt = `Kamu adalah 'Meta Bisnis', asisten penjualan untuk UMKM Indonesia.${businessContext} Jawab dalam Bahasa Indonesia berupa strategi penjualan yang terstruktur dan praktis.

Struktur jawaban:
1. Mulai dengan pengantar yang menjelaskan konsep atau tren penjualan yang relevan (1-2 kalimat)
2. Jelaskan strategi umum dalam 1-2 paragraf yang memberikan konteks kenapa strategi ini penting
3. Tuliskan "Ide aksi penjualan:" diikuti 4-6 bullet poin dengan taktik spesifik (promosi, kanal, penawaran spesial, dll)
4. Tambahkan "Contoh pesan promosi yang bisa digunakan:" dengan 2-3 contoh kalimat singkat
5. Tutup dengan "Metrik kesuksesan:" atau "Yang perlu diukur:" dalam 1-2 poin

Format jawaban sebagai teks biasa dengan struktur yang jelas. Berikan contoh konkrit. Jangan gunakan JSON.`;
        break;
      default:
        // Fallback: preserve the original JSON-mode behavior for unspecified topics
        systemPrompt = `Kamu adalah 'Meta Bisnis', asisten bisnis AI profesional untuk UMKM Indonesia. Berikan saran yang praktis, ramah, hemat biaya, dan gunakan Bahasa Indonesia yang mudah dimengerti. Fokus pada strategi digital marketing dan manajemen keuangan sederhana. RESPONS FORMAT: Always reply with a single valid JSON object ONLY (no surrounding explanation). The JSON must contain these fields: name (string), description (string), capital_est (string), target_market (string), challenge (string), category (string). Optionally include marketData (object with keys 'insight' and 'price').`;
    }

    // Gabungkan pesan: System Prompt + History (jika ada) + User Message Baru
    // Jika ada web data, sertakan dalam pesan user untuk konteks real-time
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: webData ? `${message}\n\n${webData}` : message }
    ];

    // 3. Siapkan parameter permintaan ke Kolosal AI
    const model = body.model || 'llama-3.3-70b-versatile';
    const max_tokens = body.max_tokens || 1000;
    const temperature = typeof body.temperature !== 'undefined' ? body.temperature : 0.7;

    // Build messagesToSend: prefer `body.messages` if provided, otherwise use legacy `message` or `history`.
    let messagesToSend = messagesFromBody;
    if (!messagesToSend) {
      if (message) {
        messagesToSend = [{ role: 'user', content: message }];
      } else if (Array.isArray(history) && history.length) {
        messagesToSend = history;
      } else {
        messagesToSend = [];
      }
    }

    console.log('[api/chat] messagesToSend preview', messagesToSend.slice(0, 3).map(m => ({ role: m.role, contentPreview: String(m.content).slice(0,120) })));

    // Jika tidak ada pesan untuk dikirim ke provider, kembalikan 400
    if (!messagesToSend || messagesToSend.length === 0) {
      console.error('[api/chat] no messages to send');
      return NextResponse.json({ success: false, error: 'No message provided' }, { status: 400 });
    }

    // Pastikan ada system prompt di posisi pertama agar instruksi dipatuhi
    const hasSystem = messagesToSend.some((m) => m.role === 'system');
    if (!hasSystem) {
      messagesToSend = [{ role: 'system', content: systemPrompt }, ...messagesToSend];
    }
    // 4. Request ke Groq (OpenAI-compatible)
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.error('[api/chat] Missing GROQ_API_KEY');
      return NextResponse.json({ success: false, error: 'Server missing GROQ_API_KEY' }, { status: 500 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    let groqRes;
    let groqData;
    try {
      groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          max_tokens,
          messages: messagesToSend,
          model,
          temperature
        }),
        signal: controller.signal
      });

      groqData = await groqRes.json().catch((e) => {
        console.error('[api/chat] failed parsing Groq JSON', e);
        return null;
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('[api/chat] Groq request aborted (timeout)');
        return NextResponse.json({ success: false, error: 'AI provider request timed out' }, { status: 504 });
      }
      console.error('[api/chat] error calling Groq', err);
      return NextResponse.json({ success: false, error: String(err) }, { status: 502 });
    } finally {
      clearTimeout(timeout);
    }

    console.log('[api/chat] Groq status', groqRes.status, 'bodyPreview:', typeof groqData === 'object' ? JSON.stringify(groqData).slice(0,400) : String(groqData).slice(0,400), 'webDataUsed:', !!webData);

    if (!groqRes.ok) {
      console.error("Groq Error:", groqData);
      // Return provider error payload to help debugging (do not leak secrets)
      return NextResponse.json({ success: false, error: groqData?.error || 'Error from AI Provider', providerStatus: groqRes.status, providerBody: groqData }, { status: 502 });
    }

    // Use already-parsed groqData to avoid reading the body twice
    const data = groqData || {};

    // 4. Bersihkan respons untuk Frontend
    // Mengambil konten pesan dari struktur OpenAI-compatible
    const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';

    // Coba parse langsung sebagai JSON
    let structured = null;
    let replyText = content;

    try {
      structured = JSON.parse(content);
    } catch (e) {
      // Jika parsing langsung gagal, coba ekstraksi objek JSON dari dalam teks
      try {
        const first = content.indexOf('{');
        const last = content.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
          const maybeJson = content.slice(first, last + 1);
          structured = JSON.parse(maybeJson);
          replyText = maybeJson;
        }
      } catch (e2) {
        // tetap lanjutkan — structured tetap null
      }
    }

    return NextResponse.json({ 
      success: true, 
      reply: replyText,
      structured: structured,
      webDataUsed: !!webData
    });

  } catch (error) {
    console.error('Backend Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Terjadi kesalahan pada server AI.' 
    }, { status: 500 });
  }
}

// Simple GET handler so developers can verify route existence in browser
export async function GET() {
  return NextResponse.json({ success: true, message: 'Chat API route is active. Use POST to send messages.' });
}

// Respond to OPTIONS (useful for preflight or probes)
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { Allow: 'GET, POST, OPTIONS' } });
}