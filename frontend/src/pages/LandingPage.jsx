import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './landing.css';
import logoImg from '../assets/logo.png';
import quranHeroImg from '../assets/quran-hero.jpg';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

// ─── Brand mark ──────────────────────────────────────────────────────────────
function BrandMark() {
  return <img src={logoImg} alt="Tahfeez" style={{ width: 32, height: 32, objectFit: 'contain' }} />;
}

// ─── Reveal hook ─────────────────────────────────────────────────────────────
function useReveal(delay = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const timer = setTimeout(() => el.classList.add('lp-in'), 60 + delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return ref;
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
function Nav({ scrollTo }) {
  const { t } = useTranslation();
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
          {[['why', 'landing.nav.why'], ['how', 'landing.nav.how'], ['programs', 'landing.nav.programs'], ['voices', 'landing.nav.voices']].map(([id, key]) => (
            <button key={id} className="lp-nav-link" onClick={() => go(id)}>{t(key)}</button>
          ))}
        </nav>

        <div className="lp-nav-end">
          <LanguageSwitcher className="lp-btn lp-btn-outline lp-nav-hide-mobile" />
          <Link to="/login" className="lp-btn lp-btn-outline lp-nav-hide-mobile" style={{ padding: '9px 16px', fontSize: 13 }}>
            {t('landing.nav.signIn')}
          </Link>
          <Link to="/register" className="lp-btn lp-btn-primary" style={{ padding: '9px 18px', fontSize: 13.5 }}>
            {t('landing.nav.register')}
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ scrollTo }) {
  const { t } = useTranslation();
  const ref = useReveal(0);

  return (
    <section id="hero" className="lp-hero">
      <div className="lp-container">
        <div className="lp-hero-inner">
          <div ref={ref} className="lp-hero-content lp-reveal">
            <div className="lp-eyebrow">{t('landing.hero.eyebrow')}</div>
            <h1 className="lp-hero-title">
              <span>{t('landing.hero.title1')}</span>
              <span className="lp-gold">{t('landing.hero.title2')}</span>
            </h1>
            <p className="lp-hero-sub">{t('landing.hero.sub')}</p>
            <div className="lp-hero-actions">
              <Link to="/register" className="lp-btn lp-btn-primary" style={{ padding: '14px 26px', fontSize: 15 }}>
                {t('landing.hero.cta1')}
              </Link>
              <button className="lp-btn lp-btn-ghost" style={{ padding: '14px 26px', fontSize: 15 }} onClick={() => scrollTo && scrollTo('how')}>
                {t('landing.nav.how')}
              </button>
            </div>
            <div className="lp-hero-trust">
              <div className="lp-trust-avatars">
                {['Y', 'A', 'M', 'H'].map((l, i) => (
                  <div key={i} className="lp-trust-avatar" style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i }}>{l}</div>
                ))}
              </div>
              <p className="lp-trust-text">{t('landing.hero.trust')}</p>
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
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3 L20 7 L25 7 L25 12 L29 16 L25 20 L25 25 L20 25 L16 29 L12 25 L7 25 L7 20 L3 16 L7 12 L7 7 L12 7 Z"/><path d="M11 16 L14.5 19.5 L21 13"/></svg>,
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="12" r="3.5"/><path d="M5 24 C5 19 7.5 17 10 17 C12.5 17 15 19 15 24"/><circle cx="22" cy="12" r="3.5"/><path d="M17 24 C17 19 19.5 17 22 17 C24.5 17 27 19 27 24"/></svg>,
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="6" width="24" height="22" rx="2"/><path d="M4 12 L28 12 M10 3 L10 9 M22 3 L22 9"/><circle cx="11" cy="18" r="1.2" fill="currentColor"/><circle cx="16" cy="18" r="1.2" fill="currentColor"/><circle cx="21" cy="18" r="1.2" fill="currentColor"/></svg>,
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6 L4 26 L16 24 L28 26 L28 6 L16 8 Z"/><path d="M16 8 L16 24"/><path d="M8 13 L12 13 M8 17 L12 17 M20 13 L24 13 M20 17 L24 17"/></svg>,
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 16 L6 16 L8 8 L11 24 L14 11 L17 21 L20 6 L23 26 L26 14 L29 16"/></svg>,
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
  const { t } = useTranslation();
  const ref = useReveal(0);
  const items = Array.from({ length: 6 }, (_, i) => ({
    t: t(`landing.why.item${i}.t`),
    d: t(`landing.why.item${i}.d`),
  }));
  return (
    <section id="why" className="lp-section">
      <div className="lp-container">
        <div ref={ref} className="lp-sec-header lp-reveal">
          <div className="lp-eyebrow" style={{ marginBottom: 14 }}>{t('landing.why.eyebrow')}</div>
          <h2 className="lp-section-title">{t('landing.why.title')}</h2>
          <p className="lp-section-sub">{t('landing.why.sub')}</p>
        </div>
        <div className="lp-why-grid">
          {items.map((item, i) => <WhyCard key={i} idx={i} item={item} />)}
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
  const { t } = useTranslation();
  const ref = useReveal(0);
  const steps = Array.from({ length: 4 }, (_, i) => ({
    t: t(`landing.how.step${i}.t`),
    d: t(`landing.how.step${i}.d`),
  }));
  return (
    <section id="how" className="lp-section">
      <div className="lp-container">
        <div ref={ref} className="lp-sec-header lp-reveal">
          <div className="lp-eyebrow" style={{ marginBottom: 14 }}>{t('landing.how.eyebrow')}</div>
          <h2 className="lp-section-title">{t('landing.how.title')}</h2>
          <p className="lp-section-sub">{t('landing.how.sub')}</p>
        </div>
        <div className="lp-how-grid">
          {steps.map((step, i) => <HowStep key={i} idx={i} step={step} />)}
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
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const ref = useReveal(0);

  useEffect(() => {
    axios.get(`${API_BASE}/reports/public/stats`)
      .then((r) => setStats(r.data.data.stats))
      .catch(() => setStats({ total_students: 0, total_teachers: 0, total_sessions: 0, countries: 0 }));
  }, []);

  const statItems = [
    { n: stats?.total_students || 0, suffix: '+', label: t('landing.stats.students') },
    { n: stats?.total_teachers || 0, suffix: '',  label: t('landing.stats.teachers') },
    { n: stats?.total_sessions || 0, suffix: '+', label: t('landing.stats.sessions') },
    { n: stats?.countries      || 0, suffix: '',  label: t('landing.stats.countries') },
  ];

  return (
    <section id="stats" className="lp-section">
      <div className="lp-container">
        <div ref={ref} className="lp-stats-wrap lp-reveal">
          <div className="lp-stats-head">
            <div className="lp-eyebrow" style={{ marginBottom: 14 }}>{t('landing.stats.eyebrow')}</div>
            <h2 className="lp-section-title">{t('landing.stats.title')}</h2>
            <p className="lp-section-sub">{t('landing.stats.sub')}</p>
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
  const { t } = useTranslation();
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
          {t('landing.courses.enroll')}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </Link>
      </div>
    </div>
  );
}

function Courses() {
  const { t } = useTranslation();
  const ref = useReveal(0);
  const items = Array.from({ length: 5 }, (_, i) => ({
    t:     t(`landing.courses.item${i}.t`),
    d:     t(`landing.courses.item${i}.d`),
    level: t(`landing.courses.item${i}.l`),
  }));
  return (
    <section id="programs" className="lp-section">
      <div className="lp-container">
        <div ref={ref} className="lp-sec-header lp-reveal">
          <div className="lp-eyebrow" style={{ marginBottom: 14 }}>{t('landing.courses.eyebrow')}</div>
          <h2 className="lp-section-title">{t('landing.courses.title')}</h2>
          <p className="lp-section-sub">{t('landing.courses.sub')}</p>
        </div>
        <div className="lp-courses-grid">
          {items.map((item, i) => <CourseCard key={i} idx={i} item={item} />)}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialCard({ idx, item }) {
  const ref = useReveal(idx * 80);
  const initial = item.n.replace(/[^A-Za-z؀-ۿ]/g, '').slice(0, 1) || 'م';
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
  const { t } = useTranslation();
  const ref = useReveal(0);
  const items = Array.from({ length: 4 }, (_, i) => ({
    q: t(`landing.testimonials.item${i}.q`),
    n: t(`landing.testimonials.item${i}.n`),
    r: t(`landing.testimonials.item${i}.r`),
  }));
  return (
    <section id="voices" className="lp-section">
      <div className="lp-container">
        <div ref={ref} className="lp-sec-header lp-reveal">
          <div className="lp-eyebrow" style={{ marginBottom: 14 }}>{t('landing.testimonials.eyebrow')}</div>
          <h2 className="lp-section-title">{t('landing.testimonials.title')}</h2>
        </div>
        <div className="lp-test-grid">
          {items.map((item, i) => <TestimonialCard key={i} idx={i} item={item} />)}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────
function CTA() {
  const { t } = useTranslation();
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
          <div className="lp-eyebrow" style={{ marginBottom: 20 }}>{t('landing.cta.eyebrow')}</div>
          <h2 className="lp-cta-title">
            {t('landing.cta.title').split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
          </h2>
          <p className="lp-cta-sub">{t('landing.cta.sub')}</p>
          <div className="lp-cta-row">
            <Link to="/register" className="lp-btn lp-btn-primary" style={{ padding: '15px 28px', fontSize: 15 }}>
              {t('landing.cta.cta1')}
            </Link>
            <Link to="/login" className="lp-btn lp-btn-ghost" style={{ padding: '15px 28px', fontSize: 15 }}>
              {t('landing.cta.cta2')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const { t } = useTranslation();
  const cols = [
    { h: t('landing.footer.col0.h'), links: [t('landing.footer.col0.l0'), t('landing.footer.col0.l1'), t('landing.footer.col0.l2'), t('landing.footer.col0.l3'), t('landing.footer.col0.l4')] },
    { h: t('landing.footer.col1.h'), links: [t('landing.footer.col1.l0'), t('landing.footer.col1.l1'), t('landing.footer.col1.l2'), t('landing.footer.col1.l3')] },
    { h: t('landing.footer.col2.h'), links: [t('landing.footer.col2.l0'), t('landing.footer.col2.l1'), t('landing.footer.col2.l2')] },
  ];
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
            <p className="lp-footer-tagline">{t('landing.footer.tagline')}</p>
            <div className="lp-footer-barakallahu">{t('landing.footer.barakallahu')}</div>
          </div>
          <div className="lp-footer-cols">
            {cols.map((col, i) => (
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
          <div className="lp-footer-copy">{t('landing.footer.copyright', { year: new Date().getFullYear() })}</div>
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
