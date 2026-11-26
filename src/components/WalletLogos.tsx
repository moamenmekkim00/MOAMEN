import { useId } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_WALLET_ICONS, WalletIconId } from '../data/customization';
import { isBuiltinWalletType, WalletType } from '../types/debt';

/**
 * Colorful 3D Pixar-style internal wallet icons:
 * Plush multi-stop gradients, soft clay/glossy lighting, jelly-bean specular highlights,
 * warm rim glow, and unique per-instance SVG IDs (via React useId) so multiple icons
 * never collide in the DOM.
 */

function Tile({
  uid,
  from,
  mid,
  to,
  rim = '#FFFFFF',
  size,
  children,
}: {
  uid: string;
  from: string;
  mid?: string;
  to: string;
  rim?: string;
  size: number;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className="shrink-0"
      aria-hidden="true"
      style={{ filter: 'drop-shadow(0 4px 5px rgba(15,23,42,0.22))' }}
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={from} />
          {mid && <stop offset="0.52" stopColor={mid} />}
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.52" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.24" />
        </linearGradient>
        <radialGradient id={`${uid}-gloss`} cx="0.32" cy="0.18" r="0.65">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.46" />
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0.10" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="19" fill={`url(#${uid}-bg)`} />
      <rect x="3" y="3" width="58" height="58" rx="19" fill={`url(#${uid}-shade)`} />
      <rect x="3" y="3" width="58" height="58" rx="19" fill={`url(#${uid}-gloss)`} />
      <rect
        x="4.2"
        y="4.2"
        width="55.6"
        height="55.6"
        rx="18"
        fill="none"
        stroke={rim}
        strokeOpacity="0.26"
        strokeWidth="1.4"
      />
      <path
        d="M10 23C10 12 18 7.5 32 7.5C46 7.5 54 12 54 23C45 17 19 17 10 23Z"
        fill="#fff"
        opacity="0.26"
      />
      {children}
    </svg>
  );
}

export function WalletLogo({
  type,
  iconId,
  size = 48,
}: {
  type?: WalletType;
  iconId?: WalletIconId;
  size?: number;
}) {
  const rawUid = useId();
  const uid = `wl${rawUid.replace(/[^a-zA-Z0-9]/g, '')}`;
  const fallbackIcon: WalletIconId =
    type && isBuiltinWalletType(type) ? DEFAULT_WALLET_ICONS[type] : 'app_bank_card';
  const resolved: WalletIconId = iconId || fallbackIcon;

  // =========================================================================
  // INSTAPAY (5 Authentic Official InstaPay Egypt Styles — Purple #5B2D90 & Orange #F58220)
  // Official InstaPay silhouette: interlocking sweeping instant-transfer swoosh/arrow ribbon
  // with signature upper-right orange wave + bold white/purple speed curve.
  // =========================================================================
  const renderInstaPayEmblem = (
    primaryFill: string,
    accentFill: string,
    shadowColor = 'rgba(25,8,52,0.22)'
  ) => (
    <g>
      {/* Subtle 3D drop shadow */}
      <g transform="translate(0 1.8)" opacity="0.28">
        <path
          d="M16 37.5C16 26.5 24.5 18 35.5 18H45.5C47.2 18 48.2 19.8 47.2 21.2L41.8 29.2C41.2 30.1 40.2 30.6 39.1 30.6H34.2C29.4 30.6 25.8 34 25.2 38.6C24.9 40.5 23.2 41.8 21.3 41.8H18.4C17 41.8 16 40.6 16 39.2V37.5Z"
          fill={shadowColor}
        />
        <path
          d="M48 26.5C48 37.5 39.5 46 28.5 46H18.5C16.8 46 15.8 44.2 16.8 42.8L22.2 34.8C22.8 33.9 23.8 33.4 24.9 33.4H29.8C34.6 33.4 38.2 30 38.8 25.4C39.1 23.5 40.8 22.2 42.7 22.2H45.6C47 22.2 48 23.4 48 24.8V26.5Z"
          fill={shadowColor}
        />
      </g>
      {/* Upper sweeping InstaPay curve + instant forward arrow (primary) */}
      <path
        d="M15.5 36.2C15.5 25.2 24.2 16.8 35.4 16.8H44.6L40.4 12.6C39.4 11.6 40.1 10 41.5 10H43.4C44.3 10 45.1 10.4 45.7 11L52.2 17.6C53.2 18.6 53.2 20.2 52.2 21.2L45.7 27.8C45.1 28.4 44.3 28.8 43.4 28.8H41.5C40.1 28.8 39.4 27.1 40.4 26.1L44.2 22.3H35.4C28.2 22.3 22.4 28 22.1 35.1C22 36.8 20.6 38.1 18.9 38.1H17.4C16.3 38.1 15.5 37.2 15.5 36.2Z"
        fill={primaryFill}
      />
      {/* Lower interlocking InstaPay Orange instant curve + return arrow (accent) */}
      <path
        d="M48.5 27.8C48.5 38.8 39.8 47.2 28.6 47.2H19.4L23.6 51.4C24.6 52.4 23.9 54 22.5 54H20.6C19.7 54 18.9 53.6 18.3 53L11.8 46.4C10.8 45.4 10.8 43.8 11.8 42.8L18.3 36.2C18.9 35.6 19.7 35.2 20.6 35.2H22.5C23.9 35.2 24.6 36.9 23.6 37.9L19.8 41.7H28.6C35.8 41.7 41.6 36 41.9 28.9C42 27.2 43.4 25.9 45.1 25.9H46.6C47.7 25.9 48.5 26.8 48.5 27.8Z"
        fill={accentFill}
      />
      {/* Central glowing instant spark dot */}
      <circle cx="32" cy="32" r="3.4" fill={accentFill} />
      <circle cx="31.1" cy="31.1" r="1.2" fill="#FFFFFF" opacity="0.85" />
    </g>
  );

  // 0. OFFICIAL INSTAPAY APP ICON (Authentic Official Purple Tile + Iconic Mark + INSTAPAY wordmark)
  if (resolved === 'instapay_official') {
    return (
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className="shrink-0"
        aria-hidden="true"
        style={{ filter: 'drop-shadow(0 3px 5px rgba(59,21,106,0.28))' }}
      >
        <defs>
          <linearGradient id={`${uid}-ip-off-bg`} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#652B9E" />
            <stop offset="0.55" stopColor="#532086" />
            <stop offset="1" stopColor="#3D1469" />
          </linearGradient>
          <linearGradient id={`${uid}-ip-off-or`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF9A2E" />
            <stop offset="1" stopColor="#F07014" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="58" height="58" rx="16" fill={`url(#${uid}-ip-off-bg)`} />
        <rect
          x="3.7"
          y="3.7"
          width="56.6"
          height="56.6"
          rx="15.3"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.14"
          strokeWidth="1.2"
        />
        {/* Scaled official interlocking InstaPay emblem in upper-center */}
        <g transform="translate(8 3.5) scale(0.75)">
          {renderInstaPayEmblem('#FFFFFF', `url(#${uid}-ip-off-or)`, 'rgba(20,5,40,0.28)')}
        </g>
        {/* Crisp official INSTAPAY two-tone wordmark */}
        <text
          x="32"
          y="53.2"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          fontWeight="800"
          fontSize="8.8"
          letterSpacing="0.45"
        >
          <tspan fill="#FFFFFF">INSTA</tspan>
          <tspan fill="#FF9429">PAY</tspan>
        </text>
      </svg>
    );
  }

  // 1. Original Moamen Purple Lightning Bolt (3D Glossy Style)
  if (resolved === 'instapay_violet_bolt') {
    return (
      <Tile uid={uid} from="#A76BFF" mid="#7C3AED" to="#451A8A" size={size}>
        <defs>
          <linearGradient id={`${uid}-bolt`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.65" stopColor="#FFE6C2" />
            <stop offset="1" stopColor="#F58220" />
          </linearGradient>
        </defs>
        <path
          d="M37.5 14 L21.5 36 H31.5 L27.5 52 L44.5 29 H34 Z"
          fill="#2E1065"
          opacity="0.30"
        />
        <path
          d="M37 13 L21 35 H31 L27 51 L44 28 H33.5 Z"
          fill={`url(#${uid}-bolt)`}
          stroke="#FFD9B0"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path d="M35.5 17.5 L26 31" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
        <circle cx="46.5" cy="18" r="3.6" fill="#F58220" />
        <circle cx="45.3" cy="16.8" r="1.2" fill="#fff" opacity="0.92" />
      </Tile>
    );
  }

  // 2. Original InstaPay White App Icon (Official White tile + Purple & Orange mark)
  if (resolved === 'instapay_sunset_flash') {
    return (
      <Tile uid={uid} from="#FFFFFF" mid="#FAF7FF" to="#EFE8FB" rim="#5B2D90" size={size}>
        <defs>
          <linearGradient id={`${uid}-ip-pur`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7738BD" />
            <stop offset="1" stopColor="#4B1E80" />
          </linearGradient>
          <linearGradient id={`${uid}-ip-or2`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF9E32" />
            <stop offset="1" stopColor="#F07113" />
          </linearGradient>
        </defs>
        <rect
          x="4.5"
          y="4.5"
          width="55"
          height="55"
          rx="18"
          fill="none"
          stroke="#5B2D90"
          strokeOpacity="0.18"
          strokeWidth="1.6"
        />
        {renderInstaPayEmblem(`url(#${uid}-ip-pur)`, `url(#${uid}-ip-or2)`, 'rgba(91,45,144,0.18)')}
      </Tile>
    );
  }

  // 3. InstaPay 3D Raised White Medallion on Official Purple Tile
  if (resolved === 'instapay_cyan_rocket') {
    return (
      <Tile uid={uid} from="#7A3AC4" mid="#5B2D90" to="#3A1468" size={size}>
        <defs>
          <radialGradient id={`${uid}-ip-plate`} cx="0.35" cy="0.28" r="0.82">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.78" stopColor="#F6F1FC" />
            <stop offset="1" stopColor="#E9DCF8" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="33.5" r="21" fill="#240A47" opacity="0.28" />
        <circle
          cx="32"
          cy="32"
          r="21"
          fill={`url(#${uid}-ip-plate)`}
          stroke="#F58220"
          strokeOpacity="0.55"
          strokeWidth="1.8"
        />
        <g transform="translate(6.4 6.4) scale(0.8)">
          {renderInstaPayEmblem('#5B2D90', '#F58220', 'rgba(91,45,144,0.16)')}
        </g>
      </Tile>
    );
  }

  // 4. InstaPay Dual Official Gradient (Purple-to-Orange Brand Split + Pure White Mark)
  if (resolved === 'instapay_mint_card') {
    return (
      <Tile uid={uid} from="#5B2D90" mid="#8D3B72" to="#F58220" size={size}>
        <defs>
          <linearGradient id={`${uid}-ip-w`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#FFF3E6" />
          </linearGradient>
        </defs>
        {/* Soft inner bezel ring */}
        <rect
          x="7.5"
          y="7.5"
          width="49"
          height="49"
          rx="15"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.24"
          strokeWidth="1.4"
        />
        {renderInstaPayEmblem('#FFFFFF', `url(#${uid}-ip-w)`, 'rgba(40,12,68,0.28)')}
        {/* Signature orange accent dot */}
        <circle cx="32" cy="32" r="3.6" fill="#FF9E32" stroke="#FFFFFF" strokeWidth="1.4" />
      </Tile>
    );
  }

  // 5. InstaPay Dark Royal Edition (Midnight Purple + Glowing Orange & White Original Mark)
  if (resolved === 'instapay_neon_pulse') {
    return (
      <Tile uid={uid} from="#3A1866" mid="#240D45" to="#15072B" rim="#F58220" size={size}>
        <defs>
          <linearGradient id={`${uid}-ip-dkor`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFB347" />
            <stop offset="0.55" stopColor="#F58220" />
            <stop offset="1" stopColor="#EA580C" />
          </linearGradient>
        </defs>
        <rect
          x="6.5"
          y="6.5"
          width="51"
          height="51"
          rx="16"
          fill="none"
          stroke="#F58220"
          strokeOpacity="0.35"
          strokeWidth="1.4"
        />
        {renderInstaPayEmblem('#FFFFFF', `url(#${uid}-ip-dkor)`, 'rgba(0,0,0,0.45)')}
      </Tile>
    );
  }

  // =========================================================================
  // VODAFONE CASH (5 Authentic Official Vodafone Styles — Vodafone Red #E60000 & White)
  // Iconic Vodafone Speechmark (quotation teardrop) preserved across all 5 styles.
  // =========================================================================
  const vodafoneSpeechmarkPath =
    'M33.8 17.2C26.2 17.2 20.6 23.0 20.6 30.3C20.6 36.8 25.3 42.2 31.9 42.2C38.1 42.2 42.4 37.6 42.4 32.1C42.4 27.6 39.0 24.4 34.8 24.4C32.4 24.4 30.6 25.6 29.9 27.1C30.2 22.3 33.2 19.6 37.2 18.5L33.8 17.2Z';

  // 0. OFFICIAL VODAFONE / ANA VODAFONE APP ICON (Clean Authentic Vodafone Red #E60000 + White Circle + Red Speechmark)
  if (resolved === 'vodafone_official') {
    return (
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className="shrink-0"
        aria-hidden="true"
        style={{ filter: 'drop-shadow(0 3px 5px rgba(180,0,0,0.26))' }}
      >
        <defs>
          <linearGradient id={`${uid}-vf-off-bg`} x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0" stopColor="#F20A0A" />
            <stop offset="0.5" stopColor="#E60000" />
            <stop offset="1" stopColor="#CC0000" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="58" height="58" rx="16" fill={`url(#${uid}-vf-off-bg)`} />
        <rect
          x="3.7"
          y="3.7"
          width="56.6"
          height="56.6"
          rx="15.3"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.16"
          strokeWidth="1.2"
        />
        {/* Crisp official pure white circle + exact Vodafone red speechmark */}
        <circle cx="32" cy="32" r="20.5" fill="#FFFFFF" />
        <path d={vodafoneSpeechmarkPath} fill="#E60000" transform="translate(0.5 2.3)" />
      </svg>
    );
  }

  // 1. Classic 3D Glossy Vodafone Red (Original Moamen 3D style)
  if (resolved === 'vodafone_classic_red') {
    return (
      <Tile uid={uid} from="#FF3333" mid="#E60000" to="#A80000" size={size}>
        <defs>
          <radialGradient id={`${uid}-vf-ball`} cx="0.35" cy="0.28" r="0.82">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.78" stopColor="#FFF4F4" />
            <stop offset="1" stopColor="#FEE2E2" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="34" r="19.5" fill="#7F0000" opacity="0.26" />
        <circle cx="32" cy="32.2" r="19.5" fill={`url(#${uid}-vf-ball)`} />
        <path d={vodafoneSpeechmarkPath} fill="#E60000" transform="translate(0 2.5)" />
        <ellipse cx="25" cy="21" rx="6.2" ry="2.8" fill="#FFFFFF" opacity="0.75" transform="rotate(-25 25 21)" />
      </Tile>
    );
  }

  // 2. Original Vodafone White (Official White tile + Iconic Red Circle + Crisp White Speechmark)
  if (resolved === 'vodafone_ruby_wallet') {
    return (
      <Tile uid={uid} from="#FFFFFF" mid="#FFF8F8" to="#FFEBEB" rim="#E60000" size={size}>
        <defs>
          <radialGradient id={`${uid}-vf-redorb`} cx="0.35" cy="0.28" r="0.85">
            <stop offset="0" stopColor="#FF3B3B" />
            <stop offset="0.58" stopColor="#E60000" />
            <stop offset="1" stopColor="#B30000" />
          </radialGradient>
        </defs>
        <rect
          x="4.5"
          y="4.5"
          width="55"
          height="55"
          rx="18"
          fill="none"
          stroke="#E60000"
          strokeOpacity="0.18"
          strokeWidth="1.6"
        />
        <circle cx="32" cy="34" r="19.5" fill="#990000" opacity="0.18" />
        <circle cx="32" cy="32.2" r="19.5" fill={`url(#${uid}-vf-redorb)`} />
        <path d={vodafoneSpeechmarkPath} fill="#FFFFFF" transform="translate(0 2.5)" />
        <ellipse cx="24.5" cy="20.5" rx="6" ry="2.6" fill="#FFFFFF" opacity="0.38" transform="rotate(-25 24.5 20.5)" />
      </Tile>
    );
  }

  // 3. Vodafone Cash Classic + Cash Coin Badge (Original Red + White Circle + Red Mark + Gold Cash Badge)
  if (resolved === 'vodafone_coral_phone') {
    return (
      <Tile uid={uid} from="#FF3333" mid="#E60000" to="#A80000" size={size}>
        <defs>
          <radialGradient id={`${uid}-vf-cball`} cx="0.35" cy="0.28" r="0.82">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#FEE2E2" />
          </radialGradient>
          <radialGradient id={`${uid}-vf-coin`} cx="0.35" cy="0.3" r="0.85">
            <stop offset="0" stopColor="#FEF08A" />
            <stop offset="0.65" stopColor="#F59E0B" />
            <stop offset="1" stopColor="#B45309" />
          </radialGradient>
        </defs>
        <circle cx="29.5" cy="31.5" r="17.8" fill="#7F0000" opacity="0.24" transform="translate(0 1.6)" />
        <circle cx="29.5" cy="30" r="17.8" fill={`url(#${uid}-vf-cball)`} />
        <g transform="translate(1.5 2.5) scale(0.88)">
          <path d={vodafoneSpeechmarkPath} fill="#E60000" />
        </g>
        {/* Subtle Cash gold coin badge on bottom-right corner */}
        <circle cx="46.5" cy="46.5" r="9.5" fill={`url(#${uid}-vf-coin)`} stroke="#FFFFFF" strokeWidth="2.2" />
        <path
          d="M46.5 41.6V51.4M43.8 44.3C43.8 43.2 45 42.6 46.5 42.6C48 42.6 49.2 43.2 49.2 44.3C49.2 46.1 43.8 46.1 43.8 48.1C43.8 49.3 45 50 46.5 50C48.1 50 49.2 49.3 49.2 48.1"
          stroke="#78350F"
          strokeWidth="1.9"
          strokeLinecap="round"
          fill="none"
        />
      </Tile>
    );
  }

  // 4. Vodafone 3D Embossed Glass (Pure Vodafone Red tile + Raised Double Ring + 3D White Speechmark)
  if (resolved === 'vodafone_berry_orb') {
    return (
      <Tile uid={uid} from="#FF2929" mid="#E60000" to="#9E0000" size={size}>
        {/* Sleek glass double bezel */}
        <circle cx="32" cy="32" r="21" fill="#FFFFFF" fillOpacity="0.12" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.8" />
        <circle cx="32" cy="32" r="16.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="1.2" />
        {/* Soft 3D shadow + large crisp white Vodafone speechmark */}
        <path d={vodafoneSpeechmarkPath} fill="#660000" opacity="0.34" transform="translate(0 4.5)" />
        <path d={vodafoneSpeechmarkPath} fill="#FFFFFF" transform="translate(0 2.6)" />
        <ellipse cx="26.5" cy="31" rx="3.4" ry="1.8" fill="#FFFFFF" opacity="0.55" transform="rotate(-25 26.5 31)" />
      </Tile>
    );
  }

  // 5. Vodafone Dark Mode (Sleek Charcoal Dark tile + Official Vodafone Red Orb + Crisp White Speechmark)
  if (resolved === 'vodafone_dark_crimson') {
    return (
      <Tile uid={uid} from="#36363D" mid="#1D1D22" to="#111114" rim="#FF3B3B" size={size}>
        <defs>
          <radialGradient id={`${uid}-vf-dkred`} cx="0.35" cy="0.28" r="0.82">
            <stop offset="0" stopColor="#FF3B3B" />
            <stop offset="0.58" stopColor="#E60000" />
            <stop offset="1" stopColor="#990000" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="33.5" r="19.5" fill="#000000" opacity="0.4" />
        <circle
          cx="32"
          cy="32.2"
          r="19.5"
          fill={`url(#${uid}-vf-dkred)`}
          stroke="#FF6666"
          strokeOpacity="0.4"
          strokeWidth="1.5"
        />
        <path d={vodafoneSpeechmarkPath} fill="#FFFFFF" transform="translate(0 2.5)" />
        <ellipse cx="25" cy="20.5" rx="6" ry="2.6" fill="#FFFFFF" opacity="0.38" transform="rotate(-24 25 20.5)" />
      </Tile>
    );
  }

  // =========================================================================
  // CASH (5 Colorful 3D Pixar-Style Icons)
  // =========================================================================
  if (resolved === 'cash_gold_coins') {
    return (
      <Tile uid={uid} from="#FBBF24" mid="#F59E0B" to="#B45309" size={size}>
        <defs>
          <radialGradient id={`${uid}-gc1`} cx="0.35" cy="0.28" r="0.85">
            <stop offset="0" stopColor="#FFFBEB" />
            <stop offset="0.5" stopColor="#FDE047" />
            <stop offset="1" stopColor="#D97706" />
          </radialGradient>
          <radialGradient id={`${uid}-gc2`} cx="0.35" cy="0.28" r="0.85">
            <stop offset="0" stopColor="#FEF9C3" />
            <stop offset="1" stopColor="#EAB308" />
          </radialGradient>
        </defs>
        {/* Back coin */}
        <circle cx="40" cy="25" r="13" fill={`url(#${uid}-gc2)`} stroke="#B45309" strokeWidth="2" />
        <circle cx="40" cy="25" r="8.5" fill="none" stroke="#FEF08A" strokeWidth="1.6" />
        {/* Front big 3D coin */}
        <circle cx="27" cy="38" r="15.5" fill="#78350F" opacity="0.25" transform="translate(0 2)" />
        <circle cx="27" cy="37" r="15.5" fill={`url(#${uid}-gc1)`} stroke="#C27803" strokeWidth="2.2" />
        <circle cx="27" cy="37" r="10.8" fill="none" stroke="#FFFBEB" strokeOpacity="0.8" strokeWidth="2" />
        {/* Bold stylized $ / star emblem */}
        <path
          d="M27 29.5V44.5M23 33.5C23 31.8 24.8 31 27 31C29.2 31 31 31.8 31 33.5C31 36.2 23 36.2 23 39.2C23 41 24.8 42.2 27 42.2C29.4 42.2 31 41 31 39.2"
          stroke="#92400E"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="21" cy="29.5" rx="4.5" ry="2.2" fill="#fff" opacity="0.75" transform="rotate(-32 21 29.5)" />
        <circle cx="49" cy="44" r="2.8" fill="#FFFBEB" />
      </Tile>
    );
  }

  if (resolved === 'cash_mint_bundle') {
    return (
      <Tile uid={uid} from="#4ADE80" mid="#10B981" to="#065F46" size={size}>
        <defs>
          <linearGradient id={`${uid}-mb1`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ECFDF5" />
            <stop offset="1" stopColor="#A7F3D0" />
          </linearGradient>
          <linearGradient id={`${uid}-band`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FDE047" />
            <stop offset="1" stopColor="#EA580C" />
          </linearGradient>
        </defs>
        {/* Stacked 3D Pixar banknote bundle */}
        <rect x="11" y="30" width="42" height="20" rx="6" fill="#064E3B" opacity="0.28" transform="translate(0 2)" />
        <rect x="11" y="29" width="42" height="20" rx="6" fill="#6EE7B7" stroke="#059669" strokeWidth="1.5" />
        <rect x="11" y="23" width="42" height="20" rx="6" fill="#A7F3D0" stroke="#10B981" strokeWidth="1.5" />
        <rect x="11" y="17" width="42" height="21" rx="6" fill={`url(#${uid}-mb1)`} stroke="#FFFFFF" strokeWidth="1.6" />
        {/* Banknote inner detail */}
        <circle cx="20" cy="27.5" r="3" fill="#10B981" opacity="0.5" />
        <circle cx="44" cy="27.5" r="3" fill="#10B981" opacity="0.5" />
        {/* Warm Pixar ribbon band wrapping the stack */}
        <rect x="26.5" y="16" width="11" height="34" rx="4" fill={`url(#${uid}-band)`} stroke="#FFFBEB" strokeWidth="1.4" />
        <ellipse cx="32" cy="22" rx="3.2" ry="1.6" fill="#fff" opacity="0.65" />
      </Tile>
    );
  }

  if (resolved === 'cash_sky_wallet') {
    return (
      <Tile uid={uid} from="#38BDF8" mid="#0EA5E9" to="#0369A1" size={size}>
        <defs>
          <linearGradient id={`${uid}-sw`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6EE7B7" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
          <linearGradient id={`${uid}-sb`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FEF08A" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        {/* Peeking cash note */}
        <rect x="17" y="15" width="30" height="15" rx="5" fill={`url(#${uid}-sb)`} stroke="#FFFFFF" strokeWidth="1.6" />
        {/* Plump Pixar 3D emerald wallet */}
        <rect x="10" y="23" width="44" height="29" rx="10" fill="#0C4A6E" opacity="0.26" transform="translate(0 2)" />
        <rect x="10" y="22" width="44" height="29" rx="10" fill={`url(#${uid}-sw)`} stroke="#A7F3D0" strokeWidth="1.5" />
        <path d="M10 31C10 25 15 22 22 22H42C49 22 54 25 54 31C46 27 18 27 10 31Z" fill="#FFFFFF" opacity="0.24" />
        {/* Clasp */}
        <rect x="37" y="31.5" width="19" height="11.5" rx="5.75" fill="#047857" stroke="#A7F3D0" strokeWidth="1.2" />
        <circle cx="43" cy="37.2" r="2.8" fill="#FEF08A" />
        <circle cx="42.2" cy="36.3" r="0.9" fill="#FFFFFF" />
      </Tile>
    );
  }

  if (resolved === 'cash_royal_bag') {
    return (
      <Tile uid={uid} from="#34D399" mid="#0D9488" to="#115E59" size={size}>
        <defs>
          <radialGradient id={`${uid}-bag`} cx="0.35" cy="0.3" r="0.82">
            <stop offset="0" stopColor="#FEF3C7" />
            <stop offset="0.62" stopColor="#FBBF24" />
            <stop offset="1" stopColor="#D97706" />
          </radialGradient>
        </defs>
        {/* Bag ruffled top */}
        <path
          d="M24 14C24 12.5 27 12 29 14C30.5 12 33.5 12 35 14C37 12 40 12.5 40 14L37 22H27L24 14Z"
          fill="#F59E0B"
          stroke="#FFFBEB"
          strokeWidth="1.2"
        />
        {/* Plump Pixar treasure bag belly */}
        <path
          d="M25 22C17 26 14 35 16 44C18 50 24 53 32 53C40 53 46 50 48 44C50 35 47 26 39 22Z"
          fill={`url(#${uid}-bag)`}
          stroke="#FFFBEB"
          strokeWidth="1.6"
        />
        {/* Red ribbon tie */}
        <rect x="23.5" y="20.5" width="17" height="4.8" rx="2.4" fill="#EF4444" stroke="#FECACA" strokeWidth="1" />
        {/* Emerald emblem on bag */}
        <circle cx="32" cy="38" r="8" fill="#059669" />
        <path
          d="M32 33V43M29 36.2C29 35 30.3 34.4 32 34.4C33.7 34.4 35 35 35 36.2C35 38 29 38 29 39.8C29 41 30.3 41.6 32 41.6C33.7 41.6 35 41 35 39.8"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="23" cy="31" rx="3.4" ry="1.8" fill="#fff" opacity="0.65" transform="rotate(-36 23 31)" />
      </Tile>
    );
  }

  // 0. OFFICIAL / ORIGINAL CASH ICON (Clean Classic Emerald Green Banknote Tile)
  if (resolved === 'cash_official') {
    return (
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className="shrink-0"
        aria-hidden="true"
        style={{ filter: 'drop-shadow(0 3px 5px rgba(5,122,85,0.25))' }}
      >
        <defs>
          <linearGradient id={`${uid}-cash-off-bg`} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#22C55E" />
            <stop offset="0.55" stopColor="#16A34A" />
            <stop offset="1" stopColor="#15803D" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="58" height="58" rx="16" fill={`url(#${uid}-cash-off-bg)`} />
        <rect
          x="3.7"
          y="3.7"
          width="56.6"
          height="56.6"
          rx="15.3"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.18"
          strokeWidth="1.2"
        />
        {/* Clean back banknote shadow layer */}
        <rect x="13" y="16" width="38" height="24" rx="5" fill="#DCFCE7" opacity="0.45" transform="rotate(-6 32 28)" />
        {/* Crisp main banknote */}
        <rect x="11" y="20" width="42" height="26" rx="5.5" fill="#FFFFFF" />
        <rect
          x="14.5"
          y="23.5"
          width="35"
          height="19"
          rx="3.2"
          fill="none"
          stroke="#16A34A"
          strokeOpacity="0.32"
          strokeWidth="1.4"
        />
        {/* Center currency emblem */}
        <circle cx="32" cy="33" r="6.8" fill="#16A34A" />
        <path
          d="M32 28.6V37.4M29.6 31C29.6 30 30.6 29.4 32 29.4C33.4 29.4 34.4 30 34.4 31C34.4 32.6 29.6 32.6 29.6 34.5C29.6 35.6 30.6 36.3 32 36.3C33.4 36.3 34.4 35.6 34.4 34.5"
          stroke="#FFFFFF"
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="18.5" cy="33" r="1.8" fill="#16A34A" opacity="0.55" />
        <circle cx="45.5" cy="33" r="1.8" fill="#16A34A" opacity="0.55" />
      </svg>
    );
  }

  // =========================================================================
  // ADDITIONAL APPLICATION ICONS (Orange Cash, Etisalat Cash, WE Pay, Telda, Fawry, PayPal, Bank, Vault, etc.)
  // =========================================================================

  if (resolved === 'app_orange_cash') {
    return (
      <Tile uid={uid} from="#FF8524" mid="#FF6600" to="#CC4B00" size={size}>
        <circle cx="32" cy="32" r="19" fill="#FFFFFF" opacity="0.16" />
        <rect x="17" y="17" width="30" height="30" rx="8" fill="#FFFFFF" />
        <path
          d="M23 36H41M23 40H35"
          stroke="#FF6600"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="32" cy="26.5" r="5" fill="#FF6600" />
      </Tile>
    );
  }

  if (resolved === 'app_etisalat_cash') {
    return (
      <Tile uid={uid} from="#9BE03B" mid="#65A30D" to="#365314" size={size}>
        <circle cx="32" cy="33" r="18.5" fill="#1A2E05" opacity="0.22" />
        <circle cx="32" cy="31.5" r="18.5" fill="#FFFFFF" />
        <path
          d="M24 31.5C24 26.8 27.6 23.5 32.2 23.5C36.6 23.5 39.8 26.5 39.8 30.8C39.8 31.6 39.7 32.2 39.5 32.8H28C28.4 35.1 30.2 36.4 32.8 36.4C34.8 36.4 36.4 35.7 37.8 34.5L39.8 36.8C37.9 38.7 35.4 39.7 32.4 39.7C27.2 39.7 24 36.4 24 31.5ZM28.1 30H36C35.7 27.8 34.3 26.6 32.2 26.6C30 26.6 28.5 27.9 28.1 30Z"
          fill="#65A30D"
        />
        <circle cx="46.5" cy="18" r="4.5" fill="#E11D48" stroke="#FFFFFF" strokeWidth="1.6" />
      </Tile>
    );
  }

  if (resolved === 'app_we_pay') {
    return (
      <Tile uid={uid} from="#9333EA" mid="#6D28D9" to="#3B0764" size={size}>
        <rect x="13" y="19" width="38" height="26" rx="8" fill="#FFFFFF" fillOpacity="0.18" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.4" />
        <text
          x="32"
          y="37"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="16"
          fill="#FFFFFF"
          letterSpacing="0.5"
        >
          WE
        </text>
        <circle cx="48" cy="18" r="4" fill="#F43F5E" stroke="#FFFFFF" strokeWidth="1.4" />
      </Tile>
    );
  }

  if (resolved === 'app_telda') {
    return (
      <Tile uid={uid} from="#334155" mid="#1E293B" to="#020617" rim="#818CF8" size={size}>
        <rect x="12" y="19" width="40" height="26" rx="6.5" fill="#0F172A" stroke="#6366F1" strokeWidth="1.8" />
        <rect x="17" y="25" width="9" height="7" rx="2" fill="#A5B4FC" />
        <path d="M17 38H32" stroke="#E2E8F0" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="44" cy="37" r="3.5" fill="#38BDF8" />
      </Tile>
    );
  }

  if (resolved === 'app_fawry') {
    return (
      <Tile uid={uid} from="#FDE047" mid="#FACC15" to="#CA8A04" rim="#1D4ED8" size={size}>
        <rect x="13" y="15" width="38" height="34" rx="10" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="1.8" />
        <path
          d="M35 20L24 33H31.5L29 44L40 30.5H32.5L35 20Z"
          fill="#FDE047"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </Tile>
    );
  }

  if (resolved === 'app_paypal') {
    return (
      <Tile uid={uid} from="#38BDF8" mid="#0070BA" to="#003087" size={size}>
        <path
          d="M25 18H36.5C41.5 18 44.5 20.6 43.8 25.4C43.1 30.2 39.4 33 34.2 33H29.6L27.8 44H22.2L25 18Z"
          fill="#FFFFFF"
          opacity="0.95"
        />
        <path
          d="M29.5 24H39.5C43.8 24 46.2 26.2 45.6 30.4C45 34.6 41.8 37.2 37.2 37.2H33.2L31.6 47H26.6L29.5 24Z"
          fill="#BAE6FD"
          opacity="0.88"
        />
      </Tile>
    );
  }

  if (resolved === 'app_bank_card') {
    return (
      <Tile uid={uid} from="#60A5FA" mid="#2563EB" to="#1E3A8A" size={size}>
        <rect x="11" y="19" width="42" height="27" rx="6.5" fill="#FFFFFF" fillOpacity="0.96" />
        <rect x="11" y="24" width="42" height="5.5" fill="#1E40AF" opacity="0.85" />
        <rect x="15.5" y="34" width="9" height="6.5" rx="1.8" fill="#F59E0B" />
        <circle cx="43" cy="38" r="3.4" fill="#EF4444" opacity="0.9" />
        <circle cx="46.5" cy="38" r="3.4" fill="#F59E0B" opacity="0.85" />
      </Tile>
    );
  }

  if (resolved === 'app_savings_vault') {
    return (
      <Tile uid={uid} from="#2DD4BF" mid="#0D9488" to="#115E59" size={size}>
        <rect x="14" y="14" width="36" height="36" rx="9" fill="#FFFFFF" fillOpacity="0.95" />
        <circle cx="32" cy="32" r="10.5" fill="none" stroke="#0D9488" strokeWidth="3" />
        <circle cx="32" cy="32" r="3.8" fill="#0D9488" />
        <path d="M32 21.5V26M32 38V42.5M21.5 32H26M38 32H42.5" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
      </Tile>
    );
  }

  if (resolved === 'app_gold_wallet') {
    return (
      <Tile uid={uid} from="#FCD34D" mid="#F59E0B" to="#B45309" size={size}>
        <rect x="12" y="20" width="40" height="26" rx="8" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.6" />
        <rect x="36" y="28" width="17" height="10" rx="5" fill="#B45309" />
        <circle cx="41.5" cy="33" r="2.5" fill="#FDE047" />
        <path d="M18 27H30" stroke="#D97706" strokeWidth="2.4" strokeLinecap="round" />
      </Tile>
    );
  }

  if (resolved === 'app_crypto_globe') {
    return (
      <Tile uid={uid} from="#22D3EE" mid="#0284C7" to="#1E3A8A" size={size}>
        <circle cx="32" cy="32" r="17" fill="none" stroke="#FFFFFF" strokeWidth="2.6" />
        <ellipse cx="32" cy="32" rx="8.5" ry="17" fill="none" stroke="#FFFFFF" strokeWidth="2.2" />
        <path d="M15.5 32H48.5M18 23.5H46M18 40.5H46" stroke="#FFFFFF" strokeWidth="2.1" />
      </Tile>
    );
  }

  if (resolved === 'app_pink_wallet') {
    return (
      <Tile uid={uid} from="#F472B6" mid="#EC4899" to="#9D174D" size={size}>
        <rect x="12" y="20" width="40" height="26" rx="8.5" fill="#FFFFFF" fillOpacity="0.95" />
        <rect x="35" y="28.5" width="18" height="9.5" rx="4.75" fill="#BE185D" />
        <circle cx="40.5" cy="33.2" r="2.3" fill="#FBCFE8" />
        <circle cx="23" cy="33" r="4.2" fill="#EC4899" opacity="0.25" />
      </Tile>
    );
  }

  if (resolved === 'app_dark_vault') {
    return (
      <Tile uid={uid} from="#475569" mid="#1E293B" to="#090D16" rim="#94A3B8" size={size}>
        <rect x="15" y="16" width="34" height="32" rx="8" fill="#0F172A" stroke="#CBD5E1" strokeOpacity="0.55" strokeWidth="1.8" />
        <circle cx="32" cy="32" r="8.5" fill="none" stroke="#38BDF8" strokeWidth="2.6" />
        <circle cx="32" cy="32" r="3.2" fill="#F8FAFC" />
      </Tile>
    );
  }

  // Classic 3D Cash: cash_emerald_bill
  return (
    <Tile uid={uid} from="#34D399" mid="#10B981" to="#047857" size={size}>
      <defs>
        <linearGradient id={`${uid}-note`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFDF2" />
          <stop offset="1" stopColor="#D9F5DD" />
        </linearGradient>
        <radialGradient id={`${uid}-coin`} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#FFF1A8" />
          <stop offset="1" stopColor="#F5B000" />
        </radialGradient>
      </defs>
      <rect x="10" y="18" width="38" height="25" rx="6" fill={`url(#${uid}-note)`} stroke="#BFEBC9" strokeWidth="2" />
      <circle cx="29" cy="30.5" r="6.5" fill="#34D399" />
      <circle cx="27.4" cy="28.8" r="2" fill="#fff" opacity="0.65" />
      <circle cx="14.5" cy="30.5" r="1.8" fill="#34D399" />
      <circle cx="43.5" cy="30.5" r="1.8" fill="#34D399" />
      <circle cx="45" cy="43" r="10.5" fill={`url(#${uid}-coin)`} stroke="#E29A00" strokeWidth="2" />
      <circle cx="45" cy="43" r="6.6" fill="none" stroke="#FFE27A" strokeWidth="1.8" />
      <ellipse cx="41.5" cy="38.8" rx="3.6" ry="1.8" fill="#fff" opacity="0.75" transform="rotate(-30 41.5 38.8)" />
    </Tile>
  );
}

/** Round 3D coin button icon: green "+" for Add, orange arrow for Withdraw. */
export function MoneyActionIcon({
  kind,
  size = 26,
}: {
  kind: 'add' | 'withdraw';
  size?: number;
}) {
  const rawUid = useId();
  const id = `mi${kind}${rawUid.replace(/[^a-zA-Z0-9]/g, '')}`;
  const from = kind === 'add' ? '#6EE7B7' : '#FDBA74';
  const to = kind === 'add' ? '#059669' : '#EA580C';
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0"
      style={{ filter: 'drop-shadow(0 2px 2.5px rgba(15,23,42,0.28))' }}
    >
      <defs>
        <radialGradient id={id} cx="0.35" cy="0.28" r="0.9">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="17" fill={`url(#${id})`} />
      <circle cx="20" cy="20" r="12.5" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.6" />
      {kind === 'add' ? (
        <path d="M20 12.5V27.5M12.5 20H27.5" stroke="#fff" strokeWidth="4.4" strokeLinecap="round" />
      ) : (
        <path
          d="M20 28V13M13.5 19.5L20 13L26.5 19.5"
          stroke="#fff"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
      <ellipse cx="14.5" cy="10.5" rx="5.5" ry="2.8" fill="#fff" opacity="0.55" transform="rotate(-28 14.5 10.5)" />
    </svg>
  );
}

/** Big 3D wallet for the total-balance card. */
export function WalletHeroIcon({ size = 64 }: { size?: number }) {
  const rawUid = useId();
  const uid = `wh${rawUid.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg
      viewBox="0 0 72 72"
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0"
      style={{ filter: 'drop-shadow(0 6px 7px rgba(15,23,42,0.25))' }}
    >
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5EEAD4" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
        <linearGradient id={`${uid}-flap`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#99F6E4" />
          <stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
        <radialGradient id={`${uid}-coin`} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#FFF1A8" />
          <stop offset="1" stopColor="#F5B000" />
        </radialGradient>
      </defs>
      <circle cx="26" cy="20" r="9" fill={`url(#${uid}-coin)`} stroke="#E29A00" strokeWidth="2" />
      <circle cx="43" cy="16" r="8" fill={`url(#${uid}-coin)`} stroke="#E29A00" strokeWidth="2" />
      <rect x="7" y="22" width="58" height="42" rx="13" fill={`url(#${uid}-body)`} />
      <path d="M7 36C7 26 14 22 24 22H48C58 22 65 26 65 36C58 30 14 30 7 36Z" fill={`url(#${uid}-flap)`} />
      <path d="M12 30C18 25.5 28 25 36 25" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.6" fill="none" />
      <rect x="42" y="38" width="26" height="17" rx="8.5" fill="#0F766E" />
      <circle cx="52" cy="46.5" r="4.2" fill={`url(#${uid}-coin)`} stroke="#E29A00" strokeWidth="1.5" />
      <circle cx="50.8" cy="45.2" r="1.3" fill="#fff" opacity="0.8" />
    </svg>
  );
}
