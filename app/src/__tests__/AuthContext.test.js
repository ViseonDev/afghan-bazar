import React from 'react';
import { render, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import * as storage from '../services/storage';
import { authAPI } from '../services/api';

jest.mock('../services/storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../services/api', () => ({
  authAPI: {
    login: jest.fn(),
  },
}));

jest.mock('react-native-flash-message', () => ({
  showMessage: jest.fn(),
}));

describe('AuthContext', () => {
  it('stores token and user on successful login', async () => {
    authAPI.login.mockResolvedValue({
      success: true,
      token: 'abc123',
      user: { id: 1, name: 'John' },
    });

    let context;
    const Capture = () => {
      context = useAuth();
      return null;
    };

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );

    await act(async () => {
      await context.login('test@example.com', 'password');
    });

    expect(context.user).toEqual({ id: 1, name: 'John' });
    expect(context.token).toBe('abc123');
    expect(storage.setItem).toHaveBeenCalledWith('token', 'abc123');
    expect(storage.setItem).toHaveBeenCalledWith('user', JSON.stringify({ id: 1, name: 'John' }));
  });
});
