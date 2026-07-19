import { apiClient } from './client';
import type {
  ApiResponse,
  CreatePaymentOrderResponse,
  Invoice,
  InvoiceListResponse,
  PaymentListResponse,
  VerifyPaymentResponse,
} from './types';

// Invoice API

export const getInvoices = async (
  statusFilter: 'PENDING' | 'PAID' | 'OVERDUE' | 'all' = 'all',
  pageSize: number = 20,
  lastCursor?: string
): Promise<InvoiceListResponse> => {
  const params = new URLSearchParams({
    status_filter: statusFilter,
    page_size: pageSize.toString(),
  });
  if (lastCursor) {
    params.append('last_cursor', lastCursor);
  }

  const { data } = await apiClient.get<ApiResponse<InvoiceListResponse>>(
    `/invoice/?${params.toString()}`
  );
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch invoices');
  }
  return data.details;
};

export const getInvoice = async (invoiceId: string): Promise<Invoice> => {
  const { data } = await apiClient.get<ApiResponse<{ invoice: Invoice }>>(`/invoice/${invoiceId}`);
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch invoice');
  }
  return data.details.invoice;
};

export const getInvoiceDownloadUrl = async (invoiceId: string): Promise<string> => {
  const { data } = await apiClient.get<ApiResponse<{ download_url: string }>>(
    `/invoice/${invoiceId}/download`
  );
  if (!data.success) {
    throw new Error(data.message || 'Failed to get download URL');
  }
  return data.details.download_url;
};

// Payment API

export const getPayments = async (
  statusFilter: 'SUCCESS' | 'FAILED' | 'all' = 'all',
  pageSize: number = 20,
  lastCursor?: string
): Promise<PaymentListResponse> => {
  const params = new URLSearchParams({
    status_filter: statusFilter,
    page_size: pageSize.toString(),
  });
  if (lastCursor) {
    params.append('last_cursor', lastCursor);
  }

  const { data } = await apiClient.get<ApiResponse<PaymentListResponse>>(
    `/payment/?${params.toString()}`
  );
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch payments');
  }
  return data.details;
};

export const createPaymentOrder = async (
  invoiceId: string
): Promise<CreatePaymentOrderResponse> => {
  const { data } = await apiClient.post<ApiResponse<CreatePaymentOrderResponse>>(
    '/payment/create-order',
    { invoice_id: invoiceId }
  );
  if (!data.success) {
    throw new Error(data.message || 'Failed to create payment order');
  }
  return data.details;
};

export const verifyPayment = async (
  invoiceId: string,
  paymentId: string,
  orderId: string,
  signature: string
): Promise<VerifyPaymentResponse> => {
  const { data } = await apiClient.post<ApiResponse<VerifyPaymentResponse>>('/payment/verify', {
    invoice_id: invoiceId,
    payment_id: paymentId,
    order_id: orderId,
    signature: signature,
  });
  if (!data.success) {
    throw new Error(data.message || 'Failed to verify payment');
  }
  return data.details;
};

export const getReceiptDownloadUrl = async (paymentId: string): Promise<string> => {
  const { data } = await apiClient.get<ApiResponse<{ download_url: string }>>(
    `/payment/receipt/${paymentId}`
  );
  if (!data.success) {
    throw new Error(data.message || 'Failed to get download URL');
  }
  return data.details.download_url;
};
