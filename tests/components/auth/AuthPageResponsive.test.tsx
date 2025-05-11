import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthPage from '../../../client/src/pages/auth-page';
import { useIsMobile } from '../../../client/src/hooks/use-mobile';
import * as wouter from 'wouter';

// Mock useIsMobile hook
vi.mock('../../../client/src/hooks/use-mobile', () => ({
  useIsMobile: vi.fn().mockReturnValue(false)
}));

// Mock the auth hook to avoid actual API calls
vi.mock('../../../client/src/hooks/use-auth', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn()
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock wouter hooks
vi.mock('wouter', () => ({
  useLocation: () => ['/auth', vi.fn()],
  Redirect: ({ to }: { to: string }) => <div data-testid="redirect" data-to={to}></div>,
  Router: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Create test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0
      },
    },
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('AuthPage Mobile Responsiveness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(wouter, 'useLocation').mockReturnValue(['/auth', vi.fn()]);
  });
  
  it('uses a column layout on mobile', () => {
    // Mock useIsMobile to return true (mobile)
    vi.mocked(useIsMobile).mockReturnValue(true);
    
    render(
      <TestWrapper>
        <AuthPage />
      </TestWrapper>
    );
    
    // On mobile, we expect no hero section to be visible
    // and the layout should be a column (flex-col)
    const mainContainer = screen.getByRole('main') || document.querySelector('.min-h-screen');
    
    if (mainContainer) {
      // Check for column layout classes
      expect(mainContainer.classList.contains('flex-col')).toBe(true);
      
      // Hero section should be hidden on mobile
      const heroSection = document.querySelector('.md\\:flex.md\\:w-1\\/2');
      expect(heroSection?.classList.contains('hidden')).toBe(true);
    }
  });
  
  it('uses a two-column layout on desktop', () => {
    // Mock useIsMobile to return false (desktop)
    vi.mocked(useIsMobile).mockReturnValue(false);
    
    render(
      <TestWrapper>
        <AuthPage />
      </TestWrapper>
    );
    
    // On desktop, we expect a hero section to be visible
    // and the layout should be a row (flex-row)
    const mainContainer = screen.getByRole('main') || document.querySelector('.min-h-screen');
    
    if (mainContainer) {
      // Check for row layout classes
      expect(mainContainer.classList.contains('md:flex-row')).toBe(true);
      
      // Hero section should be visible on desktop
      const heroSection = document.querySelector('.md\\:flex.md\\:w-1\\/2');
      expect(heroSection).toBeInTheDocument();
      expect(heroSection?.classList.contains('hidden')).toBe(false);
    }
  });
  
  it('has properly sized text elements on mobile', () => {
    // Mock useIsMobile to return true (mobile)
    vi.mocked(useIsMobile).mockReturnValue(true);
    
    render(
      <TestWrapper>
        <AuthPage />
      </TestWrapper>
    );
    
    // Test headings and form elements
    const heading = screen.getByText('Pokémon Card Album');
    expect(heading).toHaveClass('text-2xl');
    
    // Form fields should be properly sized
    const usernameLabel = screen.getByText('Username');
    expect(usernameLabel).toHaveClass('text-base');
    
    // Buttons should have appropriate padding
    // Use getAllByRole since there might be multiple buttons with "Login" text
    const loginButtons = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('Login')
    );
    expect(loginButtons.length).toBeGreaterThan(0);
    expect(loginButtons.some(button => button.classList.contains('py-6'))).toBe(true);
  });
  
  it('has properly sized text elements on desktop', () => {
    // Mock useIsMobile to return false (desktop)
    vi.mocked(useIsMobile).mockReturnValue(false);
    
    render(
      <TestWrapper>
        <AuthPage />
      </TestWrapper>
    );
    
    // Test headings and form elements
    const heading = screen.getByText('Pokémon Card Album');
    expect(heading).toHaveClass('md:text-3xl');
    
    // Form fields should be properly sized
    const usernameLabel = screen.getByText('Username');
    expect(usernameLabel).toHaveClass('text-base');
    
    // Buttons should have appropriate padding
    // Use getAllByRole since there might be multiple buttons with "Login" text
    const loginButtons = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('Login')
    );
    expect(loginButtons.length).toBeGreaterThan(0);
    expect(loginButtons.some(button => button.classList.contains('py-6'))).toBe(true);
  });
});