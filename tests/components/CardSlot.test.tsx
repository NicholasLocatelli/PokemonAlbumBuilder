import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CardSlot from '../../client/src/components/album/CardSlot';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a new QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Turn off retries and make everything synchronous for tests
      retry: false,
      cacheTime: 0,
      staleTime: 0
    },
  },
});

// Helper component to wrap CardSlot with DndProvider and QueryClientProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const testQueryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={testQueryClient}>
      <DndProvider backend={HTML5Backend}>
        {children}
      </DndProvider>
    </QueryClientProvider>
  );
};

describe('CardSlot Component', () => {
  it('renders an empty slot when card is null', () => {
    const onRemove = vi.fn();
    const onAddClick = vi.fn();
    
    render(
      <DndWrapper>
        <CardSlot 
          position={0} 
          card={null} 
          onRemove={onRemove} 
          onAddClick={onAddClick} 
        />
      </DndWrapper>
    );
    
    // Should display an "Add Card" button for empty slots
    const addButton = screen.getByRole('button', { name: /add card/i });
    expect(addButton).toBeInTheDocument();
  });

  it('renders a card when card is provided', () => {
    const onRemove = vi.fn();
    const onAddClick = vi.fn();
    const card = { position: 0, cardId: 'test-card-id' };
    
    render(
      <DndWrapper>
        <CardSlot 
          position={0} 
          card={card} 
          onRemove={onRemove} 
          onAddClick={onAddClick} 
        />
      </DndWrapper>
    );
    
    // Should display a remove button when a card is present
    const removeButton = screen.getByRole('button', { name: /remove/i });
    expect(removeButton).toBeInTheDocument();
  });

  it('calls onAddClick when add button is clicked', () => {
    const onRemove = vi.fn();
    const onAddClick = vi.fn();
    
    render(
      <DndWrapper>
        <CardSlot 
          position={0} 
          card={null} 
          onRemove={onRemove} 
          onAddClick={onAddClick} 
        />
      </DndWrapper>
    );
    
    // Find and click the add button
    const addButton = screen.getByRole('button', { name: /add card/i });
    fireEvent.click(addButton);
    
    // onAddClick should be called
    expect(onAddClick).toHaveBeenCalled();
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    const onAddClick = vi.fn();
    const card = { position: 0, cardId: 'test-card-id' };
    
    render(
      <DndWrapper>
        <CardSlot 
          position={0} 
          card={card} 
          onRemove={onRemove} 
          onAddClick={onAddClick} 
        />
      </DndWrapper>
    );
    
    // Find and click the remove button
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);
    
    // onRemove should be called
    expect(onRemove).toHaveBeenCalled();
  });
});