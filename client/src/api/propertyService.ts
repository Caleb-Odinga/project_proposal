// src/api/propertyService.ts
import { API_BASE_URL } from './config';

export const propertyService = {
  getProperties: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const response = await fetch(
      `${API_BASE_URL}/api/properties?${queryParams.toString()}`
    ); 
    
    if (!response.ok) {
      throw new Error('Failed to fetch properties');
    }
    
    return response.json();
  },
  
  getProperty: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/properties/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch property');
    }
    
    return response.json();
  },
  
  // More property-related functions...
};