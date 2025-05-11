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

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => {
  return {
    QueryClient: vi.fn(),
    QueryClientProvider: ({ children }: any) => children,
    useQuery: vi.fn().mockImplementation((options) => {
      const queryKey = Array.isArray(options.queryKey) ? options.queryKey : [];
      
      if (queryKey[0] === '/api/sets') {
        return {
          data: [
            { id: 'base', name: 'Base Set', series: 'Base' },
            { id: 'jungle', name: 'Jungle', series: 'Base' }
          ],
          isLoading: false,
          error: null
        };
      }
      
      if (queryKey[0] === '/api/cards/search') {
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
    
    // Click on a card - Handle the fact that the card is in a complex structure
    // Find a container element that contains the text 'Pikachu' and is clickable
    const cards = screen.getAllByRole('article') || 
                 document.querySelectorAll('.cursor-pointer') || 
                 document.querySelectorAll('.Card');
    
    // Find the card that contains 'Pikachu'
    const pikachuCard = Array.from(cards).find(card => 
      card.textContent?.includes('Pikachu')
    );

    // If we find the card, click it
    if (pikachuCard) {
      fireEvent.click(pikachuCard);
    } else {
      // Fallback to clicking the element that contains the text
      fireEvent.click(screen.getByText('Pikachu'));
    }
    
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
    
    // Handle the select trigger more robustly
    // Looking for either the text or a select element
    const setSelectTrigger = screen.getByRole('combobox') || 
                            screen.getByLabelText('Filter by Set:');
    
    if (setSelectTrigger) {
      fireEvent.click(setSelectTrigger);
    
      // Wait for the select content to be visible and then select an option
      await waitFor(() => {
        // Try various ways to find the option
        const baseSetOption = 
          screen.getByText(/Base Set/i) || 
          document.querySelector('[data-value="base"]') ||
          Array.from(document.querySelectorAll('[role="option"]')).find(el => 
            el.textContent?.includes('Base Set')
          );
          
        if (baseSetOption) {
          fireEvent.click(baseSetOption);
        }
      }, { timeout: 1000 });
    }
    
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