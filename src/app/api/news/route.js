// src/app/api/news/route.js
import { NextResponse } from 'next/server';

/**
 * Fungsi untuk fetch berita dari Tavily API
 * Menggunakan algoritma pencarian yang fokus pada bisnis serupa dengan user
 */
async function fetchNewsFromTavily(query, businessLocation = '') {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("Tavily API Key belum diset!");
    return [];
  }

  try {
    // Query dengan filter tanggal: Hanya berita 3 bulan terakhir
    // Tavily akan handle penyisihan berdasarkan prompt
    let enhancedQuery = `Berita tren viral terbaru di indonesia mengenai bisnis ${query} dibuat dalam 3 bulan terakhir (sejak September 2025)`;
    if (businessLocation && businessLocation.trim()) {
      enhancedQuery += ` di ${businessLocation}`;
    }
    
    console.log('[Tavily Query]:', enhancedQuery);
    
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: enhancedQuery,
        search_depth: "basic",
        include_answer: false,
        max_results: 10,
        include_domains: [], // Biarkan Tavily pilih sumber terbaik
      })
    });
    
    if (!response.ok) {
      console.error('[Tavily] Response not OK:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('[Tavily] Results count:', data.results?.length || 0);
    
    // Format hasil
    if (data.results && Array.isArray(data.results)) {
      return data.results.map((result, idx) => ({
        id: idx,
        title: result.title || 'Berita Tanpa Judul',
        source: new URL(result.url).hostname.replace('www.', '') || 'Sumber',
        time: 'Baru',
        location: businessLocation || 'Indonesia',
        snippet: result.content || result.description || 'Tidak ada deskripsi',
        url: result.url,
        score: result.score || 0,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching from Tavily:", error);
    return [];
  }
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

export async function POST(req) {
  try {
    const body = await req.json();
    const { query, businessName, businessLocation, businessDescription } = body;
    
    if (!query) {
      return NextResponse.json({ success: false, error: 'Query required' }, { status: 400 });
    }
    
    console.log('[api/news] Fetching news for business:', businessName);
    console.log('[api/news] Query:', query);
    
    // STRATEGI PENCARIAN: Berita tren viral terbaru tentang bisnis serupa
    // Format query: "Berita tren viral terbaru di indonesia mengenai bisnis [jenis bisnis]"
    
    // Query 1: Fokus ke jenis bisnis utama dengan format tren viral
    const primaryQuery = query; // Sudah dalam format yang tepat dari frontend
    let allNews = await fetchNewsFromTavily(primaryQuery, businessLocation);
    
    console.log('[api/news] Primary search results:', allNews.length);
    
    // Query 2: Jika hasil kurang, cari dengan AI-identified industry category
    if (allNews.length < 5) {
      const businessContext = await identifyBusinessContext(businessName, businessDescription);
      if (businessContext && businessContext.searchTerm) {
        const secondaryQuery = `tren viral ${businessContext.searchTerm} di indonesia`;
        const moreNews = await fetchNewsFromTavily(secondaryQuery, businessLocation);
        
        console.log('[api/news] Secondary search results:', moreNews.length, `(category: ${businessContext.category})`);
        
        // Gabung dan deduplikasi (berdasarkan URL)
        const existingUrls = new Set(allNews.map(n => n.url));
        const newUniqueNews = moreNews.filter(n => !existingUrls.has(n.url));
        allNews = [...allNews, ...newUniqueNews];
      }
    }
    
    console.log('[api/news] Total results before scoring:', allNews.length);
    
    // Scoring dan ranking (Tavily sudah filter tanggal melalui prompt)
    const scoredNews = allNews.map(news => ({
      ...news,
      relevanceScore: scoreNewsRelevance(news, businessName, businessDescription, businessLocation)
    }));
    
    // Sort by relevance dan ambil top 3
    const topNews = scoredNews
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3)
      .map(({ relevanceScore, score, ...news }) => news);
    
    console.log('[api/news] Returning top', topNews.length, 'news items');
    
    return NextResponse.json({
      success: true,
      news: topNews,
      debug: {
        totalFound: allNews.length,
        businessName,
        businessLocation
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
