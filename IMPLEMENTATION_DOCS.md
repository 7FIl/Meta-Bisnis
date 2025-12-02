# UMKM Pintar AI - Dokumentasi Implementasi

## Overview
Platform AI terintegrasi untuk konsultasi ide bisnis, manajemen operasional, dan pemasaran otomatis yang dirancang khusus untuk UMKM Indonesia.

## Struktur Project Next.js

### 📁 Folder Structure
```
meta-bisnis/
├── src/
│   ├── app/
│   │   ├── page.js                 # Main entry point dengan state management
│   │   ├── layout.js               # Root layout (updated dengan metadata & fonts)
│   │   └── globals.css             # Global styles & animations
│   ├── components/
│   │   ├── ConsultationView.js     # Landing page & business consultation
│   │   ├── DashboardView.js        # Main dashboard layout
│   │   ├── FinancePanel.js         # Keuangan & transaction tracker
│   │   ├── MarketIntelligence.js   # Radar tren & chart visualization
│   │   ├── MarketingStudio.js      # Content generation & caption creator
│   │   └── AdModal.js              # Modal untuk pasang iklan
├── package.json
└── ... (konfigurasi lain)
```

## Component Breakdown

### 1. **page.js** (Main Container)
- Menghandle state management utama (currentView, businessData, transactions, dll)
- Logic untuk konsultasi AI dengan mock data 3 business recommendations
- Mengelola transisi antara ConsultationView dan DashboardView
- Props yang dipass ke sub-components

**State yang dikelola:**
```javascript
- currentView: 'consultation' | 'dashboard'
- businessData: { name, description, capital_est, target_market, challenge }
- transactions: Array of transaction objects
- loading: Boolean untuk loading indicator
- showAdModal: Boolean untuk ad modal visibility
- marketData: { insight, price }
```

### 2. **ConsultationView.js**
Landing page dengan:
- ✨ Hero section dengan gradient background & animated blobs
- 🎯 Input konsultasi dengan AI fetch button
- 📊 Recommendation card dengan detail bisnis
- Loading state dengan spinner animation

**Features:**
- Input placeholder yang descriptive
- Real-time loading indicator
- Card yang smooth fade-in animation
- Tombol "Cari Lain" & "Jalankan Bisnis Ini"

### 3. **DashboardView.js**
Main dashboard layout dengan:
- 📱 Responsive sidebar (hidden di mobile, fixed di desktop)
- 🎨 Welcome banner dengan gradient
- 🎛️ 3-column grid layout untuk financial & market data
- Ad button untuk promosi

**Sub-components yang di-import:**
- FinancePanel
- MarketIntelligence
- MarketingStudio
- AdModal

### 4. **FinancePanel.js**
Kasir & keuangan dengan:
- 💰 Balance summary card (saldo, income, expense)
- 📝 Transaction form (keterangan, jumlah, tipe in/out)
- 📋 Recent transaction list dengan scroll
- Real-time calculation dari state transactions

**Features:**
- Form validation
- Auto-update balance display
- Currency formatting (toLocaleString ID)
- Max height scrollable list

### 5. **MarketIntelligence.js**
Market insights dengan:
- 📈 Chart.js line chart visualization
- 🤖 AI insight text box
- 💹 Price & search trend display
- Live analysis badge dengan pulse animation

**Features:**
- Responsive chart sizing
- Chart cleanup on component unmount
- Mock market data display
- Color-coded trend indicators

### 6. **MarketingStudio.js**
Content generator untuk:
- ✍️ Textarea input untuk detail promo
- 🎯 Generate caption untuk IG/WhatsApp
- 📋 Result display dengan copy button
- Loading state dengan spinner

**Features:**
- Simulated AI caption generation (2s delay)
- Multiple caption templates
- Clipboard copy functionality
- Disabled button state saat loading

### 7. **AdModal.js**
Modal untuk advertising:
- 📢 Two ad packages (Instagram & TikTok)
- 💵 Price & reach information
- ✅ CTA buttons (Batal & Pasang Sekarang)
- Backdrop blur effect

## Styling & Animations

### **globals.css** - Custom Animations
```css
.animate-fade-in        /* Smooth fade & slide up */
@keyframes blob         /* Floating background blobs */
.animation-delay-2000   /* Staggered blob animation */
.glass-panel            /* Glassmorphism effect */
.gradient-text          /* Gradient text effect */
```

### **Tailwind CSS Classes**
- Responsive design dengan `md:` breakpoints
- Color scheme: blue, indigo, purple, slate
- Spacing: Consistent padding/margin utilities
- Shadows: Shadow-sm, shadow-lg, shadow-xl

### **Font**
- Plus Jakarta Sans (300, 400, 600, 700 weights) dari Google Fonts
- Applied globally melalui CSS variable

## State Management Flow

```
page.js (Main State)
    ↓
handleConsultAI() → Mock API call → setBusinessData() → setCurrentView('dashboard')
    ↓
[ConsultationView] ← Input user
    ↓
[DashboardView] → render dengan businessData
    ↓
├── FinancePanel (transactions state)
├── MarketIntelligence (marketData state)
└── MarketingStudio (local component state)
```

## Mock Data Integration

### Business Recommendations (3 options)
```javascript
1. Kopi Pintar AI - Kuliner (Rp 5-10M)
2. Laundry Express Online - Jasa (Rp 8-15M)
3. Snack Sehat Organik - Kuliner (Rp 3-7M)
```

### Market Data Mock
```javascript
{
  insight: "Tren positif...",
  price: "Rp XX.000"
}
```

### Chart.js Data (MarketIntelligence)
```javascript
Line chart 7 hari: [12, 19, 15, 25, 32, 45, 40]
```

## UI/UX Highlights

✨ **Smooth Interactions:**
- Fade-in animations untuk card
- Loading spinners dengan actual delays
- Hover states pada semua interactive elements
- Disabled states untuk buttons saat loading

📱 **Responsive Design:**
- Mobile-first approach
- Sidebar hidden di mobile, fixed di desktop
- Grid columns: 1 (mobile) → 3 (lg)
- Touch-friendly button sizes

🎨 **Visual Hierarchy:**
- Color-coded transaction types (green/red)
- Icon indicators untuk setiap section
- Gradient backgrounds untuk emphasis
- Consistent spacing & typography

## Integrasi dengan Gemini API (Ready)

Kode sudah siap untuk integrasi Gemini API di:
1. `handleConsultAI()` - Untuk konsultasi bisnis
2. `generateMarketInsight()` - Untuk market intelligence
3. `generateCaption()` - Untuk marketing content

**Setup:**
1. Dapatkan API key dari Google AI Studio
2. Masukkan di environment variable atau state
3. Replace mock setTimeout dengan actual fetch calls

## Running the Project

```bash
# Development server
npm run dev

# Production build
npm run build
npm start
```

**Akses:** http://localhost:3000

## Browser Compatibility
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled
- CSS Grid & Flexbox support

## Dependencies
- Next.js 16.0.6 dengan Turbopack
- Tailwind CSS (CDN)
- Chart.js (CDN)
- Font Awesome 6.0.0 (CDN)

## Future Enhancements
- [ ] Real Gemini API integration dengan grounding
- [ ] Database untuk persistent storage
- [ ] Authentication & user profiles
- [ ] Payment gateway integration
- [ ] WhatsApp Business API integration
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Export reports functionality

---

**Created with ❤️ for UMKM Indonesia**
