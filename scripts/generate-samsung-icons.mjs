import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'public', 'app-icons');
fs.mkdirSync(outDir, { recursive: true });

// Remove all old external app icons before generating fresh Samsung Chip icons
for (const file of fs.readdirSync(outDir)) {
  if (file.endsWith('.png') || file.endsWith('.svg')) {
    fs.rmSync(path.join(outDir, file), { force: true });
  }
}

/**
 * Render an ultra-crisp 1024x1024 Samsung One UI Chip-style icon with ImageMagick
 * and Lanczos-downsample to 512x512 for razor-sharp anti-aliasing on Android & PWA.
 */
function renderIcon(filename, bgTop, bgBottom, drawOps) {
  const outPath = path.join(outDir, `${filename}.png`);
  const args = [
    '-size',
    '1024x1024',
    `gradient:${bgTop}-${bgBottom}`,
    ...drawOps,
    '-filter',
    'Lanczos',
    '-resize',
    '512x512!',
    '-strip',
    `PNG32:${outPath}`,
  ];
  execFileSync('convert', args, { stdio: 'inherit' });
}

/**
 * Samsung Chip Style + Original Moamen Wallet Silhouette (1024x1024 coordinate space,
 * safe zone 192..832 so Samsung One UI squircle & Android Adaptive masks never clip).
 *
 * Preserves the exact original Moamen app icon shape:
 *  - Peeking top card tab (272,244 -> 752,438)
 *  - Plump rounded wallet body (218,318 -> 806,754, r=88)
 *  - Smooth top flap highlight (218,318 -> 806,422)
 *  - Signature right-side rounded clasp pocket (602,472 -> 806,608) + circle dot (674,540)
 * Enhanced with Samsung One UI chip craftsmanship:
 *  - Subtle studio radial chip sheen + soft inner squircle chip rim
 *  - Precision metallic Samsung EMV smart chip on the wallet face (288,482 -> 422,588)
 *  - Optional subtle contactless arcs / accent bar / dual peeking card layer
 */
function samsungChipWalletOps({
  chipRim = 'rgba(255,255,255,0.28)',
  studioGlow = 'rgba(255,255,255,0.22)',
  backCard = 'rgba(255,255,255,0.44)',
  backCardStripe = 'rgba(255,255,255,0.28)',
  bodyTop = '#FFFFFF',
  bodyBottom = '#F1F7F6',
  flap = 'rgba(255,255,255,0.92)',
  flapEdge = 'rgba(255,255,255,0.55)',
  claspBg = '#12A87E',
  claspDot = '#FFFFFF',
  emvTop = '#F9D76B',
  emvBottom = '#D99E26',
  emvLine = '#A97312',
  accentBar = 'rgba(18,168,126,0.24)',
  shadow = 'rgba(15,23,42,0.20)',
  showDualCard = false,
  showContactless = false,
  contactlessColor = 'rgba(18,168,126,0.48)',
}) {
  const ops = [
    // Subtle top-left Samsung One UI studio light bloom
    '(',
    '-size', '1024x1024', 'xc:none',
    '-fill', studioGlow,
    '-draw', 'circle 260,210 720,210',
    '-blur', '0x110',
    ')',
    '-compose', 'Over', '-composite',

    // Soft Samsung One UI squircle chip bezel frame (sits cleanly inside safe margins)
    '-fill', 'none',
    '-stroke', chipRim,
    '-strokewidth', '16',
    '-draw', 'roundrectangle 96,96 928,928 228,228',
    '-stroke', 'none',

    // Soft ambient drop shadow beneath the original wallet silhouette
    '(',
    '-size', '1024x1024', 'xc:none',
    '-fill', shadow,
    '-draw', 'roundrectangle 218,342 806,776 88,88',
    '-blur', '0x26',
    ')',
    '-compose', 'Over', '-composite',
  ];

  // Optional subtle upper-most micro card layer for dual-card Samsung Pay editions
  if (showDualCard) {
    ops.push(
      '-fill', backCardStripe,
      '-draw', 'roundrectangle 318,214 706,368 48,48'
    );
  }

  ops.push(
    // Original peeking translucent top card tab
    '-fill', backCard,
    '-draw', 'roundrectangle 272,248 752,440 58,58',

    // Subtle sheen strip on peeking top card
    '-fill', backCardStripe,
    '-draw', 'roundrectangle 302,276 722,302 13,13',

    // Original main rounded wallet body + top flap highlight clipped cleanly inside the 88px wallet silhouette
    '(',
    '-size', '1024x1024', `gradient:${bodyTop}-${bodyBottom}`,
    '-fill', flap,
    '-draw', 'roundrectangle 218,318 806,426 54,54',
    '-fill', flapEdge,
    '-draw', 'roundrectangle 266,332 758,348 8,8',
    '(',
    '-size', '1024x1024', 'xc:black',
    '-fill', 'white',
    '-draw', 'roundrectangle 218,318 806,752 88,88',
    ')',
    '-alpha', 'off', '-compose', 'CopyOpacity', '-composite',
    ')',
    '-compose', 'Over', '-composite',

    // Precision metallic Samsung EMV Smart Chip (left face of wallet)
    '(',
    '-size', '1024x1024', 'xc:none',
    '-fill', 'rgba(15,23,42,0.16)',
    '-draw', 'roundrectangle 288,494 426,600 24,24',
    '-blur', '0x8',
    ')',
    '-compose', 'Over', '-composite',
    '(',
    '-size', '1024x1024', `gradient:${emvTop}-${emvBottom}`,
    '(',
    '-size', '1024x1024', 'xc:black',
    '-fill', 'white',
    '-draw', 'roundrectangle 286,484 424,592 24,24',
    ')',
    '-alpha', 'off', '-compose', 'CopyOpacity', '-composite',
    ')',
    '-compose', 'Over', '-composite',

    // Geometric EMV smart-chip contact traces
    '-stroke', emvLine, '-strokewidth', '6', '-fill', 'none',
    '-draw', 'roundrectangle 330,512 380,564 10,10',
    '-draw', 'line 286,522 330,522',
    '-draw', 'line 286,554 330,554',
    '-draw', 'line 380,522 424,522',
    '-draw', 'line 380,554 424,554',
    '-draw', 'line 355,484 355,512',
    '-draw', 'line 355,564 355,592',
    '-stroke', 'none',

    // Glossy diagonal glint on the EMV chip
    '-fill', 'rgba(255,255,255,0.34)',
    '-draw', 'roundrectangle 296,492 346,512 8,8',

    // Subtle precision micro-accent bar below the chip (Samsung Pay signature)
    '-fill', accentBar,
    '-draw', 'roundrectangle 288,644 434,670 13,13',
    '-draw', 'roundrectangle 454,644 532,670 13,13'
  );

  // Optional subtle contactless wave arcs beside the chip
  if (showContactless) {
    ops.push(
      '-stroke', contactlessColor, '-strokewidth', '12', '-fill', 'none',
      '-draw', 'stroke-linecap round arc 460,516 502,558 315,45 arc 442,498 520,576 315,45',
      '-stroke', 'none'
    );
  }

  ops.push(
    // Soft shadow under the right-side clasp pocket
    '(',
    '-size', '1024x1024', 'xc:none',
    '-fill', 'rgba(15,23,42,0.18)',
    '-draw', 'roundrectangle 602,482 806,618 68,68',
    '-blur', '0x12',
    ')',
    '-compose', 'Over', '-composite',

    // Original signature right-side rounded clasp pocket
    '-fill', claspBg,
    '-draw', 'roundrectangle 602,472 806,608 68,68',

    // Subtle specular highlight on clasp pocket
    '-fill', 'rgba(255,255,255,0.18)',
    '-draw', 'roundrectangle 622,484 786,510 13,13',

    // Original clasp circle dot button
    '-fill', claspDot,
    '-draw', 'circle 674,540 706,540'
  );

  return ops;
}

// ============================================================================
// Generate all 16 Samsung Chip-Style External App Icons
// (All 16 preserve the original Moamen wallet silhouette + Samsung chip detail)
// ============================================================================

// --- WHITE COLLECTION (4) ---
renderIcon(
  'samsung_white_wallet',
  '#FFFFFF',
  '#EEF5F3',
  samsungChipWalletOps({
    chipRim: 'rgba(16,185,129,0.22)',
    studioGlow: 'rgba(255,255,255,0.65)',
    backCard: '#9DE9D1',
    backCardStripe: 'rgba(255,255,255,0.52)',
    bodyTop: '#1CC495',
    bodyBottom: '#0F9471',
    flap: 'rgba(65,224,177,0.55)',
    flapEdge: 'rgba(255,255,255,0.45)',
    claspBg: '#0B7B5D',
    claspDot: '#FFFFFF',
    emvTop: '#FDE084',
    emvBottom: '#DDA027',
    emvLine: '#9E6A0C',
    accentBar: 'rgba(255,255,255,0.34)',
    shadow: 'rgba(15,148,113,0.24)',
  })
);

renderIcon(
  'samsung_white_card',
  '#FFFFFF',
  '#EEF5FE',
  samsungChipWalletOps({
    chipRim: 'rgba(37,125,235,0.22)',
    studioGlow: 'rgba(255,255,255,0.65)',
    backCard: '#9CD1FF',
    backCardStripe: 'rgba(255,255,255,0.50)',
    bodyTop: '#3696FA',
    bodyBottom: '#1969D8',
    flap: 'rgba(105,180,255,0.48)',
    flapEdge: 'rgba(255,255,255,0.48)',
    claspBg: '#1253B8',
    claspDot: '#FFFFFF',
    emvTop: '#FDE084',
    emvBottom: '#DDA027',
    emvLine: '#9E6A0C',
    accentBar: 'rgba(255,255,255,0.34)',
    shadow: 'rgba(25,105,216,0.24)',
    showDualCard: true,
    showContactless: true,
    contactlessColor: 'rgba(255,255,255,0.62)',
  })
);

renderIcon(
  'samsung_white_finance',
  '#FFFFFF',
  '#F2F7F5',
  samsungChipWalletOps({
    chipRim: 'rgba(15,118,110,0.20)',
    studioGlow: 'rgba(255,255,255,0.65)',
    backCard: '#F7D98C',
    backCardStripe: 'rgba(255,255,255,0.55)',
    bodyTop: '#16A085',
    bodyBottom: '#0B6E5B',
    flap: 'rgba(72,209,180,0.42)',
    flapEdge: 'rgba(255,255,255,0.42)',
    claspBg: '#E6AE32',
    claspDot: '#FFFFFF',
    emvTop: '#FFF2B8',
    emvBottom: '#DF9F20',
    emvLine: '#966308',
    accentBar: 'rgba(255,240,185,0.42)',
    shadow: 'rgba(11,110,91,0.22)',
    showContactless: true,
    contactlessColor: 'rgba(255,235,160,0.62)',
  })
);

renderIcon(
  'samsung_pearl_m',
  '#FCFEFD',
  '#E8F0EE',
  samsungChipWalletOps({
    chipRim: 'rgba(51,65,85,0.16)',
    studioGlow: 'rgba(255,255,255,0.75)',
    backCard: '#CBD5E1',
    backCardStripe: 'rgba(255,255,255,0.65)',
    bodyTop: '#334155',
    bodyBottom: '#1E293B',
    flap: 'rgba(100,116,139,0.42)',
    flapEdge: 'rgba(255,255,255,0.34)',
    claspBg: '#16B88A',
    claspDot: '#FFFFFF',
    emvTop: '#E8EEF5',
    emvBottom: '#B8C4D4',
    emvLine: '#64748B',
    accentBar: 'rgba(255,255,255,0.26)',
    shadow: 'rgba(15,23,42,0.24)',
    showDualCard: true,
  })
);

// --- MINT COLLECTION (4) ---
renderIcon(
  'samsung_mint_wallet',
  '#34D7A4',
  '#0C9A72',
  samsungChipWalletOps({
    chipRim: 'rgba(255,255,255,0.32)',
    studioGlow: 'rgba(255,255,255,0.26)',
    backCard: 'rgba(255,255,255,0.44)',
    backCardStripe: 'rgba(255,255,255,0.38)',
    bodyTop: '#FFFFFF',
    bodyBottom: '#ECFBF5',
    flap: 'rgba(255,255,255,0.96)',
    flapEdge: 'rgba(255,255,255,0.85)',
    claspBg: '#0FA178',
    claspDot: '#FFFFFF',
    emvTop: '#F9D66A',
    emvBottom: '#D89B22',
    emvLine: '#9B690C',
    accentBar: 'rgba(15,161,120,0.24)',
    shadow: 'rgba(6,78,59,0.26)',
  })
);

renderIcon(
  'samsung_mint_card',
  '#4AE0B4',
  '#13A37B',
  samsungChipWalletOps({
    chipRim: 'rgba(255,255,255,0.34)',
    studioGlow: 'rgba(255,255,255,0.28)',
    backCard: 'rgba(255,255,255,0.42)',
    backCardStripe: 'rgba(255,255,255,0.36)',
    bodyTop: '#FFFFFF',
    bodyBottom: '#E6FAF3',
    flap: 'rgba(255,255,255,0.94)',
    flapEdge: 'rgba(255,255,255,0.85)',
    claspBg: '#129773',
    claspDot: '#FEF3C7',
    emvTop: '#FAD973',
    emvBottom: '#D89C24',
    emvLine: '#98660C',
    accentBar: 'rgba(18,151,115,0.26)',
    shadow: 'rgba(6,78,59,0.24)',
    showDualCard: true,
    showContactless: true,
    contactlessColor: 'rgba(18,151,115,0.52)',
  })
);

renderIcon(
  'samsung_mint_coins',
  '#1EC68E',
  '#087D5B',
  samsungChipWalletOps({
    chipRim: 'rgba(255,255,255,0.30)',
    studioGlow: 'rgba(255,255,255,0.22)',
    backCard: 'rgba(253,224,132,0.58)',
    backCardStripe: 'rgba(255,255,255,0.45)',
    bodyTop: '#FFFFFF',
    bodyBottom: '#EEFAF5',
    flap: 'rgba(255,255,255,0.96)',
    flapEdge: 'rgba(255,255,255,0.85)',
    claspBg: '#E6AE2F',
    claspDot: '#FFFFFF',
    emvTop: '#FDE084',
    emvBottom: '#D4941A',
    emvLine: '#8F5E06',
    accentBar: 'rgba(14,151,111,0.24)',
    shadow: 'rgba(4,60,44,0.28)',
    showContactless: true,
    contactlessColor: 'rgba(218,158,34,0.65)',
  })
);

renderIcon(
  'samsung_mint_soft',
  '#E4FBF3',
  '#BCEEE0',
  samsungChipWalletOps({
    chipRim: 'rgba(16,163,122,0.24)',
    studioGlow: 'rgba(255,255,255,0.55)',
    backCard: '#7ADEC0',
    backCardStripe: 'rgba(255,255,255,0.48)',
    bodyTop: '#16B589',
    bodyBottom: '#0C8867',
    flap: 'rgba(69,224,179,0.48)',
    flapEdge: 'rgba(255,255,255,0.44)',
    claspBg: '#096B50',
    claspDot: '#FFFFFF',
    emvTop: '#FDE084',
    emvBottom: '#DDA027',
    emvLine: '#9B690C',
    accentBar: 'rgba(255,255,255,0.34)',
    shadow: 'rgba(12,130,98,0.22)',
    showDualCard: true,
  })
);

// --- SKY BLUE COLLECTION (4) ---
renderIcon(
  'samsung_sky_wallet',
  '#56BEFF',
  '#1B7AE6',
  samsungChipWalletOps({
    chipRim: 'rgba(255,255,255,0.34)',
    studioGlow: 'rgba(255,255,255,0.26)',
    backCard: 'rgba(255,255,255,0.44)',
    backCardStripe: 'rgba(255,255,255,0.38)',
    bodyTop: '#FFFFFF',
    bodyBottom: '#EDF5FF',
    flap: 'rgba(255,255,255,0.96)',
    flapEdge: 'rgba(255,255,255,0.85)',
    claspBg: '#1D7EE8',
    claspDot: '#FFFFFF',
    emvTop: '#F9D66A',
    emvBottom: '#D89B22',
    emvLine: '#9B690C',
    accentBar: 'rgba(29,126,232,0.24)',
    shadow: 'rgba(12,56,128,0.26)',
  })
);

renderIcon(
  'samsung_sky_card',
  '#65C8FF',
  '#1F84EE',
  samsungChipWalletOps({
    chipRim: 'rgba(255,255,255,0.34)',
    studioGlow: 'rgba(255,255,255,0.26)',
    backCard: 'rgba(255,255,255,0.42)',
    backCardStripe: 'rgba(255,255,255,0.36)',
    bodyTop: '#FFFFFF',
    bodyBottom: '#E9F4FF',
    flap: 'rgba(255,255,255,0.95)',
    flapEdge: 'rgba(255,255,255,0.85)',
    claspBg: '#196FD9',
    claspDot: '#FFFFFF',
    emvTop: '#E5ECF5',
    emvBottom: '#B5C5D8',
    emvLine: '#5E728A',
    accentBar: 'rgba(25,111,217,0.24)',
    shadow: 'rgba(12,56,128,0.24)',
    showDualCard: true,
    showContactless: true,
    contactlessColor: 'rgba(25,111,217,0.52)',
  })
);

renderIcon(
  'samsung_sky_soft',
  '#E5F3FF',
  '#BEDEFF',
  samsungChipWalletOps({
    chipRim: 'rgba(30,126,235,0.24)',
    studioGlow: 'rgba(255,255,255,0.58)',
    backCard: '#84C5FF',
    backCardStripe: 'rgba(255,255,255,0.50)',
    bodyTop: '#2689F5',
    bodyBottom: '#1462CE',
    flap: 'rgba(104,178,255,0.48)',
    flapEdge: 'rgba(255,255,255,0.46)',
    claspBg: '#0E4EAD',
    claspDot: '#FFFFFF',
    emvTop: '#FDE084',
    emvBottom: '#DDA027',
    emvLine: '#9B690C',
    accentBar: 'rgba(255,255,255,0.34)',
    shadow: 'rgba(20,98,206,0.24)',
    showContactless: true,
    contactlessColor: 'rgba(255,255,255,0.62)',
  })
);

renderIcon(
  'samsung_sky_bank',
  '#3EA9FA',
  '#125ECD',
  samsungChipWalletOps({
    chipRim: 'rgba(255,255,255,0.30)',
    studioGlow: 'rgba(255,255,255,0.24)',
    backCard: 'rgba(253,224,132,0.55)',
    backCardStripe: 'rgba(255,255,255,0.42)',
    bodyTop: '#FFFFFF',
    bodyBottom: '#ECF4FF',
    flap: 'rgba(255,255,255,0.96)',
    flapEdge: 'rgba(255,255,255,0.85)',
    claspBg: '#1151BA',
    claspDot: '#FDE084',
    emvTop: '#FDE084',
    emvBottom: '#D6971D',
    emvLine: '#946109',
    accentBar: 'rgba(17,81,186,0.24)',
    shadow: 'rgba(10,45,112,0.28)',
    showDualCard: true,
  })
);

// --- FINANCIAL DESIGNS & BANK CARDS COLLECTION (4) ---
renderIcon(
  'samsung_cobalt_visa',
  '#3572FF',
  '#1440C0',
  samsungChipWalletOps({
    chipRim: 'rgba(255,255,255,0.32)',
    studioGlow: 'rgba(147,197,253,0.30)',
    backCard: 'rgba(147,197,253,0.50)',
    backCardStripe: 'rgba(255,255,255,0.40)',
    bodyTop: '#FFFFFF',
    bodyBottom: '#EBF2FF',
    flap: 'rgba(255,255,255,0.95)',
    flapEdge: 'rgba(255,255,255,0.85)',
    claspBg: '#1A4CD6',
    claspDot: '#FFFFFF',
    emvTop: '#FDE084',
    emvBottom: '#D99920',
    emvLine: '#966308',
    accentBar: 'rgba(26,76,214,0.26)',
    shadow: 'rgba(10,30,96,0.30)',
    showDualCard: true,
    showContactless: true,
    contactlessColor: 'rgba(26,76,214,0.56)',
  })
);

renderIcon(
  'samsung_gold_card',
  '#F5CC6E',
  '#C6881F',
  samsungChipWalletOps({
    chipRim: 'rgba(255,251,235,0.40)',
    studioGlow: 'rgba(255,251,235,0.30)',
    backCard: 'rgba(255,255,255,0.42)',
    backCardStripe: 'rgba(255,255,255,0.40)',
    bodyTop: '#FFFDF7',
    bodyBottom: '#FBF1D8',
    flap: 'rgba(255,254,248,0.96)',
    flapEdge: 'rgba(255,255,255,0.88)',
    claspBg: '#C8891E',
    claspDot: '#FFFFFF',
    emvTop: '#F6C853',
    emvBottom: '#BA7B14',
    emvLine: '#7E4F05',
    accentBar: 'rgba(186,123,20,0.28)',
    shadow: 'rgba(110,68,8,0.28)',
    showDualCard: true,
    showContactless: true,
    contactlessColor: 'rgba(186,123,20,0.55)',
  })
);

renderIcon(
  'samsung_teal_transfer',
  '#2FD4CA',
  '#0A8596',
  samsungChipWalletOps({
    chipRim: 'rgba(255,255,255,0.32)',
    studioGlow: 'rgba(255,255,255,0.26)',
    backCard: 'rgba(255,255,255,0.44)',
    backCardStripe: 'rgba(255,255,255,0.38)',
    bodyTop: '#FFFFFF',
    bodyBottom: '#E9FAF9',
    flap: 'rgba(255,255,255,0.96)',
    flapEdge: 'rgba(255,255,255,0.85)',
    claspBg: '#0D8A99',
    claspDot: '#FDE084',
    emvTop: '#F9D66A',
    emvBottom: '#D69820',
    emvLine: '#966308',
    accentBar: 'rgba(13,138,153,0.26)',
    shadow: 'rgba(6,68,78,0.26)',
    showContactless: true,
    contactlessColor: 'rgba(13,138,153,0.54)',
  })
);

renderIcon(
  'samsung_obsidian_card',
  '#2B3548',
  '#111724',
  samsungChipWalletOps({
    chipRim: 'rgba(255,255,255,0.22)',
    studioGlow: 'rgba(56,189,248,0.22)',
    backCard: 'rgba(56,189,248,0.42)',
    backCardStripe: 'rgba(255,255,255,0.30)',
    bodyTop: '#24C79A',
    bodyBottom: '#197FE6',
    flap: 'rgba(255,255,255,0.20)',
    flapEdge: 'rgba(255,255,255,0.40)',
    claspBg: '#0F172A',
    claspDot: '#FDE084',
    emvTop: '#FDE084',
    emvBottom: '#D6961B',
    emvLine: '#8C5B05',
    accentBar: 'rgba(255,255,255,0.38)',
    shadow: 'rgba(0,0,0,0.48)',
    showDualCard: true,
    showContactless: true,
    contactlessColor: 'rgba(255,255,255,0.68)',
  })
);

// Update default PWA icons to match our flagship Samsung Chip Mint Wallet icon
const defaultIconSrc = path.join(outDir, 'samsung_mint_wallet.png');
const pwaTargets = [
  { dest: path.join(root, 'public', 'pwa-512x512.png'), size: 512 },
  { dest: path.join(root, 'public', 'pwa-maskable-512x512.png'), size: 512 },
  { dest: path.join(root, 'public', 'pwa-192x192.png'), size: 192 },
  { dest: path.join(root, 'public', 'apple-touch-icon.png'), size: 180 },
];
for (const t of pwaTargets) {
  execFileSync(
    'convert',
    [defaultIconSrc, '-filter', 'Lanczos', '-resize', `${t.size}x${t.size}!`, '-strip', t.dest],
    { stdio: 'inherit' }
  );
}

console.log('Generated all 16 Samsung Chip-Style external app icons preserving original wallet shape + updated PWA icons!');
