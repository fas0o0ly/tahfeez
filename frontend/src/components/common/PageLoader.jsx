// src/components/common/PageLoader.jsx
const PageLoader = () => {
  return (
    <div className="fixed inset-0 bg-forest-950 flex flex-col items-center justify-center z-50">
      {/* Animated geometric ring */}
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-forest-700" />
        <div className="absolute inset-0 rounded-full border-t-2 border-gold-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-t-2 border-gold-400 animate-spin"
          style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
        />
      </div>

      {/* Arabic text */}
      <p
        className="text-gold-400 text-xl mb-1"
        style={{ fontFamily: 'Amiri, serif', direction: 'rtl' }}
      >
        بِسْمِ اللَّهِ
      </p>
      <p className="text-forest-400 text-xs tracking-widest uppercase font-light">
        Loading
      </p>
    </div>
  );
};

export default PageLoader;