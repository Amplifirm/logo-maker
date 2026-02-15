import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const FEATURES = [
  {
    icon: "✦",
    title: "AI-Powered Design",
    desc: "Describe what you want and the AI builds it for you — low-poly art, pixel logos, geometric patterns.",
  },
  {
    icon: "⬡",
    title: "5 Grid Types",
    desc: "Square, triangle, right-triangle, diamond and hex grids — each with its own tiling and design strengths.",
  },
  {
    icon: "↗",
    title: "Export Anywhere",
    desc: "PNG at any size, SVG, or shareable URL. Transparent backgrounds. Ready for print or web.",
  },
];

const GRIDS: { icon: string; label: string }[] = [
  { icon: "△", label: "Triangle" },
  { icon: "◿", label: "Right Tri" },
  { icon: "□", label: "Square" },
  { icon: "◇", label: "Diamond" },
  { icon: "⬡", label: "Hexagon" },
];

const KEYS = [
  { key: "P", label: "Paint" },
  { key: "E", label: "Erase" },
  { key: "S", label: "Select" },
  { key: "G", label: "Fill" },
  { key: "L", label: "Line" },
  { key: "⌘K", label: "Commands" },
];

export default function Home() {
  const nav = useNavigate();
  const [vis, setVis] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);

  const fade = (d: number) =>
    ({
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(20px)",
      transition: `all 0.6s cubic-bezier(0.22,1,0.36,1) ${d}s`,
    }) as React.CSSProperties;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e8e8f0", overflowX: "hidden" }}>
      {/* ── Hero ── */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "4rem 2rem 2rem", textAlign: "center" }}>
        <img
          src="/logopaint (2).svg"
          alt="LogoPainter"
          style={{ width: 72, height: 86, marginBottom: 28, ...fade(0.1) }}
        />
        <h1 style={{
          fontFamily: "'Anonymous Pro', monospace",
          fontSize: "clamp(2.2rem, 6vw, 4rem)",
          fontWeight: 700,
          color: "#fff",
          margin: 0,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          ...fade(0.15),
        }}>
          Logo<span style={{ color: "#00b9ff" }}>Painter</span>
        </h1>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
          color: "#888899",
          marginTop: 16,
          marginBottom: 0,
          maxWidth: 480,
          lineHeight: 1.65,
          ...fade(0.25),
        }}>
          Design geometric mosaic logos on five different grids — with an AI assistant that builds alongside you.
        </p>
        <button
          onClick={() => nav("/create")}
          style={{
            fontFamily: "'Anonymous Pro', monospace",
            fontSize: "1rem",
            fontWeight: 700,
            color: "#0a0a0f",
            background: "#00b9ff",
            border: "none",
            borderRadius: 10,
            padding: "15px 44px",
            cursor: "pointer",
            marginTop: 40,
            letterSpacing: "0.02em",
            transition: "all 0.2s ease",
            ...fade(0.35),
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#33ccff"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,185,255,0.25)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#00b9ff"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          Start Creating
        </button>
      </section>

      {/* ── Features ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 2rem 4rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            style={{
              background: "#12121a",
              border: "1px solid #1e1e2e",
              borderRadius: 14,
              padding: "28px 24px",
              ...fade(0.4 + i * 0.08),
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 12, opacity: 0.7 }}>{f.icon}</div>
            <h3 style={{ fontFamily: "'Anonymous Pro', monospace", fontSize: "1.05rem", fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>{f.title}</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.88rem", color: "#777788", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── Grid Showcase ── */}
      <section style={{ maxWidth: 600, margin: "0 auto", padding: "1rem 2rem 3rem", textAlign: "center", ...fade(0.6) }}>
        <h2 style={{ fontFamily: "'Anonymous Pro', monospace", fontSize: "0.75rem", fontWeight: 700, color: "#555566", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 20 }}>
          Grid Types
        </h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          {GRIDS.map(g => (
            <div key={g.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "#1a1a28", border: "1px solid #2a2a3a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#00b9ff" }}>
                {g.icon}
              </div>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", color: "#666677" }}>{g.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Keyboard Shortcuts ── */}
      <section style={{ maxWidth: 600, margin: "0 auto", padding: "1rem 2rem 4rem", textAlign: "center", ...fade(0.7) }}>
        <h2 style={{ fontFamily: "'Anonymous Pro', monospace", fontSize: "0.75rem", fontWeight: 700, color: "#555566", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>
          Shortcuts
        </h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          {KEYS.map(k => (
            <div key={k.key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "#12121a", border: "1px solid #1e1e2e" }}>
              <kbd style={{ fontFamily: "'Anonymous Pro', monospace", fontSize: "0.75rem", color: "#00b9ff", fontWeight: 700 }}>{k.key}</kbd>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", color: "#666677" }}>{k.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ textAlign: "center", padding: "2rem", borderTop: "1px solid #1a1a28" }}>
        <p style={{ fontFamily: "'Anonymous Pro', monospace", fontSize: "0.75rem", color: "#444455", margin: 0 }}>
          built by{" "}
          <a href="https://amplifirm.com" target="_blank" rel="noreferrer" style={{ color: "#555566", textDecoration: "none" }}>
            amplifirm
          </a>
        </p>
      </footer>
    </div>
  );
}
