const TOKEN_KEY = 'bookflow_token';

export const auth = {
  get token() {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---- Types ----
export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  active: boolean;
}

export interface Slot {
  start: string;
  end: string;
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  service: Service;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'staff';
}

// ---- Public endpoints ----
export const api = {
  listServices: () => request<Service[]>('/services'),

  getSlots: (serviceId: string, date: string) =>
    request<Slot[]>(`/availability/slots?serviceId=${serviceId}&date=${date}`),

  createBooking: (payload: {
    serviceId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    startAt: string;
  }) =>
    request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ---- Admin endpoints ----
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: SessionUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<SessionUser>('/auth/me'),

  listBookings: (status?: BookingStatus) =>
    request<Booking[]>(`/bookings${status ? `?status=${status}` : ''}`),

  setBookingStatus: (id: string, status: BookingStatus) =>
    request<Booking>(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
