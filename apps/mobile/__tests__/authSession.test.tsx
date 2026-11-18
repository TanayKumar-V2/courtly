import { authStorage } from '../src/auth/auth-storage';
import {
  getAccessToken,
  setAccessToken,
  apiClient,
} from '../src/services/api-client';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
}));

describe('Mobile Auth Storage & Session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAccessToken(null);
  });

  it('securely manages refresh token in hardware storage', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('secure_refresh_token_value');

    const token = await authStorage.getRefreshToken();
    expect(token).toBe('secure_refresh_token_value');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('courtly_refresh_token_v1');

    await authStorage.setRefreshToken('new_refresh_token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'courtly_refresh_token_v1',
      'new_refresh_token',
      expect.anything(),
    );

    await authStorage.deleteRefreshToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('courtly_refresh_token_v1');
  });

  it('keeps access token strictly in application memory and not disk', () => {
    expect(getAccessToken()).toBeNull();

    setAccessToken('in_memory_jwt_access_token');
    expect(getAccessToken()).toBe('in_memory_jwt_access_token');

    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });
});
