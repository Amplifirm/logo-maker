import { useNavigate } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", background: "#0a0a0f" }}>
      {/* Logo */}
      <img
        src="/logopaint (2).svg"
        alt="LogoPaint"
        style={{ width: 80, height: 96, marginBottom: 32 }}
      />

      {/* Title */}
      <h1 style={{
        fontFamily: "'Anonymous Pro', monospace",
        fontSize: "clamp(2rem, 5vw, 3.5rem)",
        fontWeight: 700,
        color: "#fff",
        margin: 0,
        letterSpacing: "-0.02em",
      }}>
        Logo<span style={{ color: "#00b9ff" }}>Paint</span>
      </h1>

      {/* Subtitle */}
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "clamp(0.9rem, 2vw, 1.15rem)",
        color: "#888899",
        marginTop: 12,
        marginBottom: 48,
        maxWidth: 420,
        textAlign: "center",
        lineHeight: 1.6,
      }}>
        Design geometric mosaic logos on triangle, square, hex and diamond grids — with AI that builds alongside you.
      </p>

      {/* CTA */}
      <button
        onClick={() => nav("/create")}
        style={{
          fontFamily: "'Anonymous Pro', monospace",
          fontSize: "1rem",
          fontWeight: 700,
          color: "#0a0a0f",
          background: "#00b9ff",
          border: "none",
          borderRadius: 8,
          padding: "14px 40px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          letterSpacing: "0.02em",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#33ccff"; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#00b9ff"; e.currentTarget.style.transform = "translateY(0)"; }}
      >
        Start Creating
      </button>

      {/* Footer */}
      <p style={{
        fontFamily: "'Anonymous Pro', monospace",
        fontSize: "0.75rem",
        color: "#444455",
        position: "fixed",
        bottom: 24,
      }}>
        built by <a href="https://amplifirm.com" target="_blank" rel="noreferrer" style={{ color: "#555566", textDecoration: "none" }}>amplifirm</a>
      </p>
    </div>
  );
}
