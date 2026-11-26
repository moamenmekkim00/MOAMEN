import { CSSProperties } from 'react';

export type WallpaperCategory = 'all' | 'whatsapp' | 'telegram' | 'botanical' | 'geometric' | 'dark';

export type WallpaperId =
  | 'none'
  // WhatsApp Classics with dense doodles (6)
  | 'wa_sand_doodle'
  | 'wa_mint_doodle'
  | 'wa_sky_doodle'
  | 'wa_peach_doodle'
  | 'wa_lavender_doodle'
  | 'wa_rose_doodle'
  // Telegram Vibrant Multi-Color Gradients + Doodles (6)
  | 'tg_aurora_mint'
  | 'tg_ocean_breeze'
  | 'tg_sunset_coral'
  | 'tg_berry_dream'
  | 'tg_pistachio_sky'
  | 'tg_warm_honey'
  // Botanical, Cozy & Geometric Arabesque Illustrations (7)
  | 'botanical_sage'
  | 'botanical_blossom'
  | 'cozy_coffee'
  | 'cozy_meadow'
  | 'arabesque_mint'
  | 'arabesque_gold'
  | 'confetti_pastel'
  // Dark Mode WhatsApp & Telegram Doodles (6)
  | 'dark_wa_classic'
  | 'dark_tg_emerald'
  | 'dark_tg_midnight'
  | 'dark_tg_royal'
  | 'dark_tg_plum'
  | 'dark_gold_arabesque';

export type PageWallpaperChoice = 'inherit' | WallpaperId;

export interface WallpaperOption {
  id: WallpaperId;
  category: Exclude<WallpaperCategory, 'all'> | 'none';
  labelAr: string;
  labelEn: string;
  isDark: boolean;
  baseColor: string;
  gradient: string;
  patternUri: string;
  patternOpacity: number;
  patternSize: number;
}

function encodeSvg(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(
    svg.replace(/\s+/g, ' ').trim()
  )}")`;
}

/**
 * Dense WhatsApp-style everyday & finance doodle tile (220x220 seamless).
 * Filled with wallets, coins, paper planes, stars, coffee cups, hearts, sparkles,
 * notes, crowns, diamonds, clouds, lightbulbs, shopping bags, clocks & smiles.
 */
function buildWhatsAppDoodleUri(stroke: string): string {
  const s = stroke;
  return encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220" fill="none" stroke="${s}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <!-- Wallet -->
      <g transform="translate(14,14) rotate(-10)">
        <rect x="0" y="4" width="22" height="16" rx="4"/>
        <path d="M16 10h6v5h-6a2.5 2.5 0 0 1 0-5z"/>
        <path d="M4 4l12-3 2 3"/>
      </g>
      <!-- Paper plane -->
      <g transform="translate(66,12) rotate(12)">
        <path d="M0 10L22 2L14 20L10 13L0 10Z"/>
        <path d="M22 2L10 13"/>
      </g>
      <!-- Sparkling Star -->
      <g transform="translate(116,18)">
        <path d="M9 0L11.2 6.8L18 9L11.2 11.2L9 18L6.8 11.2L0 9L6.8 6.8Z"/>
      </g>
      <!-- Coffee cup -->
      <g transform="translate(162,14) rotate(-8)">
        <path d="M2 8h15v8a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V8Z"/>
        <path d="M17 10h2.5a2.5 2.5 0 0 1 0 5H17"/>
        <path d="M6 4c0-1.5 1.5-1.5 1.5-3M11 4c0-1.5 1.5-1.5 1.5-3"/>
      </g>
      <!-- Tiny Coin -->
      <g transform="translate(198,28)">
        <circle cx="8" cy="8" r="7"/>
        <path d="M8 4.5v7M6 6.5h3.5a1.2 1.2 0 0 1 0 2.4H6.5"/>
      </g>
      <!-- Heart -->
      <g transform="translate(36,64) rotate(-14)">
        <path d="M10 17S2 12 2 6.5A4.2 4.2 0 0 1 10 4.5a4.2 4.2 0 0 1 8 2C18 12 10 17 10 17Z"/>
      </g>
      <!-- Cloud -->
      <g transform="translate(82,60) rotate(5)">
        <path d="M6 16h16a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.5-1.5A4.5 4.5 0 0 0 6 16Z"/>
      </g>
      <!-- Diamond / Gem -->
      <g transform="translate(136,58) rotate(10)">
        <path d="M4 2h12l4 5-10 12L0 7l4-5Z"/>
        <path d="M0 7h20M4 2l3 5 3 12 3-12 3-5"/>
      </g>
      <!-- Music Note -->
      <g transform="translate(182,66) rotate(-12)">
        <circle cx="5" cy="15" r="3"/>
        <circle cx="15" cy="13" r="3"/>
        <path d="M8 15V4l10-2v11"/>
      </g>
      <!-- Crown -->
      <g transform="translate(12,110) rotate(8)">
        <path d="M2 16L4 5l6 5 6-5 2 11H2Z"/>
        <line x1="2" y1="19" x2="18" y2="19"/>
      </g>
      <!-- Bank Card -->
      <g transform="translate(56,112) rotate(-9)">
        <rect x="0" y="2" width="24" height="15" rx="3"/>
        <line x1="0" y1="7" x2="24" y2="7"/>
        <rect x="4" y="11" width="5" height="3" rx="0.8"/>
      </g>
      <!-- Lightbulb -->
      <g transform="translate(110,104) rotate(12)">
        <path d="M9 2a6 6 0 0 0-3.5 10.9c.7.5 1.1 1.2 1.2 2.1h4.6c.1-.9.5-1.6 1.2-2.1A6 6 0 0 0 9 2Z"/>
        <path d="M7 18h4"/>
      </g>
      <!-- Shopping Bag -->
      <g transform="translate(154,108) rotate(-8)">
        <path d="M3 7h14l1 13H2L3 7Z"/>
        <path d="M6.5 7V5a3.5 3.5 0 0 1 7 0v2"/>
      </g>
      <!-- Crescent Moon -->
      <g transform="translate(194,116) rotate(-15)">
        <path d="M13 14.5A7.5 7.5 0 0 1 7.5 2a7.5 7.5 0 1 0 9.5 11.2 6.8 6.8 0 0 1-4 1.3Z"/>
      </g>
      <!-- Clock -->
      <g transform="translate(26,162) rotate(-6)">
        <circle cx="10" cy="10" r="8.5"/>
        <path d="M10 5.5V10l3 2"/>
      </g>
      <!-- Gift Box -->
      <g transform="translate(76,162) rotate(10)">
        <rect x="2" y="8" width="16" height="12" rx="2"/>
        <rect x="1" y="5" width="18" height="3.5" rx="1"/>
        <path d="M10 5v15M10 5c-2.5-3.5-6-1.5-4.5 0M10 5c2.5-3.5 6-1.5 4.5 0"/>
      </g>
      <!-- Smile Face -->
      <g transform="translate(128,164) rotate(-8)">
        <circle cx="9" cy="9" r="8"/>
        <circle cx="6.2" cy="7.2" r="0.8" fill="${s}"/>
        <circle cx="11.8" cy="7.2" r="0.8" fill="${s}"/>
        <path d="M5.5 11.2c1 1.6 2.2 2.2 3.5 2.2s2.5-.6 3.5-2.2"/>
      </g>
      <!-- Receipt / Note -->
      <g transform="translate(174,162) rotate(9)">
        <path d="M3 2h14v17l-2.3-1.8L12.3 19 10 17.2 7.7 19 5.3 17.2 3 19V2Z"/>
        <line x1="6.5" y1="7" x2="13.5" y2="7"/>
        <line x1="6.5" y1="11" x2="11.5" y2="11"/>
      </g>
      <!-- Scattered micro sparkles & dots for authentic WhatsApp density -->
      <circle cx="48" cy="36" r="1.4" fill="${s}"/>
      <circle cx="152" cy="40" r="1.4" fill="${s}"/>
      <circle cx="16" cy="86" r="1.3" fill="${s}"/>
      <circle cx="118" cy="86" r="1.5" fill="${s}"/>
      <circle cx="174" cy="94" r="1.2" fill="${s}"/>
      <circle cx="44" cy="144" r="1.4" fill="${s}"/>
      <circle cx="102" cy="148" r="1.3" fill="${s}"/>
      <circle cx="158" cy="148" r="1.5" fill="${s}"/>
      <circle cx="204" cy="156" r="1.4" fill="${s}"/>
      <circle cx="62" cy="198" r="1.4" fill="${s}"/>
      <circle cx="156" cy="202" r="1.3" fill="${s}"/>
      <path d="M98 34l2 2m0-2l-2 2M194 94l2.5 2.5m0-2.5l-2.5 2.5M14 146l2.5 2.5m0-2.5l-2.5 2.5M114 198l2.5 2.5m0-2.5l-2.5 2.5"/>
    </svg>
  `);
}

/**
 * Dense Telegram-style dreamy doodle tile (220x220 seamless).
 * Paper planes, butterflies, rockets, umbrellas, crowns, stars, planets, headphones, balloons & gems.
 */
function buildTelegramDoodleUri(stroke: string): string {
  const s = stroke;
  return encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220" fill="none" stroke="${s}" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round">
      <!-- Telegram Paper Plane -->
      <g transform="translate(18,16) rotate(-12)">
        <path d="M1 11L24 2L17 22L11 14L1 11Z"/>
        <path d="M24 2L11 14L11 20L14.5 16"/>
      </g>
      <!-- Ringed Planet -->
      <g transform="translate(76,14) rotate(14)">
        <circle cx="12" cy="11" r="6.5"/>
        <ellipse cx="12" cy="11" rx="13" ry="4" transform="rotate(-18 12 11)"/>
      </g>
      <!-- Butterfly -->
      <g transform="translate(136,16) rotate(-10)">
        <path d="M10 11C8 4 1 3 1 8c0 3 4 4.5 9 3ZM10 11c2-7 9-8 9-3 0 3-4 4.5-9 3Z"/>
        <path d="M10 11c-2 6-7 7-7 3 0-2 3-3 7-3ZM10 11c2 6 7 7 7 3 0-2-3-3-7-3Z"/>
        <line x1="10" y1="6" x2="10" y2="17"/>
      </g>
      <!-- Umbrella -->
      <g transform="translate(184,18) rotate(12)">
        <path d="M1 12a9.5 9.5 0 0 1 19 0H1Z"/>
        <path d="M10.5 12v7a2.2 2.2 0 0 1-4.4 0"/>
      </g>
      <!-- Balloon -->
      <g transform="translate(26,70) rotate(8)">
        <ellipse cx="9" cy="9" rx="7" ry="8.5"/>
        <path d="M9 17.5c-1.5 2.5 2 4 0 6.5"/>
      </g>
      <!-- Rocket -->
      <g transform="translate(76,66) rotate(22)">
        <path d="M10 1c4 3.5 5 9 4 14H6C5 10 6 4.5 10 1Z"/>
        <circle cx="10" cy="8.5" r="2"/>
        <path d="M6 12l-3 3v3l3-1M14 12l3 3v3l-3-1"/>
      </g>
      <!-- Sparkle Cluster -->
      <g transform="translate(128,68)">
        <path d="M10 1l2 6.5L18.5 9.5 12 11.5 10 18 8 11.5 1.5 9.5 8 7.5Z"/>
        <path d="M22 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z"/>
      </g>
      <!-- Headphones -->
      <g transform="translate(174,72) rotate(-10)">
        <path d="M3 13v-2a8 8 0 0 1 16 0v2"/>
        <rect x="1.5" y="12" width="4" height="7" rx="2"/>
        <rect x="16.5" y="12" width="4" height="7" rx="2"/>
      </g>
      <!-- Open Book -->
      <g transform="translate(16,126) rotate(-7)">
        <path d="M2 5c4-1.5 7 0 9 2 2-2 5-3.5 9-2v13c-4-1.5-7 0-9 2-2-2-5-3.5-9-2V5Z"/>
        <line x1="11" y1="7" x2="11" y2="20"/>
      </g>
      <!-- Four-leaf Clover -->
      <g transform="translate(74,122) rotate(12)">
        <circle cx="7" cy="7" r="4"/>
        <circle cx="14" cy="7" r="4"/>
        <circle cx="7" cy="14" r="4"/>
        <circle cx="14" cy="14" r="4"/>
        <path d="M10.5 17v5"/>
      </g>
      <!-- Shooting Star -->
      <g transform="translate(126,120) rotate(-14)">
        <path d="M16 3l2 4.5 5 .6-3.7 3.3 1 4.9-4.3-2.5-4.3 2.5 1-4.9L9 8.1l5-.6Z"/>
        <path d="M7 11L1 15M8 15L3 19"/>
      </g>
      <!-- Camera -->
      <g transform="translate(178,124) rotate(8)">
        <rect x="1" y="5" width="20" height="14" rx="3"/>
        <path d="M7 5l1.5-2.5h5L15 5"/>
        <circle cx="11" cy="12" r="3.6"/>
      </g>
      <!-- Crown -->
      <g transform="translate(30,174) rotate(9)">
        <path d="M2 14L4 4l6 5 6-5 2 10H2Z"/>
      </g>
      <!-- Cloud & Rainbow -->
      <g transform="translate(86,174) rotate(-6)">
        <path d="M3 14a8 8 0 0 1 16 0"/>
        <path d="M6.5 14a4.5 4.5 0 0 1 9 0"/>
        <path d="M1 16h20"/>
      </g>
      <!-- Feather / Leaf -->
      <g transform="translate(142,170) rotate(15)">
        <path d="M3 18C5 8 11 3 18 2c-1 7-6 13-15 16Z"/>
        <path d="M3 18L13 8"/>
      </g>
      <!-- Heart Envelope -->
      <g transform="translate(184,176) rotate(-11)">
        <rect x="1" y="3" width="20" height="14" rx="2.5"/>
        <path d="M2 4l9 7 9-7"/>
      </g>
      <!-- Ambient Stars & Dots -->
      <circle cx="56" cy="48" r="1.5" fill="${s}"/>
      <circle cx="116" cy="44" r="1.3" fill="${s}"/>
      <circle cx="166" cy="52" r="1.4" fill="${s}"/>
      <circle cx="56" cy="104" r="1.3" fill="${s}"/>
      <circle cx="108" cy="108" r="1.5" fill="${s}"/>
      <circle cx="164" cy="106" r="1.3" fill="${s}"/>
      <circle cx="58" cy="158" r="1.5" fill="${s}"/>
      <circle cx="122" cy="160" r="1.4" fill="${s}"/>
      <circle cx="170" cy="160" r="1.3" fill="${s}"/>
      <circle cx="16" cy="204" r="1.3" fill="${s}"/>
      <circle cx="116" cy="208" r="1.4" fill="${s}"/>
    </svg>
  `);
}

/**
 * Lush Botanical Leaves, Daisies & Vines tile (200x200 seamless).
 */
function buildBotanicalDoodleUri(stroke: string): string {
  const s = stroke;
  return encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="${s}" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round">
      <!-- Leaf sprig 1 -->
      <g transform="translate(14,14) rotate(-15)">
        <path d="M12 28C12 16 14 8 18 2"/>
        <path d="M13 20C5 19 2 13 6 10c4 0 7 4 7 10Z"/>
        <path d="M15 13c7-1 11-6 7-9-4 0-7 4-7 9Z"/>
        <path d="M12 24c6 1 10-2 8-6-4 0-7 2-8 6Z"/>
      </g>
      <!-- Daisy flower -->
      <g transform="translate(76,18)">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.5 3.5M15.5 15.5L19 19M19 5l-3.5 3.5M8.5 15.5L5 19"/>
      </g>
      <!-- Monstera Leaf -->
      <g transform="translate(134,14) rotate(16)">
        <path d="M14 2C5 6 2 15 6 23c4 3 12 3 16 0 4-8 1-17-8-21Z"/>
        <path d="M14 4v21M14 10l-6-2M14 15l-7-1M14 12l6-2M14 17l7-1"/>
      </g>
      <!-- Tulip -->
      <g transform="translate(26,82) rotate(12)">
        <path d="M10 18V28M10 18c-6 0-8-6-7-12l4 3 3-5 3 5 4-3c1 6-1 12-7 12Z"/>
        <path d="M10 24c-4-1-6-3-6-5M10 24c4-1 6-3 6-5"/>
      </g>
      <!-- Little Bird -->
      <g transform="translate(86,84) rotate(-8)">
        <path d="M4 14c2-6 8-9 14-8 2 .4 3.5 1.5 4.5 3l3 1-3 1.5c-1 4-5 7-11 7H3l3-3Z"/>
        <circle cx="18" cy="9.5" r="0.8" fill="${s}"/>
      </g>
      <!-- Curved Fern -->
      <g transform="translate(148,80) rotate(-18)">
        <path d="M4 28C8 16 14 8 24 4"/>
        <path d="M8 20l-5-4M11 15l-5-3M15 11l-4-4M12 18l6 1M16 13l6 1"/>
      </g>
      <!-- Sunburst -->
      <g transform="translate(18,144)">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>
      </g>
      <!-- Blossom Cluster -->
      <g transform="translate(78,144) rotate(10)">
        <circle cx="12" cy="12" r="2.8"/>
        <circle cx="12" cy="5.5" r="3.5"/>
        <circle cx="18" cy="10" r="3.5"/>
        <circle cx="15.5" cy="17" r="3.5"/>
        <circle cx="8.5" cy="17" r="3.5"/>
        <circle cx="6" cy="10" r="3.5"/>
      </g>
      <!-- Olive Branch -->
      <g transform="translate(136,142) rotate(8)">
        <path d="M4 24C12 18 20 12 28 4"/>
        <ellipse cx="10" cy="15" rx="4" ry="2.2" transform="rotate(-40 10 15)"/>
        <ellipse cx="18" cy="9" rx="4" ry="2.2" transform="rotate(-40 18 9)"/>
        <ellipse cx="16" cy="18" rx="4" ry="2.2" transform="rotate(20 16 18)"/>
        <ellipse cx="23" cy="12" rx="4" ry="2.2" transform="rotate(20 23 12)"/>
      </g>
      <!-- Petals & Dots -->
      <circle cx="58" cy="58" r="1.5" fill="${s}"/>
      <circle cx="122" cy="58" r="1.4" fill="${s}"/>
      <circle cx="184" cy="64" r="1.5" fill="${s}"/>
      <circle cx="64" cy="122" r="1.4" fill="${s}"/>
      <circle cx="132" cy="126" r="1.5" fill="${s}"/>
      <circle cx="56" cy="184" r="1.4" fill="${s}"/>
      <circle cx="124" cy="186" r="1.5" fill="${s}"/>
    </svg>
  `);
}

/**
 * Elegant Islamic / Geometric Arabesque Star & Diamond lattice (120x120 seamless).
 */
function buildArabesqueUri(stroke: string): string {
  const s = stroke;
  return encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="${s}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <!-- Center 8-point star -->
      <polygon points="60,26 68,46 88,40 74,56 94,60 74,64 88,80 68,74 60,94 52,74 32,80 46,64 26,60 46,56 32,40 52,46"/>
      <circle cx="60" cy="60" r="8"/>
      <!-- Corner quarter stars for seamless tiling -->
      <path d="M0 26L8 12L26 0M120 26L112 12L94 0M0 94L8 108L26 120M120 94L112 108L94 120"/>
      <circle cx="0" cy="0" r="10"/>
      <circle cx="120" cy="0" r="10"/>
      <circle cx="0" cy="120" r="10"/>
      <circle cx="120" cy="120" r="10"/>
      <!-- Midpoint diamonds -->
      <polygon points="60,2 68,12 60,22 52,12"/>
      <polygon points="60,98 68,108 60,118 52,108"/>
      <polygon points="2,60 12,52 22,60 12,68"/>
      <polygon points="98,60 108,52 118,60 108,68"/>
      <circle cx="30" cy="30" r="2.2"/>
      <circle cx="90" cy="30" r="2.2"/>
      <circle cx="30" cy="90" r="2.2"/>
      <circle cx="90" cy="90" r="2.2"/>
    </svg>
  `);
}

/**
 * Cozy Café, Hearts, Bows, Books & Paws Doodle tile (200x200 seamless).
 */
function buildCozyDoodleUri(stroke: string): string {
  const s = stroke;
  return encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="${s}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <!-- Latte Mug -->
      <g transform="translate(18,18) rotate(-8)">
        <path d="M2 7h16v9a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V7Z"/>
        <path d="M18 9h3a3 3 0 0 1 0 6h-3"/>
        <path d="M7 13s3-3 5 0 5-3 5 0" opacity="0.7"/>
      </g>
      <!-- Croissant -->
      <g transform="translate(76,18) rotate(14)">
        <path d="M3 16c1-8 7-12 16-10 2 5 0 11-5 13-5 1-8-1-11-3Z"/>
        <path d="M8 7l3 9M13 6l2 9"/>
      </g>
      <!-- Cute Bow -->
      <g transform="translate(136,20) rotate(-10)">
        <circle cx="11" cy="9" r="2.5"/>
        <path d="M8.5 8C3 4 1 12 8.5 10.5M13.5 8C19 4 21 12 13.5 10.5"/>
        <path d="M9.5 11.5L6 18M12.5 11.5L16 18"/>
      </g>
      <!-- Cat Paw -->
      <g transform="translate(26,82) rotate(12)">
        <ellipse cx="11" cy="14" rx="5.5" ry="4.5"/>
        <circle cx="5.5" cy="7.5" r="2"/>
        <circle cx="11" cy="5.5" r="2"/>
        <circle cx="16.5" cy="7.5" r="2"/>
      </g>
      <!-- Stacked Books -->
      <g transform="translate(82,80) rotate(-7)">
        <rect x="2" y="4" width="20" height="5.5" rx="1.5"/>
        <rect x="0" y="10.5" width="22" height="5.5" rx="1.5"/>
        <rect x="3" y="17" width="18" height="5" rx="1.5"/>
      </g>
      <!-- Double Hearts -->
      <g transform="translate(142,80) rotate(9)">
        <path d="M9 16S2 11.5 2 6.5a3.8 3.8 0 0 1 7-2 3.8 3.8 0 0 1 7 2C16 11.5 9 16 9 16Z"/>
        <path d="M21 10s-3.5-2.2-3.5-4.8a2 2 0 0 1 3.5-1.2 2 2 0 0 1 3.5 1.2C24.5 7.8 21 10 21 10Z"/>
      </g>
      <!-- Donut -->
      <g transform="translate(24,142)">
        <circle cx="11" cy="11" r="9"/>
        <circle cx="11" cy="11" r="3.2"/>
        <path d="M6 6l1.5 1M15 6l-1 1.5M16 14l-1.5-1M6 15l1-1.5"/>
      </g>
      <!-- Sparkle Envelope -->
      <g transform="translate(86,144) rotate(8)">
        <rect x="1" y="3" width="21" height="14" rx="3"/>
        <path d="M2 5l9.5 6.5L21 5"/>
      </g>
      <!-- Cupcake -->
      <g transform="translate(146,140) rotate(-9)">
        <path d="M5 12h14l-2 9H7l-2-9Z"/>
        <path d="M4 12a4.5 4.5 0 0 1 4-4.5 4.5 4.5 0 0 1 8 0A4.5 4.5 0 0 1 20 12H4Z"/>
        <circle cx="12" cy="4" r="1.6"/>
      </g>
      <!-- Micro Stars & Dots -->
      <circle cx="58" cy="54" r="1.5" fill="${s}"/>
      <circle cx="124" cy="56" r="1.4" fill="${s}"/>
      <circle cx="182" cy="58" r="1.5" fill="${s}"/>
      <circle cx="62" cy="120" r="1.4" fill="${s}"/>
      <circle cx="126" cy="124" r="1.5" fill="${s}"/>
      <circle cx="64" cy="182" r="1.5" fill="${s}"/>
      <circle cx="132" cy="184" r="1.4" fill="${s}"/>
    </svg>
  `);
}

/**
 * Celestial Night Sky: Crescent moons, constellations, shooting stars, ringed planets & sparkles (200x200).
 */
function buildCelestialDoodleUri(stroke: string): string {
  const s = stroke;
  return encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="${s}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
      <!-- Crescent Moon & Star -->
      <g transform="translate(18,16)">
        <path d="M16 17A9 9 0 0 1 9 2a9 9 0 1 0 11.5 13.4A8 8 0 0 1 16 17Z"/>
        <path d="M22 4l1 2.8 2.8 1-2.8 1-1 2.8-1-2.8-2.8-1 2.8-1Z"/>
      </g>
      <!-- Constellation -->
      <g transform="translate(76,18)">
        <circle cx="3" cy="14" r="2" fill="${s}"/>
        <circle cx="16" cy="4" r="2" fill="${s}"/>
        <circle cx="30" cy="12" r="2" fill="${s}"/>
        <circle cx="24" cy="24" r="1.8" fill="${s}"/>
        <path d="M3 14L16 4L30 12L24 24" stroke-dasharray="2 2"/>
      </g>
      <!-- Ringed Planet -->
      <g transform="translate(142,20) rotate(-14)">
        <circle cx="14" cy="12" r="7"/>
        <ellipse cx="14" cy="12" rx="14.5" ry="4.2" transform="rotate(-16 14 12)"/>
      </g>
      <!-- Big Sparkle -->
      <g transform="translate(26,82)">
        <path d="M12 1l2.5 8.5L23 12l-8.5 2.5L12 23l-2.5-8.5L1 12l8.5-2.5Z"/>
      </g>
      <!-- Shooting Star -->
      <g transform="translate(86,82) rotate(-18)">
        <path d="M20 4l2.2 5 5.3.7-3.9 3.6 1 5.3-4.6-2.7-4.6 2.7 1-5.3-3.9-3.6 5.3-.7Z"/>
        <path d="M10 12L2 17M11 16L4 21"/>
      </g>
      <!-- Telescope / Compass Star -->
      <g transform="translate(152,88)">
        <circle cx="10" cy="10" r="8"/>
        <path d="M10 0v20M0 10h20"/>
      </g>
      <!-- Cloud with Stars -->
      <g transform="translate(22,146)">
        <path d="M5 17h18a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.5-1.5A5 5 0 0 0 5 17Z"/>
        <circle cx="8" cy="23" r="1.3" fill="${s}"/>
        <circle cx="16" cy="25" r="1.3" fill="${s}"/>
        <circle cx="22" cy="22" r="1.3" fill="${s}"/>
      </g>
      <!-- Paper Plane in Stars -->
      <g transform="translate(88,144) rotate(12)">
        <path d="M1 10L22 2L15 20L10 13L1 10Z"/>
        <path d="M22 2L10 13"/>
      </g>
      <!-- Double Sparkle -->
      <g transform="translate(148,142)">
        <path d="M9 1l1.8 6.2L17 9l-6.2 1.8L9 17l-1.8-6.2L1 9l6.2-1.8Z"/>
        <path d="M22 14l1.2 4 4 1.2-4 1.2-1.2 4-1.2-4-4-1.2 4-1.2Z"/>
      </g>
      <!-- Starfield Dots -->
      <circle cx="58" cy="56" r="1.5" fill="${s}"/>
      <circle cx="122" cy="58" r="1.4" fill="${s}"/>
      <circle cx="184" cy="64" r="1.6" fill="${s}"/>
      <circle cx="62" cy="120" r="1.5" fill="${s}"/>
      <circle cx="132" cy="124" r="1.4" fill="${s}"/>
      <circle cx="62" cy="184" r="1.5" fill="${s}"/>
      <circle cx="128" cy="186" r="1.4" fill="${s}"/>
    </svg>
  `);
}

/**
 * Playful Pastel Confetti, Ribbons, Waves & Stars tile (180x180).
 */
function buildConfettiDoodleUri(stroke: string): string {
  const s = stroke;
  return encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180" fill="none" stroke="${s}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 22c6-8 14 8 20 0"/>
      <polygon points="74,14 82,28 66,28"/>
      <circle cx="128" cy="24" r="7"/>
      <path d="M160 16l4 9 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1Z" transform="scale(0.65) translate(88,12)"/>
      <rect x="20" y="66" width="14" height="14" rx="4" transform="rotate(18 27 73)"/>
      <path d="M74 66c6-7 14 7 20 0s14 7 20 0"/>
      <path d="M142 64l10 10m0-10l-10 10"/>
      <circle cx="32" cy="124" r="8"/>
      <path d="M78 118l2.5 7.5 7.5 2.5-7.5 2.5L78 138l-2.5-7.5L68 128l7.5-2.5Z"/>
      <path d="M126 122c7-8 15 8 22 0"/>
      <polygon points="36,160 44,174 28,174"/>
      <rect x="88" y="158" width="13" height="13" rx="3.5" transform="rotate(-16 94 164)"/>
      <circle cx="150" cy="162" r="6"/>
      <circle cx="54" cy="46" r="2" fill="${s}"/>
      <circle cx="110" cy="48" r="2" fill="${s}"/>
      <circle cx="164" cy="96" r="2" fill="${s}"/>
      <circle cx="56" cy="100" r="2" fill="${s}"/>
      <circle cx="114" cy="104" r="2" fill="${s}"/>
      <circle cx="14" cy="156" r="2" fill="${s}"/>
      <circle cx="122" cy="154" r="2" fill="${s}"/>
    </svg>
  `);
}

// Pre-computed crisp pattern URIs (cached once at module load for 120 Hz performance)
const WA_DARK_INK = buildWhatsAppDoodleUri('#475569');
const WA_TEAL_INK = buildWhatsAppDoodleUri('#0F766E');
const WA_SKY_INK = buildWhatsAppDoodleUri('#0369A1');
const WA_WARM_INK = buildWhatsAppDoodleUri('#9A3412');
const WA_VIOLET_INK = buildWhatsAppDoodleUri('#6D28D9');
const WA_ROSE_INK = buildWhatsAppDoodleUri('#BE123C');
const WA_WHITE_INK = buildWhatsAppDoodleUri('#FFFFFF');

const TG_TEAL_INK = buildTelegramDoodleUri('#0D9488');
const TG_BLUE_INK = buildTelegramDoodleUri('#0284C7');
const TG_CORAL_INK = buildTelegramDoodleUri('#C2410C');
const TG_BERRY_INK = buildTelegramDoodleUri('#7E22CE');
const TG_OLIVE_INK = buildTelegramDoodleUri('#15803D');
const TG_AMBER_INK = buildTelegramDoodleUri('#B45309');
const TG_WHITE_INK = buildTelegramDoodleUri('#FFFFFF');

const BOTANICAL_GREEN_INK = buildBotanicalDoodleUri('#047857');
const BOTANICAL_ROSE_INK = buildBotanicalDoodleUri('#BE185D');
const COZY_BROWN_INK = buildCozyDoodleUri('#78350F');
const COZY_GREEN_INK = buildCozyDoodleUri('#166534');
const ARABESQUE_TEAL_INK = buildArabesqueUri('#0F766E');
const ARABESQUE_GOLD_INK = buildArabesqueUri('#B45309');
const ARABESQUE_LIGHT_GOLD = buildArabesqueUri('#FCD34D');
const CONFETTI_INK = buildConfettiDoodleUri('#6366F1');
const CELESTIAL_WHITE_INK = buildCelestialDoodleUri('#E2E8F0');

export const WALLPAPER_CATEGORIES: {
  id: WallpaperCategory;
  labelAr: string;
  labelEn: string;
}[] = [
  { id: 'all', labelAr: 'الكل (25)', labelEn: 'All (25)' },
  { id: 'whatsapp', labelAr: 'واتساب', labelEn: 'WhatsApp' },
  { id: 'telegram', labelAr: 'تليجرام', labelEn: 'Telegram' },
  { id: 'botanical', labelAr: 'طبيعة ولطيف', labelEn: 'Botanical' },
  { id: 'geometric', labelAr: 'زخارف وهندسة', labelEn: 'Patterns' },
  { id: 'dark', labelAr: 'ليلي برسومات', labelEn: 'Dark Doodles' },
];

export const WALLPAPER_OPTIONS: WallpaperOption[] = [
  {
    id: 'none',
    category: 'none',
    labelAr: 'بدون خلفية',
    labelEn: 'Default',
    isDark: false,
    baseColor: 'transparent',
    gradient: 'none',
    patternUri: 'none',
    patternOpacity: 0,
    patternSize: 200,
  },

  // --- WhatsApp Classic Colored Doodle Wallpapers (6) ---
  {
    id: 'wa_sand_doodle',
    category: 'whatsapp',
    labelAr: 'واتساب بيج',
    labelEn: 'WA Classic Sand',
    isDark: false,
    baseColor: '#EFEAE2',
    gradient: 'linear-gradient(155deg, #F5EFE6 0%, #EAE2D3 52%, #E5DCC9 100%)',
    patternUri: WA_DARK_INK,
    patternOpacity: 0.14,
    patternSize: 210,
  },
  {
    id: 'wa_mint_doodle',
    category: 'whatsapp',
    labelAr: 'واتساب نعناعي',
    labelEn: 'WA Mint Doodles',
    isDark: false,
    baseColor: '#DDF5EC',
    gradient: 'linear-gradient(150deg, #E8FAF3 0%, #D2F2E5 50%, #C2EBDC 100%)',
    patternUri: WA_TEAL_INK,
    patternOpacity: 0.16,
    patternSize: 210,
  },
  {
    id: 'wa_sky_doodle',
    category: 'whatsapp',
    labelAr: 'واتساب سماوي',
    labelEn: 'WA Sky Doodles',
    isDark: false,
    baseColor: '#DCEEFF',
    gradient: 'linear-gradient(155deg, #EBF5FF 0%, #D4EBFF 52%, #C2E2FF 100%)',
    patternUri: WA_SKY_INK,
    patternOpacity: 0.16,
    patternSize: 210,
  },
  {
    id: 'wa_peach_doodle',
    category: 'whatsapp',
    labelAr: 'واتساب خوخي',
    labelEn: 'WA Warm Peach',
    isDark: false,
    baseColor: '#FCE8DB',
    gradient: 'linear-gradient(150deg, #FFF1E8 0%, #FCE1D0 52%, #F9D4BE 100%)',
    patternUri: WA_WARM_INK,
    patternOpacity: 0.15,
    patternSize: 210,
  },
  {
    id: 'wa_lavender_doodle',
    category: 'whatsapp',
    labelAr: 'واتساب لافندر',
    labelEn: 'WA Lavender',
    isDark: false,
    baseColor: '#EAE4FC',
    gradient: 'linear-gradient(150deg, #F4F0FF 0%, #E5DCFF 52%, #D9CCFF 100%)',
    patternUri: WA_VIOLET_INK,
    patternOpacity: 0.15,
    patternSize: 210,
  },
  {
    id: 'wa_rose_doodle',
    category: 'whatsapp',
    labelAr: 'واتساب وردي',
    labelEn: 'WA Soft Rose',
    isDark: false,
    baseColor: '#FCE4EC',
    gradient: 'linear-gradient(150deg, #FFF0F5 0%, #FCDCE7 52%, #F9CADB 100%)',
    patternUri: WA_ROSE_INK,
    patternOpacity: 0.14,
    patternSize: 210,
  },

  // --- Telegram Vibrant Multi-Tone Gradients + Dense Doodles (6) ---
  {
    id: 'tg_aurora_mint',
    category: 'telegram',
    labelAr: 'تليجرام ربيعي',
    labelEn: 'TG Spring Mint',
    isDark: false,
    baseColor: '#D6F3D8',
    gradient:
      'radial-gradient(circle at 12% 18%, #D9F7C8 0%, transparent 52%), radial-gradient(circle at 86% 24%, #BCEEE4 0%, transparent 50%), radial-gradient(circle at 50% 88%, #F4F3C4 0%, transparent 58%), linear-gradient(145deg, #D5F2DA 0%, #B8E9DF 100%)',
    patternUri: TG_TEAL_INK,
    patternOpacity: 0.17,
    patternSize: 215,
  },
  {
    id: 'tg_ocean_breeze',
    category: 'telegram',
    labelAr: 'تليجرام بحري',
    labelEn: 'TG Ocean Breeze',
    isDark: false,
    baseColor: '#CBE7FF',
    gradient:
      'radial-gradient(circle at 18% 14%, #C4F1F9 0%, transparent 52%), radial-gradient(circle at 84% 78%, #C9D8FF 0%, transparent 54%), linear-gradient(145deg, #CBE8FF 0%, #BFEAE8 50%, #D5E2FF 100%)',
    patternUri: TG_BLUE_INK,
    patternOpacity: 0.17,
    patternSize: 215,
  },
  {
    id: 'tg_sunset_coral',
    category: 'telegram',
    labelAr: 'تليجرام غروب',
    labelEn: 'TG Coral Sunset',
    isDark: false,
    baseColor: '#FDDDC9',
    gradient:
      'radial-gradient(circle at 16% 16%, #FFE8B6 0%, transparent 50%), radial-gradient(circle at 85% 30%, #FFC9D6 0%, transparent 52%), radial-gradient(circle at 46% 90%, #FFD6BA 0%, transparent 55%), linear-gradient(145deg, #FFE4C9 0%, #FCD1D8 100%)',
    patternUri: TG_CORAL_INK,
    patternOpacity: 0.16,
    patternSize: 215,
  },
  {
    id: 'tg_berry_dream',
    category: 'telegram',
    labelAr: 'تليجرام بنفسجي',
    labelEn: 'TG Berry Dream',
    isDark: false,
    baseColor: '#E5D7FC',
    gradient:
      'radial-gradient(circle at 14% 20%, #F7D4EE 0%, transparent 50%), radial-gradient(circle at 86% 22%, #CFE0FF 0%, transparent 52%), radial-gradient(circle at 50% 88%, #E1CEFF 0%, transparent 56%), linear-gradient(150deg, #ECDCFF 0%, #D9E2FF 100%)',
    patternUri: TG_BERRY_INK,
    patternOpacity: 0.16,
    patternSize: 215,
  },
  {
    id: 'tg_pistachio_sky',
    category: 'telegram',
    labelAr: 'فستقي وسماوي',
    labelEn: 'TG Pistachio Sky',
    isDark: false,
    baseColor: '#DCF3E1',
    gradient:
      'radial-gradient(circle at 20% 15%, #E3F6B8 0%, transparent 50%), radial-gradient(circle at 85% 80%, #BFE6FF 0%, transparent 52%), linear-gradient(145deg, #E2F5CE 0%, #C7EEDF 55%, #C9E8FF 100%)',
    patternUri: TG_OLIVE_INK,
    patternOpacity: 0.15,
    patternSize: 215,
  },
  {
    id: 'tg_warm_honey',
    category: 'telegram',
    labelAr: 'تليجرام عسلي',
    labelEn: 'TG Warm Honey',
    isDark: false,
    baseColor: '#FBECC8',
    gradient:
      'radial-gradient(circle at 18% 18%, #FFF4C4 0%, transparent 52%), radial-gradient(circle at 84% 78%, #FAD7B8 0%, transparent 54%), linear-gradient(145deg, #FEF0C7 0%, #F9DFB8 100%)',
    patternUri: TG_AMBER_INK,
    patternOpacity: 0.16,
    patternSize: 215,
  },

  // --- Botanical, Cozy & Geometric Patterns (7) ---
  {
    id: 'botanical_sage',
    category: 'botanical',
    labelAr: 'أوراق الشجر',
    labelEn: 'Sage Leaves',
    isDark: false,
    baseColor: '#DCF0E4',
    gradient: 'linear-gradient(155deg, #EAF7EE 0%, #D3ECDD 55%, #C4E5D1 100%)',
    patternUri: BOTANICAL_GREEN_INK,
    patternOpacity: 0.19,
    patternSize: 200,
  },
  {
    id: 'botanical_blossom',
    category: 'botanical',
    labelAr: 'زهور الربيع',
    labelEn: 'Spring Blossom',
    isDark: false,
    baseColor: '#FDE6EE',
    gradient:
      'radial-gradient(circle at 18% 20%, #FFF0F6 0%, transparent 54%), radial-gradient(circle at 85% 80%, #FFE4CC 0%, transparent 52%), linear-gradient(150deg, #FDE4EE 0%, #FCE0DA 100%)',
    patternUri: BOTANICAL_ROSE_INK,
    patternOpacity: 0.17,
    patternSize: 200,
  },
  {
    id: 'cozy_coffee',
    category: 'botanical',
    labelAr: 'قهوة ودفاتر',
    labelEn: 'Cozy Café',
    isDark: false,
    baseColor: '#F5E8D9',
    gradient: 'linear-gradient(155deg, #FBF3E8 0%, #F2E1CE 55%, #E9D3BC 100%)',
    patternUri: COZY_BROWN_INK,
    patternOpacity: 0.17,
    patternSize: 200,
  },
  {
    id: 'cozy_meadow',
    category: 'botanical',
    labelAr: 'حديقة هادئة',
    labelEn: 'Cozy Meadow',
    isDark: false,
    baseColor: '#E3F3DD',
    gradient: 'linear-gradient(150deg, #F0FAE9 0%, #DCF0D4 55%, #CDE8C3 100%)',
    patternUri: COZY_GREEN_INK,
    patternOpacity: 0.16,
    patternSize: 200,
  },
  {
    id: 'arabesque_mint',
    category: 'geometric',
    labelAr: 'زخرفة نعناعية',
    labelEn: 'Mint Arabesque',
    isDark: false,
    baseColor: '#D6F2EC',
    gradient: 'linear-gradient(150deg, #E8FAF6 0%, #CEEFE7 55%, #BCE6DC 100%)',
    patternUri: ARABESQUE_TEAL_INK,
    patternOpacity: 0.17,
    patternSize: 120,
  },
  {
    id: 'arabesque_gold',
    category: 'geometric',
    labelAr: 'زخرفة ذهبية',
    labelEn: 'Royal Cream Gold',
    isDark: false,
    baseColor: '#F8EED8',
    gradient: 'linear-gradient(150deg, #FCF7EA 0%, #F5E6C5 55%, #EDD9AE 100%)',
    patternUri: ARABESQUE_GOLD_INK,
    patternOpacity: 0.17,
    patternSize: 120,
  },
  {
    id: 'confetti_pastel',
    category: 'geometric',
    labelAr: 'ألوان مبهجة',
    labelEn: 'Pastel Confetti',
    isDark: false,
    baseColor: '#E8ECFF',
    gradient:
      'radial-gradient(circle at 15% 15%, #FFE3F1 0%, transparent 50%), radial-gradient(circle at 85% 20%, #D2F4FF 0%, transparent 50%), radial-gradient(circle at 50% 88%, #FFF2C6 0%, transparent 55%), linear-gradient(145deg, #ECEBFF 0%, #E0F5FF 100%)',
    patternUri: CONFETTI_INK,
    patternOpacity: 0.18,
    patternSize: 180,
  },

  // --- Dark WhatsApp & Telegram Night Doodle Wallpapers (6) ---
  {
    id: 'dark_wa_classic',
    category: 'dark',
    labelAr: 'واتساب ليلي',
    labelEn: 'WA Dark Classic',
    isDark: true,
    baseColor: '#0B141A',
    gradient: 'linear-gradient(155deg, #0D181F 0%, #0B141A 55%, #091015 100%)',
    patternUri: WA_WHITE_INK,
    patternOpacity: 0.085,
    patternSize: 210,
  },
  {
    id: 'dark_tg_emerald',
    category: 'dark',
    labelAr: 'زمردي ليلي',
    labelEn: 'TG Night Emerald',
    isDark: true,
    baseColor: '#07221E',
    gradient:
      'radial-gradient(circle at 18% 16%, #0D3D34 0%, transparent 54%), radial-gradient(circle at 84% 80%, #0A2E38 0%, transparent 56%), linear-gradient(150deg, #07221E 0%, #06181A 100%)',
    patternUri: TG_WHITE_INK,
    patternOpacity: 0.11,
    patternSize: 215,
  },
  {
    id: 'dark_tg_midnight',
    category: 'dark',
    labelAr: 'سماء النجوم',
    labelEn: 'Starry Night',
    isDark: true,
    baseColor: '#0B132B',
    gradient:
      'radial-gradient(circle at 20% 18%, #1C2541 0%, transparent 52%), radial-gradient(circle at 84% 78%, #1E1B4B 0%, transparent 54%), linear-gradient(155deg, #0B132B 0%, #070B19 100%)',
    patternUri: CELESTIAL_WHITE_INK,
    patternOpacity: 0.14,
    patternSize: 200,
  },
  {
    id: 'dark_tg_royal',
    category: 'dark',
    labelAr: 'أزرق ملكي ليلي',
    labelEn: 'TG Royal Blue',
    isDark: true,
    baseColor: '#0C1E38',
    gradient:
      'radial-gradient(circle at 16% 18%, #163A63 0%, transparent 54%), radial-gradient(circle at 86% 80%, #10324E 0%, transparent 54%), linear-gradient(150deg, #0C1E38 0%, #081326 100%)',
    patternUri: TG_WHITE_INK,
    patternOpacity: 0.11,
    patternSize: 215,
  },
  {
    id: 'dark_tg_plum',
    category: 'dark',
    labelAr: 'بنفسجي ليلي',
    labelEn: 'TG Night Plum',
    isDark: true,
    baseColor: '#1E1033',
    gradient:
      'radial-gradient(circle at 18% 18%, #3B185F 0%, transparent 54%), radial-gradient(circle at 84% 82%, #2A164B 0%, transparent 56%), linear-gradient(150deg, #1E1033 0%, #130921 100%)',
    patternUri: WA_WHITE_INK,
    patternOpacity: 0.11,
    patternSize: 210,
  },
  {
    id: 'dark_gold_arabesque',
    category: 'dark',
    labelAr: 'أسود وذهبي',
    labelEn: 'Black & Gold',
    isDark: true,
    baseColor: '#111318',
    gradient:
      'radial-gradient(circle at 20% 15%, #272216 0%, transparent 55%), linear-gradient(155deg, #16181F 0%, #0E1015 100%)',
    patternUri: ARABESQUE_LIGHT_GOLD,
    patternOpacity: 0.13,
    patternSize: 120,
  },
];

export const VALID_WALLPAPER_IDS: WallpaperId[] = WALLPAPER_OPTIONS.map((w) => w.id);

export function sanitizeWallpaperId(val?: unknown): WallpaperId {
  if (typeof val === 'string' && VALID_WALLPAPER_IDS.includes(val as WallpaperId)) {
    return val as WallpaperId;
  }
  return 'none';
}

export function sanitizePageWallpaperChoice(val?: unknown): PageWallpaperChoice {
  if (val === 'inherit') return 'inherit';
  if (typeof val === 'string' && VALID_WALLPAPER_IDS.includes(val as WallpaperId)) {
    return val as WallpaperId;
  }
  return 'inherit';
}

export function getWallpaperById(id?: string): WallpaperOption {
  return WALLPAPER_OPTIONS.find((w) => w.id === id) || WALLPAPER_OPTIONS[0];
}

export function resolvePageWallpaper(
  globalWallpaperId?: WallpaperId | string,
  pageChoice?: PageWallpaperChoice | string
): WallpaperOption {
  if (pageChoice && pageChoice !== 'inherit') {
    return getWallpaperById(pageChoice);
  }
  return getWallpaperById(globalWallpaperId);
}

export function getWallpaperBaseStyle(wp: WallpaperOption): CSSProperties {
  if (wp.id === 'none') return {};
  return {
    backgroundColor: wp.baseColor,
    backgroundImage: wp.gradient,
  };
}

export function getWallpaperPatternStyle(wp: WallpaperOption): CSSProperties {
  if (wp.id === 'none' || wp.patternUri === 'none') return {};
  return {
    backgroundImage: wp.patternUri,
    backgroundRepeat: 'repeat',
    backgroundSize: `${wp.patternSize}px ${wp.patternSize}px`,
    opacity: wp.patternOpacity,
  };
}
