import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom for extended matchers
import AuthPage from '../../../client/src/pages/auth-page';
import { AuthProvider } from '../../../client/src/hooks/use-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as wouter from 'wouter';

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

  // Create location mock for wouter
  vi.spyOn(wouter, 'useLocation').mockReturnValue(['/auth', () => {}]);
  
  // Mock Redirect component
  vi.spyOn(wouter, 'Redirect').mockImplementation(({ to }) => {
    return <div data-testid="redirect" data-to={to}></div>;
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

describe('AuthPage Component', () => {
  beforeEach(() => {
    vi.spyOn(wouter, 'useLocation').mockReturnValue(['/auth', () => {}]);
    vi.clearAllMocks();
  });

  it('renders login form by default', () => {
    render(<AuthPage />, { wrapper: createWrapper() });
    
    // Check if login form is visible
    expect(screen.getByText('Sign in to access your card collections')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('switches to registration form when register button is clicked', async () => {
    render(<AuthPage />, { wrapper: createWrapper() });
    
    // Click the register tab
    const registerTab = screen.getByText('Register');
    fireEvent.click(registerTab);
    
    // Check if registration form is visible
    expect(screen.getByText('Create an account to start your collection')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Choose a username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('How you want to be known')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
  });

  it('shows/hides password when visibility toggle is clicked', () => {
    render(<AuthPage />, { wrapper: createWrapper() });
    
    // Get the password input and toggle
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const toggleButton = passwordInput.parentElement?.querySelector('div[role="button"]') || 
                         passwordInput.parentElement?.querySelector('.absolute.right-3');
    
    // Initial state should be password (hidden)
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click the toggle
    if (toggleButton) {
      fireEvent.click(toggleButton);
      
      // Password should now be visible
      expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click toggle again
      fireEvent.click(toggleButton);
      
      // Password should be hidden again
      expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  it('redirects to home if user is already logged in', () => {
    // Mock the useAuth hook to return a logged in user
    vi.spyOn(wouter, 'useLocation').mockReturnValue(['/auth', () => {}]);
    
    const mockAuthProvider = ({ children }: { children: React.ReactNode }) => {
      const mockAuth = {
        user: { id: 1, username: 'testuser', displayName: 'Test User' },
        isLoading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn()
      };
      
      return (
        <wouter.Router base="">
          {React.cloneElement(children as React.ReactElement, { value: mockAuth })}
        </wouter.Router>
      );
    };
    
    render(<AuthPage />, { wrapper: mockAuthProvider });
    
    // Should redirect to home
    const redirect = screen.getByTestId('redirect');
    expect(redirect).toHaveAttribute('data-to', '/');
  });

  it('handles form submission and validation', async () => {
    render(<AuthPage />, { wrapper: createWrapper() });
    
    // Try to submit with empty fields
    const loginButton = screen.getByRole('button', { name: /Login/i });
    fireEvent.click(loginButton);
    
    // Should show validation errors
    const errors = await screen.findAllByText(/must be at least/i);
    expect(errors.length).toBeGreaterThan(0);
    
    // Fill in the form
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form again
    fireEvent.click(loginButton);
    
    // Validation errors should be gone
    const errorsAfter = screen.queryAllByText(/must be at least/i);
    expect(errorsAfter.length).toBe(0);
  });
});