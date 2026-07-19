// Standard API Response Format
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  details: T;
}

// Error Response (when success is false)
export interface ApiErrorResponse {
  success: false;
  message: string;
  details: string | null; // Error details
}

// Auth Response
export interface AuthResponse {
  token: string;
}

export interface MankindSendOtpResponse {
  otp_session_id: string;
  expires_in_seconds: number;
  resend_in_seconds: number;
}

export interface MankindVerifyOtpResponse {
  verified: boolean;
}

export interface MankindMrDetails {
  employee_id: string;
  employee_name: string;
  state: string;
  /** Present for registrations after State Head field was added */
  state_head?: string;
  /** Present for registrations after Top Line Manager field was added */
  top_line_manager?: string;
  /** Present after Pool was renamed to Headquarters in API/storage */
  headquarters?: string;
  /** Legacy Firestore field (same allowed values as headquarters) */
  pool?: string;
}

export interface MankindRegisterResponse {
  pid: string;
  clinic_name: string;
  mr_number: number;
  primary_contact_phone: string;
}

// Doctor types
export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  gender: 'male' | 'female' | 'other';
  city: string;
}

// Test Admin types
export interface TestAdmin {
  id: string;
  name: string;
  email?: string;
  phone_number: string;
  gender: 'male' | 'female' | 'other';
}

// Clinic types
export interface ClinicAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface ClinicInfo {
  clinic_name: string;
  address?: ClinicAddress;
  mr_details?: MankindMrDetails;
  primary_contact_phone: string;
  /** Mankind MR clinics: 0 = first doctor add allowed without approval; 1 = changes need approval */
  doc_approval?: number;
}

/** Queued doctor change (middleware GET /doctor/pending) */
export interface DoctorChangeRequest {
  id: string;
  action: 'add' | 'update' | 'delete' | string;
  doctor_id?: string | null;
  payload?: Record<string, unknown> | null;
  status: string;
  requested_at?: string;
  clinic_id?: string;
  clinic_name?: string;
}

export interface DoctorCreateResult {
  pending: boolean;
  doctor?: Doctor;
  requestId?: string;
}

export interface DoctorUpdateResult {
  pending: boolean;
  doctor?: Doctor;
  requestId?: string;
}

export interface DoctorDeleteResult {
  pending: boolean;
  requestId?: string;
}

export interface Assessment {
  id: string;
  pid: string;
  status: string;
  error_message: string | null;
  doctor_id: string;
  test_admin_id?: string;
  timestamps: {
    created_at: string; // ISO format
    uploaded_at: string | null;
    completed_at: string | null;
  };
  patient_info: {
    name: string;
    dob: string; // YYYY-MM-DD
    gender: string;
    guardian_phone: string | null;
  };
  billing?: {
    is_free_test: boolean;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  has_more: boolean;
  next_cursor: string | null;
  count: number;
  total_count?: number;
}

// Logo response
export interface LogoResponse {
  logo_url: string | null;
}

// RSA Public Key
export interface RSAPublicKey {
  kty: string;
  n: string;
  e: string;
  alg: string;
  use: string;
  [key: string]: unknown;
}

// SSE Event Types
export interface TestUpdateEvent {
  id: string;
  status: string;
  error_message: string | null;
  change_type: 'added' | 'modified' | 'removed';
  timestamps: {
    created_at: string | null;
    uploaded_at: string | null;
    completed_at: string | null;
  };
}

export interface SSEConnectedEvent {
  status: 'connected';
  clinic_id: string;
}

export interface SSEHeartbeatEvent {
  type: 'heartbeat';
  timestamp: string;
}

// Invoice types
export interface PaymentDetails {
  method: string | null;
  paid_at: string | null;
  reference_id: string | null;
}

export interface Invoice {
  invoice_id: string;
  month: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  total_amount: number;
  amount_paid: number;
  num_tests_billed: number;
  due_date: string;
  payment_details: PaymentDetails | null;
  created_at: string | null;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  pagination: {
    page_size: number;
    has_more: boolean;
    next_cursor: string | null;
    total_count?: number;
  };
}

// Payment types
export interface Payment {
  payment_id: string;
  amount_paid: number;
  order_id: string;
  status: 'SUCCESS' | 'FAILED';
  paid_at: string;
  invoice_id: string;
}

export interface PaymentListResponse {
  payments: Payment[];
  pagination: {
    page_size: number;
    has_more: boolean;
    next_cursor: string | null;
    total_count?: number;
  };
}

export interface CreatePaymentOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  invoice_id: string;
}

export interface VerifyPaymentResponse {
  payment_id: string;
  amount_paid: number;
  invoice_id: string;
}
