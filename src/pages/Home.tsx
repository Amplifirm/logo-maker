import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const GRIDS = ["△", "◿", "□", "◇", "⬡"];

export default function Home() {
  const nav = useNavigate();
  const [vis, setVis] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);

  const fade = (d: number): React.CSSProperties => ({
    opacity: vis ? 1 : 0,
    transform: vis ? "translateY(0)" : "translateY(16px)",
    transition: `all 0.7s cubic-bezier(0.22,1,0.36,1) ${d}s`,
  });

  return (
    <div style={{
      height: "100vh",
      overflow: "hidden",
      background: "#0a0a0f",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    }}>
      {/* Subtle grid background */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 2rem", textAlign: "center" }}>
        {/* Logo */}
        <img
          src="/logopaint (2).svg"
          alt="LogoPainter"
          style={{ width: 64, height: 76, marginBottom: 24, ...fade(0.05) }}
        />

        {/* Title */}
        <h1 style={{
          fontFamily: "'Anonymous Pro', monospace",
          fontSize: "clamp(2.4rem, 7vw, 4.5rem)",
          fontWeight: 700,
          color: "#fff",
          margin: 0,
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          ...fade(0.12),
        }}>
          Logo<span style={{ color: "#00b9ff" }}>Painter</span>
        </h1>

        {/* Tagline */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
          color: "#666677",
          marginTop: 14,
          maxWidth: 380,
          lineHeight: 1.6,
          ...fade(0.2),
        }}>
          Geometric logo design with AI.
        </p>

        {/* Grid type icons */}
        <div style={{ display: "flex", gap: 8, marginTop: 32, ...fade(0.28) }}>
          {GRIDS.map((g, i) => (
            <div key={i} style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#13131d",
              border: "1px solid #1e1e2e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              color: "#00b9ff",
              opacity: 0.7,
            }}>
              {g}
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => nav("/create")}
          style={{
            fontFamily: "'Anonymous Pro', monospace",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#0a0a0f",
            background: "#00b9ff",
            border: "none",
            borderRadius: 10,
            padding: "14px 48px",
            cursor: "pointer",
            marginTop: 36,
            letterSpacing: "0.02em",
            transition: "all 0.2s ease",
            ...fade(0.36),
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#33ccff";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,185,255,0.2)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "#00b9ff";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Start Creating
        </button>
      </div>

      {/* Footer */}
      <p style={{
        position: "absolute",
        bottom: 20,
        fontFamily: "'Anonymous Pro', monospace",
        fontSize: "0.7rem",
        color: "#333344",
        margin: 0,
      }}>
        built by{" "}
        <a href="https://amplifirm.com" target="_blank" rel="noreferrer" style={{ color: "#444455", textDecoration: "none" }}>
          amplifirm
        </a>
      </p>
    </div>
  );
}
