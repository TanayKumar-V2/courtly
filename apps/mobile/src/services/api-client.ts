import { DEFAULT_API_URL } from '../constants';
import { authStorage } from '../auth/auth-storage';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * In-memory storage for short-lived JWT access tokens.
 * Access tokens are NEVER persisted to AsyncStorage or disk.
 */
let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

// Global session expiry listener for auth context
let onSessionExpired: (() => void) | null = null;

export function registerSessionExpiredListener(callback: () => void): void {
  onSessionExpired = callback;
}

// Single-flight refresh promise to prevent duplicate simultaneous refresh requests
let ongoingRefreshPromise: Promise<string | null> | null = null;

/**
 * Returns the configured base API URL.
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return DEFAULT_API_URL;
}

/**
 * Executes a single-flight token refresh against /api/auth/refresh
 */
async function performTokenRefresh(): Promise<string | null> {
  if (ongoingRefreshPromise) {
    return ongoingRefreshPromise;
  }

  ongoingRefreshPromise = (async () => {
    try {
      const storedRefreshToken = await authStorage.getRefreshToken();
      if (!storedRefreshToken) {
        setAccessToken(null);
        onSessionExpired?.();
        return null;
      }

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (!response.ok) {
        setAccessToken(null);
        await authStorage.deleteRefreshToken();
        onSessionExpired?.();
        return null;
      }

      const data = await response.json();
      if (data.accessToken && data.refreshToken) {
        setAccessToken(data.accessToken);
        await authStorage.setRefreshToken(data.refreshToken);
        return data.accessToken;
      }

      setAccessToken(null);
      await authStorage.deleteRefreshToken();
      onSessionExpired?.();
      return null;
    } catch {
      setAccessToken(null);
      await authStorage.deleteRefreshToken();
      onSessionExpired?.();
      return null;
    } finally {
      ongoingRefreshPromise = null;
    }
  })();

  return ongoingRefreshPromise;
}

/**
 * Robust fetch client with in-memory token injection, single-flight refresh on 401, and timeout.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // Inject in-memory access token if present and not already provided
  if (inMemoryAccessToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  const timeoutMs = 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // If HTTP 401 Unauthorized occurs on an authenticated route and not already retried
    if (
      response.status === 401 &&
      !isRetry &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/register') &&
      !endpoint.includes('/auth/refresh')
    ) {
      const newAccessToken = await performTokenRefresh();
      if (newAccessToken) {
        // Retry the original request once with the new access token
        return apiClient<T>(
          endpoint,
          {
            ...options,
            headers: {
              ...headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
          },
          true,
        );
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError: any;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = errorText;
      }
      const message =
        parsedError?.message ||
        `Request to ${endpoint} failed with status ${response.status}`;
      throw new ApiError(
        Array.isArray(message) ? message.join(', ') : message,
        response.status,
        parsedError,
      );
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${timeoutMs}ms reaching ${url}`);
    }

    const message = error instanceof Error ? error.message : 'Unknown network failure';
    throw new ApiError(`Network error reaching Courtly API (${url}): ${message}`);
  }
}
