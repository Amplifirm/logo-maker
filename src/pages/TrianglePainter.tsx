// ============================================================
// LogoPaint — Geometric Mosaic Logo Designer
// Route: /triangle
// ============================================================

// ── Imports ──────────────────────────────────────────────────
import { useState, useRef, useEffect, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────
type Grid = "tri" | "rtri" | "sq" | "dia" | "hex";
type Tool = "paint" | "erase" | "select" | "pick" | "fill" | "line";
type BG = "dark" | "light" | "checker";
type Sym = "none" | "mirror" | "r3" | "r4" | "r6";
type Pt = [number, number];
type CellMap = Map<string, string>;
interface GroupInfo { id: number; keys: Set<string>; color: string }

// ── Constants ────────────────────────────────────────────────
const DEF_SIZE = 50;
const ACCENT = "#7c5cfc";
const LS_KEY = "logopaint_save";
const PALETTE = [
  "#ff4d6a", "#ff8c42", "#ffd166", "#06d6a0", "#1b9aaa",
  "#4361ee", "#7c5cfc", "#c77dff", "#f472b6", "#ffffff",
  "#888888", "#222222",
];
const BG_DARK = "#0e0e12";
const BG_LIGHT = "#f0f0f4";
const SYM_LIST: { s: Sym; icon: string }[] = [
  { s: "none", icon: "Off" },
  { s: "mirror", icon: "Mirror" },
  { s: "r3", icon: "3-fold" },
  { s: "r4", icon: "4-fold" },
  { s: "r6", icon: "6-fold" },
];
const GRID_LIST: { g: Grid; icon: string }[] = [
  { g: "tri", icon: "\u25B3" },
  { g: "rtri", icon: "\u25FF" },
  { g: "sq", icon: "\u25A1" },
  { g: "dia", icon: "\u25C7" },
  { g: "hex", icon: "\u2B21" },
];
const TOOL_LIST: { t: Tool; k: string; label: string }[] = [
  { t: "paint", k: "P", label: "Paint" },
  { t: "erase", k: "E", label: "Erase" },
  { t: "select", k: "S", label: "Select" },
  { t: "pick", k: "I", label: "Pick" },
  { t: "fill", k: "G", label: "Fill" },
  { t: "line", k: "L", label: "Line" },
];

const TEMPLATES: { name: string; cells: [number, number, string][] }[] = [
  {
    name: "Diamond",
    cells: [
      [0, 0, "#7c5cfc"], [0, 1, "#4361ee"], [-1, 0, "#7c5cfc"], [-1, 1, "#4361ee"],
      [1, 0, "#4361ee"], [1, 1, "#7c5cfc"], [0, -1, "#4361ee"], [0, 2, "#7c5cfc"],
    ],
  },
  {
    name: "Flower",
    cells: [
      [0, 0, "#ff4d6a"], [0, 1, "#f472b6"], [0, -1, "#f472b6"],
      [1, 0, "#f472b6"], [-1, 0, "#f472b6"], [1, 1, "#c77dff"], [-1, -1, "#c77dff"],
    ],
  },
  {
    name: "Arrow",
    cells: [
      [0, 0, "#06d6a0"], [0, 1, "#06d6a0"], [0, 2, "#06d6a0"],
      [-1, 1, "#1b9aaa"], [1, 1, "#1b9aaa"], [-2, 2, "#1b9aaa"], [2, 2, "#1b9aaa"],
    ],
  },
];

// ── Geometry: per-grid-type tessellations ─────────────────────
const gid = (r: number, c: number) => `${r},${c}`;
const S3 = Math.sqrt(3);

/**
 * Vertex generator — each grid type has its own tessellation so shapes
 * actually tile the plane with zero gaps.
 */
function getV(grid: Grid, r: number, c: number, s: number): Pt[] {
  switch (grid) {
    case "sq": {
      const x = c * s, y = r * s;
      return [[x, y], [x + s, y], [x + s, y + s], [x, y + s]];
    }
    case "tri": {
      // Each column is s/2 wide. Up/down alternate so edges are shared.
      const up = (r + c) % 2 === 0;
      const x = c * s / 2;
      const y0 = r * s, y1 = (r + 1) * s;
      if (up) return [[x + s / 2, y0], [x, y1], [x + s, y1]];
      return [[x, y0], [x + s, y0], [x + s / 2, y1]];
    }
    case "rtri": {
      // Two right triangles per rectangle. Even c = upper-left, odd c = lower-right.
      const rc = Math.floor(c / 2);
      const x = rc * s, y = r * s;
      if (c % 2 === 0) return [[x, y], [x + s, y], [x, y + s]];
      return [[x + s, y], [x + s, y + s], [x, y + s]];
    }
    case "dia": {
      // Diamond tessellation: odd rows offset by s/2 horizontally, row spacing s/2.
      const odd = (((r % 2) + 2) % 2);
      const cx = c * s + odd * s / 2;
      const cy = r * s / 2;
      return [[cx, cy - s / 2], [cx + s / 2, cy], [cx, cy + s / 2], [cx - s / 2, cy]];
    }
    case "hex": {
      // Pointy-top hex: odd rows offset right by half hex width.
      const R = s / 2;
      const w = S3 * R;
      const h = 1.5 * R;
      const odd = (((r % 2) + 2) % 2);
      const cx = c * w + odd * w / 2;
      const cy = r * h;
      const pts: Pt[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
      }
      return pts;
    }
  }
}

function centroid(pts: Pt[]): Pt {
  let sx = 0, sy = 0;
  for (const [x, y] of pts) { sx += x; sy += y; }
  return [sx / pts.length, sy / pts.length];
}

/** Cell center for each grid type */
function cellCen(grid: Grid, r: number, c: number, s: number): Pt {
  switch (grid) {
    case "sq": return [(c + 0.5) * s, (r + 0.5) * s];
    case "tri": {
      const x = c * s / 2;
      const up = (r + c) % 2 === 0;
      return [x + s / 2, up ? r * s + s * 2 / 3 : r * s + s / 3];
    }
    case "rtri": {
      const rc = Math.floor(c / 2);
      const x = rc * s, y = r * s;
      if (c % 2 === 0) return [x + s / 3, y + s / 3];
      return [x + 2 * s / 3, y + 2 * s / 3];
    }
    case "dia": {
      const odd = (((r % 2) + 2) % 2);
      return [c * s + odd * s / 2, r * s / 2];
    }
    case "hex": {
      const R = s / 2, w = S3 * R, h = 1.5 * R;
      const odd = (((r % 2) + 2) % 2);
      return [c * w + odd * w / 2, r * h];
    }
  }
}

/** Point-in-triangle test (barycentric) */
function ptInTri(px: number, py: number, pts: Pt[]): boolean {
  const [[ax, ay], [bx, by], [cx, cy]] = pts;
  const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
  if (Math.abs(d) < 1e-8) return false;
  const a = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / d;
  const b = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / d;
  return a >= 0 && b >= 0 && (a + b) <= 1;
}

/** Hit test: which cell contains world point (wx,wy)? Grid-type-aware. */
function hitCell(grid: Grid, s: number, wx: number, wy: number): string {
  switch (grid) {
    case "sq":
      return gid(Math.floor(wy / s), Math.floor(wx / s));
    case "tri": {
      const r = Math.floor(wy / s);
      const cMid = Math.floor(2 * wx / s);
      for (const dc of [0, -1, 1, -2, 2]) {
        const cc = cMid + dc;
        if (ptInTri(wx, wy, getV("tri", r, cc, s))) return gid(r, cc);
      }
      // Fallback: check row above/below
      for (const dr of [-1, 1]) {
        for (const dc of [0, -1, 1]) {
          const cc = cMid + dc;
          if (ptInTri(wx, wy, getV("tri", r + dr, cc, s))) return gid(r + dr, cc);
        }
      }
      return gid(r, cMid);
    }
    case "rtri": {
      const r = Math.floor(wy / s);
      const rc = Math.floor(wx / s);
      const lx = wx / s - rc;
      const ly = wy / s - r;
      if (lx + ly <= 1) return gid(r, rc * 2);
      return gid(r, rc * 2 + 1);
    }
    case "dia": {
      const rApprox = Math.round(wy / (s / 2));
      let bestR = rApprox, bestC = 0, bestDist = Infinity;
      for (const dr of [-1, 0, 1]) {
        const tr = rApprox + dr;
        const odd = (((tr % 2) + 2) % 2);
        const cApprox = Math.round((wx - odd * s / 2) / s);
        for (const dc of [-1, 0, 1]) {
          const tc = cApprox + dc;
          const cx = tc * s + odd * s / 2;
          const cy = tr * s / 2;
          const dist = Math.abs(wx - cx) / (s / 2) + Math.abs(wy - cy) / (s / 2);
          if (dist < bestDist) { bestDist = dist; bestR = tr; bestC = tc; }
        }
      }
      return gid(bestR, bestC);
    }
    case "hex": {
      const R = s / 2, w = S3 * R, h = 1.5 * R;
      const rApprox = Math.round(wy / h);
      let bestR = rApprox, bestC = 0, bestDist = Infinity;
      for (const dr of [-1, 0, 1]) {
        const tr = rApprox + dr;
        const odd = (((tr % 2) + 2) % 2);
        const cApprox = Math.round((wx - odd * w / 2) / w);
        for (const dc of [-1, 0, 1]) {
          const tc = cApprox + dc;
          const cx = tc * w + odd * w / 2;
          const cy = tr * h;
          const dist = (wx - cx) ** 2 + (wy - cy) ** 2;
          if (dist < bestDist) { bestDist = dist; bestR = tr; bestC = tc; }
        }
      }
      return gid(bestR, bestC);
    }
  }
}

/** Visible cell range on screen — grid-type-aware */
function visRange(
  grid: Grid, s: number, w: number, h: number,
  panX: number, panY: number, zoom: number
): [number, number, number, number] {
  const m = 6;
  const halfW = w / 2 / zoom;
  const halfH = h / 2 / zoom;
  switch (grid) {
    case "sq": {
      return [
        Math.floor((-halfH - panY) / s) - m, Math.ceil((halfH - panY) / s) + m,
        Math.floor((-halfW - panX) / s) - m, Math.ceil((halfW - panX) / s) + m,
      ];
    }
    case "tri": {
      return [
        Math.floor((-halfH - panY) / s) - m, Math.ceil((halfH - panY) / s) + m,
        Math.floor(2 * (-halfW - panX) / s) - m * 2, Math.ceil(2 * (halfW - panX) / s) + m * 2,
      ];
    }
    case "rtri": {
      return [
        Math.floor((-halfH - panY) / s) - m, Math.ceil((halfH - panY) / s) + m,
        Math.floor(2 * (-halfW - panX) / s) - m * 2, Math.ceil(2 * (halfW - panX) / s) + m * 2,
      ];
    }
    case "dia": {
      return [
        Math.floor((-halfH - panY) / (s / 2)) - m, Math.ceil((halfH - panY) / (s / 2)) + m,
        Math.floor((-halfW - panX) / s) - m, Math.ceil((halfW - panX) / s) + m,
      ];
    }
    case "hex": {
      const R = s / 2, hw = S3 * R, hh = 1.5 * R;
      return [
        Math.floor((-halfH - panY) / hh) - m, Math.ceil((halfH - panY) / hh) + m,
        Math.floor((-halfW - panX) / hw) - m, Math.ceil((halfW - panX) / hw) + m,
      ];
    }
  }
}

function insetVerts(pts: Pt[], amt: number): Pt[] {
  const c = centroid(pts);
  return pts.map(([x, y]) => [
    x + (c[0] - x) * amt,
    y + (c[1] - y) * amt,
  ] as Pt);
}

// ── Rendering helpers ────────────────────────────────────────
function renderPoly(ctx: CanvasRenderingContext2D, pts: Pt[], radius = 0, mask?: boolean[]) {
  ctx.beginPath();
  if (radius <= 0) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  } else {
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const useR = (!mask || mask[i % mask.length]) ? radius : 0;
      const prev = pts[(i - 1 + n) % n];
      const curr = pts[i];
      const next = pts[(i + 1) % n];
      if (useR <= 0) {
        if (i === 0) ctx.moveTo(curr[0], curr[1]);
        else ctx.lineTo(curr[0], curr[1]);
      } else {
        const dx1 = prev[0] - curr[0], dy1 = prev[1] - curr[1];
        const d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const dx2 = next[0] - curr[0], dy2 = next[1] - curr[1];
        const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        const r = Math.min(useR, d1 / 2, d2 / 2);
        const p1x = curr[0] + (dx1 / d1) * r;
        const p1y = curr[1] + (dy1 / d1) * r;
        const p2x = curr[0] + (dx2 / d2) * r;
        const p2y = curr[1] + (dy2 / d2) * r;
        if (i === 0) ctx.moveTo(p1x, p1y);
        else ctx.lineTo(p1x, p1y);
        ctx.quadraticCurveTo(curr[0], curr[1], p2x, p2y);
      }
    }
  }
  ctx.closePath();
}

function drawCell(
  ctx: CanvasRenderingContext2D, pts: Pt[], color: string,
  strokeClr: string, strokeWidth: number, radius = 0, mask?: boolean[]
) {
  renderPoly(ctx, pts, radius, mask);
  ctx.fillStyle = color;
  ctx.fill();
  // Anti-gap: stroke with fill color to cover sub-pixel seams
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.stroke();
  if (strokeWidth > 0) {
    renderPoly(ctx, pts, radius, mask);
    ctx.strokeStyle = strokeClr;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.stroke();
  }
}

// ── Adjacency / symmetry ────────────────────────────────────
function cellNeighbors(grid: Grid, r: number, c: number): string[] {
  switch (grid) {
    case "sq":
      return [gid(r - 1, c), gid(r + 1, c), gid(r, c - 1), gid(r, c + 1)];
    case "tri": {
      const up = (r + c) % 2 === 0;
      // Each triangle shares 3 edges
      return up
        ? [gid(r, c - 1), gid(r, c + 1), gid(r + 1, c)]
        : [gid(r, c - 1), gid(r, c + 1), gid(r - 1, c)];
    }
    case "rtri": {
      if (c % 2 === 0) {
        // Upper-left: hypotenuse→(r,c+1), top→(r-1,c+1), left→(r,c-1)
        return [gid(r, c + 1), gid(r - 1, c + 1), gid(r, c - 1)];
      }
      // Lower-right: hypotenuse→(r,c-1), right→(r,c+1), bottom→(r+1,c-1)
      return [gid(r, c - 1), gid(r, c + 1), gid(r + 1, c - 1)];
    }
    case "dia": {
      const odd = (((r % 2) + 2) % 2);
      return odd
        ? [gid(r - 1, c), gid(r - 1, c + 1), gid(r + 1, c), gid(r + 1, c + 1)]
        : [gid(r - 1, c - 1), gid(r - 1, c), gid(r + 1, c - 1), gid(r + 1, c)];
    }
    case "hex": {
      const odd = (((r % 2) + 2) % 2);
      return odd
        ? [gid(r - 1, c), gid(r - 1, c + 1), gid(r, c - 1), gid(r, c + 1), gid(r + 1, c), gid(r + 1, c + 1)]
        : [gid(r - 1, c - 1), gid(r - 1, c), gid(r, c - 1), gid(r, c + 1), gid(r + 1, c - 1), gid(r + 1, c)];
    }
  }
}

function lineCells(
  grid: Grid, s: number, x0: number, y0: number, x1: number, y1: number,
): string[] {
  const keys: string[] = [];
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / (s * 0.3);
  const n = Math.max(Math.ceil(steps), 1);
  const seen = new Set<string>();
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const wx = x0 + (x1 - x0) * t;
    const wy = y0 + (y1 - y0) * t;
    const k = hitCell(grid, s, wx, wy);
    if (!seen.has(k)) { seen.add(k); keys.push(k); }
  }
  return keys;
}

function getSymKeys(key: string, sym: Sym): string[] {
  const [r, c] = key.split(",").map(Number);
  const keys = [key];
  if (sym === "mirror") {
    keys.push(gid(r, -c));
  } else if (sym === "r3") {
    keys.push(gid(-c, r + c));
    keys.push(gid(c - r, -r));
  } else if (sym === "r4") {
    keys.push(gid(-c, r));
    keys.push(gid(-r, -c));
    keys.push(gid(c, -r));
  } else if (sym === "r6") {
    keys.push(gid(-c, r + c));
    keys.push(gid(c - r, -r));
    keys.push(gid(-r, -c));
    keys.push(gid(c, -(r + c)));
    keys.push(gid(r - c, r));
  }
  return keys;
}

// ── Color utilities ──────────────────────────────────────────
function hex2rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").slice(0, 6);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgb2hex(r: number, g: number, b: number): string {
  const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return "#" + [cl(r), cl(g), cl(b)].map(v => v.toString(16).padStart(2, "0")).join("");
}

function hex2hsl(hex: string): [number, number, number] {
  const [rr, gg, bb] = hex2rgb(hex).map(v => v / 255);
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
  else if (max === gg) h = ((bb - rr) / d + 2) / 6;
  else h = ((rr - gg) / d + 4) / 6;
  return [h, s, l];
}

function hsl2hex(h: number, s: number, l: number): string {
  if (s === 0) {
    const v = Math.round(l * 255);
    return rgb2hex(v, v, v);
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return rgb2hex(
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
  );
}

// ── Cell value pack/unpack (embeds radius + shape into cell value for undo/save) ──
function packCell(color: string, radius: number, mask: boolean[] | null): string {
  if (radius <= 0) return color;
  const m = mask && !mask.every(Boolean) ? "|" + mask.map(b => b ? "1" : "0").join(",") : "";
  return `${color}|${radius}${m}`;
}
function unpackCell(v: string): { color: string; radius: number; mask: boolean[] | null } {
  // Strip any legacy @shape suffix
  const atIdx = v.indexOf("@");
  const main = atIdx !== -1 ? v.slice(0, atIdx) : v;
  const i = main.indexOf("|");
  if (i === -1) return { color: main, radius: 0, mask: null };
  const color = main.slice(0, i);
  const rest = main.slice(i + 1);
  const j = rest.indexOf("|");
  if (j === -1) return { color, radius: Number(rest), mask: null };
  return {
    color,
    radius: Number(rest.slice(0, j)),
    mask: rest.slice(j + 1).split(",").map(x => x === "1"),
  };
}

// ── General utilities ────────────────────────────────────────
function download(data: string, name: string, mime: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type: mime }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function contentBounds(
  cells: CellMap, s: number, g: Grid
): { x: number; y: number; w: number; h: number } {
  let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
  cells.forEach((_val, k) => {
    const [r, c] = k.split(",").map(Number);
    for (const [px, py] of getV(g, r, c, s)) {
      if (px < xMin) xMin = px;
      if (py < yMin) yMin = py;
      if (px > xMax) xMax = px;
      if (py > yMax) yMax = py;
    }
  });
  if (!isFinite(xMin)) return { x: 0, y: 0, w: 100, h: 100 };
  const pad = s * 0.5;
  return { x: xMin - pad, y: yMin - pad, w: xMax - xMin + pad * 2, h: yMax - yMin + pad * 2 };
}

// ── Component ────────────────────────────────────────────────
export default function TrianglePainter() {
  // ── State ──────────────────────────────────────────────────
  const [cells, setCells] = useState<CellMap>(new Map());
  const [grid, setGrid] = useState<Grid>("tri");
  const [tool, setTool] = useState<Tool>("paint");
  const [bg, setBg] = useState<BG>("light");
  const [sym, setSym] = useState<Sym>("none");
  const [color, setColor] = useState(PALETTE[6]);
  const [gradColor, setGradColor] = useState(PALETTE[0]);
  const [opacity, setOpacity] = useState(100);
  const [cellSize, setCellSize] = useState(DEF_SIZE);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeW, setStrokeW] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pt>([0, 0]);
  const [rot, setRot] = useState(0);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [toast, setToast] = useState("");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQ, setCmdQ] = useState("");
  const [lineStart, setLineStart] = useState<Pt | null>(null);
  const [selBox, setSelBox] = useState<{
    x0: number; y0: number; x1: number; y1: number;
  } | null>(null);
  const [refImg, setRefImg] = useState<HTMLImageElement | null>(null);
  const [refOpacity, setRefOpacity] = useState(30);
  const [history, setHistory] = useState<CellMap[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [cornerRadius, setCornerRadius] = useState(0);
  const [cornerMask, setCornerMask] = useState<boolean[]>([true, true, true]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // ── Refs ───────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const isPanning = useRef(false);
  const lastMouse = useRef<Pt>([0, 0]);
  const dragAnchor = useRef<string | null>(null);
  const paintMode = useRef<"paint" | "erase">("paint");
  const chatMsgsRef = useRef<{ role: "user" | "assistant"; text: string }[]>([
    { role: "assistant", text: "Hi! Describe a logo and I'll create it. Try \"blue diamond logo\" or \"flower pattern with pink\"." },
  ]);
  const [chatVer, setChatVer] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Mirror all state into ref for use in callbacks
  const R = useRef({
    cells, grid, tool, bg, sym, color, gradColor, opacity, cellSize,
    strokeColor, strokeW, zoom, pan, rot, sel, groups, lineStart, selBox,
    refImg, refOpacity, history, histIdx, cornerRadius, cornerMask,
  });
  R.current = {
    cells, grid, tool, bg, sym, color, gradColor, opacity, cellSize,
    strokeColor, strokeW, zoom, pan, rot, sel, groups, lineStart, selBox,
    refImg, refOpacity, history, histIdx, cornerRadius, cornerMask,
  };

  // Sync cornerMask length to grid type
  const numCorners = grid === "tri" || grid === "rtri" ? 3 : grid === "hex" ? 6 : 4;
  if (cornerMask.length !== numCorners) {
    setCornerMask(Array(numCorners).fill(true));
  }

  // ── Flash (toast) ──────────────────────────────────────────
  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }, []);

  // ── Screen to world ────────────────────────────────────────
  const s2w = useCallback((sx: number, sy: number): Pt => {
    const cv = canvasRef.current!;
    const cx = cv.width / 2, cy = cv.height / 2;
    const dx = (sx - cx) / R.current.zoom;
    const dy = (sy - cy) / R.current.zoom;
    const cosA = Math.cos(-R.current.rot);
    const sinA = Math.sin(-R.current.rot);
    return [
      dx * cosA - dy * sinA - R.current.pan[0],
      dx * sinA + dy * cosA - R.current.pan[1],
    ];
  }, []);

  // ── History management ─────────────────────────────────────
  const pushHist = useCallback((prev: CellMap) => {
    setHistory(h => {
      const next = [...h.slice(0, R.current.histIdx + 1), new Map(prev)];
      return next;
    });
    setHistIdx(i => i + 1);
  }, []);

  // ── Cell operations ────────────────────────────────────────
  const applyCell = useCallback((key: string, clr: string | null) => {
    setCells(prev => {
      const m = new Map(prev);
      const allKeys = getSymKeys(key, R.current.sym);
      const { cornerRadius: cr, cornerMask: cm } = R.current;
      for (const k of allKeys) {
        if (clr === null) m.delete(k);
        else m.set(k, packCell(clr, cr, cm.every(Boolean) ? null : cm));
      }
      return m;
    });
  }, []);

  const floodFill = useCallback((startKey: string, fillColor: string) => {
    setCells(prev => {
      if (prev.has(startKey)) return prev;
      pushHist(prev);
      const m = new Map(prev);
      const queue = [startKey];
      const visited = new Set<string>();
      visited.add(startKey);
      const { cornerRadius: cr, cornerMask: cm } = R.current;
      const packed = packCell(fillColor, cr, cm.every(Boolean) ? null : cm);
      while (queue.length > 0) {
        const k = queue.shift()!;
        const allKeys = getSymKeys(k, R.current.sym);
        for (const sk of allKeys) m.set(sk, packed);
        const [r, c] = k.split(",").map(Number);
        for (const nk of cellNeighbors(R.current.grid, r, c)) {
          if (!visited.has(nk) && !m.has(nk)) {
            visited.add(nk);
            queue.push(nk);
          }
        }
      }
      return m;
    });
  }, [pushHist]);

  // ── Draw (main canvas) ────────────────────────────────────
  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const {
      grid: g, cellSize: s, bg: bgMode, zoom: z, pan: p, rot: r,
      cells: cl, sel: selSet, selBox: sb, lineStart: ls,
      strokeColor: sc, strokeW: sw, refImg: ri, refOpacity: ro,
    } = R.current;
    const W = cv.width, H = cv.height;

    // Background
    ctx.save();
    if (bgMode === "dark") {
      ctx.fillStyle = BG_DARK;
      ctx.fillRect(0, 0, W, H);
    } else if (bgMode === "light") {
      ctx.fillStyle = BG_LIGHT;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = "#cccccc";
      ctx.fillRect(0, 0, W, H);
      const cs = 16;
      ctx.fillStyle = "#999999";
      for (let y = 0; y < H; y += cs) {
        for (let x = 0; x < W; x += cs) {
          if ((Math.floor(x / cs) + Math.floor(y / cs)) % 2 === 0) {
            ctx.fillRect(x, y, cs, cs);
          }
        }
      }
    }

    // Transform
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.rotate(r);
    ctx.translate(p[0], p[1]);

    // Reference image
    if (ri) {
      ctx.globalAlpha = ro / 100;
      ctx.drawImage(ri, -ri.width / 2, -ri.height / 2);
      ctx.globalAlpha = 1;
    }

    // Visible range (always square grid)
    const [rMin, rMax, cMin, cMax] = visRange(g, s, W, H, p[0], p[1], z);

    // Grid lines
    ctx.globalAlpha = bgMode === "dark" ? 0.06 : 0.08;
    ctx.strokeStyle = bgMode === "dark" ? "#ffffff" : "#d1d5db";
    ctx.lineWidth = 0.5;
    for (let row = rMin; row <= rMax; row++) {
      for (let col = cMin; col <= cMax; col++) {
        if (cl.has(gid(row, col))) continue;
        renderPoly(ctx, getV(g, row, col, s));
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Painted cells
    cl.forEach((val, k) => {
      const { color: cellClr, radius: cellR, mask: cellM } = unpackCell(val);
      const [cr, cc] = k.split(",").map(Number);
      drawCell(ctx, getV(g, cr, cc, s), cellClr, sc, sw, cellR, cellM || undefined);
    });

    // Selection highlight
    if (selSet.size > 0) {
      selSet.forEach(k => {
        const val = cl.get(k);
        const { radius: cellR, mask: cellM } = val ? unpackCell(val) : { radius: 0, mask: null };
        const [sr, sc2] = k.split(",").map(Number);
        const verts = getV(g, sr, sc2, s);
        // Glow
        ctx.shadowColor = ACCENT;
        ctx.shadowBlur = 8 / z;
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 2.5 / z;
        renderPoly(ctx, verts, cellR, cellM || undefined);
        ctx.stroke();
        ctx.shadowBlur = 0;
        // Inner highlight
        ctx.strokeStyle = "#ffffff88";
        ctx.lineWidth = 1 / z;
        renderPoly(ctx, insetVerts(verts, 0.08), cellR, cellM || undefined);
        ctx.stroke();
      });
    }

    // Selection box
    if (sb) {
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 1 / z;
      ctx.setLineDash([6 / z, 3 / z]);
      ctx.strokeRect(sb.x0, sb.y0, sb.x1 - sb.x0, sb.y1 - sb.y0);
      ctx.setLineDash([]);
    }

    // Line preview
    if (ls) {
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.arc(ls[0], ls[1], 4 / z, 0, Math.PI * 2);
      ctx.fill();
    }

    // Symmetry guide lines
    if (R.current.sym !== "none") {
      ctx.strokeStyle = ACCENT + "44";
      ctx.lineWidth = 1 / z;
      ctx.setLineDash([8 / z, 4 / z]);
      const extent = 2000;
      if (R.current.sym === "mirror") {
        ctx.beginPath();
        ctx.moveTo(0, -extent);
        ctx.lineTo(0, extent);
        ctx.stroke();
      } else {
        const folds = R.current.sym === "r3" ? 3 : R.current.sym === "r4" ? 4 : 6;
        for (let i = 0; i < folds; i++) {
          const a = (Math.PI * 2 * i) / folds;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * extent, Math.sin(a) * extent);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, []);

  // ── Draw preview strip ────────────────────────────────────
  const drawPreview = useCallback(() => {
    const cv = prevRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const W = cv.width, H = cv.height;
    const { cells: cl, cellSize: s, strokeColor: sc, strokeW: sw } = R.current;

    ctx.clearRect(0, 0, W, H);
    if (cl.size === 0) return;

    const bounds = contentBounds(cl, s, R.current.grid);
    const pW = W / 3;
    const backgrounds = [BG_DARK, BG_LIGHT, "#cccccc"];

    backgrounds.forEach((bgC, i) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(i * pW, 0, pW, H);
      ctx.clip();
      ctx.fillStyle = bgC;
      ctx.fillRect(i * pW, 0, pW, H);

      const scale = Math.min((pW - 16) / bounds.w, (H - 16) / bounds.h);
      ctx.translate(i * pW + pW / 2, H / 2);
      ctx.scale(scale, scale);
      ctx.translate(-(bounds.x + bounds.w / 2), -(bounds.y + bounds.h / 2));

      cl.forEach((val, k) => {
        const { color: cellClr, radius: cellR, mask: cellM } = unpackCell(val);
        const [cr, cc] = k.split(",").map(Number);
        drawCell(ctx, getV(R.current.grid, cr, cc, s), cellClr, sc, sw, cellR, cellM || undefined);
      });
      ctx.restore();
    });
  }, []);

  // ── Effects ────────────────────────────────────────────────

  // Sync radius slider to selected cell on selection change
  useEffect(() => {
    if (sel.size > 0) {
      const firstKey = sel.values().next().value;
      if (firstKey) {
        const val = cells.get(firstKey);
        if (val) {
          const { radius, mask } = unpackCell(val);
          setCornerRadius(radius);
          if (mask) setCornerMask(mask);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const cv = canvasRef.current;
      const pv = prevRef.current;
      const ct = containerRef.current;
      if (!cv || !ct) return;
      cv.width = ct.clientWidth;
      cv.height = ct.clientHeight;
      if (pv && pv.parentElement) {
        pv.width = pv.parentElement.clientWidth;
        pv.height = 120;
      }
      draw();
      drawPreview();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw, drawPreview]);

  // Redraw on state changes
  useEffect(() => {
    draw();
    drawPreview();
  }, [
    cells, grid, bg, zoom, pan, rot, sel, selBox, lineStart, cellSize,
    strokeColor, strokeW, refImg, refOpacity, sym, cornerRadius, cornerMask, draw, drawPreview,
  ]);

  // Load from localStorage or URL hash on mount
  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const data = JSON.parse(atob(hash));
        if (data.cells) {
          setCells(new Map(data.cells));
          if (data.grid) setGrid(data.grid);
          if (data.size) setCellSize(data.size);
          flash("Loaded from shared URL");
          return;
        }
      }
    } catch (_e) { /* ignore parse errors */ }

    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.cells) {
          setCells(new Map(data.cells));
          if (data.grid) setGrid(data.grid);
          if (data.size) setCellSize(data.size);
          flash("Loaded from localStorage");
        }
      }
    } catch (_e) { /* ignore parse errors */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Action callbacks ───────────────────────────────────────
  const save = useCallback(() => {
    const data = {
      cells: Array.from(R.current.cells.entries()),
      grid: R.current.grid,
      size: R.current.cellSize,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    flash("Saved!");
  }, [flash]);

  const clearAll = useCallback(() => {
    pushHist(R.current.cells);
    setCells(new Map());
    setSel(new Set());
    flash("Cleared");
  }, [pushHist, flash]);

  const undo = useCallback(() => {
    const { history: h, histIdx: idx, cells: cur } = R.current;
    if (idx < 0) return;
    setHistory(prev => {
      const next = [...prev];
      next[idx + 1] = new Map(cur);
      return next.length > idx + 2 ? next.slice(0, idx + 2) : next;
    });
    setCells(new Map(h[idx]));
    setHistIdx(idx - 1);
    flash("Undo");
  }, [flash]);

  const redo = useCallback(() => {
    const { history: h, histIdx: idx } = R.current;
    if (idx + 2 >= h.length) return;
    setCells(new Map(h[idx + 2]));
    setHistIdx(idx + 1);
    flash("Redo");
  }, [flash]);

  const deleteSel = useCallback(() => {
    const { sel: s, cells: c } = R.current;
    if (s.size === 0) return;
    pushHist(c);
    setCells(prev => {
      const m = new Map(prev);
      s.forEach(k => m.delete(k));
      return m;
    });
    setSel(new Set());
    flash("Deleted");
  }, [pushHist, flash]);

  const selectAll = useCallback(() => {
    const s = new Set<string>();
    R.current.cells.forEach((_c, k) => s.add(k));
    setSel(s);
    flash("Selected all");
  }, [flash]);

  const deselect = useCallback(() => {
    setSel(new Set());
    flash("Deselected");
  }, [flash]);

  // ── Transform callbacks ────────────────────────────────────
  const flipH = useCallback(() => {
    const { sel: s, cells: c, cellSize: sz } = R.current;
    if (s.size === 0) return;
    pushHist(c);
    const entries: [string, string][] = [];
    s.forEach(k => {
      const clr = c.get(k);
      if (clr) entries.push([k, clr]);
    });
    let sumX = 0, count = 0;
    entries.forEach(([k]) => {
      const [r, col] = k.split(",").map(Number);
      sumX += cellCen(R.current.grid, r, col, sz)[0];
      count++;
    });
    const cx = sumX / count;
    const m = new Map(c);
    const newSel = new Set<string>();
    entries.forEach(([k, clr]) => {
      m.delete(k);
      const [r, col] = k.split(",").map(Number);
      const cen = cellCen(R.current.grid, r, col, sz);
      const nk = hitCell(R.current.grid, sz, 2 * cx - cen[0], cen[1]);
      m.set(nk, clr); newSel.add(nk);
    });
    setCells(m);
    setSel(newSel);
    flash("Flipped H");
  }, [pushHist, flash]);

  const flipV = useCallback(() => {
    const { sel: s, cells: c, cellSize: sz } = R.current;
    if (s.size === 0) return;
    pushHist(c);
    const entries: [string, string][] = [];
    s.forEach(k => {
      const clr = c.get(k);
      if (clr) entries.push([k, clr]);
    });
    let sumY = 0, count = 0;
    entries.forEach(([k]) => {
      const [r, col] = k.split(",").map(Number);
      sumY += cellCen(R.current.grid, r, col, sz)[1];
      count++;
    });
    const cy = sumY / count;
    const m = new Map(c);
    const newSel = new Set<string>();
    entries.forEach(([k, clr]) => {
      m.delete(k);
      const [r, col] = k.split(",").map(Number);
      const cen = cellCen(R.current.grid, r, col, sz);
      const nk = hitCell(R.current.grid, sz, cen[0], 2 * cy - cen[1]);
      m.set(nk, clr); newSel.add(nk);
    });
    setCells(m);
    setSel(newSel);
    flash("Flipped V");
  }, [pushHist, flash]);

  const rotateSel90 = useCallback(() => {
    const { sel: s, cells: c, cellSize: sz } = R.current;
    if (s.size === 0) return;
    pushHist(c);
    const entries: [string, string][] = [];
    s.forEach(k => {
      const clr = c.get(k);
      if (clr) entries.push([k, clr]);
    });
    let sumX = 0, sumY = 0, count = 0;
    entries.forEach(([k]) => {
      const [r, col] = k.split(",").map(Number);
      const cen = cellCen(R.current.grid, r, col, sz);
      sumX += cen[0]; sumY += cen[1]; count++;
    });
    const cx = sumX / count, cy = sumY / count;
    const m = new Map(c);
    const newSel = new Set<string>();
    entries.forEach(([k, clr]) => {
      m.delete(k);
      const [r, col] = k.split(",").map(Number);
      const cen = cellCen(R.current.grid, r, col, sz);
      const dx = cen[0] - cx, dy = cen[1] - cy;
      const nk = hitCell(R.current.grid, sz, cx - dy, cy + dx);
      m.set(nk, clr); newSel.add(nk);
    });
    setCells(m);
    setSel(newSel);
    flash("Rotated 90deg");
  }, [pushHist, flash]);

  const moveSel = useCallback((dr: number, dc: number) => {
    const { sel: s, cells: c } = R.current;
    if (s.size === 0) return;
    pushHist(c);
    const m = new Map(c);
    const entries: [string, string][] = [];
    s.forEach(k => {
      const clr = m.get(k);
      if (clr) entries.push([k, clr]);
      m.delete(k);
    });
    const newSel = new Set<string>();
    entries.forEach(([k, clr]) => {
      const [r, col] = k.split(",").map(Number);
      const nk = gid(r + dr, col + dc);
      m.set(nk, clr);
      newSel.add(nk);
    });
    setCells(m);
    setSel(newSel);
  }, [pushHist]);

  // ── Color callbacks ────────────────────────────────────────
  const gradientFill = useCallback(() => {
    const { sel: s, cells: c, cellSize: sz, color: c1, gradColor: c2 } = R.current;
    if (s.size === 0) return;
    pushHist(c);
    const xs: { k: string; x: number }[] = [];
    s.forEach(k => {
      const [r, col] = k.split(",").map(Number);
      xs.push({ k, x: cellCen(R.current.grid, r, col, sz)[0] });
    });
    const xMin = Math.min(...xs.map(e => e.x));
    const xMax = Math.max(...xs.map(e => e.x));
    const range = xMax - xMin || 1;
    const [r1, g1, b1] = hex2rgb(c1);
    const [r2, g2, b2] = hex2rgb(c2);
    const m = new Map(c);
    xs.forEach(({ k, x }) => {
      const t = (x - xMin) / range;
      const newClr = rgb2hex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
      const old = m.get(k);
      const { radius: oldR, mask: oldM } = old ? unpackCell(old) : { radius: 0, mask: null };
      m.set(k, packCell(newClr, oldR, oldM));
    });
    setCells(m);
    flash("Gradient applied");
  }, [pushHist, flash]);

  const randomizeColors = useCallback(() => {
    const { sel: s, cells: c } = R.current;
    if (s.size === 0) return;
    pushHist(c);
    const m = new Map(c);
    s.forEach(k => {
      const val = m.get(k);
      if (!val) return;
      const { color: clr, radius: oldR, mask: oldM } = unpackCell(val);
      const [h, sat, l] = hex2hsl(clr);
      const nh = (h + (Math.random() - 0.5) * 0.1 + 1) % 1;
      const ns = Math.max(0, Math.min(1, sat + (Math.random() - 0.5) * 0.2));
      const nl = Math.max(0, Math.min(1, l + (Math.random() - 0.5) * 0.15));
      m.set(k, packCell(hsl2hex(nh, ns, nl), oldR, oldM));
    });
    setCells(m);
    flash("Randomized");
  }, [pushHist, flash]);

  // ── Export callbacks ───────────────────────────────────────
  const exportPNG = useCallback((size?: number) => {
    const { cells: cl, cellSize: s, strokeColor: sc, strokeW: sw } = R.current;
    if (cl.size === 0) { flash("Nothing to export"); return; }
    const bounds = contentBounds(cl, s, R.current.grid);
    const expW = size || Math.ceil(bounds.w);
    const expH = size || Math.ceil(bounds.h);
    const scale = size ? Math.min(size / bounds.w, size / bounds.h) : 1;
    const cv = document.createElement("canvas");
    cv.width = expW;
    cv.height = expH;
    const ctx = cv.getContext("2d")!;
    ctx.translate(expW / 2, expH / 2);
    ctx.scale(scale, scale);
    ctx.translate(-(bounds.x + bounds.w / 2), -(bounds.y + bounds.h / 2));
    cl.forEach((val, k) => {
      const { color: cellClr, radius: cellR, mask: cellM } = unpackCell(val);
      const [r, c] = k.split(",").map(Number);
      drawCell(ctx, getV(R.current.grid, r, c, s), cellClr, sc, sw, cellR, cellM || undefined);
    });
    cv.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `logopaint${size ? `_${size}` : ""}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
    flash(`Exported PNG${size ? ` ${size}px` : ""}`);
  }, [flash]);

  const buildSVG = useCallback(() => {
    const { cells: cl, cellSize: s, strokeColor: sc, strokeW: sw } = R.current;
    if (cl.size === 0) return "";
    const bounds = contentBounds(cl, s, R.current.grid);
    let paths = "";
    const g = R.current.grid;
    cl.forEach((val, k) => {
      const { color: clr } = unpackCell(val);
      const [r, c] = k.split(",").map(Number);
      const pts = getV(g, r, c, s);
      const d = pts
        .map(([x, y], i) =>
          `${i === 0 ? "M" : "L"}${(x - bounds.x).toFixed(2)},${(y - bounds.y).toFixed(2)}`
        )
        .join(" ") + "Z";
      const strokeAttr = sw > 0
        ? ` stroke="${sc}" stroke-width="${sw}" stroke-linejoin="round"`
        : ` stroke="${clr}" stroke-width="1" stroke-linejoin="round"`;
      paths += `<path d="${d}" fill="${clr}"${strokeAttr}/>\n`;
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${bounds.w.toFixed(1)} ${bounds.h.toFixed(1)}">\n${paths}</svg>`;
  }, []);

  const exportSVG = useCallback(() => {
    const svg = buildSVG();
    if (!svg) { flash("Nothing to export"); return; }
    download(svg, "logopaint.svg", "image/svg+xml");
    flash("Exported SVG");
  }, [buildSVG, flash]);

  const copySVG = useCallback(() => {
    const svg = buildSVG();
    if (!svg) { flash("Nothing to copy"); return; }
    navigator.clipboard.writeText(svg);
    flash("SVG copied to clipboard");
  }, [buildSVG, flash]);

  const shareURL = useCallback(() => {
    const data = {
      cells: Array.from(R.current.cells.entries()),
      grid: R.current.grid,
      size: R.current.cellSize,
    };
    const hash = btoa(JSON.stringify(data));
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    navigator.clipboard.writeText(url);
    flash("Share URL copied!");
  }, [flash]);

  // ── Template / reference callbacks ─────────────────────────
  const loadTemplate = useCallback((tpl: typeof TEMPLATES[number]) => {
    pushHist(R.current.cells);
    const m = new Map<string, string>();
    tpl.cells.forEach(([r, c, clr]) => m.set(gid(r, c), clr));
    setCells(m);
    flash(`Template: ${tpl.name}`);
  }, [pushHist, flash]);

  const loadRefImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const img = new Image();
      img.onload = () => { setRefImg(img); flash("Reference image loaded"); };
      img.src = URL.createObjectURL(file);
    };
    input.click();
  }, [flash]);

  const groupSel = useCallback(() => {
    const { sel: s, color: c } = R.current;
    if (s.size === 0) return;
    setGroups(prev => [...prev, { id: Date.now(), keys: new Set(s), color: c }]);
    flash("Grouped");
  }, [flash]);

  // ── AI Chat ───────────────────────────────────────────────
  const sendChat = useCallback(async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput("");
    chatMsgsRef.current = [...chatMsgsRef.current, { role: "user", text: msg }];
    setChatVer(v => v + 1);
    setChatLoading(true);

    try {
      // Build a row-by-row map of the canvas so the AI can "see" the design
      const cellsByRow = new Map<number, { col: number; color: string }[]>();
      R.current.cells.forEach((val, k) => {
        const { color } = unpackCell(val);
        const [r, c] = k.split(",").map(Number);
        if (!cellsByRow.has(r)) cellsByRow.set(r, []);
        cellsByRow.get(r)!.push({ col: c, color });
      });
      const sortedRows = [...cellsByRow.keys()].sort((a, b) => a - b);
      let stateStr: string;
      if (sortedRows.length > 0) {
        const totalCells = R.current.cells.size;
        // Collect unique colors used
        const usedColors = new Set<string>();
        R.current.cells.forEach(v => usedColors.add(unpackCell(v).color));
        const rowDescs = sortedRows.map(r => {
          const cols = cellsByRow.get(r)!.sort((a, b) => a.col - b.col);
          return `  Row ${r}: ${cols.map(c => `(${c.col},${c.color})`).join(" ")}`;
        });
        const colorList = [...usedColors].join(", ");
        // Find bounding box
        const allCols = sortedRows.flatMap(r => cellsByRow.get(r)!.map(c => c.col));
        const minR = sortedRows[0], maxR = sortedRows[sortedRows.length - 1];
        const minC = Math.min(...allCols), maxC = Math.max(...allCols);
        stateStr = `\nCurrent canvas (${totalCells} cells, grid: ${R.current.grid}, bounds: rows ${minR}..${maxR}, cols ${minC}..${maxC}):\nColors used: ${colorList}\n${rowDescs.join("\n")}`;
      } else {
        stateStr = "\nCanvas is empty.";
      }

      const g = R.current.grid;
      const gridGuides: Record<Grid, string> = {
        sq: `GRID: "sq" — Square grid. Standard row,col. Each cell is one solid square.
HOW TO COMPOSE: Think pixel art. Plan the silhouette row by row. Fill EVERY cell inside — no gaps.
EXAMPLE — solid arrow pointing right (center 0,0):
  Row -2: cols 1,2
  Row -1: cols 0,1,2,3
  Row  0: cols -3,-2,-1,0,1,2,3,4 (shaft + tip)
  Row  1: cols 0,1,2,3
  Row  2: cols 1,2`,

        rtri: `GRID: "rtri" — Right triangles. Two triangles share each rectangle. Even col = upper-left ◸, odd col = lower-right ◿.
HOW IT TILES: Columns go 0,1,2,3,4,5... Cols 0&1 form one rectangle, 2&3 the next, etc.
  - Even col (0,2,4): triangle with hypotenuse from top-right to bottom-left ◸
  - Odd col (1,3,5): triangle with hypotenuse from top-left to bottom-right ◿
  - Placing BOTH even+odd col fills a solid rectangle.
HOW TO COMPOSE: Use the diagonal edges to create sharp angles, arrows, and dynamic shapes. The diagonal cuts at 45° are perfect for:
  - Arrows/chevrons: use only even cols for a row of ◸◸◸, or only odd for ◿◿◿
  - Zigzag edges: alternate which triangle you place to get serrated borders
  - Solid blocks: place both even+odd col to fill the full rectangle
EXAMPLE — right-pointing chevron/arrow:
  Row -2: cols 4,5 (small filled rect at top)
  Row -1: cols 2,3,4,5,6 (wider, with extra odd col for point)
  Row  0: cols 0,1,2,3,4,5,6,7,8 (full shaft)
  Row  1: cols 2,3,4,5,6
  Row  2: cols 4,5
TIP: Use color contrast between ◸ and ◿ triangles to create diagonal stripe patterns.`,

        tri: `GRID: "tri" — Equilateral triangles. Cols are half-width. (r+c) even = ▲ up, (r+c) odd = ▽ down.
HOW IT TILES: Up and down triangles interlock. To fill a horizontal band solidly, place ALL cols (both up and down).
HOW TO COMPOSE: The 60° angles create crystal/gem-like designs. Great for:
  - Hexagonal shapes: 6 triangles around a center form a hexagon
  - Crystalline logos: angular, sharp, modern
  - LOW-POLY ART: Use "circle" action to fill a circular region, then "gradient" + "randomize" for faceted shading
  - Zigzag borders: place only up OR down triangles for sawtooth edges
LOW-POLY CIRCLE TECHNIQUE:
  1. {"type":"circle","row":0,"col":0,"radius":8,"color":"#3366cc"} — fills ~200 triangles in a circle
  2. {"type":"gradient","color1":"#1a3388","color2":"#66aaff","direction":"diagonal"} — smooth color sweep
  3. {"type":"randomize"} — adds per-triangle color variation for the faceted low-poly look
  This creates a beautiful faceted sphere/circle effect. Use cellSize:15-25 for denser triangles.
TIP: Color ▲ and ▽ differently for a faceted gem effect. Use circle+gradient+randomize for organic low-poly shapes.`,

        dia: `GRID: "dia" — Diamond/rhombus grid. Each cell is a ◇ rotated 45°. Odd rows offset right by half. Row spacing is halved (denser vertically).
HOW IT TILES: Diamonds interlock. Odd rows are shifted right by half a cell.
HOW TO COMPOSE: Natural for:
  - Diamond/argyle patterns
  - Logos with 45° rotated elements
  - Stacking diamonds to form larger shapes
EXAMPLE — large diamond:
  Row -2: col 0
  Row -1: cols -1,0,1
  Row  0: cols -2,-1,0,1,2 (widest)
  Row  1: cols -1,0,1
  Row  2: col 0
TIP: The offset rows mean a "column" zigzags. Use gradients diagonally for great effect.`,

        hex: `GRID: "hex" — Hexagonal grid. Pointy-top hexagons. Odd rows offset right by half. 6 neighbours per cell.
HOW IT TILES: Hexagons tessellate with offset rows. Each hex has 6 neighbors.
HOW TO COMPOSE: Best for:
  - Organic, natural-feeling logos (honeycombs, flowers)
  - Rounded shapes — hex edges approximate curves nicely
  - Snowflake/mandala designs using 6-fold symmetry
EXAMPLE — flower (set sym to "r6" for auto-symmetry):
  Row 0: col 0 (center, bright color)
  Row -1: cols -1,0 (petal)
  Row 1: cols 0,1 (petal)
  (symmetry fills the rest)
TIP: Use sym:"r6" for automatic 6-fold symmetry — place cells in one wedge and they replicate around.`,
      };
      const currentState = JSON.stringify({
        grid: g, cellSize: R.current.cellSize, bg: R.current.bg,
        sym: R.current.sym, strokeW: R.current.strokeW,
        strokeColor: R.current.strokeColor, cornerRadius: R.current.cornerRadius,
      });
      const systemPrompt = `You are a world-class logo designer. You design on a geometric grid by placing colored cells. You are an EXPERT at using EVERY grid type — sq, rtri, tri, dia, hex — and you create stunning, coherent designs on whichever grid is active.

${gridGuides[g]}

SETTINGS: ${currentState}
COORDS: (row, col). Row goes down, col goes right. Center around (0,0).

ACTIONS you can use:
- {"type":"set","grid":"sq","bg":"dark","cellSize":40,"sym":"none","strokeW":1,"strokeColor":"#1a1a2e","cornerRadius":3} — change ANY setting (only include keys you want)
- {"type":"clear"} — wipe canvas
- {"type":"place","cells":[{"row":0,"col":0,"color":"#ff0000"},...]}} — place cells
- {"type":"delete","cells":[{"row":0,"col":0},...]} — remove cells
- {"type":"rotate"} — rotate entire design 90° clockwise
- {"type":"flipH"} — flip entire design horizontally
- {"type":"flipV"} — flip entire design vertically
- {"type":"move","dr":2,"dc":-1} — shift entire design by row/col offset
- {"type":"gradient","color1":"#ff0000","color2":"#0000ff","direction":"horizontal"} — apply gradient across all cells. direction: "horizontal","vertical", or "diagonal"
- {"type":"recolor","from":"#ff0000","to":"#00ff00"} — replace one color with another throughout design
- {"type":"randomize"} — slightly randomize all cell colors for organic feel
- {"type":"circle","row":0,"col":0,"radius":6,"color":"#4466ff"} — fill a circle of cells centered at (row,col) with given radius (in grid cells). All cells whose center falls within the radius are filled.
- {"type":"ring","row":0,"col":0,"innerRadius":3,"outerRadius":6,"color":"#4466ff"} — fill a ring/annulus shape (hollow circle)

Reply ONLY with:
\`\`\`json
{"actions":[...],"message":"what I made"}
\`\`\`

CRITICAL RULES:
1. FILL SHAPES SOLIDLY. Every cell inside a shape's outline must be filled. No gaps, no checkerboard.
2. RESPECT THE CURRENT GRID. Design for whatever grid is active — do NOT switch to sq unless the user asks. Each grid type has unique strengths; use them.
3. Use 30-80+ cells for real designs. More cells = more detail = better.
4. Plan the silhouette row by row, then fill it. Think about how the specific grid's cell shapes tile together.
5. Use 2-3 bold, contrasting colors. Dark bg + bright shapes looks best. Set bg to "dark".
6. Add strokeW:1 with dark strokeColor for crisp edges.
7. Use cornerRadius:2-4 for polish (especially on sq/dia).
8. Use gradient to make designs look professional — much better than flat single-color fills.
9. Use rotate/flipH/flipV to create symmetrical designs or adjust orientation.
10. Use recolor to tweak colors without rebuilding.
11. When the user says "rotate", "flip", "move", "gradient", etc., use those actions — don't rebuild from scratch.
12. You can SEE the full canvas state below. When the user asks you to look at their work, ANALYZE the cell data to understand the design. Describe what you see, give feedback, and offer improvements.
13. For rtri: leverage the diagonal hypotenuse edges for sharp, dynamic angles. Color ◸ and ◿ differently for depth.
14. For tri: use ▲/▽ contrast for faceted crystal effects. Group 6 triangles into hex shapes.
15. For hex: use sym:"r6" for mandalas. Hexagons approximate curves — use many cells for rounded edges.
16. For dia: the 45° rotation is natural for argyle and diamond motifs. Gradients look especially good diagonally.

LOW-POLY ART TECHNIQUE (works on ALL grids, best on tri/rtri):
To create smooth organic shapes (circles, spheres, abstract blobs, letters with curves):
1. Use "circle" or "ring" to fill the base shape with cells
2. Apply "gradient" for a directional color sweep (gives depth/lighting)
3. Apply "randomize" so each cell gets a slightly different shade (the faceted low-poly look)
4. Use small cellSize (15-25) for denser cells = smoother curves
This combo turns geometric grids into stunning low-poly art. Use it for any curved or organic shape.
You can chain multiple circles/rings at different positions to build complex shapes (eyes, letters, icons).

Think like a geometric artist. Understand the grid's tiling pattern and USE it creatively.${stateStr}`;

      const prevMsgs = chatMsgsRef.current.slice(-10);
      const apiMsgs = prevMsgs.map(m => ({ role: m.role, content: m.text }));
      while (apiMsgs.length > 0 && apiMsgs[0].role !== "user") apiMsgs.shift();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 8192,
          system: systemPrompt,
          messages: apiMsgs,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`API ${res.status}: ${errBody.slice(0, 200)}`);
      }

      const data = await res.json();
      const aiText: string = data.content?.[0]?.text || "";

      let parsed: { actions?: unknown[]; message?: string } | null = null;
      const jsonMatch = aiText.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) try { parsed = JSON.parse(jsonMatch[1]); } catch { /* ignore */ }
      if (!parsed) {
        const braceMatch = aiText.match(/\{[\s\S]*"actions"[\s\S]*\}/);
        if (braceMatch) try { parsed = JSON.parse(braceMatch[0]); } catch { /* ignore */ }
      }

      if (parsed?.actions && Array.isArray(parsed.actions)) {
        pushHist(R.current.cells);
        // Apply setting changes first
        for (const action of parsed.actions as Record<string, unknown>[]) {
          if (action.type === "set") {
            if (typeof action.grid === "string" && ["tri", "rtri", "sq", "dia", "hex"].includes(action.grid))
              setGrid(action.grid as Grid);
            if (typeof action.cellSize === "number")
              setCellSize(Math.max(10, Math.min(80, action.cellSize as number)));
            if (typeof action.bg === "string" && ["dark", "light", "checker"].includes(action.bg))
              setBg(action.bg as BG);
            if (typeof action.sym === "string" && ["none", "mirror", "r3", "r4", "r6"].includes(action.sym))
              setSym(action.sym as Sym);
            if (typeof action.strokeW === "number")
              setStrokeW(Math.max(0, Math.min(10, action.strokeW as number)));
            if (typeof action.strokeColor === "string")
              setStrokeColor(action.strokeColor as string);
            if (typeof action.cornerRadius === "number")
              setCornerRadius(Math.max(0, Math.min(20, action.cornerRadius as number)));
          }
        }
        // Apply cell changes
        setCells(prev => {
          let m = new Map(prev);
          const g = R.current.grid;
          const sz = R.current.cellSize;
          for (const action of parsed!.actions as Record<string, unknown>[]) {
            if (action.type === "clear") {
              m.clear();
            } else if (action.type === "place" && Array.isArray(action.cells)) {
              for (const cell of action.cells as Record<string, unknown>[]) {
                if (typeof cell.row === "number" && typeof cell.col === "number") {
                  const clr = typeof cell.color === "string" ? cell.color : R.current.color;
                  const rad = typeof cell.radius === "number" ? (cell.radius as number) : R.current.cornerRadius;
                  m.set(gid(cell.row as number, cell.col as number), packCell(clr, rad, null));
                }
              }
            } else if (action.type === "delete" && Array.isArray(action.cells)) {
              for (const cell of action.cells as Record<string, unknown>[]) {
                if (typeof cell.row === "number" && typeof cell.col === "number") {
                  m.delete(gid(cell.row as number, cell.col as number));
                }
              }
            } else if (action.type === "rotate" && m.size > 0) {
              // Rotate all cells 90° clockwise around centroid
              const entries: [string, string][] = [...m.entries()];
              let sumX = 0, sumY = 0;
              entries.forEach(([k]) => {
                const [r, c] = k.split(",").map(Number);
                const cen = cellCen(g, r, c, sz);
                sumX += cen[0]; sumY += cen[1];
              });
              const cx = sumX / entries.length, cy = sumY / entries.length;
              const nm = new Map<string, string>();
              entries.forEach(([k, v]) => {
                const [r, c] = k.split(",").map(Number);
                const cen = cellCen(g, r, c, sz);
                const dx = cen[0] - cx, dy = cen[1] - cy;
                nm.set(hitCell(g, sz, cx - dy, cy + dx), v);
              });
              m = nm;
            } else if (action.type === "flipH" && m.size > 0) {
              const entries: [string, string][] = [...m.entries()];
              let sumX = 0;
              entries.forEach(([k]) => {
                const [r, c] = k.split(",").map(Number);
                sumX += cellCen(g, r, c, sz)[0];
              });
              const cx = sumX / entries.length;
              const nm = new Map<string, string>();
              entries.forEach(([k, v]) => {
                const [r, c] = k.split(",").map(Number);
                const cen = cellCen(g, r, c, sz);
                nm.set(hitCell(g, sz, 2 * cx - cen[0], cen[1]), v);
              });
              m = nm;
            } else if (action.type === "flipV" && m.size > 0) {
              const entries: [string, string][] = [...m.entries()];
              let sumY = 0;
              entries.forEach(([k]) => {
                const [r, c] = k.split(",").map(Number);
                sumY += cellCen(g, r, c, sz)[1];
              });
              const cy = sumY / entries.length;
              const nm = new Map<string, string>();
              entries.forEach(([k, v]) => {
                const [r, c] = k.split(",").map(Number);
                const cen = cellCen(g, r, c, sz);
                nm.set(hitCell(g, sz, cen[0], 2 * cy - cen[1]), v);
              });
              m = nm;
            } else if (action.type === "move" && typeof action.dr === "number" && typeof action.dc === "number") {
              const entries: [string, string][] = [...m.entries()];
              const nm = new Map<string, string>();
              entries.forEach(([k, v]) => {
                const [r, c] = k.split(",").map(Number);
                nm.set(gid(r + (action.dr as number), c + (action.dc as number)), v);
              });
              m = nm;
            } else if (action.type === "gradient" && m.size > 0) {
              const c1 = typeof action.color1 === "string" ? action.color1 as string : "#ff0000";
              const c2 = typeof action.color2 === "string" ? action.color2 as string : "#0000ff";
              const dir = typeof action.direction === "string" ? action.direction as string : "horizontal";
              const [r1, g1, b1] = hex2rgb(c1);
              const [r2, g2, b2] = hex2rgb(c2);
              const poses: { k: string; val: number }[] = [];
              m.forEach((_, k) => {
                const [r, c] = k.split(",").map(Number);
                const cen = cellCen(g, r, c, sz);
                const v = dir === "vertical" ? cen[1] : dir === "diagonal" ? cen[0] + cen[1] : cen[0];
                poses.push({ k, val: v });
              });
              const vMin = Math.min(...poses.map(p => p.val));
              const vMax = Math.max(...poses.map(p => p.val));
              const range = vMax - vMin || 1;
              poses.forEach(({ k, val }) => {
                const t = (val - vMin) / range;
                const clr = rgb2hex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
                const old = m.get(k);
                const { radius: oldR, mask: oldM } = old ? unpackCell(old) : { radius: 0, mask: null };
                m.set(k, packCell(clr, oldR, oldM));
              });
            } else if (action.type === "recolor" && typeof action.from === "string" && typeof action.to === "string") {
              const from = (action.from as string).toLowerCase();
              const to = action.to as string;
              m.forEach((v, k) => {
                const { color, radius, mask } = unpackCell(v);
                if (color.toLowerCase() === from) {
                  m.set(k, packCell(to, radius, mask));
                }
              });
            } else if (action.type === "randomize" && m.size > 0) {
              m.forEach((v, k) => {
                const { color: clr, radius: oldR, mask: oldM } = unpackCell(v);
                const [h, sat, l] = hex2hsl(clr);
                const nh = (h + (Math.random() - 0.5) * 0.1 + 1) % 1;
                const ns = Math.max(0, Math.min(1, sat + (Math.random() - 0.5) * 0.2));
                const nl = Math.max(0, Math.min(1, l + (Math.random() - 0.5) * 0.15));
                m.set(k, packCell(hsl2hex(nh, ns, nl), oldR, oldM));
              });
            } else if (action.type === "circle" && typeof action.row === "number" && typeof action.col === "number" && typeof action.radius === "number") {
              // Fill all cells within radius of center point
              const cr = action.row as number, cc = action.col as number;
              const rad = action.radius as number;
              const clr = typeof action.color === "string" ? action.color as string : "#ffffff";
              const cRad = R.current.cornerRadius;
              // Get world-space center of the anchor cell
              const center = cellCen(g, cr, cc, sz);
              const worldR = rad * sz;
              // Scan a generous range of grid cells and keep those within radius
              const scanR = Math.ceil(rad * 2.5);
              for (let dr = -scanR; dr <= scanR; dr++) {
                for (let dc = -scanR; dc <= scanR; dc++) {
                  const r2 = cr + dr, c2 = cc + dc;
                  const cen = cellCen(g, r2, c2, sz);
                  const dx = cen[0] - center[0], dy = cen[1] - center[1];
                  if (dx * dx + dy * dy <= worldR * worldR) {
                    m.set(gid(r2, c2), packCell(clr, cRad, null));
                  }
                }
              }
            } else if (action.type === "ring" && typeof action.row === "number" && typeof action.col === "number" && typeof action.outerRadius === "number") {
              const cr = action.row as number, cc = action.col as number;
              const outerR = action.outerRadius as number;
              const innerR = typeof action.innerRadius === "number" ? action.innerRadius as number : outerR * 0.5;
              const clr = typeof action.color === "string" ? action.color as string : "#ffffff";
              const cRad = R.current.cornerRadius;
              const center = cellCen(g, cr, cc, sz);
              const worldOuter = outerR * sz, worldInner = innerR * sz;
              const scanR = Math.ceil(outerR * 2.5);
              for (let dr = -scanR; dr <= scanR; dr++) {
                for (let dc = -scanR; dc <= scanR; dc++) {
                  const r2 = cr + dr, c2 = cc + dc;
                  const cen = cellCen(g, r2, c2, sz);
                  const dx = cen[0] - center[0], dy = cen[1] - center[1];
                  const d2 = dx * dx + dy * dy;
                  if (d2 <= worldOuter * worldOuter && d2 >= worldInner * worldInner) {
                    m.set(gid(r2, c2), packCell(clr, cRad, null));
                  }
                }
              }
            }
          }
          return m;
        });
        chatMsgsRef.current = [...chatMsgsRef.current, { role: "assistant", text: parsed.message || "Done!" }];
      } else {
        chatMsgsRef.current = [...chatMsgsRef.current, { role: "assistant", text: aiText || "No response" }];
      }
    } catch (err: unknown) {
      const msg2 = err instanceof Error ? err.message : String(err);
      chatMsgsRef.current = [...chatMsgsRef.current, { role: "assistant", text: `Error: ${msg2}` }];
    }
    setChatLoading(false);
    setChatVer(v => v + 1);
  }, [chatInput, chatLoading, pushHist]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatVer, chatLoading]);

  // ── Event handlers ─────────────────────────────────────────
  const handleDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const [wx, wy] = s2w(sx, sy);
    lastMouse.current = [e.clientX, e.clientY];

    // Right click = pan
    if (e.button === 2) {
      isPanning.current = true;
      return;
    }

    dragging.current = true;
    const { cellSize: s, tool: t, color: clr, opacity: op } = R.current;
    const k = hitCell(R.current.grid, s, wx, wy);

    if (t === "paint" && k) {
      pushHist(R.current.cells);
      if (R.current.cells.has(k)) {
        paintMode.current = "erase";
        applyCell(k, null);
      } else {
        paintMode.current = "paint";
        const hex = op < 100
          ? clr + Math.round(op * 2.55).toString(16).padStart(2, "0")
          : clr;
        applyCell(k, hex);
      }
    } else if (t === "erase" && k) {
      pushHist(R.current.cells);
      applyCell(k, null);
    } else if (t === "select") {
      if (k && R.current.sel.has(k)) {
        pushHist(R.current.cells);
        dragAnchor.current = k;
      } else if (k && R.current.cells.has(k)) {
        if (e.shiftKey) {
          setSel(prev => { const ns = new Set(prev); ns.add(k); return ns; });
        } else {
          setSel(new Set([k]));
        }
      } else {
        setSelBox({ x0: wx, y0: wy, x1: wx, y1: wy });
      }
    } else if (t === "pick") {
      const picked = R.current.cells.get(k);
      if (picked) {
        const { color: pickedClr, radius: pickedR, mask: pickedM } = unpackCell(picked);
        setColor(pickedClr.slice(0, 7));
        setCornerRadius(pickedR);
        if (pickedM) setCornerMask(pickedM);
        flash(`Picked ${pickedClr.slice(0, 7)}`);
      }
    } else if (t === "fill") {
      const hex = op < 100
        ? clr + Math.round(op * 2.55).toString(16).padStart(2, "0")
        : clr;
      floodFill(k, hex);
    } else if (t === "line") {
      if (!R.current.lineStart) {
        setLineStart([wx, wy]);
      } else {
        pushHist(R.current.cells);
        const hex = op < 100
          ? clr + Math.round(op * 2.55).toString(16).padStart(2, "0")
          : clr;
        const keys = lineCells(
          R.current.grid, s, R.current.lineStart[0], R.current.lineStart[1], wx, wy,
        );
        setCells(prev => {
          const m = new Map(prev);
          keys.forEach(lk => {
            const allKeys = getSymKeys(lk, R.current.sym);
            const { cornerRadius: cr2, cornerMask: cm2 } = R.current;
            const packedLine = packCell(hex, cr2, cm2.every(Boolean) ? null : cm2);
            allKeys.forEach(sk => m.set(sk, packedLine));
          });
          return m;
        });
        setLineStart(null);
      }
    }
  }, [s2w, pushHist, applyCell, floodFill, flash]);

  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (isPanning.current) {
      const dx = e.clientX - lastMouse.current[0];
      const dy = e.clientY - lastMouse.current[1];
      lastMouse.current = [e.clientX, e.clientY];
      setPan(p => [p[0] + dx / R.current.zoom, p[1] + dy / R.current.zoom]);
      return;
    }

    if (!dragging.current) return;
    const [wx, wy] = s2w(sx, sy);
    const { cellSize: s, tool: t, color: clr, opacity: op } = R.current;
    const k = hitCell(R.current.grid, s, wx, wy);

    if (t === "paint") {
      if (paintMode.current === "erase") {
        applyCell(k, null);
      } else {
        const hex = op < 100
          ? clr + Math.round(op * 2.55).toString(16).padStart(2, "0")
          : clr;
        applyCell(k, hex);
      }
    } else if (t === "erase") {
      applyCell(k, null);
    } else if (t === "select") {
      if (dragAnchor.current) {
        const dragK = hitCell(R.current.grid, s, wx, wy);
        if (dragK !== dragAnchor.current) {
          const [ar, ac] = dragAnchor.current.split(",").map(Number);
          const [kr, kc] = dragK.split(",").map(Number);
          const dr = kr - ar, dc = kc - ac;
          const curSel = R.current.sel;
          const curCells = R.current.cells;
          const nm = new Map(curCells);
          const entries: [string, string][] = [];
          curSel.forEach(sk => {
            const clr2 = nm.get(sk);
            if (clr2) entries.push([sk, clr2]);
            nm.delete(sk);
          });
          const newSel = new Set<string>();
          entries.forEach(([sk, clr2]) => {
            const [sr, scc] = sk.split(",").map(Number);
            const nk = gid(sr + dr, scc + dc);
            nm.set(nk, clr2);
            newSel.add(nk);
          });
          setCells(nm);
          setSel(newSel);
          dragAnchor.current = dragK;
        }
      } else {
        setSelBox(prev => prev ? { ...prev, x1: wx, y1: wy } : null);
      }
    }
  }, [s2w, applyCell]);

  const handleUp = useCallback((_e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning.current) {
      isPanning.current = false;
      return;
    }
    dragging.current = false;

    // End drag
    if (dragAnchor.current) {
      dragAnchor.current = null;
      return;
    }

    // Finalize selection box
    if (R.current.tool === "select" && R.current.selBox) {
      const { selBox: sb, cellSize: s, cells: c } = R.current;
      if (!sb) return;
      const x0 = Math.min(sb.x0, sb.x1);
      const x1 = Math.max(sb.x0, sb.x1);
      const y0 = Math.min(sb.y0, sb.y1);
      const y1 = Math.max(sb.y0, sb.y1);
      const newSel = new Set<string>();
      c.forEach((_val, k) => {
        const [r, col] = k.split(",").map(Number);
        const cen = cellCen(R.current.grid, r, col, s);
        if (cen[0] >= x0 && cen[0] <= x1 && cen[1] >= y0 && cen[1] <= y1) {
          newSel.add(k);
        }
      });
      setSel(newSel);
      setSelBox(null);
      if (newSel.size > 0) flash(`Selected ${newSel.size} cells`);
    }
  }, [flash]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.shiftKey) {
      setRot(r => r + e.deltaY * 0.002);
    } else {
      setZoom(z => Math.max(0.1, Math.min(10, z * (1 - e.deltaY * 0.001))));
    }
  }, []);

  // ── Keyboard handler ───────────────────────────────────────
  const handleKey = useCallback((e: KeyboardEvent) => {
    // Don't fire shortcuts when typing in inputs
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") {
      if (e.key === "Escape") {
        (e.target as HTMLElement).blur();
        setCmdOpen(false);
        setChatOpen(false);
      }
      return;
    }

    const meta = e.metaKey || e.ctrlKey;

    // Tool shortcuts (only when no modifier held)
    if (!meta && !e.shiftKey) {
      const upper = e.key.toUpperCase();
      const found = TOOL_LIST.find(ti => ti.k === upper);
      if (found) { setTool(found.t); return; }
      if (upper === "M") {
        setSym(prev => {
          const idx = SYM_LIST.findIndex(x => x.s === prev);
          return SYM_LIST[(idx + 1) % SYM_LIST.length].s;
        });
        return;
      }
    }

    // Arrow keys for moving selection
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && R.current.sel.size > 0) {
      e.preventDefault();
      const dr = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
      const dc = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
      moveSel(dr, dc);
      return;
    }

    // Delete / Backspace
    if (e.key === "Backspace" || e.key === "Delete") {
      deleteSel();
      return;
    }

    // Meta combos
    if (meta) {
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); }
      else if (e.key === "Z") { e.preventDefault(); redo(); }
      else if (e.key === "s") { e.preventDefault(); save(); }
      else if (e.key === "a") { e.preventDefault(); selectAll(); }
      else if (e.key === "d") { e.preventDefault(); deselect(); }
      else if (e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
    }
  }, [deleteSel, undo, redo, save, selectAll, deselect, moveSel]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // ── Command palette data ───────────────────────────────────
  const commands = [
    { name: "Save (Cmd+S)", fn: save },
    { name: "Undo (Cmd+Z)", fn: undo },
    { name: "Redo (Cmd+Shift+Z)", fn: redo },
    { name: "Select All (Cmd+A)", fn: selectAll },
    { name: "Deselect (Cmd+D)", fn: deselect },
    { name: "Delete Selected", fn: deleteSel },
    { name: "Clear All", fn: clearAll },
    { name: "Flip Horizontal", fn: flipH },
    { name: "Flip Vertical", fn: flipV },
    { name: "Rotate 90 degrees", fn: rotateSel90 },
    { name: "Gradient Fill", fn: gradientFill },
    { name: "Randomize Colors", fn: randomizeColors },
    { name: "Group Selection", fn: groupSel },
    { name: "Export PNG", fn: () => exportPNG() },
    { name: "Export PNG 16px", fn: () => exportPNG(16) },
    { name: "Export PNG 32px", fn: () => exportPNG(32) },
    { name: "Export PNG 64px", fn: () => exportPNG(64) },
    { name: "Export PNG 128px", fn: () => exportPNG(128) },
    { name: "Export PNG 512px", fn: () => exportPNG(512) },
    { name: "Export SVG", fn: exportSVG },
    { name: "Copy SVG", fn: copySVG },
    { name: "Share URL", fn: shareURL },
    { name: "Load Reference Image", fn: loadRefImage },
    { name: "Clear Reference Image", fn: () => { setRefImg(null); flash("Ref cleared"); } },
  ];
  const filteredCmds = commands.filter(c => c.name.toLowerCase().includes(cmdQ.toLowerCase()));

  // ── JSX return ─────────────────────────────────────────────
  const tb = "px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ease-out hover:scale-[1.04] active:scale-[0.96]";
  const tbOn = `${tb} bg-[#7c5cfc] text-white shadow-sm shadow-purple-200 lp-glow`;
  const tbOff = `${tb} text-gray-500 hover:text-gray-900 hover:bg-gray-50`;
  const pb = "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ease-out bg-gray-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-100 hover:scale-[1.02] active:scale-[0.96] hover:shadow-sm";

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f5f6f8] text-gray-900 text-sm select-none">
      {/* ── Top Toolbar ── */}
      <div className="h-12 flex-shrink-0 flex items-center bg-white border-b border-gray-200/80 px-4 gap-2.5 lp-fade-down">
        {/* Logo */}
        <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#7c5cfc] to-[#f472b6] transition-transform duration-300 hover:rotate-12 hover:scale-110" />
          <span className="font-semibold text-sm bg-gradient-to-r from-[#7c5cfc] to-[#f472b6] bg-clip-text text-transparent">
            LogoPaint
          </span>
        </div>

        {/* Shape selector */}
        <div className="flex items-center bg-gray-50 rounded-xl p-0.5 border border-gray-100 mr-1">
          {GRID_LIST.map(({ g: gType, icon }) => (
            <button
              key={gType}
              onClick={() => setGrid(gType)}
              className={`w-8 h-7 flex items-center justify-center rounded-lg text-base transition-all duration-150 ${
                grid === gType ? "bg-[#7c5cfc] text-white shadow-sm shadow-purple-200" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
              }`}
              title={`Shape: ${gType}`}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Tool selector */}
        <div className="flex items-center bg-gray-50 rounded-xl p-0.5 border border-gray-100">
          {TOOL_LIST.map(({ t, k, label }) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              className={tool === t ? tbOn : tbOff}
              title={`${label} (${k})`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Symmetry */}
        <div className="flex items-center bg-gray-50 rounded-xl p-0.5 border border-gray-100">
          {SYM_LIST.map(({ s: sType, icon }) => {
            const shortLabel = sType === "none" ? "Off" : sType === "mirror" ? "|" : sType === "r3" ? "R3" : sType === "r4" ? "R4" : "R6";
            return (
              <button
                key={sType}
                onClick={() => setSym(sType)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 ${
                  sym === sType
                    ? "bg-purple-100 text-purple-700 shadow-sm shadow-purple-100"
                    : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                }`}
                title={icon}
              >
                {shortLabel}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Zoom controls */}
        <div className="flex items-center bg-gray-50 rounded-xl p-0.5 gap-0.5 border border-gray-100">
          <button
            onClick={() => setZoom(z => Math.max(0.1, z / 1.3))}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-all text-sm"
            title="Zoom out"
          >
            −
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-2 py-1 rounded-md text-[11px] text-gray-400 hover:text-gray-900 hover:bg-gray-200 transition-all font-mono min-w-[44px] text-center"
            title="Reset zoom"
          >
            {(zoom * 100).toFixed(0)}%
          </button>
          <button
            onClick={() => setZoom(z => Math.min(10, z * 1.3))}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-all text-sm"
            title="Zoom in"
          >
            +
          </button>
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={undo}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-all"
            title="Undo (Cmd+Z)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
          </button>
          <button
            onClick={redo}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-all"
            title="Redo (Cmd+Shift+Z)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
          </button>
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button
          onClick={save}
          className="px-3.5 py-1.5 rounded-lg text-[11px] bg-[#7c5cfc] text-white hover:bg-[#6b4be0] transition-all duration-150 font-medium shadow-sm shadow-purple-200"
        >
          Save
        </button>
        <button
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          onClick={() => setCmdOpen(o => !o)}
          title="Command palette (Cmd+K)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </button>
      </div>

      {/* ── Main body: canvas + right panel ── */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas area */}
        <div ref={containerRef} className="flex-1 relative bg-gray-100" onContextMenu={e => e.preventDefault()}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair rounded-none"
            onMouseDown={handleDown}
            onMouseMove={handleMove}
            onMouseUp={handleUp}
            onWheel={handleWheel}
          />

          {/* Floating status */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-lg shadow-gray-200/50 text-[11px] text-gray-500 font-mono pointer-events-none lp-float-up">
            <span>{cells.size} cells</span>
            {sel.size > 0 && <span className="text-purple-400">{sel.size} selected</span>}
          </div>

          {/* Toast */}
          {toast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-xl bg-[#7c5cfc] text-white text-sm font-medium shadow-lg shadow-purple-300/50 pointer-events-none z-50 lp-pop">
              {toast}
            </div>
          )}

          {/* AI Chat */}
          {chatOpen ? (
            <div className="absolute bottom-3 left-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200/60 flex flex-col overflow-hidden z-40 lp-pop" style={{ maxHeight: "min(420px, calc(100% - 24px))" }}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-[#7c5cfc]/5 to-transparent flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#7c5cfc] animate-pulse" />
                  <span className="text-xs font-semibold text-gray-700">AI Assistant</span>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none transition-colors">&times;</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                {chatMsgsRef.current.map((m, i) => (
                  <div
                    key={`${i}-${chatVer}`}
                    className={`text-[13px] leading-relaxed px-3 py-2 rounded-xl max-w-[88%] transition-all ${
                      m.role === "user"
                        ? "ml-auto bg-[#7c5cfc] text-white rounded-br-md"
                        : "bg-gray-100 text-gray-700 rounded-bl-md"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-1 px-3 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7c5cfc] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7c5cfc] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7c5cfc] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-2.5 border-t border-gray-100 flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                    placeholder="Describe a logo..."
                    className="flex-1 px-3 py-2 text-[13px] rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#7c5cfc] transition-colors placeholder:text-gray-300"
                  />
                  <button
                    onClick={sendChat}
                    disabled={chatLoading}
                    className="px-3 py-2 rounded-xl bg-[#7c5cfc] text-white text-xs font-medium hover:bg-[#6b4be0] transition-all disabled:opacity-50 active:scale-95"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setChatOpen(true)}
              className="absolute bottom-14 left-3 w-9 h-9 rounded-full bg-[#7c5cfc] text-white shadow-lg shadow-purple-300/30 flex items-center justify-center hover:scale-110 transition-all z-40 lp-glow"
              title="AI Assistant"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
          )}

          {/* Command palette */}
          {cmdOpen && (
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-24 z-50 lp-backdrop"
              onClick={() => setCmdOpen(false)}
            >
              <div
                className="w-[480px] bg-white border border-gray-200/60 rounded-2xl shadow-2xl shadow-gray-300/40 overflow-hidden lp-drop"
                onClick={e => e.stopPropagation()}
              >
                <input
                  autoFocus
                  placeholder="Search commands..."
                  value={cmdQ}
                  onChange={e => setCmdQ(e.target.value)}
                  className="w-full px-5 py-4 bg-transparent text-gray-900 border-b border-gray-100 outline-none text-base placeholder:text-gray-300"
                  onKeyDown={e => {
                    if (e.key === "Escape") setCmdOpen(false);
                    if (e.key === "Enter" && filteredCmds.length > 0) {
                      filteredCmds[0].fn();
                      setCmdOpen(false);
                      setCmdQ("");
                    }
                  }}
                />
                <div className="max-h-80 overflow-y-auto py-1">
                  {filteredCmds.map(c => (
                    <button
                      key={c.name}
                      onClick={() => { c.fn(); setCmdOpen(false); setCmdQ(""); }}
                      className="w-full text-left px-5 py-2.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-gray-900 transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel ── */}
        <div className="w-72 flex-shrink-0 bg-white border-l border-gray-200/80 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full lp-slide-in">
          {/* Color */}
          <Pnl title="Color">
            <div className="grid grid-cols-6 gap-1.5 mb-3">
              {PALETTE.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-xl transition-all duration-150 ${
                    color === c
                      ? "ring-2 ring-[#7c5cfc] ring-offset-2 ring-offset-white scale-110 shadow-md"
                      : "hover:scale-110 shadow-sm shadow-gray-200/50"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-10 h-7 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs text-gray-500 font-mono">{color}</span>
            </div>
            <Sld label="Opacity" value={opacity} min={0} max={100} onChange={setOpacity} />
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
              <span className="text-[10px] text-gray-500 uppercase">Gradient</span>
              <input
                type="color"
                value={gradColor}
                onChange={e => setGradColor(e.target.value)}
                className="w-8 h-6 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs text-gray-500 font-mono">{gradColor}</span>
            </div>
          </Pnl>

          {/* Properties */}
          <Pnl title="Properties">
            <Sld label="Cell Size" value={cellSize} min={10} max={80} onChange={setCellSize} />
            <Sld label="Radius" value={cornerRadius} min={0} max={20} onChange={v => {
              setCornerRadius(v);
              if (R.current.sel.size > 0) {
                setCells(prev => {
                  const m = new Map(prev);
                  R.current.sel.forEach(sk => {
                    const val = m.get(sk);
                    if (val) {
                      const { color: c2, mask: m2 } = unpackCell(val);
                      m.set(sk, packCell(c2, v, m2));
                    }
                  });
                  return m;
                });
              }
            }} />
            {cornerRadius > 0 && (
              <div className="flex items-center gap-1.5 mt-1 mb-1">
                <span className="text-[10px] text-gray-400 uppercase w-14 flex-shrink-0">Corners</span>
                <div className="flex gap-1">
                  {cornerMask.map((on, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const newMask = cornerMask.map((v2, j) => j === i ? !v2 : v2);
                        setCornerMask(newMask);
                        if (R.current.sel.size > 0) {
                          setCells(prev => {
                            const m2 = new Map(prev);
                            R.current.sel.forEach(sk => {
                              const val = m2.get(sk);
                              if (val) {
                                const { color: c3, radius: r3 } = unpackCell(val);
                                m2.set(sk, packCell(c3, r3, newMask.every(Boolean) ? null : newMask));
                              }
                            });
                            return m2;
                          });
                        }
                      }}
                      className={`w-6 h-6 rounded-full text-[10px] font-medium transition-all ${
                        on
                          ? "bg-[#7c5cfc] text-white shadow-sm"
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const allOn = cornerMask.every(Boolean);
                    const newMask = cornerMask.map(() => !allOn);
                    setCornerMask(newMask);
                    if (R.current.sel.size > 0) {
                      setCells(prev => {
                        const m3 = new Map(prev);
                        R.current.sel.forEach(sk => {
                          const val = m3.get(sk);
                          if (val) {
                            const { color: c4, radius: r4 } = unpackCell(val);
                            m3.set(sk, packCell(c4, r4, newMask.every(Boolean) ? null : newMask));
                          }
                        });
                        return m3;
                      });
                    }
                  }}
                  className="text-[10px] text-gray-400 hover:text-gray-600 ml-auto"
                >
                  {cornerMask.every(Boolean) ? "None" : "All"}
                </button>
              </div>
            )}
            <div className="flex gap-1 mt-2 mb-2">
              {(["dark", "light", "checker"] as BG[]).map(b => (
                <button
                  key={b}
                  onClick={() => setBg(b)}
                  className={`flex-1 ${b === bg ? tbOn : pb}`}
                >
                  {b === "dark" ? "Dark" : b === "light" ? "Light" : "Check"}
                </button>
              ))}
            </div>
            <Sld
              label="Rotation"
              value={Math.round(rot * 180 / Math.PI)}
              min={-180}
              max={180}
              onChange={v => setRot(v * Math.PI / 180)}
            />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-gray-500 uppercase w-14">Stroke</span>
              <input
                type="color"
                value={strokeColor}
                onChange={e => setStrokeColor(e.target.value)}
                className="w-7 h-5 rounded cursor-pointer bg-transparent border-0"
              />
              <input
                type="range"
                min={0}
                max={6}
                value={strokeW}
                onChange={e => setStrokeW(+e.target.value)}
                className="flex-1 h-1 appearance-none bg-gray-200 rounded accent-[#7c5cfc]"
              />
              <span className="text-xs text-gray-500 w-4">{strokeW}</span>
            </div>
          </Pnl>

          {/* Selection */}
          <Pnl title={`Selection${sel.size > 0 ? ` (${sel.size})` : ""}`}>
            <div className="grid grid-cols-3 gap-1">
              {[
                { label: "All", fn: selectAll },
                { label: "None", fn: deselect },
                { label: "Delete", fn: deleteSel },
                { label: "Flip H", fn: flipH },
                { label: "Flip V", fn: flipV },
                { label: "Rot 90", fn: rotateSel90 },
                { label: "Gradient", fn: gradientFill },
                { label: "Random", fn: randomizeColors },
                { label: "Group", fn: groupSel },
              ].map(({ label, fn }) => (
                <button key={label} onClick={fn} className={pb}>{label}</button>
              ))}
            </div>
          </Pnl>

          {/* Export */}
          <Pnl title="Export">
            <div className="grid grid-cols-3 gap-1">
              <button onClick={() => exportPNG()} className={pb}>PNG</button>
              <button onClick={exportSVG} className={pb}>SVG</button>
              <button onClick={copySVG} className={pb}>Copy SVG</button>
            </div>
            <div className="flex gap-1 mt-1.5">
              {[16, 32, 64, 128, 512].map(sz => (
                <button key={sz} onClick={() => exportPNG(sz)} className={`flex-1 ${pb} text-[10px]`}>
                  {sz}
                </button>
              ))}
            </div>
            <button onClick={shareURL} className={`w-full mt-1.5 ${pb}`}>
              Share URL
            </button>
          </Pnl>

          {/* Preview */}
          <Pnl title="Preview">
            <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
              <canvas ref={prevRef} className="w-full" style={{ height: 120 }} />
            </div>
          </Pnl>

          {/* File & Templates */}
          <Pnl title="File">
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {TEMPLATES.map(tpl => (
                  <button key={tpl.name} onClick={() => loadTemplate(tpl)} className={`flex-1 ${pb}`}>
                    {tpl.name}
                  </button>
                ))}
              </div>
              <button onClick={loadRefImage} className={`w-full ${pb}`}>
                Load Reference Image
              </button>
              {refImg && (
                <>
                  <Sld label="Ref Opa" value={refOpacity} min={0} max={100} onChange={setRefOpacity} />
                  <button
                    onClick={() => { setRefImg(null); flash("Ref cleared"); }}
                    className={`w-full ${pb} !text-red-500 hover:!text-red-600`}
                  >
                    Clear Reference
                  </button>
                </>
              )}
              <button
                onClick={clearAll}
                className="w-full px-2.5 py-1.5 rounded-md text-xs transition-all duration-100 bg-red-50 text-red-500 hover:bg-red-100 active:scale-[0.97]"
              >
                Clear All
              </button>
            </div>
          </Pnl>

          {/* Groups */}
          {groups.length > 0 && (
            <Pnl title="Groups">
              <div className="space-y-1">
                {groups.map((grp, i) => (
                  <button
                    key={grp.id}
                    onClick={() => { setSel(new Set(grp.keys)); flash(`Selected group ${i + 1}`); }}
                    className={`w-full ${pb} flex items-center gap-2`}
                  >
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: grp.color }} />
                    Group {i + 1} ({grp.keys.size})
                  </button>
                ))}
              </div>
            </Pnl>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────
function Pnl({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-3.5 px-4 border-b border-gray-100/80 lp-fade-up">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-2.5">
        {title}
      </div>
      {children}
    </div>
  );
}

function Sld({
  label, value, min, max, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] text-gray-400 uppercase w-14 flex-shrink-0 font-medium">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1 appearance-none bg-gray-100 rounded-full accent-[#7c5cfc] cursor-pointer"
      />
      <span className="text-xs text-gray-500 font-mono w-8 text-right">{value}</span>
    </div>
  );
}
