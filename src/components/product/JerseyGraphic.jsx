import { useId } from 'react'

/**
 * Generated jersey artwork.
 *
 * Product photography is the single biggest thing a new store lacks, and
 * stock/AI images of real club kits raise their own problems. So each product
 * renders a deterministic SVG shirt from its own `primary_color` /
 * `secondary_color` and a pattern chosen by hashing its slug. The result is
 * original artwork, on-brand at any size, and it costs no network requests.
 *
 * The moment a real `thumbnail_url` exists, ProductCard renders the photo
 * instead — this is a fallback, not a replacement for a product shoot.
 */

/** Stable 0..n-1 from a string, so a product always looks the same. */
function hashIndex(text, buckets) {
  let h = 0
  for (let i = 0; i < (text?.length ?? 0); i += 1) {
    h = (h * 31 + text.charCodeAt(i)) % 100003
  }
  return Math.abs(h) % buckets
}

/** Pick readable text colour for an arbitrary shirt colour. */
function contrastInk(hex) {
  if (!hex) return '#0B1220'
  const clean = hex.replace('#', '')
  if (clean.length < 6) return '#0B1220'
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#0B1220' : '#FFFFFF'
}

const PATTERNS = ['solid', 'stripes', 'hoops', 'sash', 'halves', 'shoulder']

/** Clip path that traces the shirt, so patterns cannot bleed past the hem. */
const SHIRT_PATH =
  'M160 38C150 40 132 46 112 58L44 96L22 170L86 198L104 150L104 448' +
  'Q104 472 128 472L272 472Q296 472 296 448L296 150L314 198L378 170L356 96L288 58' +
  'C268 46 250 40 240 38Q200 62 160 38Z'

export default function JerseyGraphic({
  seed = 'jersey',
  primary = '#111827',
  secondary = '#F8FAFC',
  name = '',
  className = '',
  showNumber = true,
  pattern: patternOverride,
}) {
  const uid = useId().replace(/[:]/g, '')
  const pattern = patternOverride ?? PATTERNS[hashIndex(seed, PATTERNS.length)]
  const ink = contrastInk(primary)
  const trim = contrastInk(secondary)

  const clipId = `clip-${uid}`
  const shadeId = `shade-${uid}`
  const glowId = `glow-${uid}`

  // A plausible squad number, stable per product.
  const number = 7 + (hashIndex(seed + 'n', 24) % 24)

  return (
    <svg
      viewBox="0 0 400 500"
      className={className}
      role="img"
      aria-label={name ? `${name} jersey illustration` : 'Jersey illustration'}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={SHIRT_PATH} />
        </clipPath>
        {/* Soft vertical shading so the flat colour reads as fabric */}
        <linearGradient id={shadeId} x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stopColor="#000" stopOpacity="0.14" />
          <stop offset="28%" stopColor="#fff" stopOpacity="0.10" />
          <stop offset="62%" stopColor="#000" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.32" r="0.72">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Base colour */}
      <g clipPath={`url(#${clipId})`}>
        <rect width="400" height="500" fill={primary} />

        {/* --- pattern layer (clipped to the shirt) --------------------- */}
        {pattern === 'stripes' && (
          <g fill={secondary} opacity="0.9">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <rect key={i} x={70 + i * 34} y={0} width={15} height={500} />
            ))}
          </g>
        )}

        {pattern === 'hoops' && (
          <g fill={secondary} opacity="0.85">
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={0} y={110 + i * 78} width={400} height={30} />
            ))}
          </g>
        )}

        {pattern === 'sash' && (
          <path d="M-40 472L472 20L440 -40L-20 412Z" fill={secondary} opacity="0.9" />
        )}

        {pattern === 'halves' && (
          <path d="M200 0H400V500H200Z" fill={secondary} opacity="0.92" />
        )}

        {pattern === 'shoulder' && (
          <g fill={secondary} opacity="0.9">
            <path d="M0 0H400V150Q200 96 0 150Z" />
          </g>
        )}

        {/* Fabric lighting over the top of everything */}
        <rect width="400" height="500" fill={`url(#${glowId})`} />
        <rect width="400" height="500" fill={`url(#${shadeId})`} />
      </g>

      {/* Sleeve cuffs */}
      <g>
        <path d="M22 170L86 198L76 224L12 196Z" fill={secondary} opacity="0.95" />
        <path d="M378 170L314 198L324 224L388 196Z" fill={secondary} opacity="0.95" />
      </g>

      {/* Collar rib */}
      <path
        d="M160 38Q200 62 240 38"
        fill="none"
        stroke={ink}
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M160 38Q200 62 240 38"
        fill="none"
        stroke={secondary}
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Shoulder seams */}
      <path d="M112 58Q150 82 168 96" fill="none" stroke={ink} strokeWidth="1.6" opacity="0.22" />
      <path d="M288 58Q250 82 232 96" fill="none" stroke={ink} strokeWidth="1.6" opacity="0.22" />

      {/* Club crest (left chest) */}
      <g opacity="0.9">
        <path
          d="M124 108h30v30a15 15 0 01-15 15 15 15 0 01-15-15z"
          fill={secondary}
          stroke={ink}
          strokeWidth="2"
        />
        <path
          d="M132 122l6 7 12-14"
          fill="none"
          stroke={trim}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Maker mark (right chest) */}
      <g opacity="0.65" fill={ink}>
        <rect x="248" y="112" width="30" height="7" rx="3.5" />
        <rect x="256" y="124" width="22" height="5" rx="2.5" />
      </g>

      {/* Squad number */}
      {showNumber && (
        <text
          x="200"
          y="330"
          textAnchor="middle"
          fontFamily="'Barlow Condensed', Impact, sans-serif"
          fontSize="150"
          fontWeight="800"
          fill={ink}
          opacity="0.17"
        >
          {number}
        </text>
      )}

      {/* Team wordmark across the chest */}
      {name && (
        <text
          x="200"
          y="196"
          textAnchor="middle"
          fontFamily="'Barlow Condensed', Impact, sans-serif"
          fontSize={name.length > 14 ? 27 : 34}
          fontWeight="700"
          letterSpacing="1.5"
          fill={ink}
          opacity="0.5"
        >
          {name.toUpperCase().slice(0, 18)}
        </text>
      )}

      {/* Outline last so the silhouette stays crisp against any backdrop */}
      <path
        d={SHIRT_PATH}
        fill="none"
        stroke={ink}
        strokeWidth="2.5"
        strokeLinejoin="round"
        opacity="0.35"
      />
    </svg>
  )
}
