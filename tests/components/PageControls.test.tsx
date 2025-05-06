import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PageControls from '../../client/src/components/album/PageControls';

describe('PageControls Component', () => {
  it('renders with the correct current page', () => {
    const onPageChange = vi.fn();
    render(<PageControls currentPage={3} onPageChange={onPageChange} />);
    
    // Check if current page is displayed
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls onPageChange with previous page when prev button is clicked', () => {
    const onPageChange = vi.fn();
    render(<PageControls currentPage={3} onPageChange={onPageChange} />);
    
    // Find the previous button and click it
    const prevButton = screen.getByLabelText('Previous page');
    fireEvent.click(prevButton);
    
    // onPageChange should be called with current page - 1
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with next page when next button is clicked', () => {
    const onPageChange = vi.fn();
    render(<PageControls currentPage={3} onPageChange={onPageChange} />);
    
    // Find the next button and click it
    const nextButton = screen.getByLabelText('Next page');
    fireEvent.click(nextButton);
    
    // onPageChange should be called with current page + 1
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('disables the previous button when on page 1', () => {
    const onPageChange = vi.fn();
    render(<PageControls currentPage={1} onPageChange={onPageChange} />);
    
    // Previous button should be disabled
    const prevButton = screen.getByLabelText('Previous page');
    expect(prevButton).toBeDisabled();
    
    // Click should not trigger onPageChange
    fireEvent.click(prevButton);
    expect(onPageChange).not.toHaveBeenCalled();
  });
});