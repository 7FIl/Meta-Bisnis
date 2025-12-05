import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Fungsi untuk menyimpan/update data user
export const saveUserSettings = async (uid, data) => {
  try {
    // Referensi ke dokumen: collection "users", ID dokumen = UID user
    const userRef = doc(db, 'users', uid);
    // setDoc dengan { merge: true } akan mengupdate field yang ada atau membuat baru jika belum ada
    await setDoc(userRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};

// Fungsi untuk mengambil data user
export const getUserSettings = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null; // Data belum ada (user baru)
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
};
