// src/components/common/EmptyState.jsx
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {icon && (
      <div className="w-14 h-14 rounded-2xl bg-forest-50 flex items-center justify-center mb-4 text-2xl">
        {icon}
      </div>
    )}
    <h3 className="font-display text-lg font-semibold text-forest-900 mb-1">{title}</h3>
    {description && (
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-5">{description}</p>
    )}
    {action}
  </div>
);

// src/components/common/Spinner.jsx
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return (
    <svg
      className={`animate-spin text-forest-600 ${sizes[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
};

// src/components/common/Pagination.jsx
export const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.total_pages <= 1) return null;

  const { page, total_pages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-xs text-gray-500">
        Showing <span className="font-medium text-gray-700">{from}–{to}</span> of{' '}
        <span className="font-medium text-gray-700">{total}</span> results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!pagination.has_prev}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {Array.from({ length: total_pages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === total_pages || Math.abs(p - page) <= 1)
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, idx) =>
            p === '...' ? (
              <span key={`dot-${idx}`} className="px-1 text-gray-400 text-sm">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-forest-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            )
          )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!pagination.has_next}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};