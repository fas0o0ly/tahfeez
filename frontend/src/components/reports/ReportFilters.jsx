const PERIODS = [
  { value: 'week',  label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year',  label: 'This Year' },
  { value: 'all',   label: 'All Time' },
];

const ReportFilters = ({ period, onPeriodChange, children }) => (
  <div className="flex flex-wrap items-center gap-3 mb-6 print:hidden">
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onPeriodChange(p.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                      ${period === p.value
                        ? 'bg-white text-forest-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'}`}
        >
          {p.label}
        </button>
      ))}
    </div>
    {children}
  </div>
);

export default ReportFilters;
