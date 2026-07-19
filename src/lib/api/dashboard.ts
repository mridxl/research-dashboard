import { apiClient } from './client';
import type {
  ApiResponse,
  Assessment,
  ClinicInfo,
  Doctor,
  DoctorChangeRequest,
  DoctorCreateResult,
  DoctorDeleteResult,
  DoctorUpdateResult,
  LogoResponse,
  PaginatedResponse,
} from './types';

// Doctor API
export const getDoctors = async (): Promise<Doctor[]> => {
  const { data } = await apiClient.get<ApiResponse<{ doctors: Doctor[] }>>('/doctor/');
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch doctors');
  }
  return data.details.doctors;
};

export const getPendingDoctorRequests = async (): Promise<DoctorChangeRequest[]> => {
  const { data } =
    await apiClient.get<ApiResponse<{ items: DoctorChangeRequest[] }>>('/doctor/pending');
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch pending doctor requests');
  }
  return data.details.items ?? [];
};

export const createDoctor = async (doctorData: Omit<Doctor, 'id'>): Promise<DoctorCreateResult> => {
  const { data, status } = await apiClient.post<
    ApiResponse<{ doctor?: Doctor; request_id?: string; status?: string }>
  >('/doctor/', doctorData);
  if (!data.success) {
    throw new Error(data.message || 'Failed to create doctor');
  }
  if (status === 202 || data.details?.status === 'pending') {
    return {
      pending: true,
      requestId: data.details?.request_id,
    };
  }
  if (!data.details?.doctor) {
    throw new Error(data.message || 'Invalid create doctor response');
  }
  return { pending: false, doctor: data.details.doctor };
};

export const updateDoctor = async (
  doctorId: string,
  doctorData: Partial<Omit<Doctor, 'id'>>
): Promise<DoctorUpdateResult> => {
  const { data, status } = await apiClient.patch<
    ApiResponse<{ doctor?: Doctor; request_id?: string; status?: string }>
  >(`/doctor/${encodeURIComponent(doctorId)}`, doctorData);
  if (!data.success) {
    throw new Error(data.message || 'Failed to update doctor');
  }
  if (status === 202 || data.details?.status === 'pending') {
    return {
      pending: true,
      requestId: data.details?.request_id,
    };
  }
  if (!data.details?.doctor) {
    throw new Error(data.message || 'Invalid update doctor response');
  }
  return { pending: false, doctor: data.details.doctor };
};

export const deleteDoctor = async (doctorId: string): Promise<DoctorDeleteResult> => {
  const { data, status } = await apiClient.delete<
    ApiResponse<{ request_id?: string; status?: string }>
  >(`/doctor/${encodeURIComponent(doctorId)}`);
  if (!data.success) {
    throw new Error(data.message || 'Failed to delete doctor');
  }
  if (status === 202 || data.details?.status === 'pending') {
    return {
      pending: true,
      requestId: data.details?.request_id,
    };
  }
  return { pending: false };
};

// Logo API
export const uploadLogo = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('logo', file);

  const { data } = await apiClient.post<ApiResponse>('/logo/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!data.success) {
    throw new Error(data.message || 'Failed to upload logo');
  }
};

export const getLogoUrl = async (): Promise<string | null> => {
  const { data } = await apiClient.get<ApiResponse<LogoResponse>>('/logo/');
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch logo');
  }
  return data.details.logo_url;
};

// Clinic API
export const getClinicInfo = async (): Promise<ClinicInfo> => {
  const { data } = await apiClient.get<ApiResponse<ClinicInfo>>('/clinic/');
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch clinic info');
  }
  return data.details;
};

export const getClinicTests = async (
  pageSize: number = 20,
  lastCursor?: string,
  includeTotal?: boolean,
  dateFrom?: string,
  dateTo?: string,
  doctorId?: string,
  testAdminId?: string
): Promise<PaginatedResponse<Assessment>> => {
  const params = new URLSearchParams({
    page_size: pageSize.toString(),
  });
  if (lastCursor) {
    params.append('last_cursor', lastCursor);
  }
  if (includeTotal) {
    params.append('include_total', 'true');
  }
  if (dateFrom) {
    params.append('date_from', dateFrom);
  }
  if (dateTo) {
    params.append('date_to', dateTo);
  }
  if (doctorId) {
    params.append('doctor_id', doctorId);
  }
  if (testAdminId) {
    params.append('test_admin_id', testAdminId);
  }

  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Assessment>>>(
    `/clinic/tests?${params.toString()}`
  );
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch tests');
  }
  return data.details;
};
