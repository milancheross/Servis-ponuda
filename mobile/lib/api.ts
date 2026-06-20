import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://servisponuda.com';

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
  id: string;
  email: string;
  company_name: string;
  phone?: string;
  address?: string;
  pib?: string;
  logo_url?: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  client_type?: 'person' | 'business';
  phone?: string;
  email?: string;
  address?: string;
  company_name?: string;
  created_at: string;
}

export interface PriceItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  category: 'rad' | 'materijal' | 'ostalo';
  is_active: boolean;
  created_at: string;
}

export type QuoteStatus = 'nacrt' | 'poslata' | 'prihvacena' | 'odbijena';

export interface QuoteItem {
  id?: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
  category?: string;
}

export interface Quote {
  id: string;
  client_id: string;
  client?: Client;
  quote_number?: string;
  status: QuoteStatus;
  items?: QuoteItem[];
  discount_percent: number;
  total_amount: number;
  total: number;
  valid_until?: string;
  note?: string;
  sent_at?: string;
  opened_at?: string;
  signed_by?: string;
  signed_at?: string;
  tracking_token?: string;
  created_at: string;
}

export type InvoiceStatus = 'neplaceno' | 'placeno';

export interface Invoice {
  id: string;
  invoice_number: string;
  quote_id?: string;
  client_id: string;
  client?: Client;
  status: InvoiceStatus;
  total_amount: number;
  total: number;
  issued_at: string;
  due_date?: string;
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
  client_type?: 'person' | 'business';
}

export interface CreatePriceItemData {
  name: string;
  unit: string;
  price: number;
  category: 'rad' | 'materijal' | 'ostalo';
}

export interface CreateQuoteData {
  client_id: string;
  items: Pick<QuoteItem, 'name' | 'unit' | 'quantity' | 'price' | 'category'>[];
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
    throw new Error('Sesija je istekla. Prijavite se ponovo.');
  }

  if (response.status === 429) {
    throw new Error('Previše pokušaja. Sačekajte malo pa pokušajte ponovo.');
  }

  if (!response.ok) {
    let message = `Greška ${response.status}`;
    try {
      const body = await response.json();
      message = body?.error ?? body?.message ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

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
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  data: RegisterData,
): Promise<{ token: string; user: User }> {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getProfile(): Promise<{ user: User }> {
  return apiFetch('/api/auth/profile');
}

export async function updateProfile(data: UpdateProfileData): Promise<User> {
  return apiFetch('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export async function getClients(): Promise<Client[]> {
  return apiFetch('/api/clients');
}

export async function createClient(data: CreateClientData): Promise<Client> {
  return apiFetch('/api/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateClient(
  id: string,
  data: Partial<CreateClientData>,
): Promise<Client> {
  return apiFetch(`/api/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteClient(id: string): Promise<void> {
  return apiFetch(`/api/clients/${id}`, { method: 'DELETE' });
}

// ─── Price items ──────────────────────────────────────────────────────────────

export async function getPriceItems(): Promise<PriceItem[]> {
  return apiFetch('/api/price-items');
}

export async function createPriceItem(
  data: CreatePriceItemData,
): Promise<PriceItem> {
  return apiFetch('/api/price-items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePriceItem(
  id: string,
  data: Partial<CreatePriceItemData>,
): Promise<PriceItem> {
  return apiFetch(`/api/price-items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePriceItem(id: string): Promise<void> {
  return apiFetch(`/api/price-items/${id}`, { method: 'DELETE' });
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

export async function getQuotes(): Promise<Quote[]> {
  return apiFetch('/api/quotes');
}

export async function getQuote(id: string): Promise<Quote> {
  return apiFetch(`/api/quotes/${id}`);
}

export async function createQuote(data: CreateQuoteData): Promise<Quote> {
  return apiFetch('/api/quotes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateQuote(
  id: string,
  data: Partial<CreateQuoteData>,
): Promise<Quote> {
  return apiFetch(`/api/quotes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function sendQuote(id: string): Promise<Quote> {
  return apiFetch(`/api/quotes/${id}/send`, { method: 'POST' });
}

export async function convertToInvoice(id: string): Promise<Invoice> {
  return apiFetch(`/api/quotes/${id}/convert`, { method: 'POST' });
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function getInvoices(): Promise<Invoice[]> {
  return apiFetch('/api/invoices');
}

export async function getInvoice(id: string): Promise<Invoice> {
  return apiFetch(`/api/invoices/${id}`);
}

export async function markPaid(id: string): Promise<Invoice> {
  return apiFetch(`/api/invoices/${id}/pay`, { method: 'POST' });
}
