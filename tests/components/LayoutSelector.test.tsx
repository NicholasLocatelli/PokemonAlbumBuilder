import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LayoutSelector from '../../client/src/components/album/LayoutSelector';
import React from 'react';

describe('LayoutSelector Component', () => {
  it('renders with the current grid size selected', () => {
    const onSelect = vi.fn();
    render(<LayoutSelector currentSize={9} onSelect={onSelect} />);
    
    // The 9-card layout should be selected
    const nineCardButton = screen.getByRole('button', { name: /9 cards/i });
    expect(nineCardButton).toHaveClass('bg-primary');
  });

  it('calls onSelect with the correct size when a layout is clicked', () => {
    const onSelect = vi.fn();
    render(<LayoutSelector currentSize={9} onSelect={onSelect} />);
    
    // Click on the 4-card layout
    const fourCardButton = screen.getByRole('button', { name: /4 cards/i });
    fireEvent.click(fourCardButton);
    
    // onSelect should be called with 4
    expect(onSelect).toHaveBeenCalledWith(4);
  });

  it('does not call onSelect when clicking the already selected layout', () => {
    const onSelect = vi.fn();
    render(<LayoutSelector currentSize={9} onSelect={onSelect} />);
    
    // Click on the already selected 9-card layout
    const nineCardButton = screen.getByRole('button', { name: /9 cards/i });
    fireEvent.click(nineCardButton);
    
    // onSelect should not be called
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows all three layout options', () => {
    const onSelect = vi.fn();
    render(<LayoutSelector currentSize={9} onSelect={onSelect} />);
    
    // All three layout options should be present
    expect(screen.getByRole('button', { name: /4 cards/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /9 cards/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /12 cards/i })).toBeInTheDocument();
  });
});