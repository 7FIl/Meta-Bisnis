// src/app/api/chat/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // 1. Terima payload dari Frontend
    const body = await req.json();
    // Accept either `message` (string) or `messages` (array of {role,content}) from frontend.
    const { message, history } = body;
    const messagesFromBody = Array.isArray(body.messages) ? body.messages : null;
    console.log('[api/chat] incoming request', { hasMessage: !!message, hasMessagesArray: !!messagesFromBody, model: body.model, max_tokens: body.max_tokens });
    
    // history opsional: array percakapan sebelumnya jika frontend support context aware

    // 2. Setup Payload ke Kolosal AI
    // Instruksi system meminta output berupa JSON yang konsisten agar frontend mudah memproses.
    const systemPrompt = `Kamu adalah 'Konsultan UMKM Pintar', asisten bisnis ahli untuk UMKM Indonesia. Berikan saran yang praktis, ramah, hemat biaya, dan gunakan Bahasa Indonesia yang mudah dimengerti. Fokus pada strategi digital marketing dan manajemen keuangan sederhana."
    + "RESPONS FORMAT: Always reply with a single valid JSON object ONLY (no surrounding explanation). The JSON must contain these fields: name (string), description (string), capital_est (string), target_market (string), challenge (string), category (string). Optionally include marketData (object with keys 'insight' and 'price').`; 

    // Gabungkan pesan: System Prompt + History (jika ada) + User Message Baru
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: message }
    ];

    // 3. Siapkan parameter permintaan ke Kolosal AI
    const model = body.model || 'meta-llama/llama-4-maverick-17b-128e-instruct';
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
    // 4. Request ke Kolosal AI Server
    if (!process.env.KOLOSAL_API_KEY) {
      console.error('[api/chat] Missing KOLOSAL_API_KEY');
      return NextResponse.json({ success: false, error: 'Server missing KOLOSAL_API_KEY' }, { status: 500 });
    }

    // small timeout wrapper for node-fetch
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s

    let kolosalRes;
    let kolosalData;
    try {
      kolosalRes = await fetch('https://api.kolosal.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.KOLOSAL_API_KEY}`
        },
        body: JSON.stringify({
          max_tokens,
          messages: messagesToSend,
          model,
          temperature
        }),
        signal: controller.signal
      });

      kolosalData = await kolosalRes.json().catch((e) => {
        console.error('[api/chat] failed parsing kolosal JSON', e);
        return null;
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('[api/chat] kolosal request aborted (timeout)');
        return NextResponse.json({ success: false, error: 'AI provider request timed out' }, { status: 504 });
      }
      console.error('[api/chat] error calling kolosal', err);
      return NextResponse.json({ success: false, error: String(err) }, { status: 502 });
    } finally {
      clearTimeout(timeout);
    }

    console.log('[api/chat] kolosal status', kolosalRes.status, 'bodyPreview:', typeof kolosalData === 'object' ? JSON.stringify(kolosalData).slice(0,400) : String(kolosalData).slice(0,400));

    if (!kolosalRes.ok) {
      console.error("Kolosal Error:", kolosalData);
      // Return provider error payload to help debugging (do not leak secrets)
      return NextResponse.json({ success: false, error: kolosalData?.error || 'Error from AI Provider', providerStatus: kolosalRes.status, providerBody: kolosalData }, { status: 502 });
    }

    // Use already-parsed kolosalData to avoid reading the body twice
    const data = kolosalData || {};

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
      structured: structured
    });

  } catch (error) {
    console.error('Backend Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Terjadi kesalahan pada server AI.' 
    }, { status: 500 });
  }
}