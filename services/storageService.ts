import { logger } from '../lib/logger';

/**
 * Convert a file to a base64 data URL string.
 * This stores the file content directly in Firestore as a base64-encoded string,
 * eliminating the need for Firebase Storage (which requires the Blaze plan).
 *
 * Files are capped at 1MB in the UI, so the base64 string (~1.33x original size)
 * stays well within Firestore's 1MB document size limit.
 */
export const uploadUserDocument = async (
  _userId: string,
  file: File
): Promise<string> => {
  try {
    return await fileToBase64(file);
  } catch (error) {
    logger.error('File conversion to base64 failed:', error);
    throw new Error('Failed to process document. Please try again.');
  }
};

/**
 * Read a File object and return it as a base64 data URL.
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader did not return a string'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};
