// services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { LoginResponse, Media } from './Manhwa';

const API_BASE_URL = 'https://manhwaapp-1.onrender.com';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  silentErrors?: boolean;
};

let inMemoryToken: string | null = null;

export const setApiToken = (token: string | null) => {
  inMemoryToken = token;
};

async function getStoredToken() {
  return AsyncStorage.getItem('authToken');
}

/**
 * Base request helper
 */
async function request<T>(
  endpoint: string,
  {
    method = 'GET',
    body,
    headers = {},
    requiresAuth = false,
    silentErrors = false,
  }: RequestOptions = {}
): Promise<T> {
  try {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (requiresAuth) {
      const token = inMemoryToken ?? (await getStoredToken());
      if (!token) {
        throw new ApiError('Not authenticated', 401);
      }
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      await AsyncStorage.multiRemove(['authToken', 'user']);
      if (!silentErrors) {
        Alert.alert('Session expired', 'Please log in again.');
      }
      throw new ApiError('Unauthorized', 401);
    }

    const contentType = res.headers.get('content-type');
    const data =
      contentType && contentType.includes('application/json')
        ? await res.json()
        : await res.text();

    if (!res.ok) {
      throw new ApiError(
        data?.detail || data?.message || 'Request failed',
        res.status
      );
    }

    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      err instanceof Error ? err.message : 'Network error',
      0
    );
  }
}

export const apis = {
  // Media endpoints
  getTrending: (limit: number = 10): Promise<Media[]> =>
    request(`/api/media/trending?limit=${limit}`),

  searchMedia: (
    query: string,
    type?: string,
    genre?: string
  ): Promise<Media[]> => {
    const params = new URLSearchParams({ query });
    if (type) params.append('type', type);
    if (genre) params.append('genre', genre);
    return request(`/api/media/search?${params.toString()}`);
  },

  getMediaById: (id: number): Promise<Media> =>
    request(`/api/media/${id}`),

  // Auth endpoints
  login: async (
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    const data = await request<LoginResponse>('/login', {
      method: 'POST',
      body: { email, password },
    });

    if (data?.token) {
      setApiToken(data.token);
      await AsyncStorage.setItem('authToken', data.token);
    }

    return data;
  },

  signup: (name: string, email: string, password: string) =>
    request('/signup', {
      method: 'POST',
      body: { name, email, password },
    }),
};
