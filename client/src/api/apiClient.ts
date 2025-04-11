// src/api/apiClient.ts
import { API_BASE_URL } from './config';
import { tokenStorage } from '../utils/tokenStorage';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export const apiClient = {
  request: async (endpoint: string, options: RequestOptions = {}) => {
    const { requiresAuth = false, headers = {}, ...rest } = options;
    
    const requestHeaders: Record<string, string> = { 
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>)
    };
    
    if (requiresAuth) {
      const token = tokenStorage.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: requestHeaders,
      ...rest
    });
    
    if (!response.ok) {
      // Handle different error status codes
      if (response.status === 401) {
        tokenStorage.clearToken();
        // Redirect to login or dispatch auth error
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Request failed');
    }
    
    return response.json();
  },
  
  get: (endpoint: string, options: RequestOptions = {}) => {
    return apiClient.request(endpoint, { ...options, method: 'GET' });
  },
  
  post: (endpoint: string, data: any, options: RequestOptions = {}) => {
    return apiClient.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  put: (endpoint: string, data: any, options: RequestOptions = {}) => {
    return apiClient.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  delete: (endpoint: string, options: RequestOptions = {}) => {
    return apiClient.request(endpoint, { ...options, method: 'DELETE' });
  }
};