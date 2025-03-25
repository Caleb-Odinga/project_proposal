import { create } from 'zustand';
import { apiRequest } from './queryClient';
import { queryClient } from './queryClient';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: string;
  bio?: string;
  language: string;
}

interface SearchFilters {
  search?: string;
  location?: string;
  propertyType?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  features?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface MapState {
  showMap: boolean;
  toggleMapView: () => void;
}

interface StoreState extends AuthState, MapState {
  searchFilters: SearchFilters;
  language: string;
  
  // Auth actions
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  
  // Search/filter actions
  setSearchFilters: (filters: SearchFilters) => void;
  resetSearchFilters: () => void;
  
  // Language actions
  setLanguage: (lang: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Auth state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  
  // Map state
  showMap: false,
  toggleMapView: () => set(state => ({ showMap: !state.showMap })),
  
  // Search state
  searchFilters: {
    listingType: 'rent',
  },
  
  // Language state
  language: localStorage.getItem('language') || 'en',
  
  // Auth actions
  login: async (username, password) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const user = await response.json();
      set({ user, isAuthenticated: true, isLoading: false });
      localStorage.setItem('language', user.language);
      set({ language: user.language });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      });
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const user = await response.json();
      set({ user, isAuthenticated: true, isLoading: false });
      localStorage.setItem('language', 'en'); // Default language for new users
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      });
      throw error;
    }
  },
  
  logout: async () => {
    try {
      set({ isLoading: true });
      await apiRequest('POST', '/api/auth/logout');
      set({ user: null, isAuthenticated: false, isLoading: false });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries();
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Logout failed' 
      });
    }
  },
  
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      
      if (response.ok) {
        const user = await response.json();
        set({ user, isAuthenticated: true, isLoading: false });
        if (user.language) {
          localStorage.setItem('language', user.language);
          set({ language: user.language });
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  
  // Search/filter actions
  setSearchFilters: (filters) => {
    set(state => ({
      searchFilters: {
        ...state.searchFilters,
        ...filters
      }
    }));
  },
  
  resetSearchFilters: () => {
    set({
      searchFilters: {
        listingType: 'rent',
      }
    });
  },
  
  // Language actions
  setLanguage: (lang) => {
    localStorage.setItem('language', lang);
    set({ language: lang });
    
    // If user is authenticated, update their preference
    const { user, isAuthenticated } = get();
    if (isAuthenticated && user) {
      apiRequest('PATCH', '/api/users/profile', { language: lang })
        .then(() => {
          // Update user in store
          set({ user: { ...user, language: lang } });
        })
        .catch(console.error);
    }
  }
}));
