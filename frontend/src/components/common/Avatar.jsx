// src/components/common/Avatar.jsx

const sizeMap = {
  xs:  'w-6 h-6 text-xs',
  sm:  'w-8 h-8 text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-14 h-14 text-base',
  xl:  'w-20 h-20 text-xl',
  '2xl': 'w-28 h-28 text-2xl',
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const sizeClass = sizeMap[size] || sizeMap.md;

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User avatar'}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        ${sizeClass} rounded-full flex-shrink-0
        bg-forest-100 text-forest-700 font-semibold font-body
        flex items-center justify-center ${className}
      `}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;