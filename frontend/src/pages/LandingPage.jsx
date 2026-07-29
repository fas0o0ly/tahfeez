import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './landing.css';
import logoImg from '../assets/logo.png';
import quranHeroImg from '../assets/quran-hero.jpg';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  en: {
    nav: { why: 'Why Tahfeez', how: 'How it works', programs: 'Programs', voices: 'Voices', signIn: 'Sign in', register: 'Begin Hifz' },
    hero: {
      eyebrow: 'Online Tahfeez Academy',
      title1: 'Carry the Qur\'an',
      title2: 'in your heart.',
      sub: 'One-to-one Tahfeez & Tajweed with certified Qurraa. Personalised tracks, ijazah pathways, and a teacher who knows your name.',
      cta1: 'Start for free',
      cta2: 'Sign in',
      trust: 'Trusted by families worldwide',
    },
    why: {
      eyebrow: 'Why Tahfeez',
      title: 'A path of memorisation, walked with care.',
      sub: 'We pair you with a teacher, build a plan around your life, and stay until you reach the last page.',
      items: [
        { t: 'Certified Qurraa',       d: 'Teachers hold ijazah in Hafs & Warsh, with sanad to the Prophet ﷺ. Every teacher is verified.' },
        { t: 'One-to-one always',      d: 'Never a group, never a recording. Live face-to-face with the same teacher every session.' },
        { t: 'A plan, not a syllabus', d: 'Memorisation, review, and tajweed timed to your life — students, professionals, parents, retirees.' },
        { t: 'Hifz & Murajaah',        d: 'New pages, old pages, and a structured review cycle so what you memorise actually stays.' },
        { t: 'Tajweed from day one',   d: 'Pronunciation corrected gently in every session. Makharij and sifaat taught by recitation.' },
        { t: 'Ijazah pathway',         d: 'Complete the Qur\'an and walk the chain — full sanad ijazah granted, in shaa Allah.' },
      ],
    },
    how: {
      eyebrow: 'How it works',
      title: 'Four steps. One Qur\'an. A lifetime.',
      sub: 'From your first message to your first juz, the path is simple.',
      steps: [
        { t: 'Tell us about you',         d: 'A short conversation — your level, goals, and hours. Tahfeez, tajweed, or Arabic — we listen first.' },
        { t: 'Meet your teacher',          d: 'We hand-pick a teacher matched to your level, gender preference, accent, and schedule.' },
        { t: 'Free trial class',           d: 'Sit with your teacher for a full session, on us. No card, no commitment. Continue only if it feels right.' },
        { t: 'Begin your journey',         d: 'Lock your weekly times and start the most consistent thing you\'ll do this year.' },
      ],
    },
    stats: {
      eyebrow: 'By the grace of Allah',
      title: 'A growing circle of huffadh.',
      sub: 'Numbers don\'t memorise the Qur\'an — people do. Here is the shape of our community, by His permission.',
    },
    courses: {
      eyebrow: 'Programs',
      title: 'Five tracks. Choose your path.',
      sub: 'Every track is one-to-one. Combine tracks freely — most students study two.',
      items: [
        { t: 'Tahfeez (Hifz)',     d: 'Memorise the Qur\'an, page by page, with structured murajaah and weekly tests.',         level: 'All levels' },
        { t: 'Tajweed',            d: 'Master the rules of recitation — makharij, sifaat, and the ten qira\'aat.',               level: 'Beginner → Advanced' },
        { t: 'Qur\'anic Arabic',   d: 'Read and understand the Qur\'an in its own language. Grammar through ayah, not textbook.', level: 'Beginner → Intermediate' },
        { t: 'Ijazah Track',       d: 'Complete recitation and ijazah with full sanad in Hafs \'an \'Asim.',                     level: 'Hafidh / Hafidha' },
        { t: 'Kids Program',       d: 'Gentle, playful tahfeez & Noorani Qa\'idah for children 5–12 with parental updates.',      level: 'Ages 5–12' },
      ],
    },
    testimonials: {
      eyebrow: 'Voices',
      title: 'Letters from our students.',
      items: [
        { q: 'I had tried three apps and one local circle. None held. With Tahfeez I memorised seven juz in eighteen months while working full-time. The same teacher every Tuesday and Thursday — that is what changed everything.', n: 'Yusuf Ibrahim', r: 'Software Engineer · Toronto' },
        { q: 'My daughter (8) asked to do the trial class. After it she asked when the next one was. A year later she finished Juz \'Amma. Her teacher knows her favourite surahs and her birthday.', n: 'Asma Khalid', r: 'Parent · Birmingham, UK' },
        { q: 'As a revert, I was ashamed to start. The intake was warm — they didn\'t quiz me, they asked how I was. I now read Surah Al-Mulk every night before sleep.', n: 'Mariam Reyes', r: 'Student · Manila, Philippines' },
        { q: 'I completed my ijazah in Hafs \'an \'Asim this Ramadan. I cannot describe the moment. Tahfeez made it possible across an ocean.', n: 'Dr. Hamza Çelik', r: 'Physician · Berlin, Germany' },
      ],
    },
    cta: {
      eyebrow: 'Begin',
      title: 'The Qur\'an is waiting.\nOne page is enough to start.',
      sub: 'Create your free account today. Your first session is on us. The intention itself is rewarded.',
      cta1: 'Create free account',
      cta2: 'Sign in',
    },
    footer: {
      tagline: 'An online Tahfeez academy for the global ummah.',
      cols: [
        { h: 'Programs', links: ['Tahfeez (Hifz)', 'Tajweed', 'Qur\'anic Arabic', 'Ijazah Track', 'Kids Program'] },
        { h: 'Academy',  links: ['About Tahfeez', 'Our Teachers', 'Sanad & Ijazah', 'Register as Teacher'] },
        { h: 'Help',     links: ['Sign In', 'Create Account', 'Contact Support'] },
      ],
      copyright: `© ${new Date().getFullYear()} Tahfeez Academy. Built with love for the global ummah.`,
      barakallahu: 'بَارَكَ اللَّهُ فِيكُمْ',
    },
  },
};

function QuranHeroImage() {
  return (
    <div className="lp-quran-hero-wrap">
      <img src={quranHeroImg} alt="Holy Quran" className="lp-quran-hero-img" />
    </div>
  );
}

// ─── Particle canvas background ───────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = (canvas.width = window.innerWidth * devicePixelRatio);
    let h = (canvas.height = window.innerHeight * devicePixelRatio);
    canvas.style.width = '100%'; canvas.style.height = '100%';
    const r = 200, g = 162, b = 75;
    const count = 90;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      rr: (0.5 + Math.random() * 1.5) * devicePixelRatio,
      vx: (Math.random() - 0.5) * 0.09 * devicePixelRatio,
      vy: -0.05 * devicePixelRatio - Math.random() * 0.16 * devicePixelRatio,
      a: 0.1 + Math.random() * 0.5,
      tw: Math.random() * Math.PI * 2,
      tws: 0.005 + Math.random() * 0.012,
    }));
    const onResize = () => {
      w = canvas.width = window.innerWidth * devicePixelRatio;
      h = canvas.height = window.innerHeight * devicePixelRatio;
    };
    window.addEventListener('resize', onResize);
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.tw += p.tws;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        const flicker = 0.6 + 0.4 * Math.sin(p.tw);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.rr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.a * flicker})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
}

// ─── Brand mark SVG ──────────────────────────────────────────────────────────
function BrandMark() {
  return <img src={logoImg} alt="Tahfeez" style={{ width: 32, height: 32, objectFit: 'contain' }} />;
}

// ─── Reveal hook ─────────────────────────────────────────────────────────────
function useReveal(delay = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t = setTimeout(() => el.classList.add('lp-in'), 60 + delay);
    return () => clearTimeout(t);
  }, [delay]);
  return ref;
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
function Nav({ scrollTo }) {
  const t = T.en;
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id) => scrollTo && scrollTo(id);

  return (
    <header className={`lp-nav ${scrolled ? 'lp-scrolled' : ''}`}>
      <div className="lp-container lp-nav-inner">
        <Link to="/" className="lp-nav-logo">
          <BrandMark />
          <div className="lp-logo-text">
            <span className="lp-logo-en">Tahfeez</span>
            <span className="lp-logo-ar">تَحْفِيظ</span>
          </div>
        </Link>

        <nav className="lp-nav-links" aria-label="Primary">
          {[['why', t.nav.why], ['how', t.nav.how], ['programs', t.nav.programs], ['voices', t.nav.voices]].map(([id, label]) => (
            <button key={id} className="lp-nav-link" onClick={() => go(id)}>{label}</button>
          ))}
        </nav>

        <div className="lp-nav-end">
          <Link to="/login" className="lp-btn lp-btn-outline lp-nav-hide-mobile" style={{ padding: '9px 16px', fontSize: 13 }}>
            {t.nav.signIn}
          </Link>
          <Link to="/register" className="lp-btn lp-btn-primary" style={{ padding: '9px 18px', fontSize: 13.5 }}>
            {t.nav.register}
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Mushaf visual ────────────────────────────────────────────────────────────

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ scrollTo }) {
  const t = T.en;
  const ref = useReveal(0);

  return (
    <section id="hero" className="lp-hero">
      <div className="lp-container">
        <div className="lp-hero-inner">
          <div ref={ref} className="lp-hero-content lp-reveal">
            <div className="lp-eyebrow">{t.hero.eyebrow}</div>
            <h1 className="lp-hero-title">
              <span>{t.hero.title1}</span>
              <span className="lp-gold">{t.hero.title2}</span>
            </h1>
            <p className="lp-hero-sub">{t.hero.sub}</p>
            <div className="lp-hero-actions">
              <Link to="/register" className="lp-btn lp-btn-primary" style={{ padding: '14px 26px', fontSize: 15 }}>
                {t.hero.cta1}
              </Link>
              <button className="lp-btn lp-btn-ghost" style={{ padding: '14px 26px', fontSize: 15 }} onClick={() => scrollTo && scrollTo('how')}>
                How it works
              </button>
            </div>
            <div className="lp-hero-trust">
              <div className="lp-trust-avatars">
                {['Y', 'A', 'M', 'H'].map((l, i) => (
                  <div key={i} className="lp-trust-avatar" style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i }}>{l}</div>
                ))}
              </div>
              <p className="lp-trust-text">{t.hero.trust}</p>
            </div>
          </div>

          <div className="lp-hero-visual">
            <QuranHeroImage />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Why Us ───────────────────────────────────────────────────────────────────
const WHY_ICONS = [
  // Certified
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3 L20 7 L25 7 L25 12 L29 16 L25 20 L25 25 L20 25 L16 29 L12 25 L7 25 L7 20 L3 16 L7 12 L7 7 L12 7 Z"/><path d="M11 16 L14.5 19.5 L21 13"/></svg>,
  // One-to-one
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="12" r="3.5"/><path d="M5 24 C5 19 7.5 17 10 17 C12.5 17 15 19 15 24"/><circle cx="22" cy="12" r="3.5"/><path d="M17 24 C17 19 19.5 17 22 17 C24.5 17 27 19 27 24"/></svg>,
  // Calendar/plan
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="6" width="24" height="22" rx="2"/><path d="M4 12 L28 12 M10 3 L10 9 M22 3 L22 9"/><circle cx="11" cy="18" r="1.2" fill="currentColor"/><circle cx="16" cy="18" r="1.2" fill="currentColor"/><circle cx="21" cy="18" r="1.2" fill="currentColor"/></svg>,
  // Book/Hifz
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6 L4 26 L16 24 L28 26 L28 6 L16 8 Z"/><path d="M16 8 L16 24"/><path d="M8 13 L12 13 M8 17 L12 17 M20 13 L24 13 M20 17 L24 17"/></svg>,
  // Tajweed waveform
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 16 L6 16 L8 8 L11 24 L14 11 L17 21 L20 6 L23 26 L26 14 L29 16"/></svg>,
  // Sanad/chain
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10 12 L7 12 A4 4 0 0 0 7 20 L10 20"/><path d="M22 12 L25 12 A4 4 0 0 1 25 20 L22 20"/><path d="M11 16 L21 16"/><circle cx="16" cy="16" r="2.4"/></svg>,
];

function WhyCard({ idx, item }) {
  const ref = useReveal(idx * 70);
  return (
    <div ref={ref} className="lp-card lp-why-card lp-reveal">
      <div className="lp-why-icon">{WHY_ICONS[idx % WHY_ICONS.length]}</div>
      <span className="lp-why-num">{String(idx + 1).padStart(2, '0')}</span>
      <h3>{item.t}</h3>
      <p>{item.d}</p>
    </div>
  );
}

function WhyUs() {
  const t = T.en;
  const ref = useReveal(0);
  return (
    <section id="why" className="lp-section">
      <div className="lp-container">
        <div ref={ref} className="lp-sec-header lp-reveal">
          <div className="lp-eyebrow" style={{ marginBottom: 14 }}>{t.why.eyebrow}</div>
          <h2 className="lp-section-title">{t.why.title}</h2>
          <p className="lp-section-sub">{t.why.sub}</p>
        </div>
        <div className="lp-why-grid">
          {t.why.items.map((item, i) => <WhyCard key={i} idx={i} item={item} />)}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowStep({ idx, step }) {
  const ref = useReveal(idx * 90);
  return (
    <div ref={ref} className="lp-card lp-how-step lp-reveal">
      <span className="lp-how-num">{String(idx + 1).padStart(2, '0')}</span>
      <h3>{step.t}</h3>
      <p>{step.d}</p>
    </div>
  );
}

function HowItWorks() {
  const t = T.en;
  const ref = useReveal(0);
  return (
    <section id="how" className="lp-section">
      <div className="lp-container">
        <div ref={ref} className="lp-sec-header lp-reveal">
          <div className="lp-eyebrow" style={{ marginBottom: 14 }}>{t.how.eyebrow}</div>
          <h2 className="lp-section-title">{t.how.title}</h2>
          <p className="lp-section-sub">{t.how.sub}</p>
        </div>
        <div className="lp-how-grid">
          {t.how.steps.map((step, i) => <HowStep key={i} idx={i} step={step} />)}
        </div>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function useCountUp(target, duration = 2200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let raf;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function StatTile({ n, suffix, label, idx }) {
  const val = useCountUp(n, 2200 + idx * 120);
  const ref = useReveal(idx * 80);
  return (
    <div ref={ref} className="lp-stat-tile lp-reveal">
      <div className="lp-stat-num">
        {val.toLocaleString('en-US')}
        <span className="lp-stat-suffix">{suffix}</span>
      </div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

function Stats() {
  const t = T.en;
  const [stats, setStats] = useState(null);
  const ref = useReveal(0);

  useEffect(() => {
    axios.get(`${API_BASE}/reports/public/stats`)
      .then((r) => setStats(r.data.data.stats))
      .catch(() => setStats({ total_students: 0, total_teachers: 0, total_sessions: 0, countries: 0 }));
  }, []);

  const statItems = [
    { n: stats?.total_students || 0,  suffix: '+', label: 'Active students' },
    { n: stats?.total_teachers || 0,  suffix: '',  label: 'Certified teachers' },
    { n: stats?.total_sessions || 0,  suffix: '+', label: 'Sessions delivered' },
    { n: stats?.countries      || 0,  suffix: '',  label: 'Countries reached' },
  ];

  return (
    <section id="stats" className="lp-section">
      <div className="lp-container">
        <div ref={ref} className="lp-stats-wrap lp-reveal">
          <div className="lp-stats-head">
            <div className="lp-eyebrow" style={{ marginBottom: 14 }}>{t.stats.eyebrow}</div>
            <h2 className="lp-section-title">{t.stats.title}</h2>
            <p className="lp-section-sub">{t.stats.sub}</p>
          </div>
          <div className="lp-stats-grid">
            {statItems.map((item, i) => <StatTile key={i} idx={i} {...item} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Courses ──────────────────────────────────────────────────────────────────
function CourseCard({ idx, item }) {
  const ref = useReveal(idx * 70);
  const glyphs = ['١', '٢', '٣', '٤', '٥'];
  return (
    <div ref={ref} className="lp-card lp-course-card lp-reveal">
      <div className="lp-course-head">
        <h3>{item.t}</h3>
        <span className="lp-course-glyph">{glyphs[idx % glyphs.length]}</span>
      </div>
      <p>{item.d}</p>
      <div className="lp-course-foot">
        <span className="lp-course-level">{item.level}</span>
        <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'inherit', textDecoration: 'none', fontSize: 13, opacity: 0.85 }}>
          Enroll
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </Link>
      </div>
    </div>
  );
}

function Courses() {
  const t = T.en;
  const ref = useReveal(0);
  return (
    <section id="programs" className="lp-section">
      <div className="lp-container">
        <div ref={ref} className="lp-sec-header lp-reveal">
          <div className="lp-eyebrow" style={{ marginBottom: 14 }}>{t.courses.eyebrow}</div>
          <h2 className="lp-section-title">{t.courses.title}</h2>
          <p className="lp-section-sub">{t.courses.sub}</p>
        </div>
        <div className="lp-courses-grid">
          {t.courses.items.map((item, i) => <CourseCard key={i} idx={i} item={item} />)}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialCard({ idx, item }) {
  const ref = useReveal(idx * 80);
  const initial = item.n.replace(/[^A-Za-z]/g, '').slice(0, 1) || 'M';
  return (
    <div ref={ref} className="lp-card lp-test-card lp-reveal">
      <div className="lp-test-quote-mark" aria-hidden="true">"</div>
      <p className="lp-test-q">{item.q}</p>
      <div className="lp-test-meta">
        <div className="lp-test-ava">{initial}</div>
        <div>
          <div className="lp-test-name">{item.n}</div>
          <div className="lp-test-role">{item.r}</div>
        </div>
      </div>
    </div>
  );
}

function Testimonials() {
  const t = T.en;
  const ref = useReveal(0);
  return (
    <section id="voices" className="lp-section">
      <div className="lp-container">
        <div ref={ref} className="lp-sec-header lp-reveal">
          <div className="lp-eyebrow" style={{ marginBottom: 14 }}>{t.testimonials.eyebrow}</div>
          <h2 className="lp-section-title">{t.testimonials.title}</h2>
        </div>
        <div className="lp-test-grid">
          {t.testimonials.items.map((item, i) => <TestimonialCard key={i} idx={i} item={item} />)}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────
function CTA() {
  const t = T.en;
  const ref = useReveal(0);
  return (
    <section className="lp-section">
      <div className="lp-container">
        <div ref={ref} className="lp-cta-wrap lp-reveal">
          <div className="lp-cta-backdrop" aria-hidden="true">
            <svg viewBox="0 0 800 400" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
              <g fill="none" stroke="#C8A24B" strokeWidth="0.8">
                <circle cx="400" cy="200" r="80"/><circle cx="400" cy="200" r="140"/>
                <circle cx="400" cy="200" r="200"/><circle cx="400" cy="200" r="260"/>
                <path d="M400 0 L400 400 M0 200 L800 200"/><path d="M250 50 L550 350 M550 50 L250 350"/>
              </g>
            </svg>
          </div>
          <div className="lp-eyebrow" style={{ marginBottom: 20 }}>{t.cta.eyebrow}</div>
          <h2 className="lp-cta-title">
            {t.cta.title.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
          </h2>
          <p className="lp-cta-sub">{t.cta.sub}</p>
          <div className="lp-cta-row">
            <Link to="/register" className="lp-btn lp-btn-primary" style={{ padding: '15px 28px', fontSize: 15 }}>
              {t.cta.cta1}
            </Link>
            <Link to="/login" className="lp-btn lp-btn-ghost" style={{ padding: '15px 28px', fontSize: 15 }}>
              {t.cta.cta2}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const t = T.en;
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div className="lp-footer-top">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <BrandMark />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                <span style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 600, color: 'var(--cream-warm)' }}>Tahfeez</span>
                <span style={{ fontFamily: 'var(--f-arabic)', fontSize: 13, color: 'var(--gold)', marginTop: 4 }}>تَحْفِيظ</span>
              </div>
            </div>
            <p className="lp-footer-tagline">{t.footer.tagline}</p>
            <div className="lp-footer-barakallahu">{t.footer.barakallahu}</div>
          </div>
          <div className="lp-footer-cols">
            {t.footer.cols.map((col, i) => (
              <div key={i} className="lp-footer-col">
                <h4>{col.h}</h4>
                <ul>
                  {col.links.map((link, j) => <li key={j}><a href="#">{link}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="lp-footer-bottom">
          <div className="lp-footer-copy">{t.footer.copyright}</div>
          <div className="lp-footer-socials">
            {[
              ['YouTube', <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M10 9 L15 12 L10 15 Z" fill="currentColor" stroke="none"/></svg>],
              ['Instagram', <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>],
              ['X', <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4 L11 12 L4 20 M20 4 L13 12 L20 20"/></svg>],
              ['Email', <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7 L12 13 L21 7"/></svg>],
            ].map(([label, icon]) => (
              <a key={label} href="#" aria-label={label}>{icon}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Ornament ─────────────────────────────────────────────────────────────────
function OrnamentDivider() {
  return (
    <div className="lp-ornament" aria-hidden="true">
      <div className="lp-ornament-line" />
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#C8A24B" strokeWidth="1.1">
        <path d="M12 2 L13.5 9 L20 8 L15 12 L20 16 L13.5 15 L12 22 L10.5 15 L4 16 L9 12 L4 8 L10.5 9 Z" strokeLinejoin="round" strokeLinecap="round"/>
        <circle cx="12" cy="12" r="1.2" fill="#C8A24B"/>
      </svg>
      <div className="lp-ornament-line" />
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
const LandingPage = () => {
  const sectionRefs = useRef({});

  const scrollTo = useCallback((id) => {
    const el = sectionRefs.current[id] || document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="landing-page" id="top" style={{ position: 'relative' }}>
      <ParticleField />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Nav scrollTo={scrollTo} />
        <Hero scrollTo={scrollTo} />
        <div style={{ padding: '0' }}><OrnamentDivider /></div>
        <WhyUs />
        <OrnamentDivider />
        <HowItWorks />
        <Stats />
        <OrnamentDivider />
        <Courses />
        <OrnamentDivider />
        <Testimonials />
        <CTA />
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
