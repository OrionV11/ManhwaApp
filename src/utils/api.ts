// utils/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const API_BASE_URL = 'https://manhwaapp-jn15.onrender.com';  

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
  silentErrors?: boolean; // Don't show alerts for certain errors
};

async function getAuthToken(): Promise<string | null> {
  return await AsyncStorage.getItem('authToken');
}



export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    requiresAuth = true,
    silentErrors = false,
  } = options;

  try {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add authorization header if required
    if (requiresAuth) {
      const token = await getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
        console.log('Token added to request')
      } else {
        console.log('No token found')
        throw new ApiError('No authentication token found', 401);
      }
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle 401 Unauthorized
    if (response.status === 401) {
      await AsyncStorage.multiRemove(['authToken', 'user']);
      if (!silentErrors) {
        Alert.alert('Session Expired', 'Please log in again');
      }
      throw new ApiError('Unauthorized', 401);
    }

    // Handle 404 Not Found
    if (response.status === 404) {
      console.warn(`API endpoint not found: ${endpoint}`);
      // Return empty data for 404s instead of throwing
      if (method === 'GET') {
        return (endpoint.includes('stats') ? { stats: {} } : []) as T;
      }
      throw new ApiError('Resource not found', 404);
    }

    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new ApiError(
        data?.detail || data?.message || `Request failed with status ${response.status}`,
        response.status
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('API request error:', error);
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed',
      0
    );
  }
}

// Convenience methods
export const api = {
  get: <T = any>(endpoint: string, requiresAuth = true, silentErrors = false) =>
    apiRequest<T>(endpoint, { method: 'GET', requiresAuth, silentErrors }),

  post: <T = any>(endpoint: string, body?: any, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: 'POST', body, requiresAuth }),

  put: <T = any>(endpoint: string, body?: any, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: 'PUT', body, requiresAuth }),

  patch: <T = any>(endpoint: string, body?: any, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body, requiresAuth }),

  delete: <T = any>(endpoint: string, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: 'DELETE', requiresAuth }),
};