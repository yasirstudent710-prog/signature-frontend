/**
 * Atmospheric detective-office scene (bookshelves, banker's lamp, case papers, magnifying
 * glass) drawn as inline SVG: no image assets, no dependencies. Decorative only.
 */
const SPINES = ["#542b32", "#45594a", "#7a5d2f", "#3f1f25", "#5b4636", "#2f4338", "#8a6b3a", "#6a3a40"];

const shelf = (y, count, seed) => {
  let x = 34;
  return Array.from({ length: count }).map((_, i) => {
    const w = 16 + ((i * 7 + seed) % 11);
    const h = 78 + ((i * 37 + seed * 13) % 34);
    const book = { x, y: y - h, w, h, fill: SPINES[(i + seed) % SPINES.length], band: (i + seed) % 3 === 0 };
    x += w + 2;
    return book;
  });
};

export default function OfficeIllustration({ className = "" }) {
  const rows = [
    { y: 168, books: shelf(168, 26, 1) },
    { y: 292, books: shelf(292, 26, 4) },
  ];

  return (
    <svg viewBox="0 0 640 600" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a3027" />
          <stop offset="1" stopColor="#38251f" />
        </linearGradient>
        <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b3338" />
          <stop offset="1" stopColor="#3f1f25" />
        </linearGradient>
        <radialGradient id="glow" cx="0.78" cy="0.5" r="0.7">
          <stop offset="0" stopColor="#d2b98a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#d2b98a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5e6bf" stopOpacity="0.38" />
          <stop offset="1" stopColor="#f5e6bf" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="640" height="600" fill="url(#wall)" />

      {/* bookshelves */}
      <g opacity="0.9">
        {rows.map((row) => (
          <g key={row.y}>
            {row.books.map((b, i) => (
              <g key={i}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.fill} rx="1.5" />
                {b.band && <rect x={b.x} y={b.y + 14} width={b.w} height="3" fill="#b08d57" opacity="0.8" />}
                <rect x={b.x + b.w - 3} y={b.y} width="2" height={b.h} fill="#000" opacity="0.18" />
              </g>
            ))}
            <rect x="26" y={row.y} width="588" height="8" fill="#2a1913" />
            <rect x="26" y={row.y} width="588" height="1.5" fill="#b08d57" opacity="0.6" />
          </g>
        ))}
      </g>

      {/* lamp light */}
      <rect width="640" height="600" fill="url(#glow)" className="anim-flicker" />

      {/* desk */}
      <rect y="388" width="640" height="212" fill="url(#desk)" />
      <rect y="388" width="640" height="3" fill="#b08d57" opacity="0.7" />

      {/* stack of books, left */}
      <g>
        <rect x="46" y="358" width="150" height="30" rx="2" fill="#45594a" />
        <rect x="46" y="364" width="150" height="3" fill="#b08d57" opacity="0.85" />
        <rect x="58" y="330" width="130" height="28" rx="2" fill="#542b32" />
        <rect x="58" y="336" width="130" height="3" fill="#b08d57" opacity="0.85" />
        <rect x="52" y="304" width="138" height="26" rx="2" fill="#7a5d2f" />
        <rect x="52" y="310" width="138" height="3" fill="#eae0cc" opacity="0.6" />
      </g>

      {/* case papers with signature */}
      <g transform="rotate(-6 300 470)">
        <rect x="190" y="418" width="250" height="150" fill="#f5f0e6" stroke="#b08d57" strokeWidth="1.2" />
        {[440, 456, 472, 488, 504].map((y, i) => (
          <rect key={y} x="208" y={y} width={190 - (i % 3) * 30} height="4" rx="2" fill="#292723" opacity="0.16" />
        ))}
        <path d="M210 540c10-26 18-26 22-6s12 12 20-10 16-8 22 6 14 6 24-8 18 4 28 0" stroke="#542b32" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </g>
      <g transform="rotate(7 420 480)">
        <rect x="330" y="436" width="170" height="110" fill="#eae0cc" stroke="#b08d57" strokeWidth="1" opacity="0.95" />
        <rect x="346" y="456" width="120" height="4" rx="2" fill="#292723" opacity="0.15" />
        <rect x="346" y="470" width="90" height="4" rx="2" fill="#292723" opacity="0.15" />
      </g>

      {/* magnifying glass */}
      <g transform="rotate(-18 330 500)">
        <circle cx="318" cy="492" r="46" fill="#f5f0e6" fillOpacity="0.16" stroke="#b08d57" strokeWidth="7" />
        <circle cx="318" cy="492" r="40" fill="none" stroke="#d2b98a" strokeOpacity="0.5" strokeWidth="1.5" />
        <path d="M296 476c6-10 18-14 28-12" stroke="#fff" strokeOpacity="0.55" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="350" y="524" width="14" height="76" rx="6" transform="rotate(-42 357 524)" fill="#38251f" stroke="#b08d57" strokeWidth="2" />
      </g>

      {/* banker's lamp */}
      <g>
        <polygon points="496,258 556,258 610,388 450,388" fill="url(#cone)" className="anim-flicker" />
        <ellipse cx="540" cy="392" rx="38" ry="8" fill="#7a5d2f" />
        <rect x="534" y="316" width="12" height="76" fill="#b08d57" />
        <path d="M498 262 q42 -44 84 0 z" fill="#45594a" stroke="#b08d57" strokeWidth="2.5" />
        <rect x="496" y="260" width="88" height="4" fill="#b08d57" />
        <circle cx="540" cy="264" r="6" fill="#f5e6bf" className="anim-flicker" />
      </g>
    </svg>
  );
}
