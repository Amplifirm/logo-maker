import { useRef, useEffect, useState, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

/* ─── images ───────────────────────────────────────────────── */

const LOGO = 'https://www.connorsllp.com/wp-content/uploads/2024/07/connors-llp-logo.png';
const LIBERTY = 'https://www.mainliberty.com/templates/custom/mainplaceliberty/images/liberty-building/Liberty.jpg';
const IMG_OFFICE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80';
const IMG_LEGAL = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1400&q=80';
const IMG_COLUMNS = 'https://images.unsplash.com/photo-1564596823821-79b97151055e?auto=format&fit=crop&w=1400&q=80';
const IMG_HANDSHAKE = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=80';
const IMG_LIBRARY = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1400&q=80';
const IMG_CITY = 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=1400&q=80';

/* ─── primitives ───────────────────────────────────────────── */

function FadeUp({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const v = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={v ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

function Count({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef(null);
  const v = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!v) return;
    let s = 0;
    const tick = (t: number) => { if (!s) s = t; const p = Math.min((t - s) / 2000, 1); setN(Math.floor((1 - Math.pow(1 - p, 4)) * to)); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, [v, to]);
  return <span ref={ref}>{prefix}{n}{suffix}</span>;
}

function Magnetic({ children, className = '' }: { children: ReactNode; className?: string }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18 }), sy = useSpring(y, { stiffness: 200, damping: 18 });
  const ref = useRef<HTMLDivElement>(null);
  return (
    <motion.div ref={ref} style={{ x: sx, y: sy }}
      onMouseMove={(e) => { const r = ref.current?.getBoundingClientRect(); if (!r) return; x.set((e.clientX - r.left - r.width / 2) * 0.12); y.set((e.clientY - r.top - r.height / 2) * 0.12); }}
      onMouseLeave={() => { x.set(0); y.set(0); }} className={className}>{children}</motion.div>
  );
}

function ParallaxImg({ src, alt = '', className = '', speed = 40 }: { src: string; alt?: string; className?: string; speed?: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-speed, speed]);
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.img style={{ y }} src={src} alt={alt} className="w-full h-[120%] -mt-[10%] object-cover" />
    </div>
  );
}

function RevealLine({ text, delay = 0, className = '' }: { text: string; delay?: number; className?: string }) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span className="block" initial={{ y: '115%' }} animate={{ y: '0%' }}
        transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}>{text}</motion.span>
    </span>
  );
}

/* ═══════════════════ NAVBAR ══════════════════════════════ */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navLinks = ['About', 'Practice', 'Results', 'Contact'];

  return (
    <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ${scrolled ? 'bg-white/95 backdrop-blur-lg shadow-[0_1px_0_rgba(0,0,0,0.04)]' : ''}`}>
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12 flex items-center justify-between h-[72px]">
        <a href="#" className="relative z-10">
          <img src={LOGO} alt="Connors LLP" className={`h-[22px] w-auto transition-all duration-500 ${scrolled ? '' : 'brightness-0 invert'}`} />
        </a>
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((l, i) => (
            <motion.a key={l} href={`#${l.toLowerCase()}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.04 }}
              className={`text-[12px] font-medium tracking-[0.02em] transition-colors ${scrolled ? 'text-[#1e3456]/50 hover:text-[#1e3456]' : 'text-white/50 hover:text-white'}`}>{l}</motion.a>
          ))}
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Magnetic>
              <a href="#contact" className={`text-[11px] font-semibold tracking-[0.04em] uppercase px-5 py-2.5 transition-all ${scrolled ? 'bg-[#1e3456] text-white hover:bg-[#162a44]' : 'bg-white text-[#1e3456] hover:bg-white/90'}`}>Get in Touch</a>
            </Magnetic>
          </motion.div>
        </div>
        <button onClick={() => setOpen(!open)} className="lg:hidden relative z-10 p-1">
          <div className="flex flex-col gap-[5px]">
            <motion.span animate={open ? { rotate: 45, y: 6.5 } : {}} className={`block w-5 h-[1.5px] transition-colors ${scrolled || open ? 'bg-[#1e3456]' : 'bg-white'}`} />
            <motion.span animate={{ opacity: open ? 0 : 1 }} className={`block w-5 h-[1.5px] transition-colors ${scrolled || open ? 'bg-[#1e3456]' : 'bg-white'}`} />
            <motion.span animate={open ? { rotate: -45, y: -6.5 } : {}} className={`block w-5 h-[1.5px] transition-colors ${scrolled || open ? 'bg-[#1e3456]' : 'bg-white'}`} />
          </div>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="lg:hidden bg-white overflow-hidden">
            <div className="px-8 py-8 space-y-5">
              {navLinks.map((l) => (<a key={l} href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)} className="block font-serif text-lg text-[#1e3456]/60 hover:text-[#1e3456] transition-colors">{l}</a>))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/* ═══════════════════ HERO ════════════════════════════════ */

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const textOp = useTransform(scrollYProgress, [0, 0.45], [1, 0]);

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[700px] overflow-hidden bg-[#0d1b2e]">
      {/* image */}
      <motion.div style={{ scale }} className="absolute inset-0">
        <img src={LIBERTY} alt="Liberty Building" className="w-full h-full object-cover" />
      </motion.div>
      {/* gradient overlay — lighter top, darker bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b2e]/30 via-[#0d1b2e]/40 to-[#0d1b2e]/80" />

      {/* content pinned to bottom-left */}
      <motion.div style={{ y: textY, opacity: textOp }} className="relative z-10 h-full flex flex-col justify-end">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12 w-full pb-16 lg:pb-20">
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-10 h-[2px] bg-[#4d9a3d] origin-left mb-8"
          />

          <h1 className="font-serif font-light text-white text-[clamp(3rem,7vw,6rem)] leading-[0.93] tracking-[-0.02em]">
            <RevealLine text="When Everything" delay={0.3} />
            <span className="block overflow-hidden">
              <motion.span className="block" initial={{ y: '115%' }} animate={{ y: '0%' }}
                transition={{ duration: 1, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                Is On <em className="italic text-[#6db85a]">The Line</em>
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            className="font-sans text-[15px] font-light text-white/55 max-w-md leading-[1.75] mt-8"
          >
            A premier litigation firm in Buffalo, NY. Tenacious advocacy, adaptable strategy, and the resolve to fight for what matters most.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="mt-8"
          >
            <Magnetic>
              <a href="#contact" className="inline-block font-sans text-[11px] font-semibold tracking-[0.06em] uppercase border border-white/25 text-white px-7 py-3.5 hover:bg-white hover:text-[#1e3456] transition-all duration-300">
                Get in Touch
              </a>
            </Magnetic>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════ MARQUEE ════════════════════════════ */

function Marquee() {
  const words = ['Tenacious', 'Strategic', 'Relentless', 'Proven', 'Dedicated', 'Fearless', 'Principled', 'Resolute'];

  return (
    <div className="py-6 overflow-hidden border-b border-[#1e3456]/[0.06]">
      <div className="flex animate-marquee whitespace-nowrap">
        {[0, 1].map((j) => (
          <div key={j} className="flex items-center shrink-0">
            {words.map((w, i) => (
              <span key={`${j}-${i}`} className="flex items-center">
                <span className="font-serif text-[1.5rem] lg:text-[2rem] text-[#1e3456]/[0.07] tracking-[0.02em] mx-6 lg:mx-10 select-none">{w}</span>
                <span className="text-[#4d9a3d]/15 text-[6px]">&#9670;</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════ ABOUT ══════════════════════════════ */

function About() {
  return (
    <section id="about" className="py-28 lg:py-40">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12">

        {/* big serif statement */}
        <div className="max-w-4xl mb-20 lg:mb-28">
          <FadeUp>
            <p className="font-sans text-[10px] font-semibold tracking-[0.25em] uppercase text-[#4d9a3d] mb-6">The Firm</p>
          </FadeUp>
          <FadeUp delay={0.05}>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] font-light text-[#1e3456] leading-[1.15]">
              Founded in 1986, Connors LLP has built a reputation as one of Western New York's most formidable litigation practices &mdash; representing clients in cases that <em className="text-[#4d9a3d]/70 not-italic">define lives</em> and <em className="text-[#4d9a3d]/70 not-italic">shape futures.</em>
            </h2>
          </FadeUp>
        </div>

        {/* content grid: two images + text */}
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* tall image left */}
          <div className="lg:col-span-4">
            <FadeUp>
              <ParallaxImg src={LIBERTY} alt="Liberty Building" className="h-[420px] lg:h-[560px]" speed={30} />
              <p className="font-serif text-[13px] italic text-[#1e3456]/40 mt-3">Liberty Building &mdash; Our home since 1986</p>
            </FadeUp>
          </div>

          {/* text + stats center */}
          <div className="lg:col-span-4 flex flex-col justify-center lg:px-4">
            <FadeUp delay={0.08}>
              <p className="font-sans text-[14px] font-light text-[#1e3456]/55 leading-[1.85]">
                Our approach is never one-size-fits-all. We bring decades of trial and appellate expertise across state, federal, and administrative forums — crafting strategies as unique as the cases we take on.
              </p>
            </FadeUp>
            <FadeUp delay={0.14}>
              <p className="font-sans text-[14px] font-light text-[#1e3456]/55 leading-[1.85] mt-5">
                From bet-the-company business disputes to catastrophic personal injury cases, our team delivers when no one else can.
              </p>
            </FadeUp>
            <FadeUp delay={0.18}>
              <div className="grid grid-cols-2 gap-8 mt-10 pt-10 border-t border-[#1e3456]/[0.08]">
                <div>
                  <p className="font-serif text-[2.4rem] font-light text-[#1e3456]"><Count to={35} suffix="+" /></p>
                  <p className="font-sans text-[9px] tracking-[0.15em] uppercase text-[#1e3456]/40 font-semibold mt-1">Years of Practice</p>
                </div>
                <div>
                  <p className="font-serif text-[2.4rem] font-light text-[#1e3456]">$<Count to={500} suffix="M+" /></p>
                  <p className="font-sans text-[9px] tracking-[0.15em] uppercase text-[#1e3456]/40 font-semibold mt-1">Recovered</p>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* second image right */}
          <div className="lg:col-span-4 lg:pt-20">
            <FadeUp delay={0.1}>
              <ParallaxImg src={IMG_OFFICE} alt="Modern legal office" className="h-[350px] lg:h-[480px]" speed={25} />
            </FadeUp>
          </div>
        </div>

        {/* accolades */}
        <FadeUp delay={0.2}>
          <div className="mt-16 pt-10 border-t border-[#1e3456]/[0.06] flex flex-wrap items-center gap-x-10 gap-y-3">
            <p className="font-sans text-[9px] tracking-[0.15em] uppercase text-[#1e3456]/35 font-semibold">Recognized by:</p>
            {['Super Lawyers', 'Best Law Firms', 'Million Dollar Advocates Forum', 'Martindale-Hubbell AV'].map((b) => (
              <p key={b} className="font-sans text-[10px] tracking-[0.05em] text-[#1e3456]/40 font-medium">{b}</p>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ═══════════════════ PRACTICE AREAS ═════════════════════ */

function Practice() {
  const [active, setActive] = useState<number | null>(null);

  const areas = [
    { title: 'Personal Injury', desc: 'Catastrophic injuries, vehicle accidents, construction incidents, trucking collisions, workplace injuries, and wrongful death claims.', img: IMG_LEGAL },
    { title: 'Business Litigation', desc: 'High-stakes, bet-the-company disputes. We craft tailored strategies to protect your interests at every stage.', img: IMG_HANDSHAKE },
    { title: 'White Collar Defense', desc: 'Federal investigations, complex criminal matters, trials, and appeals — handled with precision and absolute discretion.', img: IMG_COLUMNS },
    { title: 'Professional Representation', desc: 'Dedicated counsel for attorneys, judges, physicians, and healthcare facilities facing professional challenges.', img: IMG_LIBRARY },
    { title: 'Civil Litigation', desc: 'Comprehensive litigation services across state, federal, and administrative forums throughout New York and beyond.', img: IMG_OFFICE },
    { title: 'Appeals', desc: 'Skilled appellate advocacy protecting trial victories and pursuing reversals of unfavorable decisions.', img: IMG_LEGAL },
  ];

  return (
    <section id="practice" className="py-28 lg:py-40 bg-[#f7f8fa]">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          {/* sticky left */}
          <div className="lg:col-span-5 mb-12 lg:mb-0">
            <div className="lg:sticky lg:top-28">
              <FadeUp>
                <p className="font-sans text-[10px] font-semibold tracking-[0.25em] uppercase text-[#4d9a3d] mb-5">Practice Areas</p>
              </FadeUp>
              <FadeUp delay={0.05}>
                <h2 className="font-serif text-[clamp(2.2rem,4vw,3rem)] font-light text-[#1e3456] leading-[1.1]">
                  Deep expertise<br />where it <em className="text-[#4d9a3d]/70 italic">matters</em>
                </h2>
              </FadeUp>
              <FadeUp delay={0.1}>
                <p className="font-sans text-[13px] text-[#1e3456]/50 font-light leading-relaxed mt-5 max-w-xs">
                  Every case is different. We build strategies from the ground up, tailored to your unique circumstances.
                </p>
              </FadeUp>

              {/* preview image */}
              <FadeUp delay={0.15}>
                <div className="mt-10 h-[240px] lg:h-[300px] overflow-hidden relative hidden lg:block">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={active ?? -1}
                      src={active !== null ? areas[active].img : IMG_COLUMNS}
                      alt=""
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-[#1e3456]/10" />
                </div>
              </FadeUp>
            </div>
          </div>

          {/* list right */}
          <div className="lg:col-span-7 border-t border-[#1e3456]/[0.06]">
            {areas.map((a, i) => (
              <FadeUp key={a.title} delay={i * 0.03}>
                <div
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  className="border-b border-[#1e3456]/[0.06] group cursor-pointer"
                >
                  <div className="py-6 lg:py-7 flex items-start gap-5">
                    <span className="font-sans text-[10px] text-[#4d9a3d]/45 font-semibold pt-2 shrink-0 w-5">{String(i + 1).padStart(2, '0')}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-[#1e3456]/65 text-[clamp(1.15rem,1.8vw,1.45rem)] font-medium group-hover:text-[#1e3456] transition-colors duration-300">
                        {a.title}
                      </h3>
                      <AnimatePresence>
                        {active === i && (
                          <motion.p initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: 8 }} exit={{ height: 0, opacity: 0, marginTop: 0 }} transition={{ duration: 0.25 }}
                            className="font-sans text-[13px] text-[#1e3456]/45 font-light leading-relaxed max-w-md overflow-hidden">
                            {a.desc}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <svg className="w-4 h-4 text-[#1e3456]/[0.12] group-hover:text-[#4d9a3d] group-hover:translate-x-0.5 transition-all duration-300 shrink-0 mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════ BIG QUOTE BREAK ════════════════════ */

function QuoteBreak() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div className="grid lg:grid-cols-2 min-h-[500px] lg:min-h-[600px]">
        {/* image left */}
        <div className="relative h-[300px] lg:h-auto overflow-hidden">
          <motion.img style={{ y }} src={IMG_COLUMNS} alt="Courthouse" className="absolute inset-0 w-full h-[130%] -top-[15%] object-cover" />
          <div className="absolute inset-0 bg-[#1e3456]/20" />
        </div>

        {/* quote right */}
        <div className="bg-[#1e3456] flex items-center px-8 lg:px-16 py-16 lg:py-24">
          <div>
            <FadeUp>
              <p className="font-serif text-[5rem] lg:text-[7rem] leading-none text-[#4d9a3d]/20 -mb-8 lg:-mb-12">&ldquo;</p>
            </FadeUp>
            <FadeUp delay={0.05}>
              <blockquote className="font-serif text-[clamp(1.2rem,2vw,1.6rem)] font-light text-white/75 leading-[1.6] italic max-w-lg">
                Connors LLP demonstrated an extraordinary level of dedication and legal acumen. Their tenacity and strategic thinking were pivotal in securing a result that exceeded all expectations.
              </blockquote>
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="mt-8 flex items-center gap-3">
                <div className="w-8 h-[1px] bg-[#4d9a3d]/40" />
                <p className="font-sans text-[10px] tracking-[0.12em] uppercase font-medium text-white/35">Former Client &mdash; Business Litigation</p>
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════ RESULTS ════════════════════════════ */

function Results() {
  const results = [
    { amount: '$47.5M', label: 'Medical Malpractice', type: 'Verdict' },
    { amount: '$28.3M', label: 'Construction Accident', type: 'Settlement' },
    { amount: '$19.8M', label: 'Trucking Accident', type: 'Verdict' },
    { amount: '$15.2M', label: 'Wrongful Death', type: 'Settlement' },
  ];

  return (
    <section id="results" className="py-28 lg:py-40">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-start">
          {/* left heading */}
          <div className="lg:col-span-4 mb-14 lg:mb-0">
            <FadeUp>
              <p className="font-sans text-[10px] font-semibold tracking-[0.25em] uppercase text-[#4d9a3d] mb-5">Track Record</p>
            </FadeUp>
            <FadeUp delay={0.05}>
              <h2 className="font-serif text-[clamp(2.2rem,4vw,3rem)] font-light text-[#1e3456] leading-[1.1]">
                Results that<br /><em className="text-[#4d9a3d]/70 italic">speak volumes</em>
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="font-sans text-[13px] text-[#1e3456]/50 font-light leading-relaxed mt-5 max-w-xs">
                Our verdicts and settlements reflect decades of relentless, strategic advocacy.
              </p>
            </FadeUp>
            <FadeUp delay={0.14}>
              <ParallaxImg src={IMG_LEGAL} alt="Legal scales" className="h-[200px] mt-10 hidden lg:block" speed={20} />
            </FadeUp>
          </div>

          {/* results grid */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 gap-px bg-[#1e3456]/[0.04]">
              {results.map((r, i) => (
                <FadeUp key={i} delay={i * 0.06}>
                  <div className="bg-white p-8 lg:p-10 group hover:bg-[#f7f8fa] transition-colors duration-300 h-full">
                    <p className="font-sans text-[9px] font-semibold tracking-[0.18em] uppercase text-[#4d9a3d]/55 mb-4">{r.type}</p>
                    <p className="font-serif text-[clamp(2rem,3vw,2.8rem)] font-light text-[#1e3456]">{r.amount}</p>
                    <p className="font-serif text-[14px] text-[#1e3456]/45 italic mt-2">{r.label}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
            <FadeUp delay={0.3}>
              <p className="font-sans text-[10px] text-[#1e3456]/30 mt-6">Prior results do not guarantee a similar outcome.</p>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════ IMAGE BREAK ════════════════════════ */

function ImageBreak() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  return (
    <section ref={ref} className="relative h-[45vh] min-h-[350px] overflow-hidden">
      <motion.img style={{ y }} src={IMG_LIBRARY} alt="Law library" className="absolute inset-0 w-full h-[130%] -top-[15%] object-cover" />
      <div className="absolute inset-0 bg-[#0d1b2e]/55" />
      <div className="relative z-10 h-full flex items-center justify-center px-8">
        <FadeUp>
          <p className="font-serif text-[clamp(1.4rem,3vw,2.2rem)] font-light text-white/85 italic text-center max-w-2xl leading-[1.5]">
            We strive to make it happen when no one else can.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

/* ═══════════════════ CONTACT ════════════════════════════ */

function Contact() {
  return (
    <section id="contact" className="py-28 lg:py-40">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">

          {/* image + info left */}
          <div className="lg:col-span-5 mb-12 lg:mb-0">
            <FadeUp>
              <ParallaxImg src={IMG_CITY} alt="City at night" className="h-[250px] lg:h-[320px] mb-10" speed={20} />
            </FadeUp>

            <FadeUp delay={0.05}>
              <p className="font-sans text-[10px] font-semibold tracking-[0.25em] uppercase text-[#4d9a3d] mb-5">Contact</p>
            </FadeUp>
            <FadeUp delay={0.08}>
              <h2 className="font-serif text-[clamp(2.2rem,4vw,3rem)] font-light text-[#1e3456] leading-[1.1]">
                Talk to us <em className="text-[#4d9a3d]/70 italic">today</em>
              </h2>
            </FadeUp>

            <FadeUp delay={0.12}>
              <div className="mt-10 space-y-7">
                <div>
                  <p className="font-sans text-[9px] font-semibold tracking-[0.2em] uppercase text-[#1e3456]/35 mb-1.5">Address</p>
                  <p className="font-serif text-[16px] text-[#1e3456]/65 leading-relaxed">1000 Liberty Building<br />424 Main Street, Buffalo, NY 14202</p>
                </div>
                <div>
                  <p className="font-sans text-[9px] font-semibold tracking-[0.2em] uppercase text-[#1e3456]/35 mb-1.5">Phone</p>
                  <a href="tel:716-852-5533" className="font-serif text-[16px] text-[#1e3456]/65 hover:text-[#4d9a3d] transition-colors">(716) 852-5533</a>
                </div>
                <div>
                  <p className="font-sans text-[9px] font-semibold tracking-[0.2em] uppercase text-[#1e3456]/35 mb-1.5">Email</p>
                  <p className="font-serif text-[16px] text-[#1e3456]/65">info@connorsllp.com</p>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* form right */}
          <div className="lg:col-span-6 lg:col-start-7">
            <FadeUp delay={0.06}>
              <form onSubmit={(e) => e.preventDefault()} className="bg-[#f7f8fa] p-8 lg:p-12">
                <p className="font-serif text-[1.35rem] text-[#1e3456] mb-8">Request a Consultation</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="First name" className="font-sans w-full bg-white border border-[#1e3456]/[0.08] px-4 py-3.5 text-[13px] text-[#1e3456]/70 placeholder:text-[#1e3456]/30 focus:outline-none focus:border-[#4d9a3d]/30 transition-colors" />
                    <input type="text" placeholder="Last name" className="font-sans w-full bg-white border border-[#1e3456]/[0.08] px-4 py-3.5 text-[13px] text-[#1e3456]/70 placeholder:text-[#1e3456]/30 focus:outline-none focus:border-[#4d9a3d]/30 transition-colors" />
                  </div>
                  <input type="email" placeholder="Email" className="font-sans w-full bg-white border border-[#1e3456]/[0.08] px-4 py-3.5 text-[13px] text-[#1e3456]/70 placeholder:text-[#1e3456]/30 focus:outline-none focus:border-[#4d9a3d]/30 transition-colors" />
                  <input type="tel" placeholder="Phone" className="font-sans w-full bg-white border border-[#1e3456]/[0.08] px-4 py-3.5 text-[13px] text-[#1e3456]/70 placeholder:text-[#1e3456]/30 focus:outline-none focus:border-[#4d9a3d]/30 transition-colors" />
                  <textarea rows={4} placeholder="Tell us about your case..." className="font-sans w-full bg-white border border-[#1e3456]/[0.08] px-4 py-3.5 text-[13px] text-[#1e3456]/70 placeholder:text-[#1e3456]/30 focus:outline-none focus:border-[#4d9a3d]/30 transition-colors resize-none" />
                </div>
                <Magnetic className="mt-6">
                  <button type="submit" className="font-sans text-[11px] font-semibold tracking-[0.05em] uppercase w-full bg-[#1e3456] text-white py-4 hover:bg-[#162a44] transition-colors">
                    Send Message
                  </button>
                </Magnetic>
                <p className="font-sans text-[9px] text-[#1e3456]/30 text-center mt-4">Confidential. Does not create an attorney-client relationship.</p>
              </form>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════ FOOTER ═════════════════════════════ */

function Footer() {
  return (
    <footer className="bg-[#0d1b2e]">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
        {/* top band */}
        <div className="py-16 lg:py-20 grid lg:grid-cols-2 gap-10 items-center border-b border-white/[0.06]">
          <div>
            <img src={LOGO} alt="Connors LLP" className="h-[20px] w-auto brightness-0 invert opacity-50 mb-6" />
            <p className="font-serif text-white/40 text-[17px] italic leading-relaxed max-w-sm">
              When everything is on the line, we make it happen.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4 lg:justify-end">
            <div>
              <p className="font-sans text-[9px] font-semibold tracking-[0.15em] uppercase text-white/20 mb-3">Navigate</p>
              <div className="space-y-2">
                {['About', 'Practice', 'Results', 'Contact'].map((l) => (
                  <a key={l} href={`#${l.toLowerCase()}`} className="block font-sans text-[12px] text-white/35 hover:text-white/60 transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="font-sans text-[9px] font-semibold tracking-[0.15em] uppercase text-white/20 mb-3">Location</p>
              <p className="font-sans text-[12px] text-white/35 leading-relaxed">1000 Liberty Building<br />424 Main Street<br />Buffalo, NY 14202</p>
            </div>
            <div>
              <p className="font-sans text-[9px] font-semibold tracking-[0.15em] uppercase text-white/20 mb-3">Contact</p>
              <p className="font-sans text-[12px] text-white/35 leading-relaxed">(716) 852-5533<br />info@connorsllp.com</p>
            </div>
          </div>
        </div>

        {/* bottom */}
        <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="font-sans text-[9px] text-white/20">&copy; {new Date().getFullYear()} Connors LLP. All rights reserved.</p>
          <div className="flex gap-5">
            <span className="font-sans text-[9px] text-white/20 cursor-pointer hover:text-white/40 transition-colors">Privacy Policy</span>
            <span className="font-sans text-[9px] text-white/20 cursor-pointer hover:text-white/40 transition-colors">Disclaimer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════ PAGE ═══════════════════════════════ */

export default function ConnorsHome() {
  return (
    <div className="bg-white">
      <Navbar />
      <Hero />
      <Marquee />
      <About />
      <Practice />
      <QuoteBreak />
      <Results />
      <ImageBreak />
      <Contact />
      <Footer />
    </div>
  );
}
