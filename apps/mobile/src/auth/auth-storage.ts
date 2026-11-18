import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'courtly_refresh_token_v1';

export const authStorage = {
  /**
   * Securely retrieves the stored opaque refresh token from device keychain / Keystore.
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Securely saves the opaque refresh token in hardware-backed storage.
   */
  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch {
      // Handle write failure gracefully without unhandled promise rejection
    }
  },

  /**
   * Securely clears the stored refresh token.
   */
  async deleteRefreshToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      // Ignore deletion errors
    }
  },
};
