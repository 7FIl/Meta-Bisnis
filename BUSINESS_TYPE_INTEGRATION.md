# Business Type Integration Documentation

## Overview
Sistem telah diperbarui dengan fitur **Business Type & Subtype Selection** untuk mengoptimalkan AI responses dan market trend accuracy. User dapat memilih jenis usaha mereka dari dropdown yang komprehensif, sehingga sistem dapat memberikan rekomendasi yang lebih akurat dan relevan.

---

## Features Added

### 1. **Business Type Dropdown Form (MenuPengaturan.js)**
- Tambahan 9 kategori bisnis utama:
  - F&B (Makanan & Minuman)
  - Retail & Fashion
  - Jasa & Layanan
  - Pendidikan & Pelatihan
  - Properti & Real Estate
  - Otomotif
  - Pertanian & Peternakan
  - E-Commerce & Digital
  - Usaha Kecil Lainnya

- Setiap kategori memiliki **sub-kategori spesifik** (contoh: F&B → Restoran, Kafe, Kedai Mie, Bubble Tea, dll)

- **Validasi Form**: 
  - Jenis Usaha **wajib diisi** (marked with *)
  - Sub-kategori opsional untuk hasil lebih spesifik
  - Toast notification untuk konfirmasi update

- **UI/UX Improvements**:
  - Sub-kategori hanya tampil ketika kategori sudah dipilih
  - Reset sub-kategori otomatis saat ganti kategori
  - Helper text: "Penting untuk AI Akurat" dan "untuk hasil lebih spesifik"

---

## System Integration

### 2. **News/Trend Market API Enhancement (src/app/api/news/route.js)**

**Updated Search Query Logic:**
```javascript
// Priority order untuk search topic:
1. businessSubtype (paling spesifik, ex: "Coffee Shop")
2. businessType (umum, ex: "F&B")
3. businessDescription (fallback)
4. businessName (last resort)
```

**Query Building Improvement:**
```javascript
// Sebelum:
const query = `Latest viral market trends for "${searchTopic}" industry in ${location}...`;

// Sesudah:
const query = `Latest viral market trends for "${searchTopic}" in ${businessType} industry in ${location}...`;
// Tambahan konteks: competitive advantages, business opportunities, practical strategies
```

**Benefits:**
- Tavily API mendapat konteks yang lebih presisi
- Hasil tren pasar lebih relevan dengan industri user
- Mengurangi false positives (ex: def isi, artikel foreign)
- Indonesian translation tetap diaktifkan untuk summary

---

### 3. **Chat AI Enhancement (src/app/api/chat/route.js)**

**System Prompt Personalization:**
```javascript
// Sebelum:
"Kamu adalah 'Meta Bisnis', asisten bisnis AI untuk UMKM Indonesia..."

// Sesudah:
"Kamu adalah 'Meta Bisnis', asisten bisnis AI untuk UMKM Indonesia. Kamu sedang membantu bisnis tipe 'F&B (Makanan & Minuman)' (Coffee Shop)..."
```

**Impact:**
- AI memahami konteks bisnis user secara lebih dalam
- Recommendations lebih tailored ke industri spesifik
- Analysis menimbang tren dan best practices per kategori
- Finance advice disesuaikan dengan model bisnis user

**Topics Affected:**
- **Analysis**: Analisis bisnis contextual per jenis usaha
- **Finance**: Saran keuangan spesifik per industri
- **Sales**: Strategi penjualan yang sesuai kategori bisnis

---

### 4. **MarketIntelligence Component (src/components/MarketIntelligence.js)**

**Updated Props:**
```javascript
export default function MarketIntelligence({ 
  businessName, 
  marketData, 
  businessLocation, 
  businessDescription,
  businessType,        // NEW
  businessSubtype      // NEW
})
```

**API Call Enhancement:**
```javascript
const response = await fetch('/api/news', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    businessName,
    businessLocation,
    businessDescription,
    businessType,        // NEW: dikirim ke backend
    businessSubtype      // NEW: dikirim ke backend
  })
});
```

---

### 5. **DashboardView Component Update (src/components/DashboardView.js)**

**New Props:**
```javascript
export default function DashboardView({
  // ... existing props
  businessType = '',      // NEW
  businessSubtype = '',   // NEW
})
```

**Component Pass-Through:**
```javascript
<MenuPengaturan
  // ... existing props
  currentBusinessType={businessType}
  currentBusinessSubtype={businessSubtype}
/>

<MarketIntelligence
  // ... existing props
  businessType={businessType}
  businessSubtype={businessSubtype}
/>
```

**Chat Context Enhancement:**
```javascript
const businessContext = {
  name: businessName,
  type: businessType,        // NEW
  subtype: businessSubtype,  // NEW
  location: businessLocation,
  description: businessDescription,
};
```

---

### 6. **Main Page.js State Management (src/app/page.js)**

**New State Variables:**
```javascript
const [currentBusinessType, setCurrentBusinessType] = useState('');
const [currentBusinessSubtype, setCurrentBusinessSubtype] = useState('');
```

**Firebase Persistence:**
- Semua field termasuk `businessType` dan `businessSubtype` disimpan ke Firestore
- Otomatis loaded saat user login kembali
- Reset saat logout

**Updated Settings Handler:**
```javascript
const handleUpdateSettings = async ({ 
  businessName, 
  userName, 
  businessLocation, 
  businessDescription,
  businessType,    // NEW
  businessSubtype  // NEW
}) => { ... }
```

---

## Data Flow Diagram

```
User Input (MenuPengaturan)
    ↓
    ├─→ businessType (dropdown)
    ├─→ businessSubtype (dependent dropdown)
    │
    ↓
Firebase Firestore (saveUserSettings)
    ├─→ users/{uid}/businessType
    ├─→ users/{uid}/businessSubtype
    │
    ↓
DashboardView (state management)
    │
    ├─→ ChatAI (system prompt personalization)
    │   └─→ /api/chat (POST with businessType/Subtype)
    │
    ├─→ MarketIntelligence (trend optimization)
    │   └─→ /api/news (POST with businessType/Subtype)
    │       ├─→ determineSearchTopic() prioritizes businessSubtype
    │       ├─→ buildSearchQuery() adds industry context
    │       └─→ Tavily API (advanced search with precision)
    │           └─→ Kolosal AI (translate answer to Indonesian)
```

---

## Business Impact

### ✅ **For End Users:**
1. **Lebih Akurat**: AI memahami spesifik bisnis → rekomendasi lebih relevan
2. **Lebih Cepat**: Trend pasar langsung sesuai kategori → no wasted results
3. **Lebih Praktis**: Advice tailored ke industri → actionable insights
4. **Persistent**: Pilihan disimpan → tidak perlu set ulang setiap kali

### ✅ **For System:**
1. **Better Search Precision**: Tavily queries lebih targeted
2. **Reduced API Costs**: Fewer irrelevant results to filter
3. **Improved Relevance**: Less "noise" from unrelated industries
4. **Scalable**: Easy to add more business types later

---

## Usage Example

### Skenario: User Kafe Coffee Shop di Jakarta

1. **Setup Pengaturan:**
   - Jenis Usaha: `F&B (Makanan & Minuman)`
   - Sub-kategori: `Kafe / Coffee Shop`
   - Lokasi: `DKI Jakarta`
   - Deskripsi: `Specialty coffee shop dengan fokus sustainable sourcing`

2. **AI Chat - Analysis Topic:**
   - User: "Bagaimana cara meningkatkan loyalitas pelanggan?"
   - System Prompt: "...Kamu sedang membantu bisnis tipe 'F&B' (Kafe / Coffee Shop)..."
   - AI Response: Memberikan insights tentang coffee shop loyalty programs, seasonal menu strategies, community building di kedai kopi, dll

3. **Market Intelligence - Trend Pasar:**
   - Query ke Tavily: "Latest viral market trends for 'Kafe / Coffee Shop' in F&B industry in Jakarta. Focus on viral products, business opportunities..."
   - Result: Trending coffee types, social media engagement tactics, specialty beverage innovations, barista training trends
   - Summary: Ditranslate ke Indonesian via Kolosal AI

---

## Technical Specifications

### Database Schema (Firestore)
```javascript
users/{uid}
├─ businessName: string
├─ businessType: string        // NEW: "F&B (Makanan & Minuman)"
├─ businessSubtype: string     // NEW: "Kafe / Coffee Shop"
├─ businessDescription: string
├─ businessLocation: string
├─ userName: string
├─ employees: array
└─ businessData: object
```

### API Contracts

**POST /api/news**
```json
{
  "businessName": "Kopi Pintar",
  "businessLocation": "Jakarta",
  "businessDescription": "Specialty coffee shop",
  "businessType": "F&B (Makanan & Minuman)",      // NEW
  "businessSubtype": "Kafe / Coffee Shop"         // NEW
}
```

**POST /api/chat**
```json
{
  "message": "Gimana cara jual lebih banyak?",
  "businessName": "Kopi Pintar",
  "businessType": "F&B (Makanan & Minuman)",      // NEW
  "businessSubtype": "Kafe / Coffee Shop",        // NEW
  "topic": "sales"
}
```

---

## Future Enhancements

1. **Dynamic Business Types**: Load dari database instead of hardcoded
2. **Industry Benchmarks**: Compare metrics dengan businesses tipe sama
3. **Recommendation Engine**: Suggest best practices per business type
4. **Marketing Templates**: Pre-built templates per kategori bisnis
5. **Competitor Analysis**: Filter competitors by business type

---

## Migration Notes

✅ **All changes backward compatible** - existing users tetap berfungsi
- Default values: `businessType = ''`, `businessSubtype = ''`
- System prompt fallback jika field kosong
- Tavily query tetap work meski type/subtype undefined

✅ **No Breaking Changes** - semua existing APIs tetap supported
- Optional parameters di endpoint
- Graceful degradation jika type/subtype tidak provided

---

## Testing Checklist

- [ ] MenuPengaturan: Business type dropdown renders semua kategori
- [ ] MenuPengaturan: Sub-kategori dependency working (hidden sampai main type selected)
- [ ] MenuPengaturan: Validation error muncul saat save tanpa type
- [ ] Firebase: businessType/Subtype tersimpan dan ter-load ulang
- [ ] News API: Query lebih spesifik dengan type/subtype
- [ ] Chat API: System prompt include business type context
- [ ] MarketIntelligence: Trend results more relevant per type
- [ ] UI: Responsive design di mobile/tablet

---

## Support & Documentation

Untuk questions atau issues, refer to:
- **MenuPengaturan.js**: Business type selection UI
- **src/app/api/news/route.js**: Tavily integration + personalization
- **src/app/api/chat/route.js**: AI system prompt customization
- **DashboardView.js**: Component integration points
