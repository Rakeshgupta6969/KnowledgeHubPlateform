import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../components/Pagination';

describe('Pagination Component', () => {
  it('renders correctly with pagination numbers and items count', () => {
    render(
      <Pagination
        page={1}
        totalPages={5}
        total={45}
        limit={10}
        onPageChange={() => {}}
      />
    );

    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });

  it('disables Previous button on first page', () => {
    render(
      <Pagination
        page={1}
        totalPages={3}
        total={25}
        limit={10}
        onPageChange={() => {}}
      />
    );

    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton).toBeDisabled();

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).not.toBeDisabled();
  });

  it('disables Next button on last page', () => {
    render(
      <Pagination
        page={3}
        totalPages={3}
        total={25}
        limit={10}
        onPageChange={() => {}}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();

    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton).not.toBeDisabled();
  });

  it('calls onPageChange with correct page number when clicked', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination
        page={2}
        totalPages={4}
        total={35}
        limit={10}
        onPageChange={handlePageChange}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    expect(handlePageChange).toHaveBeenCalledWith(3);

    const prevButton = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(prevButton);
    expect(handlePageChange).toHaveBeenCalledWith(1);
  });

  it('renders nothing when totalPages is 1 and total is 0', () => {
    const { container } = render(
      <Pagination
        page={1}
        totalPages={1}
        total={0}
        limit={10}
        onPageChange={() => {}}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
