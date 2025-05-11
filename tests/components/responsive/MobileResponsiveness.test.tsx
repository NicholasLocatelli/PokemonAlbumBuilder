import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AuthProvider } from '../../../client/src/hooks/use-auth';
import { useIsMobile } from '../../../client/src/hooks/use-mobile';

// Mock useIsMobile hook
vi.mock('../../../client/src/hooks/use-mobile', () => ({
  useIsMobile: vi.fn().mockReturnValue(false)
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
      <AuthProvider>
        <DndProvider backend={HTML5Backend}>
          {children}
        </DndProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

// Create a simple responsive test component
const ResponsiveTestComponent = () => {
  const isMobile = useIsMobile();
  
  return (
    <div data-testid="responsive-component">
      <div data-testid="device-type">{isMobile ? 'mobile' : 'desktop'}</div>
      <div className={`hidden md:block`} data-testid="desktop-only">Desktop Only</div>
      <div className={`md:hidden`} data-testid="mobile-only">Mobile Only</div>
    </div>
  );
};

describe('Mobile Responsiveness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('shows desktop view when not on mobile', () => {
    // Mock useIsMobile to return false (desktop)
    vi.mocked(useIsMobile).mockReturnValue(false);
    
    render(
      <TestWrapper>
        <ResponsiveTestComponent />
      </TestWrapper>
    );
    
    // Should show desktop indicator
    expect(screen.getByTestId('device-type')).toHaveTextContent('desktop');
    
    // CSS classes for responsive design would be tested with snapshots
    // or by manually checking the element's classList in a real browser environment
  });
  
  it('shows mobile view when on mobile', () => {
    // Mock useIsMobile to return true (mobile)
    vi.mocked(useIsMobile).mockReturnValue(true);
    
    render(
      <TestWrapper>
        <ResponsiveTestComponent />
      </TestWrapper>
    );
    
    // Should show mobile indicator
    expect(screen.getByTestId('device-type')).toHaveTextContent('mobile');
  });
  
  describe('Testing viewport-specific layouts', () => {
    // Note: This test is for demonstration purposes only
    // In a real environment, you would manually test responsive design with different viewport sizes
    // or use visual testing tools like Storybook with viewport addons
    
    it('simulates how components would change with different viewports', () => {
      // For mobile
      vi.mocked(useIsMobile).mockReturnValue(true);
      
      const { unmount } = render(
        <TestWrapper>
          <ResponsiveTestComponent />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('device-type')).toHaveTextContent('mobile');
      
      // Check that we're simulating the tailwind classes correctly
      // Note: This won't actually test the CSS, just our simulation
      const mobileOnlyElement = screen.getByTestId('mobile-only');
      const desktopOnlyElement = screen.getByTestId('desktop-only');
      
      // In mobile view:
      // - desktop-only elements have a class of 'hidden md:block', which would make them hidden on mobile
      // - mobile-only elements have a class of 'md:hidden', which would make them visible on mobile
      
      expect(desktopOnlyElement).toHaveClass('hidden');
      expect(mobileOnlyElement).not.toHaveClass('hidden');
      
      unmount();
      
      // For desktop
      vi.mocked(useIsMobile).mockReturnValue(false);
      
      render(
        <TestWrapper>
          <ResponsiveTestComponent />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('device-type')).toHaveTextContent('desktop');
    });
  });
  
  describe('Mobile-specific components', () => {
    it('shows different UI elements based on screen size', () => {
      // Create a mobile-specific test component
      const MobileAdaptiveComponent = () => {
        const isMobile = useIsMobile();
        
        return (
          <div>
            {isMobile ? (
              <button data-testid="hamburger-menu">☰</button>
            ) : (
              <nav data-testid="navbar">
                <a href="#">Home</a>
                <a href="#">Albums</a>
                <a href="#">Settings</a>
              </nav>
            )}
          </div>
        );
      };
      
      // Test mobile view
      vi.mocked(useIsMobile).mockReturnValue(true);
      
      const { unmount } = render(
        <TestWrapper>
          <MobileAdaptiveComponent />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();
      expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
      
      unmount();
      
      // Test desktop view
      vi.mocked(useIsMobile).mockReturnValue(false);
      
      render(
        <TestWrapper>
          <MobileAdaptiveComponent />
        </TestWrapper>
      );
      
      expect(screen.queryByTestId('hamburger-menu')).not.toBeInTheDocument();
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });
  });
});