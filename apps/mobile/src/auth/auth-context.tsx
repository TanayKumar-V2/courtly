import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { queryClient } from '../lib/queryClient';
import {
  apiClient,
  registerSessionExpiredListener,
  setAccessToken,
} from '../services/api-client';
import { authStorage } from './auth-storage';
import { authService } from './auth-service';
import {
  AuthResponse,
  PlayerProfile,
  RegisterResponse,
  Sport,
  SportSkill,
  User,
} from './auth-types';

// Keep splash screen visible until initial session restoration completes
SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash screen might already be prevented or not available
});

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: {
    email: string;
    password: string;
    deviceName?: string;
    platform?: string;
  }) => Promise<void>;
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    city?: string;
    preferredSports?: Sport[];
  }) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: { fullName?: string; phoneNumber?: string }) => Promise<void>;
  updatePlayerProfile: (data: {
    bio?: string;
    city?: string;
    state?: string;
    country?: string;
    preferredSports?: Sport[];
    sportSkills?: SportSkill[];
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearSession = useCallback(async () => {
    setAccessToken(null);
    await authStorage.deleteRefreshToken();
    setUser(null);
    queryClient.clear();
  }, []);

  // Restore authenticated session on startup
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const storedRefreshToken = await authStorage.getRefreshToken();
        if (!storedRefreshToken) {
          if (isMounted) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        // Attempt initial token refresh using stored refresh token
        const refreshResponse = await apiClient<{
          accessToken: string;
          refreshToken: string;
        }>('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        if (refreshResponse?.accessToken && refreshResponse?.refreshToken) {
          setAccessToken(refreshResponse.accessToken);
          await authStorage.setRefreshToken(refreshResponse.refreshToken);

          // Fetch authenticated user profile
          const userProfile = await authService.getMe();
          if (isMounted) {
            setUser(userProfile);
          }
        } else {
          await clearSession();
        }
      } catch {
        await clearSession();
      } finally {
        if (isMounted) {
          setIsLoading(false);
          // Hide splash screen smoothly after session is restored
          SplashScreen.hideAsync().catch(() => {});
        }
      }
    }

    restoreSession();

    // Register callback for background session expiration (e.g. 401 refresh failure)
    registerSessionExpiredListener(() => {
      if (isMounted) {
        clearSession();
      }
    });

    return () => {
      isMounted = false;
    };
  }, [clearSession]);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const response = await authService.login(credentials);
      setAccessToken(response.accessToken);
      await authStorage.setRefreshToken(response.refreshToken);
      setUser(response.user);
    },
    [],
  );

  const register = useCallback(
    async (data: {
      fullName: string;
      email: string;
      password: string;
      city?: string;
      preferredSports?: Sport[];
    }) => {
      return authService.register(data);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Proceed with local cleanup even if network fails
    } finally {
      await clearSession();
    }
  }, [clearSession]);

  const logoutAll = useCallback(async () => {
    try {
      await authService.logoutAll();
    } catch {
      // Proceed with local cleanup
    } finally {
      await clearSession();
    }
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    try {
      const userProfile = await authService.getMe();
      setUser(userProfile);
    } catch {
      // Ignore
    }
  }, []);

  const updateUser = useCallback(
    async (data: { fullName?: string; phoneNumber?: string }) => {
      const updated = await authService.updateMe(data);
      setUser(updated);
    },
    [],
  );

  const updatePlayerProfile = useCallback(
    async (data: {
      bio?: string;
      city?: string;
      state?: string;
      country?: string;
      preferredSports?: Sport[];
      sportSkills?: SportSkill[];
    }) => {
      const updated = await authService.updatePlayerProfile(data);
      setUser(updated);
    },
    [],
  );

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    logoutAll,
    refreshUser,
    updateUser,
    updatePlayerProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
