import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

// Max logo size: 3 MB
export const MAX_LOGO_SIZE = 3 * 1024 * 1024;

/**
 * Upload a business logo for a user and return the download URL.
 * - Enforces a 3 MB limit
 * - Stores the file at `users/{uid}/logo.{ext}`
 * - Accepts an optional onProgress callback(percent)
 *
 * @param {string} uid
 * @param {File} file
 * @param {(number)=>void} onProgress
 * @returns {Promise<{url:string, path:string}>}
 */
export async function uploadBusinessLogo(uid, file, onProgress) {
  if (!uid) throw new Error('Missing uid');
  if (!file) throw new Error('No file provided');
  if (file.size > MAX_LOGO_SIZE) {
    throw new Error('File too large. Maximum allowed is 3 MB.');
  }

  const ext = (file.name || '').split('.').pop() || 'png';
  const path = `users/${uid}/logo.${ext}`;
  const storageRef = ref(storage, path);
  const metadata = { contentType: file.type || `image/${ext}` };

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on('state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes) {
          const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          try { onProgress(Math.round(percent)); } catch (e) { /* ignore */ }
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url, path });
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

export default uploadBusinessLogo;
