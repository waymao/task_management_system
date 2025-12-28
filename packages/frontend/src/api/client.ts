import axios from 'axios';
import toast from 'react-hot-toast';
import type { ApiResponse, ApiError } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      const apiError = error.response.data as ApiError;
      if (apiError.error) {
        toast.error(apiError.error.message);
      }
    } else if (error.message) {
      toast.error(error.message);
    } else {
      toast.error('An unexpected error occurred');
    }
    return Promise.reject(error);
  }
);

// Helper to unwrap API responses
export function unwrapResponse<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data;
}
