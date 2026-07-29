// src/components/layout/AuthLayout.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoImg from '../../assets/logo.png';

// Animated SVG geometric Islamic pattern for the left panel
const IslamicPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-10"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="islamic-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        {/* 8-pointed star base */}
        <g fill="none" stroke="#d4af37" strokeWidth="0.6">
          <polygon points="40,8 47,25 65,25 51,36 56,53 40,43 24,53 29,36 15,25 33,25" />
          <rect x="20" y="20" width="40" height="40" transform="rotate(45 40 40)" />
          <circle cx="40" cy="40" r="14" />
          <line x1="40" y1="0" x2="40" y2="80" />
          <line x1="0" y1="40" x2="80" y2="40" />
          <line x1="0" y1="0" x2="80" y2="80" />
          <line x1="80" y1="0" x2="0" y2="80" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#islamic-grid)" />
  </svg>
);

const LeftPanel = () => (
  <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between
                  bg-gradient-to-br from-forest-950 via-forest-900 to-forest-800
                  overflow-hidden px-12 py-14">

    {/* Background pattern */}
    <IslamicPattern />

    {/* Glowing orb */}
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-80 h-80 rounded-full opacity-10
                    bg-gradient-radial from-gold-400 to-transparent blur-3xl pointer-events-none" />

    {/* Top — Brand */}
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="relative z-10"
    >
      <Link to="/" className="flex items-center gap-3 mb-3 group w-fit">
        <img
          src={logoImg}
          alt="Tahfeez"
          className="w-10 h-10 object-contain transition-transform group-hover:scale-105"
        />
        <span className="text-white font-display text-xl font-semibold tracking-wide
                          group-hover:text-gold-300 transition-colors">
          Tahfeez
        </span>
      </Link>
      <div className="w-8 h-px bg-gold-500/50" />
    </motion.div>

    {/* Center — Main quote */}
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
      className="relative z-10 text-center"
    >
      <p
        className="text-gold-300 leading-loose mb-6"
        style={{
          fontFamily: 'Amiri, serif',
          fontSize: '28px',
          direction: 'rtl',
          textShadow: '0 2px 20px rgba(212,175,55,0.3)',
        }}
      >
قال الله تعالى: ﴿وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ﴾ [القمر: ١٧]
      </p>

      <div className="w-12 h-px bg-gold-500/40 mx-auto mb-4" />

      <p className="text-forest-300 text-sm font-light tracking-wide leading-relaxed">
        "And We have certainly made the Quran easy to remember. So is there anyone who will be mindful?"
      </p>
      <p className="text-forest-500 text-xs mt-2 tracking-widest">
        — AL-QAMAR 54:17
      </p>
    </motion.div>

    {/* Bottom — Features */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
      className="relative z-10 space-y-3"
    >
      {[
        { icon: '📖', text: 'Live Halaqah sessions with qualified teachers' },
        { icon: '🎙️', text: 'AI-powered recitation feedback' },
        { icon: '📊', text: 'Structured Hifz progress tracking' },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10
                          flex items-center justify-center text-sm flex-shrink-0">
            {item.icon}
          </div>
          <p className="text-forest-300 text-xs leading-relaxed">{item.text}</p>
        </div>
      ))}
    </motion.div>
  </div>
);

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f9f7f2' }}>
      <LeftPanel />

      {/* Right panel — form area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">

        {/* Mobile-only top brand bar */}
        <div className="lg:hidden mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <img src={logoImg} alt="Tahfeez" className="w-8 h-8 object-contain" />
            <span className="font-display text-forest-800 text-xl font-semibold">Tahfeez</span>
          </Link>
          <p className="text-forest-500 text-xs tracking-widest">ONLINE QURAN MEMORIZATION</p>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>

        <p className="mt-8 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} Tahfeez Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;