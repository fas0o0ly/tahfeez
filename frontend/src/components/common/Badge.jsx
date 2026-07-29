// src/components/common/Badge.jsx

const variants = {
  // Status badges
  active:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  suspended: 'bg-orange-50 text-orange-700 border border-orange-200',
  banned:    'bg-red-50 text-red-700 border border-red-200',
  // Role badges
  admin:     'bg-purple-50 text-purple-700 border border-purple-200',
  teacher:   'bg-forest-50 text-forest-700 border border-forest-200',
  student:   'bg-blue-50 text-blue-700 border border-blue-200',
  // Generic
  success:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning:   'bg-amber-50 text-amber-700 border border-amber-200',
  error:     'bg-red-50 text-red-700 border border-red-200',
  info:      'bg-blue-50 text-blue-700 border border-blue-200',
  gold:      'bg-gold-50 text-gold-700 border border-gold-200',
};

const Badge = ({ variant = 'info', children, className = '' }) => {
  const styles = variants[variant] || variants.info;
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2.5 py-0.5
        text-xs font-medium rounded-full
        ${styles} ${className}
      `}
    >
      {children}
    </span>
  );
};

// Convenience dot indicator
Badge.Dot = ({ variant = 'info' }) => {
  const colors = {
    active:    'bg-emerald-500',
    pending:   'bg-amber-500',
    suspended: 'bg-orange-500',
    banned:    'bg-red-500',
    success:   'bg-emerald-500',
    warning:   'bg-amber-500',
    error:     'bg-red-500',
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[variant] || 'bg-gray-400'}`} />
  );
};

export default Badge;