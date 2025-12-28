import { apiClient, unwrapResponse } from './client';
import type { LoginInput, RegisterInput, AuthResponse, User, ApiResponse } from '../types';

export async function login(credentials: LoginInput): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
  return unwrapResponse(response);
}

export async function register(data: RegisterInput): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
  return unwrapResponse(response);
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me');
  return unwrapResponse(response);
}
