// src/components/common/Button.jsx
const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const base = `
    inline-flex items-center justify-center gap-2 font-medium
    rounded-xl transition-all duration-200 focus:outline-none
    focus:ring-2 focus:ring-offset-2 active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
  `;

  const variants = {
    primary: 'bg-forest-600 text-white hover:bg-forest-700 focus:ring-forest-500 shadow-sm hover:shadow-md',
    secondary: 'border border-forest-200 text-forest-700 bg-white hover:bg-forest-50 focus:ring-forest-400',
    gold: 'bg-gold-500 text-obsidian-900 hover:bg-gold-600 focus:ring-gold-400 font-semibold shadow-sm',
    ghost: 'text-forest-600 hover:bg-forest-50 focus:ring-forest-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
    full: 'w-full px-6 py-3.5 text-sm',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
};

export default Button;