import { apiClient } from '@/lib/api/client';
import type { ApiResponse, RSAPublicKey } from '@/lib/api/types';

/**
 * Helper function to convert ArrayBuffer to Base64
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Helper function to generate encryption key from a password
 */
const generateKey = async (password: string): Promise<{ key: CryptoKey; salt: Uint8Array }> => {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Generate a random salt
  const salt = window.crypto.getRandomValues(new Uint8Array(16));

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );

  return { key, salt };
};

/**
 * Encrypt the video blob using AES-GCM
 */
export const encryptVideo = async (videoBlob: Blob, password: string): Promise<Blob> => {
  try {
    // Generate encryption key and salt
    const { key, salt } = await generateKey(password);

    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Convert blob to array buffer
    const videoArrayBuffer = await videoBlob.arrayBuffer();

    // Encrypt the video data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      videoArrayBuffer
    );

    // Combine salt, IV, and encrypted data
    const encryptedArray = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    encryptedArray.set(salt, 0);
    encryptedArray.set(iv, salt.length);
    encryptedArray.set(new Uint8Array(encryptedData), salt.length + iv.length);

    // Convert to blob for sending
    return new Blob([encryptedArray], { type: 'application/octet-stream' });
  } catch (error) {
    console.error('Video encryption error:', error);
    throw error;
  }
};

/**
 * Encrypt the calibration data using AES-GCM
 */
export const encryptCalibrationData = async (
  calibrationPoints: unknown,
  password: string
): Promise<string> => {
  try {
    // Generate encryption key and salt
    const { key, salt } = await generateKey(password);

    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Convert calibration points to array buffer
    const encoder = new TextEncoder();
    const dataArrayBuffer = encoder.encode(JSON.stringify(calibrationPoints));

    // Encrypt the data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      dataArrayBuffer
    );

    // Combine salt, IV, and encrypted data
    const encryptedArray = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    encryptedArray.set(salt, 0);
    encryptedArray.set(iv, salt.length);
    encryptedArray.set(new Uint8Array(encryptedData), salt.length + iv.length);

    // Convert to base64 string for JSON compatibility
    return arrayBufferToBase64(encryptedArray.buffer);
  } catch (error) {
    console.error('Calibration encryption error:', error);
    throw error;
  }
};

/** Same as {@link encryptCalibrationData}; use for mirror-frame JSON payload `{ mirror_frame }`. */
export const encryptMirrorFramePayload = async (
  payload: { mirror_frame: string },
  password: string
): Promise<string> => encryptCalibrationData(payload, password);

/**
 * Encrypt the AES password with RSA public key
 */
export const encryptPassword = async (password: string): Promise<string> => {
  try {
    // Get RSA public key from API
    const { data } = await apiClient.get<ApiResponse<RSAPublicKey>>('/research/test/rrpk');

    if (!data.success || !data.details) {
      throw new Error(data.message || 'Failed to fetch RSA public key');
    }

    const jwk = data.details;
    const publicKey = await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );

    // Encrypt the password
    const encryptedPassword = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      new TextEncoder().encode(password)
    );

    // Convert to base64 string
    return arrayBufferToBase64(encryptedPassword);
  } catch (error) {
    console.error('Password encryption error:', error);
    throw error;
  }
};
