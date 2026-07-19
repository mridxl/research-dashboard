import { apiClient } from './client';
import type { ApiResponse, TestAdmin } from './types';

// Test Admin API
export const getTestAdmins = async (): Promise<TestAdmin[]> => {
  const { data } = await apiClient.get<ApiResponse<{ test_admins: TestAdmin[] }>>('/test-admin/');
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch test admins');
  }
  return data.details.test_admins;
};

export const createTestAdmin = async (testAdminData: Omit<TestAdmin, 'id'>): Promise<TestAdmin> => {
  const { data } = await apiClient.post<ApiResponse<{ test_admin: TestAdmin }>>(
    '/test-admin/',
    testAdminData
  );
  if (!data.success) {
    throw new Error(data.message || 'Failed to create test admin');
  }
  return data.details.test_admin;
};

export const updateTestAdmin = async (
  testAdminId: string,
  testAdminData: Partial<Omit<TestAdmin, 'id'>>
): Promise<TestAdmin> => {
  const { data } = await apiClient.patch<ApiResponse<{ test_admin: TestAdmin }>>(
    `/test-admin/${testAdminId}`,
    testAdminData
  );
  if (!data.success) {
    throw new Error(data.message || 'Failed to update test admin');
  }
  return data.details.test_admin;
};

export const deleteTestAdmin = async (testAdminId: string): Promise<void> => {
  const { data } = await apiClient.delete<ApiResponse>(`/test-admin/${testAdminId}`);
  if (!data.success) {
    throw new Error(data.message || 'Failed to delete test admin');
  }
};
