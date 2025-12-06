# Testing Checklist - Temporary Data Flow

## Pre-Test Setup
- [ ] Clear browser localStorage (F12 → Application → Clear All)
- [ ] Logout from Firebase Console if logged in
- [ ] Keep browser console open to check logs

---

## Test Case 1: AI Consultation → Login → Dashboard (Bypass Onboarding)

### Steps:
1. [ ] Open app in incognito/private window (ensures fresh state)
2. [ ] Should see ConsultationView (not logged in)
3. [ ] Enter business idea, e.g., "Saya ingin memulai toko kopi specialty di Jakarta"
4. [ ] Click "Konsultasi AI"
5. [ ] Wait for AI recommendation to load
6. [ ] Check browser console: Should see `[ConsultationView] Saved AI recommendation to temp storage:`
7. [ ] Check localStorage: `meta_bisnis_temp` should contain businessName, businessType, etc.
8. [ ] Click "Login untuk Mulai" button
9. [ ] Complete Google login flow
10. [ ] **EXPECTED**: Redirect to Dashboard (NOT Onboarding)
11. [ ] Check browser console: Should see `[Auth] Found temp data, transferring to Firebase:`
12. [ ] Verify business name in dashboard matches AI recommendation
13. [ ] Verify businessType is set correctly
14. [ ] Check localStorage: `meta_bisnis_temp` should be **REMOVED** (cleanup successful)
15. [ ] Refresh page → Should stay on dashboard with saved data

### Success Criteria:
- ✅ Temp data saved to localStorage before login
- ✅ Temp data transferred to Firebase after login
- ✅ Onboarding skipped entirely
- ✅ Dashboard shows correct business data
- ✅ Temp data cleaned up after transfer
- ✅ Data persists on page refresh

---

## Test Case 2: Manual Setup Before Login (OnboardingView)

### Steps:
1. [ ] Open app in incognito window
2. [ ] View should be ConsultationView
3. [ ] Click "Setup Manual" or navigate to manual form
4. [ ] **Note**: This is only for returning users or if they skip AI
5. [ ] For this test, trigger OnboardingView by:
   - [ ] Check if there's a way to go to onboarding from consultation (might not be direct)
   - [ ] Or: Setup new account that doesn't trigger onboarding
6. [ ] In OnboardingView manual form, enter:
   - [ ] Business Name: "Toko Elektronik Saya"
   - [ ] Business Type: "Retail"
   - [ ] Location: "Bandung"
   - [ ] Description: "Toko elektronik consumer"
7. [ ] Click save/submit
8. [ ] Should see toast: "Data tersimpan sementara di browser. Login untuk menyimpan permanen."
9. [ ] Check localStorage: `meta_bisnis_temp` should contain data
10. [ ] Click login button
11. [ ] Complete Google login
12. [ ] **EXPECTED**: Redirect to Dashboard with saved manual data
13. [ ] Verify data transferred correctly to Firebase
14. [ ] Temp data should be cleaned up

### Success Criteria:
- ✅ Temp data saved when manual form submitted before login
- ✅ Toast message shown correctly
- ✅ Data transferred to Firebase after login
- ✅ Dashboard shows correct business data from manual form

---

## Test Case 3: Return Visit (No Re-login Spam)

### Steps:
1. [ ] From Test Case 1, click logout
2. [ ] Verify redirected to ConsultationView
3. [ ] Click login again (return user)
4. [ ] Complete Google login
5. [ ] **EXPECTED**: Direct to Dashboard (no onboarding)
6. [ ] Verify business data loaded from Firebase (not temp storage)
7. [ ] Check console: Should NOT see "Found temp data" message (because temp was cleared)

### Success Criteria:
- ✅ Return users skip onboarding
- ✅ Data loaded from Firebase, not temp
- ✅ No temp data re-used on second login

---

## Test Case 4: Temp Data Expiration / Manual Cleanup

### Steps:
1. [ ] Save temp data to localStorage (any method from tests above)
2. [ ] Open DevTools → Application → localStorage
3. [ ] View `meta_bisnis_temp` content
4. [ ] Manually delete it: `localStorage.removeItem('meta_bisnis_temp')`
5. [ ] Refresh page or login
6. [ ] **EXPECTED**: Should not see temp data transfer log
7. [ ] Should handle gracefully (fallback to normal Firebase load or onboarding)

### Success Criteria:
- ✅ Missing temp data doesn't cause errors
- ✅ App gracefully falls back to normal flow

---

## Test Case 5: Verify OnboardingView Download Button Works

### Steps:
1. [ ] Get to OnboardingView (sign up new account)
2. [ ] Go through AI consultation
3. [ ] Should see "Download Rincian Modal (Excel)" button
4. [ ] Click it
5. [ ] **EXPECTED**: Excel file downloads
6. [ ] Verify file contains:
   - [ ] Sheet 1: "Rincian Modal" with itemized breakdown
   - [ ] Sheet 2: "Analisis Keuangan" with BEP, ROI, Gross Margin
7. [ ] Click "Mulai" to proceed
8. [ ] Verify Excel data (from onboarding) can be downloaded again in dashboard

### Success Criteria:
- ✅ Excel download button works in OnboardingView
- ✅ Excel contains correct format (2 sheets)
- ✅ Financial metrics calculated correctly

---

## Test Case 6: Edge Case - Login Before Clicking "Login untuk Mulai"

### Steps:
1. [ ] Open app in incognito
2. [ ] Enter business idea and get AI recommendation
3. [ ] Temp data saved (check console)
4. [ ] **Instead of clicking "Login untuk Mulai"**, click a generic "Login" button if available, or logout/login through other means
5. [ ] **EXPECTED**: Same behavior - temp data detected and transferred

### Success Criteria:
- ✅ Temp data transfer works even if user logins differently
- ✅ Still redirects to dashboard correctly

---

## Test Case 7: Check Console Logs

**When should these appear:**

```javascript
// During AI consultation (before login)
[TempData] Saved to meta_bisnis_temp: {...}
[ConsultationView] Saved AI recommendation to temp storage: {...}

// During login
[TempData] Retrieved from meta_bisnis_temp: {...}
[Auth] Found temp data, transferring to Firebase: {...}
[Auth] Temp data saved to Firebase
[TempData] Removed meta_bisnis_temp

// During subsequent loads
// Should NOT see temp-related logs (only normal Firebase loads)
```

---

## Regression Testing

- [ ] Existing users (no temp data): Can still login and access dashboard
- [ ] Users with existing Firebase data: No conflicts when temp data exists
- [ ] Onboarding still shows for genuinely new users without temp data
- [ ] Settings page (pengaturan): Still allows manual edits
- [ ] Dashboard: No UI breaks or console errors

---

## Mobile Testing

- [ ] Test on mobile browser (iOS Safari, Android Chrome)
- [ ] Temp data localStorage works on mobile
- [ ] Download Excel works on mobile
- [ ] Login flow works on mobile
- [ ] Check touch interactions (buttons, forms)

---

## Failure Scenarios

### Scenario A: localStorage unavailable (Private browsing in some browsers)
- [ ] App should still work (might not save temp data, but user can still login)
- [ ] Should show appropriate error/warning if available

### Scenario B: Network error during Firebase save
- [ ] Temp data should remain for retry
- [ ] User should be informed
- [ ] Can try login again

### Scenario C: Corrupted temp data
- [ ] Should have try-catch to handle JSON parse errors
- [ ] Should fallback to normal flow
- [ ] Should not crash app

---

## Sign-off Checklist

- [ ] All test cases passed
- [ ] No console errors
- [ ] Temp data flow works end-to-end
- [ ] Data persists correctly
- [ ] UI shows appropriate messages
- [ ] Excel download works in OnboardingView
- [ ] Return users skip onboarding
- [ ] App works on mobile
- [ ] No regressions in existing features

---

## Debug Commands (Browser Console)

```javascript
// View temp data
localStorage.getItem('meta_bisnis_temp')

// Clear temp data
localStorage.removeItem('meta_bisnis_temp')

// Check all localStorage
console.table(Object.entries(localStorage))

// Enable verbose logging (if needed)
// In browser console: localStorage.setItem('DEBUG_TEMP_DATA', 'true')
```

---

## Notes

- Test in both logged out and logged in states
- Use different Google accounts for multiple user tests
- Check network tab for API calls
- Verify Firestore documents created correctly
- Test both success and error paths
