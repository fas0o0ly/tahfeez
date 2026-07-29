// src/components/quran/SurahCard.jsx
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Badge from '../common/Badge';

const SurahCard = ({ surah, index }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleOpen = () => {
    const base = user?.role === 'teacher' ? '/teacher' : '/student';
    // Navigate to reader at the surah's first page
    navigate(`${base}/quran/read`, {
      state: { page: surah.page_start || 1, surahNumber: surah.surah_number },
    });
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      onClick={handleOpen}
      className="w-full text-left bg-white rounded-2xl border border-gray-100
                 shadow-card hover:shadow-card-hover hover:border-forest-200
                 transition-all duration-200 group overflow-hidden"
    >
      <div className="flex items-center gap-4 p-4">
        {/* Surah number badge */}
        <div className="relative flex-shrink-0 w-11 h-11">
          {/* Diamond shape background */}
          <div
            className="absolute inset-0 bg-forest-50 group-hover:bg-forest-100
                       transition-colors duration-200"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
          <span className="absolute inset-0 flex items-center justify-center
                           text-xs font-semibold text-forest-700 font-body">
            {surah.surah_number}
          </span>
        </div>

        {/* Names */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-display font-semibold text-forest-900 text-sm leading-tight">
              {surah.name_english}
            </p>
            <Badge variant={surah.revelation_type === 'meccan' ? 'gold' : 'info'}>
              {surah.revelation_type === 'meccan' ? 'Meccan' : 'Medinan'}
            </Badge>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 font-body">
            {surah.name_transliteration} · {surah.total_verses} verses
          </p>
        </div>

        {/* Arabic name */}
        <div className="flex-shrink-0 text-right">
          <p
            className="text-forest-800 group-hover:text-forest-600
                       transition-colors duration-200"
            style={{ fontFamily: 'Amiri Quran, Amiri, serif', fontSize: '1.25rem', direction: 'rtl' }}
          >
            {surah.name_arabic}
          </p>
          {surah.juz_number && (
            <p className="text-xs text-gray-400 mt-0.5 font-body">Juz {surah.juz_number}</p>
          )}
        </div>

        {/* Arrow */}
        <svg
          className="w-4 h-4 text-gray-300 group-hover:text-forest-500 flex-shrink-0
                     transition-colors duration-200 group-hover:translate-x-0.5 transform"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.button>
  );
};

export default SurahCard;