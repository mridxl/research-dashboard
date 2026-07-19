import { parsePhoneNumber } from 'react-phone-number-input';

/**
 * Generate UID in format: countryCode_PhoneNumber (without + symbol)
 * Example: +11234567899 -> 1_1234567899
 */
export const getPhoneUID = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  try {
    const cleanNumber = phoneNumber.replace('+', '');
    const parsedPhoneNumber = parsePhoneNumber(phoneNumber);
    if (!parsedPhoneNumber || !parsedPhoneNumber.countryCallingCode) {
      throw new Error('Invalid phone number format');
    }
    const countryCode = parsedPhoneNumber.countryCallingCode;
    const number = cleanNumber.replace(countryCode, '').replace(/\D/g, ''); // Remove non-digit characters
    return `${countryCode}_${number}`;
  } catch (error) {
    console.error('Error parsing phone number:', error);
    return '';
  }
};

/**
 * Clean phone number by removing all non-digit characters
 */
export const cleanPhoneNumber = (phone: string): string => {
  return phone ? phone.replace(/\D/g, '') : '';
};

/**
 * Convert UID format countryCode_number (e.g. '1_1234567890') to E.164 ('+11234567890')
 */
export const getPhoneFromUID = (uid: string): string => {
  if (!uid) return '';
  try {
    if (typeof uid !== 'string') return '';
    // If already E.164, return as-is
    if (uid.startsWith('+')) return uid;

    // UID format like '1_1234567890'
    if (uid.includes('_')) {
      const [countryCode, number] = uid.split('_');
      const cleaned = (number || '').replace(/\D/g, '');
      if (!countryCode || !cleaned) return '';
      return `+${countryCode}${cleaned}`;
    }

    // If it's all digits, try to return as +<digits>
    const digits = uid.replace(/\D/g, '');
    return digits ? `+${digits}` : '';
  } catch (err) {
    console.error('Error converting UID to phone:', err);
    return '';
  }
};
