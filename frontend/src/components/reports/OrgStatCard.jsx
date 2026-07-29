import { motion } from 'framer-motion';

const OrgStatCard = ({ icon, label, value, sub, accent = 'forest', index = 0 }) => {
  const accents = {
    forest: 'from-forest-600 to-forest-500',
    gold:   'from-gold-600 to-gold-400',
    amber:  'from-amber-500 to-amber-400',
    blue:   'from-blue-600 to-blue-400',
    red:    'from-red-500 to-red-400',
    purple: 'from-purple-600 to-purple-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-card p-5
                 flex items-start gap-4 print:break-inside-avoid"
    >
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accents[accent] || accents.forest}
                       flex items-center justify-center flex-shrink-0 text-white text-lg shadow-sm`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-display font-semibold text-forest-900 leading-none tabular-nums">
          {value ?? '—'}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
};

export default OrgStatCard;
