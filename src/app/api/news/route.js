// src/app/api/news/route.js
import { NextResponse } from 'next/server';

/**
 * Ekstrak primary business type term (sebelum parentheses)
 * Contoh: "F&B (Bakso, Mie, Restoran...)" → "F&B"
 */
function extractPrimaryBusinessType(businessType = '') {
  if (!businessType) return '';
  return businessType.split('(')[0].trim();
}

/**
 * Tentukan konteks pencarian utama dengan prioritas:
 * 1. businessDescription (ex: "Coffee Shop", "Toko Baju")
 * 2. businessType primary term (fallback, ex: "F&B")
 * 3. businessName (last resort)
 */
function determineSearchTopic(businessName = '', businessDescription = '', businessType = '') {
  if (businessDescription && businessDescription.length > 3) return businessDescription;
  const primaryType = extractPrimaryBusinessType(businessType);
  if (primaryType && primaryType.length > 2) return primaryType;
  return `${businessName} (Business Industry)`;
}

/**
 * Bangun query dengan fokus pada tren industri viral, bukan definisi
 * Struktur: [Topik] + [Lokasi] + [Kata Kunci Viral/Marketing] - [Kata Kunci Definisi]
 * Gunakan primary term dari businessType untuk query lebih presisi
 */
function buildSearchQuery({ businessName, businessDescription, businessLocation, businessType }) {
  const searchTopic = determineSearchTopic(businessName, businessDescription, businessType);
  const primaryType = extractPrimaryBusinessType(businessType);
  const industryContext = primaryType ? ` in ${primaryType} industry` : '';
  const location = businessLocation || 'Indonesia';
  const today = new Date().toISOString().split('T')[0];

  // Query dalam bahasa Inggris untuk Tavily yang lebih responsif terhadap prompt engineering
  return `Latest viral market trends, consumer behavior shifts, and popular marketing strategies for "${searchTopic}"${industryContext} in ${location}. Focus on viral products on TikTok/Instagram, business opportunities, competitive advantages, and practical strategies. Exclude definition of terms, acronyms, and foreign reference. (Date: ${today})`;
}

/**
 * Fetch berita dari Tavily dengan pencarian spesifik tren industri
 */
async function fetchNewsFromTavily(searchQuery) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("Tavily API Key belum diset!");
    return { answer: null, results: [] };
  }

  try {
    console.log('[Tavily Query]:', searchQuery);

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: searchQuery,
        search_depth: "advanced",
        include_answer: true, // Minta AI Tavily merangkum menjadi strategi
        max_results: 5,
        // Filter domain agar fokus ke berita & sosmed, hindari kamus/wiki
        include_domains: [
          "kompas.com",
          "detik.com",
          "dailysocial.id",
          "cnbcindonesia.com",
          "tiktok.com",
          "instagram.com",
          "bisnis.com",
          "techinasia.com",
          "youtube.com",
          "twitter.com"
        ],
      })
    });

    if (!response.ok) {
      console.error('[Tavily] Response not OK:', response.status);
      return { answer: null, results: [] };
    }

    const data = await response.json();
    console.log('[Tavily] Results count:', data.results?.length || 0);

    // Format hasil dengan field yang konsisten
    const formattedResults = Array.isArray(data.results)
      ? data.results.map((item, idx) => {
          let source = 'sumber';
          try {
            source = new URL(item.url).hostname.replace('www.', '') || 'sumber';
          } catch (e) {
            source = 'sumber';
          }

          return {
            id: idx,
            title: item.title || 'Berita Tanpa Judul',
            url: item.url,
            source,
            snippet: item.content || item.description || 'Tidak ada deskripsi',
            published_date: item.published_date || 'Terkini',
            score: item.score || 0,
          };
        })
      : [];

    return {
      answer: data.answer || 'Belum ada ringkasan tren spesifik saat ini.',
      results: formattedResults
    };
  } catch (error) {
    console.error("Error fetching from Tavily:", error);
    return { answer: null, results: [] };
  }
}

function personalizeSummary(answer, businessName, businessLocation) {
  if (!answer) return '';
  const name = businessName || 'bisnis Anda';
  const loc = businessLocation ? ` di ${businessLocation}` : '';
  return `Untuk ${name}${loc}: ${answer}`;
}

/**
 * Terjemahkan jawaban Tavily ke bahasa Indonesia menggunakan Kolosal AI
 */
async function translateToIndonesian(text) {
  if (!text || text.length === 0) return text;

  const kolosaKey = process.env.KOLOSAL_AI_KEY;
  if (!kolosaKey) {
    console.warn('[Translation] No Kolosal AI key available');
    return text;
  }

  try {
    const prompt = `Terjemahkan teks berikut ke bahasa Indonesia dengan natural dan ringkas. Fokus pada makna bisnis/marketing yang praktis. Jangan tambahkan informasi baru:

"${text}"

Berikan HANYA terjemahan, tanpa penjelasan tambahan.`;

    const response = await fetch('https://api.kolosal.id/v2/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kolosaKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-2-7b-chat-hf',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      })
    });

    if (!response.ok) {
      console.error('[Translation] API error:', response.status);
      return text;
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content?.trim() || '';
    
    console.log('[Translation] Success:', translatedText.substring(0, 100) + '...');
    return translatedText || text;

  } catch (error) {
    console.error('[Translation] Error:', error);
    return text;
  }
}

const allowedDomains = new Set([
  'tiktok.com',
  'instagram.com',
  'twitter.com',
  'youtube.com',
  'kompas.com',
  'detik.com',
  'dailysocial.id',
  'cnbcindonesia.com',
  'katadata.co.id',
  'tekno.kompas.com',
  'inet.detik.com'
]);

const irrelevantKeywords = [
  'atlanta', 'dallas', 'appalachian', 'georgia', 'us', 'usa', 'president', 'election', 'crime',
  'meaning', 'stands for', 'definition', 'prefecture', 'japanese', 'minimally invasive', 'microsoft educator'
];

export async function POST(req) {
  try {
    const body = await req.json();
    const { businessName, businessLocation, businessDescription, businessType } = body;
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API Key missing' }, { status: 500 });
    }

    // Tentukan topik pencarian fokus pada industri, prioritaskan businessType
    const searchTopic = determineSearchTopic(businessName, businessDescription, businessType);
    
    // Bangun query tren industri dengan business type context (tidak akan mencari definisi)
    const searchQuery = buildSearchQuery({
      businessName,
      businessDescription,
      businessLocation,
      businessType
    });

    console.log('[api/news] Searching for:', searchTopic);
    console.log('[api/news] Business Type:', businessType || 'Not specified');
    console.log('[api/news] Location:', businessLocation || 'Indonesia');

    // Fetch dari Tavily dengan query yang sudah dioptimalkan
    const { answer, results } = await fetchNewsFromTavily(searchQuery);

    // Terjemahkan jawaban ke bahasa Indonesia
    const indonesianAnswer = await translateToIndonesian(answer);

    // Format hasil
    const newsItems = results.map((item, idx) => ({
      id: idx,
      title: item.title,
      url: item.url,
      source: item.source,
      snippet: item.snippet,
      published_date: item.published_date
    }));

    return NextResponse.json({
      success: true,
      summary: indonesianAnswer,
      news: newsItems
    });

  } catch (error) {
    console.error('[API News] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'News API route is active. Use POST to fetch news.'
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { Allow: 'GET, POST, OPTIONS' } });
}