import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom for extended matchers
import PageControls from '../../client/src/components/album/PageControls';
import React from 'react';

describe('PageControls Component', () => {
  it('renders with the correct current page', () => {
    const onPageChange = vi.fn();
    render(<PageControls currentPage={3} onPageChange={onPageChange} />);
    
    // Check if current page is displayed
    expect(screen.getByText('Page 3')).toBeInTheDocument();
  });

  it('calls onPageChange with previous page when prev button is clicked', () => {
    const onPageChange = vi.fn();
    render(<PageControls currentPage={3} onPageChange={onPageChange} />);
    
    // Find the previous button (first button in the component) and click it
    const buttons = screen.getAllByRole('button');
    const prevButton = buttons[0]; // First button is previous
    fireEvent.click(prevButton);
    
    // onPageChange should be called with current page - 1
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with next page when next button is clicked', () => {
    const onPageChange = vi.fn();
    render(<PageControls currentPage={3} onPageChange={onPageChange} />);
    
    // Find the next button (second button in the component) and click it
    const buttons = screen.getAllByRole('button');
    const nextButton = buttons[1]; // Second button is next
    fireEvent.click(nextButton);
    
    // onPageChange should be called with current page + 1
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('disables the previous button when on page 1', () => {
    const onPageChange = vi.fn();
    render(<PageControls currentPage={1} onPageChange={onPageChange} />);
    
    // Previous button should be disabled
    const buttons = screen.getAllByRole('button');
    const prevButton = buttons[0]; // First button is previous
    expect(prevButton).toBeDisabled();
    
    // Click should not trigger onPageChange
    fireEvent.click(prevButton);
    expect(onPageChange).not.toHaveBeenCalled();
  });
});