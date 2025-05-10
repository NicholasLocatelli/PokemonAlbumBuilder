import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CardSearchModal from '../../../client/src/components/album/CardSearchModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the API request
vi.mock('../../../client/src/lib/queryClient', () => ({
  apiRequest: vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      cards: [
        {
          id: 'test-card-1',
          name: 'Pikachu',
          images: { small: 'pikachu-small.jpg', large: 'pikachu-large.jpg' },
          set: { id: 'base', name: 'Base Set', series: 'Base' }
        },
        {
          id: 'test-card-2',
          name: 'Charizard',
          images: { small: 'charizard-small.jpg', large: 'charizard-large.jpg' },
          set: { id: 'base', name: 'Base Set', series: 'Base' }
        }
      ],
      totalCount: 2
    })
  }),
  queryClient: new QueryClient()
}));

// Mock sets data
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: vi.fn().mockImplementation(({ queryKey }) => {
      if (queryKey && queryKey[0] === '/api/sets') {
        return {
          data: [
            { id: 'base', name: 'Base Set', series: 'Base' },
            { id: 'jungle', name: 'Jungle', series: 'Base' }
          ],
          isLoading: false,
          error: null
        };
      }
      
      if (queryKey && queryKey[0] === '/api/search-cards') {
        return {
          data: {
            cards: [
              {
                id: 'test-card-1',
                name: 'Pikachu',
                images: { small: 'pikachu-small.jpg', large: 'pikachu-large.jpg' },
                set: { id: 'base', name: 'Base Set', series: 'Base' }
              },
              {
                id: 'test-card-2',
                name: 'Charizard',
                images: { small: 'charizard-small.jpg', large: 'charizard-large.jpg' },
                set: { id: 'base', name: 'Base Set', series: 'Base' }
              }
            ],
            totalCount: 2
          },
          isLoading: false,
          error: null
        };
      }
      
      return {
        data: null,
        isLoading: false,
        error: null
      };
    })
  };
});

// Create test wrapper
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

describe('CardSearchModal Component', () => {
  const onOpenChangeMock = vi.fn();
  const onCardSelectMock = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders the search modal when open is true', () => {
    render(
      <TestWrapper>
        <CardSearchModal 
          open={true} 
          onOpenChange={onOpenChangeMock} 
          onCardSelect={onCardSelectMock}
        />
      </TestWrapper>
    );
    
    // Modal title should be visible
    expect(screen.getByText('Search Pokémon Cards')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search for a card...')).toBeInTheDocument();
  });
  
  it('does not render the modal when open is false', () => {
    render(
      <TestWrapper>
        <CardSearchModal 
          open={false} 
          onOpenChange={onOpenChangeMock} 
          onCardSelect={onCardSelectMock}
        />
      </TestWrapper>
    );
    
    // Modal should not be in the document
    expect(screen.queryByText('Search Pokémon Cards')).not.toBeInTheDocument();
  });
  
  it('displays card search results', async () => {
    render(
      <TestWrapper>
        <CardSearchModal 
          open={true} 
          onOpenChange={onOpenChangeMock} 
          onCardSelect={onCardSelectMock}
        />
      </TestWrapper>
    );
    
    // Cards should be displayed
    await waitFor(() => {
      expect(screen.getByText('Pikachu')).toBeInTheDocument();
      expect(screen.getByText('Charizard')).toBeInTheDocument();
    });
  });
  
  it('calls onCardSelect when a card is clicked', async () => {
    render(
      <TestWrapper>
        <CardSearchModal 
          open={true} 
          onOpenChange={onOpenChangeMock} 
          onCardSelect={onCardSelectMock}
        />
      </TestWrapper>
    );
    
    // Wait for cards to be displayed
    await waitFor(() => {
      expect(screen.getByText('Pikachu')).toBeInTheDocument();
    });
    
    // Click on a card
    const pikachuCard = screen.getByText('Pikachu').closest('.card') || 
                        screen.getByText('Pikachu').closest('div[role="button"]') ||
                        screen.getByText('Pikachu');
                        
    fireEvent.click(pikachuCard);
    
    // onCardSelect should be called with the card data
    expect(onCardSelectMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'test-card-1',
      name: 'Pikachu'
    }));
    
    // Modal should be closed
    expect(onOpenChangeMock).toHaveBeenCalledWith(false);
  });
  
  it('allows filtering by set', async () => {
    render(
      <TestWrapper>
        <CardSearchModal 
          open={true} 
          onOpenChange={onOpenChangeMock} 
          onCardSelect={onCardSelectMock}
        />
      </TestWrapper>
    );
    
    // Wait for sets to be displayed
    await waitFor(() => {
      expect(screen.getByText('All Sets')).toBeInTheDocument();
    });
    
    // Open the set dropdown
    const setSelect = screen.getByText('All Sets');
    fireEvent.click(setSelect);
    
    // Select a set from the dropdown
    await waitFor(() => {
      const baseSetOption = screen.getByText('Base Set');
      if (baseSetOption) {
        fireEvent.click(baseSetOption);
      }
    });
    
    // Cards from the selected set should be displayed
    expect(screen.getByText('Pikachu')).toBeInTheDocument();
  });
  
  it('searches cards when query is entered', async () => {
    render(
      <TestWrapper>
        <CardSearchModal 
          open={true} 
          onOpenChange={onOpenChangeMock} 
          onCardSelect={onCardSelectMock}
        />
      </TestWrapper>
    );
    
    // Enter search query
    const searchInput = screen.getByPlaceholderText('Search for a card...');
    fireEvent.change(searchInput, { target: { value: 'pikachu' } });
    
    // Wait for debounce and API call
    await waitFor(() => {
      expect(screen.getByText('Pikachu')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});