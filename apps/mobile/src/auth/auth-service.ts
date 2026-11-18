import { apiClient } from '../services/api-client';
import {
  AuthResponse,
  RegisterResponse,
  Sport,
  SportSkill,
  User,
} from './auth-types';

export const authService = {
  async register(data: {
    fullName: string;
    email: string;
    password: string;
    city?: string;
    preferredSports?: Sport[];
  }): Promise<RegisterResponse> {
    return apiClient<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: {
    email: string;
    password: string;
    deviceName?: string;
    platform?: string;
  }): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(data: {
    token: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  async logoutAll(): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/logout-all', {
      method: 'POST',
    });
  },

  async getMe(): Promise<User> {
    return apiClient<User>('/users/me', {
      method: 'GET',
    });
  },

  async updateMe(data: {
    fullName?: string;
    phoneNumber?: string;
  }): Promise<User> {
    return apiClient<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updatePlayerProfile(data: {
    bio?: string;
    city?: string;
    state?: string;
    country?: string;
    preferredSports?: Sport[];
    sportSkills?: SportSkill[];
  }): Promise<User> {
    return apiClient<User>('/users/me/player-profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
