import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AlbumGrid from '../../client/src/components/album/AlbumGrid';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a TestWrapper component that provides necessary context
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
      <DndProvider backend={HTML5Backend}>
        {children}
      </DndProvider>
    </QueryClientProvider>
  );
};

// Mock CardSlot component since we're testing AlbumGrid in isolation
vi.mock('../../client/src/components/album/CardSlot', () => ({
  default: ({ position, card, onRemove, onAddClick }: any) => (
    <div data-testid={`card-slot-${position}`} className="card-slot-mock">
      <span>Position: {position}</span>
      <span>Has Card: {card ? 'Yes' : 'No'}</span>
      <button onClick={onRemove} data-testid={`remove-btn-${position}`}>Remove</button>
      <button onClick={onAddClick} data-testid={`add-btn-${position}`}>Add</button>
    </div>
  ),
}));

describe('AlbumGrid Component', () => {
  it('renders all card slots based on gridSize', () => {
    // Test with grid size 4 (2x2)
    render(
      <TestWrapper>
        <AlbumGrid
          gridSize={4}
          cards={[]}
          pageId={1}
        />
      </TestWrapper>
    );
    
    // Should render 4 card slots
    expect(screen.getAllByTestId(/card-slot-\d+/)).toHaveLength(4);
  });

  it('renders the correct card information', () => {
    const testCards = [
      { position: 0, cardId: 'card1' },
      { position: 2, cardId: 'card2' },
    ];
    
    render(
      <TestWrapper>
        <AlbumGrid
          gridSize={4}
          cards={testCards}
          pageId={1}
        />
      </TestWrapper>
    );
    
    // Check if positions are rendered correctly
    const slot0 = screen.getByTestId('card-slot-0');
    const slot2 = screen.getByTestId('card-slot-2');
    
    expect(slot0).toHaveTextContent('Position: 0');
    expect(slot0).toHaveTextContent('Has Card: Yes');
    
    expect(slot2).toHaveTextContent('Position: 2');
    expect(slot2).toHaveTextContent('Has Card: Yes');
    
    // Empty slots should show "Has Card: No"
    const slot1 = screen.getByTestId('card-slot-1');
    expect(slot1).toHaveTextContent('Has Card: No');
  });

  it('renders with custom cover color', () => {
    const testColor = '#ff0000';
    render(
      <TestWrapper>
        <AlbumGrid
          gridSize={4}
          cards={[]}
          pageId={1}
          coverColor={testColor}
        />
      </TestWrapper>
    );
    
    // Check if the background color is applied with transparency
    const gridContainer = screen.getByTestId('album-grid-container');
    expect(gridContainer).toHaveStyle(`background-color: ${testColor}20`); // 20 is hex for 12% opacity
  });
});