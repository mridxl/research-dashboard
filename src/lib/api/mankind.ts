import { apiClient } from './client';
import type {
  ApiResponse,
  MankindMrDetails,
  MankindRegisterResponse,
  MankindSendOtpResponse,
  MankindVerifyOtpResponse,
} from './types';

export const sendMankindOtp = async (phoneNumber: string): Promise<MankindSendOtpResponse> => {
  const { data } = await apiClient.post<ApiResponse<MankindSendOtpResponse>>('/mankind/otp/send', {
    phone_number: phoneNumber,
  });
  if (!data.success || !data.details) {
    throw new Error(data.message || 'Failed to send OTP');
  }
  return data.details;
};

export const verifyMankindOtp = async (
  phoneNumber: string,
  otpSessionId: string,
  otp: string
): Promise<MankindVerifyOtpResponse> => {
  const { data } = await apiClient.post<ApiResponse<MankindVerifyOtpResponse>>(
    '/mankind/otp/verify',
    {
      phone_number: phoneNumber,
      otp_session_id: otpSessionId,
      otp,
    }
  );
  if (!data.success || !data.details) {
    throw new Error(data.message || 'Failed to verify OTP');
  }
  return data.details;
};

export const registerMankindMr = async (
  phoneNumber: string,
  otpSessionId: string,
  mrDetails: MankindMrDetails
): Promise<MankindRegisterResponse> => {
  const { data } = await apiClient.post<ApiResponse<MankindRegisterResponse>>('/mankind/register', {
    phone_number: phoneNumber,
    otp_session_id: otpSessionId,
    mr_details: mrDetails,
  });
  if (!data.success || !data.details) {
    throw new Error(data.message || 'Failed to register clinic');
  }
  return data.details;
};
