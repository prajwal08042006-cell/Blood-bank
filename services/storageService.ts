import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { logger } from '../lib/logger';

/**
 * Upload a file to Firebase Storage and return the download URL.
 * Files are stored under: user-documents/{userId}/{timestamp}_{filename}
 */
export const uploadUserDocument = async (
  userId: string,
  file: File
): Promise<string> => {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageRef = ref(storage, `user-documents/${userId}/${Date.now()}_${sanitizedName}`);

  try {
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    logger.error('File upload to Storage failed:', error);
    throw new Error('Failed to upload document. Please try again.');
  }
};
