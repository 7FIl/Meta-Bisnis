# Temporary Data Flow Documentation

## Masalah yang Dipecahkan
- User melakukan konsultasi AI di ConsultationView **sebelum login**
- Setelah setuju dengan rekomendasi, user diminta login
- **BUG**: Data tidak tersimpan karena belum ada UID Firebase
- **Solusi**: Gunakan localStorage untuk simpan temporary, transfer ke Firebase setelah login

---

## Alur Lengkap

### 1. **User Konsultasi AI (Sebelum Login)**
```
ConsultationView 
  → Input business idea 
  → Klik "Konsultasi AI" 
  → API call ke /api/chat 
  → Get AI recommendation 
  → handleConsultAI() dipanggil di page.js
```

### 2. **Save AI Recommendation ke Temp Storage** (NEW)
**File**: `src/app/page.js` - fungsi `handleConsultAI` (line ~380)

```javascript
// Setelah AI response berhasil
if (!user) {
  const tempPayload = {
    businessName: newBusinessData.name,
    businessDescription: newBusinessData.description || '',
    businessLocation: newBusinessData.location || 'N/A',
    businessType: newBusinessData.businessType || '',
    businessData: newBusinessData,
    userName: 'Pengguna',
  };
  setTempData('meta_bisnis_temp', tempPayload);
}
```

**Storage Key**: `meta_bisnis_temp` (localStorage)
**Data Tersimpan**:
- businessName ✓
- businessDescription ✓
- businessLocation ✓
- businessType ✓
- businessData (full AI object) ✓
- userName (default, update saat setup) ✓

---

### 3. **User Login**
```
Klik "Login untuk Mulai" 
  → Google Login 
  → onAuthStateChanged callback triggered 
  → currentUser verified
```

---

### 4. **Detect & Transfer Temp Data** (NEW)
**File**: `src/app/page.js` - useEffect auth listener (line ~47-87)

```javascript
useEffect(() => {
  onAuthStateChanged(auth, (currentUser) => {
    if (currentUser && currentUser.emailVerified) {
      // CEK TEMP DATA
      const tempData = getTempData('meta_bisnis_temp');
      if (tempData && tempData.businessName) {
        // TRANSFER ke Firebase
        const mergedSettings = {
          businessName: tempData.businessName,
          userName: tempData.userName || currentUser.displayName,
          businessLocation: tempData.businessLocation,
          businessDescription: tempData.businessDescription,
          businessType: tempData.businessType,
          businessData: tempData.businessData,
          employees: [],
        };
        
        // Save ke Firebase
        await saveUserSettings(currentUser.uid, mergedSettings);
        
        // Apply ke state
        setCurrentBusinessName(mergedSettings.businessName);
        // ... set other states ...
        
        // Hapus temp data
        removeTempData('meta_bisnis_temp');
        hasBusinessData = true;
      }
    }
  });
}, []);
```

**Benefit**: 
- Temp data otomatis dipindahkan ke Firebase ✓
- User tidak perlu ulang setup ✓
- Langsung ke dashboard, skip onboarding ✓

---

### 5. **Jika User Update Settings Sebelum Login** (NEW)
**File**: `src/app/page.js` - fungsi `handleUpdateSettings` (line ~415)

```javascript
if (auth.currentUser) {
  // JIKA LOGIN: Save ke Firebase
  await saveUserSettings(auth.currentUser.uid, payload);
  toast.success('Pengaturan tersimpan.');
} else {
  // JIKA BELUM LOGIN: Save ke Temp Storage
  setTempData('meta_bisnis_temp', payload);
  toast.info('Data tersimpan sementara di browser. Login untuk menyimpan permanen.');
}
```

---

## Helper Functions (New File)
**File**: `src/lib/cookies.js`

```javascript
export const setTempData(key, data)
  → Save object ke localStorage sebagai JSON

export const getTempData(key)
  → Retrieve object dari localStorage, parse JSON

export const removeTempData(key)
  → Delete entry dari localStorage

export const hasTempData(key)
  → Check apakah ada data tersimpan
```

---

## Flow Diagram

```
SEBELUM LOGIN:
┌─────────────────────────┐
│ ConsultationView        │
│ - Input business idea   │
│ - Call AI API           │
└────────┬────────────────┘
         │ handleConsultAI()
         ↓
┌─────────────────────────┐
│ page.js                 │
│ - Save to temp storage  │
│ - localStorage key:     │
│   "meta_bisnis_temp"    │
└─────────────────────────┘

USER LOGIN:
┌─────────────────────────┐
│ Google Auth             │
│ - currentUser created   │
└────────┬────────────────┘
         │ onAuthStateChanged
         ↓
┌─────────────────────────┐
│ Auth Listener (page.js) │
│ - getTempData()         │
│ - saveUserSettings()    │
│ - removeTempData()      │
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│ Firebase Firestore      │
│ - Settings saved        │
│ - Ready to use          │
└─────────────────────────┘
```

---

## Test Scenarios

### Scenario 1: Complete AI → Login → Dashboard
1. ✓ Open ConsultationView
2. ✓ Enter business idea
3. ✓ Click "Konsultasi AI"
4. ✓ Get recommendation (data saved to temp)
5. ✓ Click "Login untuk Mulai"
6. ✓ Login with Google
7. ✓ Observe: Redirect to dashboard (NO onboarding)
8. ✓ Observe: Business name & type loaded from temp

### Scenario 2: Return Visit After Login
1. ✓ User logout
2. ✓ Login again
3. ✓ Observe: Dashboard loads directly with saved data
4. ✓ Observe: Temp data cleared (not re-used)

### Scenario 3: Manual Settings Update Before Login
1. ✓ OnboardingView manual form (before login)
2. ✓ Enter business details
3. ✓ Click save
4. ✓ Observe: "Data tersimpan sementara..."
5. ✓ Login
6. ✓ Observe: Data transferred to Firebase

---

## Files Modified

| File | Changes | Purpose |
|------|---------|---------|
| `src/lib/cookies.js` | **NEW** | Temp data management helper |
| `src/app/page.js` | Import cookies, Auth listener enhancement, handleUpdateSettings | Temp ↔ Firebase transfer logic |
| `src/components/ConsultationView.js` | *No changes* | Uses parent callback (page.js handles temp save) |
| `src/components/OnboardingView.js` | *No changes* | Uses handleUpdateSettings for temp save |

---

## Key Improvements

✅ **No Data Loss**: AI recommendations saved even before login
✅ **Seamless UX**: Skip onboarding after AI recommendation
✅ **Persistent**: Data kept until login, then transferred to Firebase
✅ **Automatic Cleanup**: Temp data removed after successful transfer
✅ **Browser Compatible**: Uses localStorage (available on all modern browsers)
✅ **Graceful Fallback**: If temp data missing, load from Firebase normally

---

## Console Logs for Debugging

Look for these in browser console:

```javascript
// When saving temp data
[TempData] Saved to meta_bisnis_temp: {businessName, ...}

// When transferring at login
[Auth] Found temp data, transferring to Firebase: {...}
[Auth] Temp data saved to Firebase

// When retrieving temp data
[TempData] Retrieved from meta_bisnis_temp: {...}

// When removing temp data
[TempData] Removed meta_bisnis_temp
```

---

## Backward Compatibility

✅ Existing users: No changes, loads from Firebase as before
✅ New users (no temp data): Falls back to normal Firebase load
✅ Users with temp data: Auto-migrated on login

---

## Future Enhancements

- Add expiration date to temp data (auto-clear after 7 days)
- Encrypt temp data before storing in localStorage
- Add migration UI showing which data is being transferred
- Allow user to discard temp data and start fresh
