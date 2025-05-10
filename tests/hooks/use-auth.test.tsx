import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth, AuthProvider } from '../../client/src/hooks/use-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Create a wrapper with all the providers we need
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

// Mock fetch
global.fetch = vi.fn();

describe('useAuth Hook', () => {
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.spyOn(global, 'fetch');
    vi.clearAllMocks();

    // Setup mock responses
    mockFetch.mockImplementation(async (url: string) => {
      if (url === '/api/user') {
        return {
          ok: true,
          json: async () => ({
            id: 1,
            username: 'testuser',
            displayName: 'Test User'
          })
        };
      }
      return { ok: false, status: 404 };
    });
  });

  it('should fetch current user on initialization', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    });

    // Initially user should be null and isLoading should be true
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBe(null);

    // Wait for the user to be loaded
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // User should be loaded
    expect(result.current.user).toEqual({
      id: 1,
      username: 'testuser',
      displayName: 'Test User'
    });
  });

  it('should handle login successfully', async () => {
    // Mock successful login
    mockFetch.mockImplementation(async (url: string, options: any) => {
      if (url === '/api/login' && options.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            id: 1,
            username: 'testuser',
            displayName: 'Test User'
          })
        };
      }
      return { ok: false, status: 404 };
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.login('testuser', 'password123');
    });

    // User should be authenticated after login
    expect(result.current.user).toEqual({
      id: 1,
      username: 'testuser',
      displayName: 'Test User'
    });
  });

  it('should handle login failure', async () => {
    // Mock failed login
    mockFetch.mockImplementation(async (url: string, options: any) => {
      if (url === '/api/login' && options.method === 'POST') {
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: 'Invalid credentials' })
        };
      }
      return { ok: false, status: 404 };
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    });

    // Login should throw an error
    await expect(result.current.login('testuser', 'wrongpassword')).rejects.toThrow();
  });

  it('should handle registration successfully', async () => {
    // Mock successful registration
    mockFetch.mockImplementation(async (url: string, options: any) => {
      if (url === '/api/register' && options.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            id: 2,
            username: 'newuser',
            displayName: 'New User'
          })
        };
      }
      return { ok: false, status: 404 };
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.register('newuser', 'password123', 'New User');
    });

    // User should be authenticated after registration
    expect(result.current.user).toEqual({
      id: 2,
      username: 'newuser',
      displayName: 'New User'
    });
  });

  it('should handle logout correctly', async () => {
    // Setup initial authenticated state
    mockFetch.mockImplementation(async (url: string, options: any) => {
      if (url === '/api/user') {
        return {
          ok: true,
          json: async () => ({
            id: 1,
            username: 'testuser',
            displayName: 'Test User'
          })
        };
      } else if (url === '/api/logout' && options.method === 'POST') {
        return { ok: true, status: 200 };
      }
      return { ok: false, status: 404 };
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    });

    // Wait for initial auth state to be loaded
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Perform logout
    await act(async () => {
      await result.current.logout();
    });

    // User should be null after logout
    expect(result.current.user).toBe(null);
  });
});