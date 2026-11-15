import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 10,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1 && total === 0) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <nav
      className={`p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 text-xs text-gray-600 ${className}`}
      aria-label="Pagination Navigation"
    >
      <div>
        {total > 0 ? (
          <span>
            Showing <strong className="font-semibold text-gray-900">{startItem}</strong> to{' '}
            <strong className="font-semibold text-gray-900">{endItem}</strong> of{' '}
            <strong className="font-semibold text-gray-900">{total}</strong> results
          </span>
        ) : (
          <span>Page {page} of {totalPages}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <span className="px-2 py-1 font-mono font-medium text-gray-700">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  );
}
