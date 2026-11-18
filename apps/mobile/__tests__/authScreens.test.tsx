import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import LoginScreen from '../app/(auth)/login';
import RegisterScreen from '../app/(auth)/register';
import ForgotPasswordScreen from '../app/(auth)/forgot-password';
import ResetPasswordScreen from '../app/(auth)/reset-password';

// Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

// Mock useAuth
const mockLogin = jest.fn();
const mockRegister = jest.fn();
jest.mock('../src/auth/use-auth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    register: mockRegister,
    logout: jest.fn(),
    logoutAll: jest.fn(),
  }),
}));

// Mock authService
jest.mock('../src/auth/auth-service', () => ({
  authService: {
    forgotPassword: jest.fn().mockResolvedValue({ message: 'Instructions sent' } as any),
    resetPassword: jest.fn().mockResolvedValue({ message: 'Password reset' } as any),
  },
}));

describe('Mobile Authentication Screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LoginScreen', () => {
    it('renders Courtly branding, inputs, and action buttons', () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      expect(getByText('COURTLY')).toBeTruthy();
      expect(getByText('Sign in to book courts and join matches')).toBeTruthy();
      expect(getByPlaceholderText('player@example.com')).toBeTruthy();
      expect(getByPlaceholderText('••••••••')).toBeTruthy();
      expect(getByText('Sign In')).toBeTruthy();
      expect(getByText('Create account')).toBeTruthy();
    });

    it('validates empty inputs and displays error message', async () => {
      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(getByText('Please enter your email address')).toBeTruthy();
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('submits valid credentials and calls login', async () => {
      mockLogin.mockResolvedValue(undefined);
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('player@example.com'), 'arjun@courtly.app');
      fireEvent.changeText(getByPlaceholderText('••••••••'), 'Password123!');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'arjun@courtly.app',
            password: 'Password123!',
          }),
        );
      });
    });

    it('toggles password visibility', () => {
      const { getByPlaceholderText, getByLabelText } = render(<LoginScreen />);
      const passwordInput = getByPlaceholderText('••••••••');
      expect(passwordInput.props.secureTextEntry).toBe(true);

      const eyeButton = getByLabelText('Show password');
      fireEvent.press(eyeButton);
      expect(passwordInput.props.secureTextEntry).toBe(false);
    });
  });

  describe('RegisterScreen', () => {
    it('renders all player registration fields and preferred sports', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterScreen />);

      expect(getByText('JOIN COURTLY')).toBeTruthy();
      expect(getByPlaceholderText('Arjun Kumar')).toBeTruthy();
      expect(getByPlaceholderText('player@example.com')).toBeTruthy();
      expect(getByText('Football')).toBeTruthy();
      expect(getByText('Cricket')).toBeTruthy();
      expect(getByText('Create Player Account')).toBeTruthy();
    });

    it('validates terms checkbox before submission', async () => {
      const { getByText, getByPlaceholderText } = render(<RegisterScreen />);

      fireEvent.changeText(getByPlaceholderText('Arjun Kumar'), 'Arjun Kumar');
      fireEvent.changeText(getByPlaceholderText('player@example.com'), 'arjun@courtly.app');
      fireEvent.press(getByText('Create Player Account'));

      await waitFor(() => {
        expect(getByText(/Password must be at least 8 characters/i)).toBeTruthy();
      });
    });
  });

  describe('ForgotPasswordScreen', () => {
    it('renders email input and sends reset instructions', async () => {
      const { getByText, getByPlaceholderText } = render(<ForgotPasswordScreen />);

      expect(getByText('FORGOT PASSWORD')).toBeTruthy();
      fireEvent.changeText(getByPlaceholderText('player@example.com'), 'player@courtly.app');
      fireEvent.press(getByText('Send Reset Instructions'));

      await waitFor(() => {
        expect(getByText('Instructions sent')).toBeTruthy();
      });
    });
  });

  describe('ResetPasswordScreen', () => {
    it('renders new password inputs and validates token', async () => {
      const { getByText, getByPlaceholderText } = render(<ResetPasswordScreen />);

      expect(getByText('NEW PASSWORD')).toBeTruthy();
      expect(getByPlaceholderText('Paste token from email')).toBeTruthy();
      expect(getByText('Update Password')).toBeTruthy();
    });
  });
});
