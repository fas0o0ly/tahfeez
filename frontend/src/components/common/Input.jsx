// src/components/common/Input.jsx
import { forwardRef, useState } from 'react';

const EyeIcon = ({ open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {open ? (
      <>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
      </>
    )}
  </svg>
);

const Input = forwardRef(({
  label,
  error,
  type = 'text',
  hint,
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 tracking-wide">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          className={`
            w-full px-4 py-3 rounded-xl border bg-white text-gray-800 text-sm
            placeholder:text-gray-400 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${isPassword ? 'pr-11' : ''}
            ${error
              ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
              : 'border-gray-200 focus:ring-forest-200 focus:border-forest-400'
            }
          `}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            <EyeIcon open={showPassword} />
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}

      {hint && !error && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;