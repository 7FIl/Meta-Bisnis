// src/lib/businessData.js
'use client';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const DEFAULT_BUSINESS_DATA = {
  stockItems: [],
  salesHistory: [],
  marketData: {
    period: new Date().toISOString().slice(0, 7),
    sales: [],
    incomes: [],
    marketing: [],
    salesHistory: [],
  },
};

export async function fetchBusinessData(userId) {
  if (!userId) return DEFAULT_BUSINESS_DATA;
  try {
    const ref = doc(db, 'businessData', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return DEFAULT_BUSINESS_DATA;
    const data = snap.data() || {};
    return {
      stockItems: data.stockItems || [],
      salesHistory: data.salesHistory || [],
      marketData: {
        period: data.marketData?.period || new Date().toISOString().slice(0, 7),
        sales: data.marketData?.sales || [],
        incomes: data.marketData?.incomes || [],
        marketing: data.marketData?.marketing || [],
        salesHistory: data.marketData?.salesHistory || data.salesHistory || [],
      },
    };
  } catch (err) {
    console.error('Failed to fetch business data:', err);
    return DEFAULT_BUSINESS_DATA;
  }
}

export async function saveBusinessData(userId, payload) {
  if (!userId) return;
  try {
    const ref = doc(db, 'businessData', userId);
    const merged = {
      ...DEFAULT_BUSINESS_DATA,
      ...(payload || {}),
    };
    await setDoc(ref, merged, { merge: true });
    return true;
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('missing or insufficient')) {
      console.warn('Permission denied when saving business data (suppressed):', msg);
      return false;
    }
    console.error('Failed to save business data:', err);
    return false;
  }
}
