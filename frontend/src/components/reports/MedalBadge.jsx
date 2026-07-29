const COLOR_MAP = {
  gold:   'bg-gold-50 border-gold-200 text-gold-700',
  forest: 'bg-forest-50 border-forest-200 text-forest-700',
  amber:  'bg-amber-50 border-amber-200 text-amber-700',
};

const MedalBadge = ({ achievement }) => {
  const colorClass = COLOR_MAP[achievement.color] || COLOR_MAP.forest;

  return (
    <div className={`border rounded-2xl p-4 flex flex-col items-center gap-2
                     text-center ${colorClass} print:break-inside-avoid`}>
      <span className="text-3xl">{achievement.icon}</span>
      <div>
        <p className="text-xs font-semibold leading-snug">{achievement.name}</p>
        {achievement.name_ar && (
          <p className="text-xs opacity-70 mt-0.5" style={{ fontFamily: 'Amiri, serif' }}>
            {achievement.name_ar}
          </p>
        )}
      </div>
      <p className="text-[10px] opacity-60">
        {new Date(achievement.awarded_at).toLocaleDateString('en-MY', {
          day: 'numeric', month: 'short', year: 'numeric',
        })}
      </p>
    </div>
  );
};

export default MedalBadge;
