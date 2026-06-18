import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
console.log('API BASE_URL:', BASE_URL);

const TOKEN_KEY = 'auth_token';

// ─── Token helpers ────────────────────────────────────────────────────────────

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  company_name: string;
  phone?: string;
  address?: string;
  pib?: string;
  logo_url?: string;
  created_at: string;
}

export interface Client {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
}

export interface PriceItem {
  id: number;
  name: string;
  unit: string;
  price: number;
  category: 'rad' | 'materijal' | 'ostalo';
  created_at: string;
}

export type QuoteStatus = 'nacrt' | 'poslata' | 'prihvacena' | 'odbijena';

export interface QuoteItem {
  id?: number;
  price_item_id?: number;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Quote {
  id: number;
  client_id: number;
  client?: Client;
  status: QuoteStatus;
  items: QuoteItem[];
  discount_percent: number;
  subtotal: number;
  discount_amount: number;
  total: number;
  valid_until?: string;
  note?: string;
  sent_at?: string;
  opened_at?: string;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 'neplaceno' | 'placeno';

export interface Invoice {
  id: number;
  invoice_number: string;
  quote_id: number;
  quote?: Quote;
  client_id: number;
  client?: Client;
  status: InvoiceStatus;
  items: QuoteItem[];
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  total: number;
  issued_at: string;
  due_at?: string;
  paid_at?: string;
  note?: string;
  created_at: string;
}

export interface RegisterData {
  email: string;
  password: string;
  company_name: string;
  phone?: string;
  address?: string;
  pib?: string;
}

export interface UpdateProfileData {
  company_name?: string;
  phone?: string;
  address?: string;
  pib?: string;
}

export interface CreateClientData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CreatePriceItemData {
  name: string;
  unit: string;
  price: number;
  category: 'rad' | 'materijal' | 'ostalo';
}

export interface CreateQuoteData {
  client_id: number;
  items: Omit<QuoteItem, 'id' | 'total'>[];
  discount_percent?: number;
  valid_until?: string;
  note?: string;
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    await clearToken();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body?.message ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: User }> {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  data: RegisterData,
): Promise<{ token: string; user: User }> {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getProfile(): Promise<User> {
  return apiFetch('/auth/profile');
}

export async function updateProfile(data: UpdateProfileData): Promise<User> {
  return apiFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export async function getClients(): Promise<Client[]> {
  return apiFetch('/clients');
}

export async function createClient(data: CreateClientData): Promise<Client> {
  return apiFetch('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateClient(
  id: number,
  data: Partial<CreateClientData>,
): Promise<Client> {
  return apiFetch(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteClient(id: number): Promise<void> {
  return apiFetch(`/clients/${id}`, { method: 'DELETE' });
}

// ─── Price items ──────────────────────────────────────────────────────────────

export async function getPriceItems(): Promise<PriceItem[]> {
  return apiFetch('/price-items');
}

export async function createPriceItem(
  data: CreatePriceItemData,
): Promise<PriceItem> {
  return apiFetch('/price-items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePriceItem(
  id: number,
  data: Partial<CreatePriceItemData>,
): Promise<PriceItem> {
  return apiFetch(`/price-items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePriceItem(id: number): Promise<void> {
  return apiFetch(`/price-items/${id}`, { method: 'DELETE' });
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

export async function getQuotes(): Promise<Quote[]> {
  return apiFetch('/quotes');
}

export async function getQuote(id: number): Promise<Quote> {
  return apiFetch(`/quotes/${id}`);
}

export async function createQuote(data: CreateQuoteData): Promise<Quote> {
  return apiFetch('/quotes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateQuote(
  id: number,
  data: Partial<CreateQuoteData>,
): Promise<Quote> {
  return apiFetch(`/quotes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function sendQuote(id: number): Promise<Quote> {
  return apiFetch(`/quotes/${id}/send`, { method: 'POST' });
}

export async function convertToInvoice(id: number): Promise<Invoice> {
  return apiFetch(`/quotes/${id}/convert`, { method: 'POST' });
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function getInvoices(): Promise<Invoice[]> {
  return apiFetch('/invoices');
}

export async function getInvoice(id: number): Promise<Invoice> {
  return apiFetch(`/invoices/${id}`);
}

export async function markPaid(id: number): Promise<Invoice> {
  return apiFetch(`/invoices/${id}/pay`, { method: 'POST' });
}

// ─── Quick Quote ───────────────────────────────────────────────────────────────

export interface QuickQuoteData {
  client_name: string;
  client_phone?: string;
  description: string;
  price: number;
}

export interface QuickQuoteResult {
  quote_id: number;
  tracking_url: string;
  tracking_token: string;
  client_id: number;
}

export async function quickQuote(data: QuickQuoteData): Promise<QuickQuoteResult> {
  return apiFetch('/quotes/quick', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface FunnelData {
  sent: number;
  opened: number;
  accepted: number;
  declined: number;
  open_rate: number;
  accept_rate: number;
}

export interface AnalyticsFunnel {
  funnel: FunnelData;
}

export async function getAnalyticsFunnel(): Promise<AnalyticsFunnel> {
  return apiFetch('/analytics/funnel');
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export type JobStatus = 'zakazano' | 'u_toku' | 'zavrseno';

export interface Job {
  id: string;
  title: string;
  status: JobStatus;
  scheduled_at?: string;
  note?: string;
  created_at: string;
  updated_at: string;
  clients?: { id: string; name: string; phone?: string; email?: string; address?: string };
  quotes?: { id: string; total_amount: number };
}

export interface CreateJobData {
  quote_id?: string | number;
  client_id: string | number;
  title: string;
  scheduled_at?: string;
  note?: string;
}

export async function getJobs(status?: JobStatus): Promise<Job[]> {
  const qs = status ? `?status=${status}` : '';
  const data = await apiFetch<{ jobs: Job[] }>(`/jobs${qs}`);
  return data.jobs;
}

export async function getJob(id: string): Promise<Job> {
  const data = await apiFetch<{ job: Job }>(`/jobs/${id}`);
  return data.job;
}

export async function createJob(d: CreateJobData): Promise<Job> {
  const data = await apiFetch<{ job: Job }>('/jobs', {
    method: 'POST',
    body: JSON.stringify(d),
  });
  return data.job;
}

export async function updateJob(id: string, updates: Partial<Pick<Job, 'status' | 'scheduled_at' | 'note' | 'title'>>): Promise<Job> {
  const data = await apiFetch<{ job: Job }>(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return data.job;
}
