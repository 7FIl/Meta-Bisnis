// src/app/api/news/route.js
import { NextResponse } from 'next/server';

/**
 * Ambil kata kunci dari nama + deskripsi bisnis untuk memperkuat konteks pencarian
 */
function extractBusinessKeywords(businessName = '', businessDescription = '') {
  const text = `${businessName} ${businessDescription}`.toLowerCase();
  const stopwords = new Set([
    'toko','kedai','warung','usaha','bisnis','umkm','ud','cv','pt','the','and','&','di','dan','yang','untuk','dengan','jasa','service','layanan','indo','indonesia','nusantara','sejahtera','makmur','jaya','abadi','utama','sentosa','group','perkasa','maju','mulia','putra','putri'
  ]);
  const tokens = text
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));

  // Prioritaskan kata unik
  return Array.from(new Set(tokens)).slice(0, 8);
}

/**
 * Bangun query yang money-oriented dan kontekstual
 */
function buildSearchQuery({ businessName, businessDescription, businessLocation, categoryHint }) {
  const currentDate = new Date().toISOString().split('T')[0];
  const namePart = businessName ? ` untuk bisnis "${businessName}"` : '';
  const descPart = businessDescription ? ` (deskripsi: ${businessDescription})` : '';
  const locationPart = businessLocation ? ` di ${businessLocation}` : ' di Indonesia';
  const categoryPart = categoryHint ? ` (kategori: ${categoryHint})` : '';
  const keywords = extractBusinessKeywords(businessName, businessDescription);
  const keywordPart = keywords.length ? ` Gunakan kata kunci berikut untuk relevansi: ${keywords.join(', ')}.` : '';

  return `Apa tren viral terbaru, produk laris, atau strategi marketing yang sedang ramai di media sosial (TikTok/Instagram) minggu ini (${currentDate})${namePart}${locationPart}${descPart}${categoryPart}? Jawab dalam bahasa Indonesia saja, fokus pada peluang keuntungan praktis yang bisa langsung diterapkan, dan prioritaskan sumber Indonesia (hindari berita luar negeri atau kriminal yang tidak relevan).${keywordPart}`;
}

/**
 * Fetch berita dari Tavily dengan pencarian agresif + ringkasan bawaan
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
        include_answer: "basic", // minta ringkasan singkat bawaan
        max_results: 8,
        include_domains: [
          "tiktok.com",
          "instagram.com",
          "twitter.com",
          "youtube.com",
          "kompas.com",
          "detik.com",
          "dailysocial.id",
          "cnbcindonesia.com",
          "katadata.co.id",
          "tekno.kompas.com",
          "inet.detik.com"
        ],
      })
    });

    if (!response.ok) {
      console.error('[Tavily] Response not OK:', response.status);
      return { answer: null, results: [] };
    }

    const data = await response.json();
    console.log('[Tavily] Results count:', data.results?.length || 0);

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
            published_date: item.published_date || 'Baru saja',
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

function splitLocation(businessLocation = '') {
  // Ambil kota dan provinsi jika dipisah koma
  const parts = businessLocation.split(',').map(p => p.trim()).filter(Boolean);
  return {
    city: parts[0] || businessLocation || '',
    province: parts[1] || parts[0] || ''
  };
}

/**
 * Fungsi scoring yang mengikuti algoritma Tavily
 * Prioritas: relevansi jenis bisnis > lokasi > konteks industri
 */
function scoreNewsRelevance(news, businessName, businessDescription, businessLocation) {
  let score = news.score || 0; // Mulai dari Tavily score
  
  const titleLower = news.title.toLowerCase();
  const snippetLower = news.snippet.toLowerCase();
  const searchText = `${titleLower} ${snippetLower}`;
  
  // 1. PRIORITAS TERTINGGI: Keyword dari nama bisnis (jenis usaha)
  // Contoh: "bakso" dari "Bakso Pak Kumis"
  const businessKeywords = businessName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  businessKeywords.forEach(keyword => {
    if (searchText.includes(keyword)) {
      score += 10; // Boost besar untuk match jenis bisnis
    }
  });
  
  // 2. Keyword dari deskripsi bisnis (detail produk/layanan)
  if (businessDescription) {
    const descKeywords = businessDescription.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    descKeywords.forEach(keyword => {
      if (searchText.includes(keyword)) {
        score += 5;
      }
    });
  }
  
  // 3. Match lokasi bisnis
  if (businessLocation && searchText.includes(businessLocation.toLowerCase())) {
    score += 3;
  }
  
  // 4. Keyword industri/bisnis umum
  const businessContextKeywords = [
    'bisnis', 'usaha', 'umkm', 'franchise', 'kuliner', 'makanan', 'minuman',
    'restoran', 'warung', 'toko', 'kedai', 'cafe', 'katering',
    'penjualan', 'omzet', 'pelanggan', 'konsumen', 'strategi', 'pemasaran',
    'tren', 'pasar', 'industri', 'pengusaha', 'wirausaha'
  ];
  
  businessContextKeywords.forEach(kw => {
    if (searchText.includes(kw)) {
      score += 2;
    }
  });
  
  // 5. Penalti jika tidak ada konteks bisnis sama sekali
  const hasBusinessContext = businessContextKeywords.some(kw => searchText.includes(kw));
  if (!hasBusinessContext) {
    score -= 15;
  }
  
  // 6. Penalti untuk berita yang terlalu umum/politik (bukan bisnis)
  const irrelevantKeywords = ['politik', 'pemilu', 'presiden', 'menteri', 'dpr', 'kpk'];
  irrelevantKeywords.forEach(kw => {
    if (searchText.includes(kw)) {
      score -= 5;
    }
  });
  
  return score;
}

function filterAndNormalizeResults(results, businessLocation) {
  return results
    .filter(item => {
      // Hanya izinkan domain yang ada di whitelist
      try {
        const host = new URL(item.url).hostname.replace('www.', '');
        if (!allowedDomains.has(host)) return false;
        // Tolak kata kunci yang tidak relevan (berita luar negeri/kriminal)
        const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
        if (irrelevantKeywords.some(k => text.includes(k))) return false;
      } catch (e) {
        return false;
      }
      return true;
    })
    .map((item, idx) => ({
      ...item,
      id: idx,
      location: businessLocation || 'Indonesia'
    }));
}

function buildNewsSummary(news) {
  if (!news || news.length === 0) return '';
  const top = news.slice(0, 3).map(n => n.title).filter(Boolean);
  if (top.length === 0) return '';
  return `Rangkuman cepat: ${top.join(' · ')}`;
}

function sanitizeAnswer(answer, news) {
  if (!answer) return buildNewsSummary(news);
  const lower = answer.toLowerCase();
  if (irrelevantKeywords.some(k => lower.includes(k))) {
    return buildNewsSummary(news);
  }
  return answer;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { query, businessName, businessLocation, businessDescription } = body;

    console.log('[api/news] Fetching news for business:', businessName);

    const { city, province } = splitLocation(businessLocation || '');
    // Gunakan konteks bisnis (AI + keyword) untuk memperkaya query
    const businessContext = await identifyBusinessContext(businessName || '', businessDescription || '');
    const queries = [];

    // 1) Query utama dengan nama bisnis penuh
    const primaryQuery = query && query.trim()
      ? query
      : buildSearchQuery({
          businessName,
          businessDescription,
          businessLocation: city,
          categoryHint: businessContext?.category
        });
    queries.push(primaryQuery);

    // 2) Query kategori industri (misal kuliner) bila tersedia
    if (businessContext?.searchTerm) {
      queries.push(buildSearchQuery({
        businessName: businessContext.searchTerm,
        businessDescription,
        businessLocation: city,
        categoryHint: businessContext.category
      }));
    }

    // 3) Query level provinsi jika kota kosong hasilnya
    if (province && province !== city) {
      queries.push(buildSearchQuery({
        businessName: businessContext?.searchTerm || businessName,
        businessDescription,
        businessLocation: province,
        categoryHint: businessContext?.category
      }));
    }

    let combinedResults = [];
    let answer = '';
    const seenUrls = new Set();

    for (const q of queries) {
      const { answer: a, results } = await fetchNewsFromTavily(q);
      if (!answer && a) answer = a; // ambil ringkasan pertama yang tersedia
      const filtered = filterAndNormalizeResults(results, businessLocation)
        .filter(n => {
          if (seenUrls.has(n.url)) return false;
          seenUrls.add(n.url);
          return true;
        });
      combinedResults = [...combinedResults, ...filtered];
      if (combinedResults.length >= 6) break; // cukup data
    }

    console.log('[api/news] Total results before scoring:', combinedResults.length);

    const scoredNews = combinedResults.map(news => ({
      ...news,
      relevanceScore: scoreNewsRelevance(news, businessName || '', businessDescription || '', businessLocation || '')
    }));

    // Ambil top 5 paling relevan
    const topNews = scoredNews
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5)
      .map(({ relevanceScore, score, ...news }) => news);

    console.log('[api/news] Returning top', topNews.length, 'news items');

    const safeSummary = sanitizeAnswer(answer, topNews);

    return NextResponse.json({
      success: true,
      summary: personalizeSummary(safeSummary, businessName, businessLocation),
      news: topNews,
      debug: {
        totalFound: combinedResults.length,
        businessName,
        businessLocation,
        queryUsed: queries[0],
        category: businessContext?.category
      }
    });

  } catch (error) {
    console.error('[api/news] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Gagal mengambil berita'
    }, { status: 500 });
  }
}

/**
 * Extract keyword industri dari nama bisnis dan deskripsi
 * DEPRECATED: Gunakan identifyBusinessContext() sebagai gantinya
 */
async function extractIndustryKeywords(businessName, businessDescription) {
  // Gunakan AI-powered business context identification
  const context = await identifyBusinessContext(businessName, businessDescription);
  
  if (context && context.category) {
    console.log('[Extract Industry] Using category:', context.category);
    return context.category;
  }
  
  return 'umkm'; // Fallback
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

/**
 * Fungsi AI untuk mengenali konteks bisnis dari nama
 * Menggunakan kombinasi pattern matching dan semantic understanding
 */
async function identifyBusinessContext(businessName, businessDescription) {
  // Daftar kategori bisnis dengan keywords
  const businessCategories = {
    'kuliner': {
      keywords: ['bakso', 'mie', 'nasi', 'ayam', 'soto', 'sate', 'burger', 'pizza', 'kopi', 'teh', 'minuman', 'makanan', 'cafe', 'restoran', 'warung', 'kedai', 'noodle', 'soup', 'rice', 'bbq', 'grilled', 'fried', 'steamed', 'martabak', 'pastel', 'lumpia', 'spring roll', 'dim sum', 'baso', 'siomay', 'kue', 'roti', 'donut', 'cake', 'pastry'],
      searchTerm: 'kuliner bisnis UMKM'
    },
    'fashion': {
      keywords: ['baju', 'pakaian', 'clothing', 'fashion', 'dress', 'shirt', 'pants', 'jacket', 'sepatu', 'shoes', 'tas', 'bag', 'aksesoris', 'accessories', 'beauty', 'makeup', 'kosmetik', 'skincare', 'fragrance', 'cologne', 'perfume'],
      searchTerm: 'fashion retail bisnis online'
    },
    'teknologi': {
      keywords: ['elektronik', 'gadget', 'laptop', 'hp', 'handphone', 'smartphone', 'computer', 'tablet', 'kamera', 'printer', 'monitor', 'keyboard', 'mouse', 'software', 'aplikasi', 'web development', 'tech'],
      searchTerm: 'teknologi elektronik bisnis'
    },
    'jasa': {
      keywords: ['salon', 'barber', 'barbershop', 'laundry', 'cuci', 'spa', 'massage', 'bengkel', 'service', 'repair', 'maintenance', 'cleaning', 'jasa', 'layanan', 'konsultasi'],
      searchTerm: 'jasa layanan bisnis'
    },
    'retail': {
      keywords: ['toko', 'store', 'shop', 'mart', 'supermarket', 'minimarket', 'distributor', 'grosir', 'retail', 'outlet'],
      searchTerm: 'retail toko bisnis'
    },
    'properti': {
      keywords: ['rumah', 'ruko', 'apartemen', 'kos', 'kamar', 'properti', 'real estate', 'tanah', 'house', 'apartment', 'office', 'kondominium'],
      searchTerm: 'properti real estate bisnis'
    },
    'otomotif': {
      keywords: ['mobil', 'motor', 'kendaraan', 'motorcycle', 'car', 'automotive', 'bengkel motor', 'dealer', 'rental mobil', 'ojek'],
      searchTerm: 'otomotif kendaraan bisnis'
    },
    'pendidikan': {
      keywords: ['kursus', 'les', 'sekolah', 'bimbel', 'pendidikan', 'academy', 'course', 'training', 'workshop', 'education'],
      searchTerm: 'pendidikan pelatihan bisnis'
    },
    'kesehatan': {
      keywords: ['klinik', 'apotek', 'farmasi', 'dokter', 'kesehatan', 'hospital', 'clinic', 'pharmacy', 'health', 'medical'],
      searchTerm: 'kesehatan medis bisnis farmasi'
    },
    'agraris': {
      keywords: ['pertanian', 'kebun', 'peternakan', 'ikan', 'tambak', 'farm', 'agriculture', 'plantation', 'farming', 'crops', 'vegetables'],
      searchTerm: 'pertanian agraris bisnis'
    }
  };

  const searchText = `${businessName} ${businessDescription}`.toLowerCase();
  
  // Cari kategori yang match
  let bestMatch = null;
  let bestScore = 0;

  for (const [category, data] of Object.entries(businessCategories)) {
    let score = 0;
    
    // Hitung keyword matches
    for (const keyword of data.keywords) {
      if (searchText.includes(keyword)) {
        score += 1;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { category, searchTerm: data.searchTerm, confidence: score };
    }
  }

  // Jika tidak ada match (score 0), coba gunakan Kolosal AI untuk semantic understanding
  if (bestMatch === null || bestScore === 0) {
    console.log('[Business Context] No keyword match for:', businessName);
    bestMatch = await identifyBusinessContextWithAI(businessName, businessDescription);
  }

  if (bestMatch) {
    console.log(`[Business Context] Identified as: ${bestMatch.category} (confidence: ${bestMatch.confidence || 'AI'})`);
  }

  return bestMatch;
}

/**
 * Gunakan AI untuk memahami bisnis secara semantik
 * Fallback jika pattern matching tidak menemukan kategori
 */
async function identifyBusinessContextWithAI(businessName, businessDescription) {
  const kolosaKey = process.env.KOLOSAL_AI_KEY;
  if (!kolosaKey) {
    console.warn('[AI Context] No Kolosal AI key, using default fallback');
    return { category: 'umkm', searchTerm: 'bisnis UMKM', confidence: 'fallback' };
  }

  try {
    const prompt = `Identifikasi kategori bisnis dari informasi berikut dan berikan HANYA nama kategori (SATU KATA):
    
Nama Bisnis: ${businessName}
Deskripsi: ${businessDescription || 'Tidak ada deskripsi'}

Kategori yang tersedia:
- kuliner (makanan & minuman)
- fashion (pakaian & aksesoris)
- teknologi (elektronik & gadget)
- jasa (service & layanan)
- retail (toko & penjualan)
- properti (real estate)
- otomotif (kendaraan)
- pendidikan (pelatihan & kursus)
- kesehatan (medis & farmasi)
- agraris (pertanian & peternakan)
- umkm (jika tidak jelas)

BERIKAN HANYA NAMA KATEGORI (contoh: "kuliner")`;

    const response = await fetch('https://api.kolosal.id/v2/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kolosaKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-2-7b-chat-hf',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
        temperature: 0.3,
      })
    });

    if (!response.ok) {
      console.error('[AI Context] API error:', response.status);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim().toLowerCase() || '';
    
    console.log('[AI Context] AI Response:', aiResponse);

    // Map AI response ke kategori
    const categoryMap = {
      'kuliner': 'kuliner',
      'fashion': 'fashion',
      'teknologi': 'teknologi',
      'jasa': 'jasa',
      'retail': 'retail',
      'properti': 'properti',
      'otomotif': 'otomotif',
      'pendidikan': 'pendidikan',
      'kesehatan': 'kesehatan',
      'agraris': 'agraris',
    };

    const category = categoryMap[aiResponse] || 'umkm';
    
    const searchTermMap = {
      'kuliner': 'kuliner bisnis UMKM',
      'fashion': 'fashion retail bisnis online',
      'teknologi': 'teknologi elektronik bisnis',
      'jasa': 'jasa layanan bisnis',
      'retail': 'retail toko bisnis',
      'properti': 'properti real estate bisnis',
      'otomotif': 'otomotif kendaraan bisnis',
      'pendidikan': 'pendidikan pelatihan bisnis',
      'kesehatan': 'kesehatan medis bisnis farmasi',
      'agraris': 'pertanian agraris bisnis',
      'umkm': 'bisnis UMKM',
    };

    return {
      category,
      searchTerm: searchTermMap[category],
      confidence: 'AI-identified'
    };

  } catch (error) {
    console.error('[AI Context] Error:', error);
    return null;
  }
}
