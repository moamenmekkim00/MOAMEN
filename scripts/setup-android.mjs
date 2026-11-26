import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const androidMain = path.join(root, 'android', 'app', 'src', 'main');
const androidRes = path.join(androidMain, 'res');
const manifestPath = path.join(androidMain, 'AndroidManifest.xml');
const stylesPath = path.join(androidRes, 'values', 'styles.xml');
const iconColorsPath = path.join(androidRes, 'values', 'icon_colors.xml');
const mainActivityPath = path.join(
  androidMain,
  'java',
  'com',
  'moamen',
  'app',
  'MainActivity.java'
);

const APP_ICONS = [
  // White Collection (4)
  { id: 'samsung_white_wallet', alias: '.LauncherSamsungWhiteWallet', resName: 'ic_launcher_samsung_white_wallet', bgHex: '#FFFFFF', src: path.join(root, 'public', 'app-icons', 'samsung_white_wallet.png'), enabled: false },
  { id: 'samsung_white_card', alias: '.LauncherSamsungWhiteCard', resName: 'ic_launcher_samsung_white_card', bgHex: '#FFFFFF', src: path.join(root, 'public', 'app-icons', 'samsung_white_card.png'), enabled: false },
  { id: 'samsung_white_finance', alias: '.LauncherSamsungWhiteFinance', resName: 'ic_launcher_samsung_white_finance', bgHex: '#FFFFFF', src: path.join(root, 'public', 'app-icons', 'samsung_white_finance.png'), enabled: false },
  { id: 'samsung_pearl_m', alias: '.LauncherSamsungPearlM', resName: 'ic_launcher_samsung_pearl_m', bgHex: '#F4F8F7', src: path.join(root, 'public', 'app-icons', 'samsung_pearl_m.png'), enabled: false },
  // Mint Collection (4)
  { id: 'samsung_mint_wallet', alias: '.LauncherSamsungMintWallet', resName: 'ic_launcher_samsung_mint_wallet', bgHex: '#1CB98B', src: path.join(root, 'public', 'app-icons', 'samsung_mint_wallet.png'), enabled: true },
  { id: 'samsung_mint_card', alias: '.LauncherSamsungMintCard', resName: 'ic_launcher_samsung_mint_card', bgHex: '#2CC397', src: path.join(root, 'public', 'app-icons', 'samsung_mint_card.png'), enabled: false },
  { id: 'samsung_mint_coins', alias: '.LauncherSamsungMintCoins', resName: 'ic_launcher_samsung_mint_coins', bgHex: '#16A87A', src: path.join(root, 'public', 'app-icons', 'samsung_mint_coins.png'), enabled: false },
  { id: 'samsung_mint_soft', alias: '.LauncherSamsungMintSoft', resName: 'ic_launcher_samsung_mint_soft', bgHex: '#D2F5E9', src: path.join(root, 'public', 'app-icons', 'samsung_mint_soft.png'), enabled: false },
  // Sky Blue Collection (4)
  { id: 'samsung_sky_wallet', alias: '.LauncherSamsungSkyWallet', resName: 'ic_launcher_samsung_sky_wallet', bgHex: '#359BF4', src: path.join(root, 'public', 'app-icons', 'samsung_sky_wallet.png'), enabled: false },
  { id: 'samsung_sky_card', alias: '.LauncherSamsungSkyCard', resName: 'ic_launcher_samsung_sky_card', bgHex: '#41A6F8', src: path.join(root, 'public', 'app-icons', 'samsung_sky_card.png'), enabled: false },
  { id: 'samsung_sky_soft', alias: '.LauncherSamsungSkySoft', resName: 'ic_launcher_samsung_sky_soft', bgHex: '#D2E9FF', src: path.join(root, 'public', 'app-icons', 'samsung_sky_soft.png'), enabled: false },
  { id: 'samsung_sky_bank', alias: '.LauncherSamsungSkyBank', resName: 'ic_launcher_samsung_sky_bank', bgHex: '#2D8CE9', src: path.join(root, 'public', 'app-icons', 'samsung_sky_bank.png'), enabled: false },
  // Financial Designs & Bank Cards Collection (4)
  { id: 'samsung_cobalt_visa', alias: '.LauncherSamsungCobaltVisa', resName: 'ic_launcher_samsung_cobalt_visa', bgHex: '#235AE2', src: path.join(root, 'public', 'app-icons', 'samsung_cobalt_visa.png'), enabled: false },
  { id: 'samsung_gold_card', alias: '.LauncherSamsungGoldCard', resName: 'ic_launcher_samsung_gold_card', bgHex: '#DFAC47', src: path.join(root, 'public', 'app-icons', 'samsung_gold_card.png'), enabled: false },
  { id: 'samsung_teal_transfer', alias: '.LauncherSamsungTealTransfer', resName: 'ic_launcher_samsung_teal_transfer', bgHex: '#1CB0B1', src: path.join(root, 'public', 'app-icons', 'samsung_teal_transfer.png'), enabled: false },
  { id: 'samsung_obsidian_card', alias: '.LauncherSamsungObsidianCard', resName: 'ic_launcher_samsung_obsidian_card', bgHex: '#1D2535', src: path.join(root, 'public', 'app-icons', 'samsung_obsidian_card.png'), enabled: false },
];

// 1. Strip non-app files from dist/ before syncing to Android APK (keep dist/app-icons/ for Settings preview)
const unusedPaths = [
  path.join(distDir, 'assets', 'aistudio'),
  path.join(distDir, 'pwa-512x512.png'),
  path.join(distDir, 'pwa-maskable-512x512.png'),
  path.join(distDir, 'apple-touch-icon.png'),
];
for (const p of unusedPaths) {
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
  }
}
console.log('Cleaned unused assets from dist/ to shrink APK size.');

// 2. Generate full-bleed Android Adaptive Icons (mipmap-anydpi-v26 + exact matching background colors)
//    so Android launchers NEVER wrap the icon in a milky-white exterior frame!
const anydpiDir = path.join(androidRes, 'mipmap-anydpi-v26');
fs.mkdirSync(anydpiDir, { recursive: true });
fs.mkdirSync(path.dirname(iconColorsPath), { recursive: true });

const iconColorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="app_window_bg">#F6FAF9</color>
${APP_ICONS.map((icon) => `    <color name="icon_bg_${icon.id}">${icon.bgHex}</color>`).join('\n')}
</resources>
`;
fs.writeFileSync(iconColorsPath, iconColorsXml, 'utf8');

const densities = [
  { dir: 'mipmap-mdpi', legacySize: 48, fgSize: 108 },
  { dir: 'mipmap-hdpi', legacySize: 72, fgSize: 162 },
  { dir: 'mipmap-xhdpi', legacySize: 96, fgSize: 216 },
  { dir: 'mipmap-xxhdpi', legacySize: 144, fgSize: 324 },
  { dir: 'mipmap-xxxhdpi', legacySize: 192, fgSize: 432 },
];

function writeResizedPng(src, dest, size) {
  try {
    execFileSync('convert', [src, '-resize', `${size}x${size}!`, '-strip', dest], {
      stdio: 'ignore',
    });
  } catch {
    fs.copyFileSync(src, dest);
  }
}

/**
 * Generates an Android 108dp Adaptive Icon foreground layer by placing the icon cleanly
 * at 74% inside a 108dp canvas filled with the exact matching icon background color.
 * Result: crisp full-bleed icon artwork with ZERO white/milky-white exterior ring on any Android OEM!
 */
function writeAdaptiveForegroundPng(src, dest, fgSize, bgHex) {
  const innerSize = Math.round(fgSize * 0.74);
  try {
    execFileSync(
      'convert',
      [
        src,
        '-resize',
        `${innerSize}x${innerSize}!`,
        '-background',
        bgHex,
        '-gravity',
        'center',
        '-extent',
        `${fgSize}x${fgSize}`,
        '-strip',
        dest,
      ],
      { stdio: 'ignore' }
    );
  } catch {
    writeResizedPng(src, dest, fgSize);
  }
}

for (const { dir, legacySize, fgSize } of densities) {
  const targetDir = path.join(androidRes, dir);
  fs.mkdirSync(targetDir, { recursive: true });

  for (const icon of APP_ICONS) {
    const sourceFile = fs.existsSync(icon.src)
      ? icon.src
      : path.join(root, 'public', 'pwa-512x512.png');
    if (!fs.existsSync(sourceFile)) continue;

    // Legacy fallback PNG (Android <= 7)
    writeResizedPng(sourceFile, path.join(targetDir, `${icon.resName}.png`), legacySize);
    // Adaptive foreground PNG (Android 8+)
    writeAdaptiveForegroundPng(
      sourceFile,
      path.join(targetDir, `${icon.resName}_fg.png`),
      fgSize,
      icon.bgHex
    );

    if (icon.id === 'samsung_mint_wallet') {
      writeResizedPng(sourceFile, path.join(targetDir, 'ic_launcher.png'), legacySize);
      writeResizedPng(sourceFile, path.join(targetDir, 'ic_launcher_round.png'), legacySize);
      writeAdaptiveForegroundPng(
        sourceFile,
        path.join(targetDir, 'ic_launcher_foreground.png'),
        fgSize,
        icon.bgHex
      );
    }
  }
}

for (const icon of APP_ICONS) {
  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/icon_bg_${icon.id}" />
    <foreground android:drawable="@mipmap/${icon.resName}_fg" />
</adaptive-icon>
`;
  fs.writeFileSync(path.join(anydpiDir, `${icon.resName}.xml`), adaptiveXml, 'utf8');
}

const defaultAdaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/icon_bg_samsung_mint_wallet" />
    <foreground android:drawable="@mipmap/ic_launcher_samsung_mint_wallet_fg" />
</adaptive-icon>
`;
fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), defaultAdaptiveXml, 'utf8');
fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), defaultAdaptiveXml, 'utf8');

console.log('Generated full-bleed Android adaptive icons for all 16 Samsung One UI variants.');

// 3. Patch AndroidManifest.xml with 16 <activity-alias> entries for runtime home-screen icon switching
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  if (!manifest.includes('android:name=".LauncherSamsungMintWallet"')) {
    const launcherFilterRegex =
      /<intent-filter>\s*<action android:name="android\.intent\.action\.MAIN"\s*\/>\s*<category android:name="android\.intent\.category\.LAUNCHER"\s*\/>\s*<\/intent-filter>/m;

    if (launcherFilterRegex.test(manifest)) {
      manifest = manifest.replace(launcherFilterRegex, '');

      const aliasesXml = APP_ICONS.map(
        (icon) => `        <activity-alias
            android:name="${icon.alias}"
            android:enabled="${icon.enabled ? 'true' : 'false'}"
            android:exported="true"
            android:icon="@mipmap/${icon.resName}"
            android:roundIcon="@mipmap/${icon.resName}"
            android:label="@string/app_name"
            android:targetActivity=".MainActivity">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity-alias>`
      ).join('\n\n');

      manifest = manifest.replace('</activity>', `</activity>\n\n${aliasesXml}`);
      console.log('Patched AndroidManifest.xml with 16 selectable launcher activity-aliases.');
    }
  }

  // Ensure Android notification, exact alarm, full-screen alert, battery exemption, boot persistence, wake lock & vibration permissions
  const requiredPermissions = [
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.SCHEDULE_EXACT_ALARM',
    'android.permission.USE_EXACT_ALARM',
    'android.permission.USE_FULL_SCREEN_INTENT',
    'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
    'android.permission.RECEIVE_BOOT_COMPLETED',
    'android.permission.WAKE_LOCK',
    'android.permission.VIBRATE',
  ];
  const missingPerms = requiredPermissions.filter((perm) => !manifest.includes(perm));
  if (missingPerms.length > 0) {
    const permsXml = missingPerms
      .map((perm) => `    <uses-permission android:name="${perm}" />`)
      .join('\n');
    manifest = manifest.replace('<application', `${permsXml}\n\n    <application`);
  }

  // Allow MainActivity to wake and display above lockscreen when user opts into full-screen alerts
  if (!manifest.includes('android:showWhenLocked="true"')) {
    manifest = manifest.replace(
      /android:name="\.MainActivity"/,
      'android:name=".MainActivity"\n            android:showWhenLocked="true"\n            android:turnScreenOn="true"'
    );
  }

  // Register DueNotificationReceiver so due alerts fire while app is closed, screen is off, or after reboot/time change
  if (!manifest.includes('android:name=".DueNotificationReceiver"')) {
    const receiverXml = `        <receiver
            android:name=".DueNotificationReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.LOCKED_BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
                <action android:name="android.intent.action.TIME_SET" />
                <action android:name="android.intent.action.TIMEZONE_CHANGED" />
            </intent-filter>
        </receiver>`;
    manifest = manifest.replace('</application>', `${receiverXml}\n    </application>`);
  } else if (!manifest.includes('android.intent.action.TIME_SET')) {
    manifest = manifest.replace(
      '<action android:name="android.intent.action.MY_PACKAGE_REPLACED" />',
      `<action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
                <action android:name="android.intent.action.TIME_SET" />
                <action android:name="android.intent.action.TIMEZONE_CHANGED" />`
    );
  }

  fs.writeFileSync(manifestPath, manifest, 'utf8');
  console.log('Verified AndroidManifest.xml permissions and DueNotificationReceiver.');
}

// 4. Configure Android styles for clean mint-white status bar, nav bar, and non-white exterior window bg
if (fs.existsSync(stylesPath)) {
  let styles = fs.readFileSync(stylesPath, 'utf8');
  if (!styles.includes('android:statusBarColor')) {
    styles = styles.replace(
      '</style>',
      `        <item name="android:statusBarColor">#F6FAF9</item>
        <item name="android:navigationBarColor">#FFFFFF</item>
        <item name="android:windowBackground">@color/app_window_bg</item>
        <item name="android:windowLightStatusBar">true</item>
    </style>`
    );
    fs.writeFileSync(stylesPath, styles, 'utf8');
    console.log('Updated Android styles.xml for clean status bar and window background.');
  }
}

// 4b. Synthesize lightweight 16-bit PCM WAV notification tones into res/raw/ so Android 8–15
//     NotificationChannels can play the user's exact selected tone even while the screen is off
const rawDir = path.join(androidRes, 'raw');
fs.mkdirSync(rawDir, { recursive: true });

function writeToneWav(filePath, notes, totalDurationSec) {
  const sampleRate = 22050;
  const numSamples = Math.max(1, Math.floor(sampleRate * totalDurationSec));
  const pcm = new Int16Array(numSamples);

  for (const n of notes) {
    const startIdx = Math.floor(n.start * sampleRate);
    const lenSamples = Math.floor(n.dur * sampleRate);
    for (let i = 0; i < lenSamples; i++) {
      const idx = startIdx + i;
      if (idx < 0 || idx >= numSamples) continue;
      const t = i / sampleRate;
      const env = Math.min(1, i / (sampleRate * 0.012)) * Math.exp(-t * (n.decay ?? 5.5));
      const phase = 2 * Math.PI * n.freq * t;
      let wave = Math.sin(phase);
      if (n.wave === 'triangle') {
        wave = (2 / Math.PI) * Math.asin(Math.sin(phase));
      } else if (n.wave === 'square') {
        wave = Math.sin(phase) >= 0 ? 0.7 : -0.7;
      }
      const sample = pcm[idx] + Math.round(wave * env * (n.amp ?? 0.55) * 32767);
      pcm[idx] = Math.max(-32768, Math.min(32767, sample));
    }
  }

  const dataByteLength = pcm.length * 2;
  const buf = Buffer.alloc(44 + dataByteLength);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataByteLength, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20); // PCM format
  buf.writeUInt16LE(1, 22); // Mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); // Byte rate
  buf.writeUInt16LE(2, 32); // Block align
  buf.writeUInt16LE(16, 34); // Bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataByteLength, 40);
  for (let i = 0; i < pcm.length; i++) {
    buf.writeInt16LE(pcm[i], 44 + i * 2);
  }
  fs.writeFileSync(filePath, buf);
}

writeToneWav(
  path.join(rawDir, 'tone_chime.wav'),
  [
    { freq: 659.25, start: 0.0, dur: 0.28, wave: 'sine', amp: 0.6, decay: 4.8 },
    { freq: 880.0, start: 0.16, dur: 0.42, wave: 'sine', amp: 0.65, decay: 4.2 },
    { freq: 1046.5, start: 0.34, dur: 0.48, wave: 'sine', amp: 0.6, decay: 4.0 },
  ],
  0.9
);
writeToneWav(
  path.join(rawDir, 'tone_coin.wav'),
  [
    { freq: 987.77, start: 0.0, dur: 0.18, wave: 'triangle', amp: 0.65, decay: 6.5 },
    { freq: 1318.51, start: 0.13, dur: 0.38, wave: 'triangle', amp: 0.7, decay: 4.5 },
    { freq: 1567.98, start: 0.3, dur: 0.44, wave: 'triangle', amp: 0.62, decay: 4.2 },
  ],
  0.82
);
writeToneWav(
  path.join(rawDir, 'tone_samsung.wav'),
  [
    { freq: 523.25, start: 0.0, dur: 0.2, wave: 'sine', amp: 0.58, decay: 5.2 },
    { freq: 659.25, start: 0.14, dur: 0.2, wave: 'sine', amp: 0.62, decay: 5.0 },
    { freq: 783.99, start: 0.28, dur: 0.28, wave: 'sine', amp: 0.66, decay: 4.5 },
    { freq: 1046.5, start: 0.44, dur: 0.46, wave: 'sine', amp: 0.68, decay: 4.0 },
  ],
  0.98
);
writeToneWav(
  path.join(rawDir, 'tone_urgent.wav'),
  [
    { freq: 880.0, start: 0.0, dur: 0.14, wave: 'square', amp: 0.46, decay: 3.8 },
    { freq: 1108.73, start: 0.16, dur: 0.14, wave: 'square', amp: 0.46, decay: 3.8 },
    { freq: 1318.51, start: 0.32, dur: 0.22, wave: 'square', amp: 0.48, decay: 3.5 },
    { freq: 880.0, start: 0.64, dur: 0.14, wave: 'square', amp: 0.48, decay: 3.8 },
    { freq: 1108.73, start: 0.8, dur: 0.14, wave: 'square', amp: 0.48, decay: 3.8 },
    { freq: 1318.51, start: 0.96, dur: 0.26, wave: 'square', amp: 0.5, decay: 3.5 },
  ],
  1.3
);
writeToneWav(
  path.join(rawDir, 'tone_crystal.wav'),
  [
    { freq: 783.99, start: 0.0, dur: 0.24, wave: 'sine', amp: 0.52, decay: 4.8 },
    { freq: 987.77, start: 0.11, dur: 0.28, wave: 'sine', amp: 0.55, decay: 4.6 },
    { freq: 1174.66, start: 0.22, dur: 0.32, wave: 'sine', amp: 0.58, decay: 4.2 },
    { freq: 1567.98, start: 0.33, dur: 0.52, wave: 'sine', amp: 0.62, decay: 3.8 },
  ],
  0.92
);

// Longer Payment Ringtones (3.0s - 3.5s) so payment alerts are clearly heard even across the room
writeToneWav(
  path.join(rawDir, 'tone_classic_ring.wav'),
  [0, 1.55].flatMap((rep) => [
    { freq: 659.25, start: rep + 0.0, dur: 0.26, wave: 'sine', amp: 0.62, decay: 4.0 },
    { freq: 783.99, start: rep + 0.22, dur: 0.26, wave: 'sine', amp: 0.65, decay: 4.0 },
    { freq: 987.77, start: rep + 0.44, dur: 0.28, wave: 'sine', amp: 0.68, decay: 3.8 },
    { freq: 1318.51, start: rep + 0.68, dur: 0.5, wave: 'sine', amp: 0.72, decay: 3.2 },
    { freq: 987.77, start: rep + 1.04, dur: 0.38, wave: 'triangle', amp: 0.54, decay: 3.8 },
  ]),
  3.2
);
writeToneWav(
  path.join(rawDir, 'tone_marimba_long.wav'),
  [0, 1.45].flatMap((rep) => [
    { freq: 523.25, start: rep + 0.0, dur: 0.2, wave: 'triangle', amp: 0.66, decay: 5.0 },
    { freq: 659.25, start: rep + 0.16, dur: 0.2, wave: 'triangle', amp: 0.68, decay: 5.0 },
    { freq: 783.99, start: rep + 0.32, dur: 0.22, wave: 'triangle', amp: 0.7, decay: 4.8 },
    { freq: 1046.5, start: rep + 0.5, dur: 0.3, wave: 'triangle', amp: 0.74, decay: 4.2 },
    { freq: 783.99, start: rep + 0.76, dur: 0.2, wave: 'triangle', amp: 0.62, decay: 5.0 },
    { freq: 880.0, start: rep + 0.94, dur: 0.24, wave: 'triangle', amp: 0.66, decay: 4.8 },
    { freq: 1046.5, start: rep + 1.14, dur: 0.36, wave: 'triangle', amp: 0.72, decay: 4.0 },
  ]),
  3.05
);
writeToneWav(
  path.join(rawDir, 'tone_radar_bell.wav'),
  [0, 1.05, 2.1].flatMap((rep) => [
    { freq: 880.0, start: rep + 0.0, dur: 0.24, wave: 'sine', amp: 0.64, decay: 4.0 },
    { freq: 1318.51, start: rep + 0.0, dur: 0.24, wave: 'triangle', amp: 0.34, decay: 4.5 },
    { freq: 1108.73, start: rep + 0.22, dur: 0.24, wave: 'sine', amp: 0.66, decay: 4.0 },
    { freq: 1318.51, start: rep + 0.44, dur: 0.44, wave: 'sine', amp: 0.72, decay: 3.4 },
  ]),
  3.15
);
writeToneWav(
  path.join(rawDir, 'tone_melody_gold.wav'),
  [0, 1.65].flatMap((rep) => [
    { freq: 587.33, start: rep + 0.0, dur: 0.24, wave: 'sine', amp: 0.6, decay: 4.2 },
    { freq: 739.99, start: rep + 0.2, dur: 0.24, wave: 'sine', amp: 0.64, decay: 4.2 },
    { freq: 880.0, start: rep + 0.4, dur: 0.26, wave: 'sine', amp: 0.68, decay: 4.0 },
    { freq: 1174.66, start: rep + 0.62, dur: 0.38, wave: 'sine', amp: 0.72, decay: 3.4 },
    { freq: 1108.73, start: rep + 0.96, dur: 0.24, wave: 'sine', amp: 0.64, decay: 4.2 },
    { freq: 1174.66, start: rep + 1.18, dur: 0.46, wave: 'sine', amp: 0.72, decay: 3.2 },
  ]),
  3.4
);
writeToneWav(
  path.join(rawDir, 'tone_soft_harp.wav'),
  [0, 1.45].flatMap((rep) => [
    { freq: 523.25, start: rep + 0.0, dur: 0.48, wave: 'sine', amp: 0.52, decay: 3.4 },
    { freq: 659.25, start: rep + 0.14, dur: 0.48, wave: 'sine', amp: 0.55, decay: 3.4 },
    { freq: 783.99, start: rep + 0.28, dur: 0.48, wave: 'sine', amp: 0.58, decay: 3.4 },
    { freq: 987.77, start: rep + 0.42, dur: 0.52, wave: 'sine', amp: 0.6, decay: 3.2 },
    { freq: 1046.5, start: rep + 0.58, dur: 0.56, wave: 'sine', amp: 0.64, decay: 3.0 },
    { freq: 1318.51, start: rep + 0.76, dur: 0.64, wave: 'sine', amp: 0.68, decay: 2.8 },
  ]),
  3.0
);
writeToneWav(
  path.join(rawDir, 'tone_alarm_pulse.wav'),
  [0, 0.85, 1.7, 2.55].flatMap((rep) => [
    { freq: 880.0, start: rep + 0.0, dur: 0.16, wave: 'square', amp: 0.44, decay: 3.8 },
    { freq: 1174.66, start: rep + 0.18, dur: 0.16, wave: 'square', amp: 0.46, decay: 3.8 },
    { freq: 1318.51, start: rep + 0.36, dur: 0.3, wave: 'triangle', amp: 0.7, decay: 3.6 },
  ]),
  3.45
);
console.log('Generated 11 custom notification & longer ringtone WAV files in android/app/src/main/res/raw/.');

// 5. Generate DueAlarmScheduler.java & DueNotificationReceiver.java for reliable background / screen-off / post-reboot due alerts
const javaPkgDir = path.dirname(mainActivityPath);
fs.mkdirSync(javaPkgDir, { recursive: true });

const dueAlarmSchedulerJava = `package com.moamen.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;

public class DueAlarmScheduler {
    private static final String PREFS_NAME = "moamen_due_alarms";
    private static final String KEY_PAYLOAD = "alarms_json";
    private static final int TEST_ALARM_ID = 990002;

    public static void replaceAlarms(Context context, String payloadJson) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String oldJson = prefs.getString(KEY_PAYLOAD, "");
        cancelAlarmsFromJson(context, oldJson);

        String safeJson = payloadJson != null ? payloadJson : "{\\"enabled\\":false,\\"alarms\\":[]}";
        prefs.edit().putString(KEY_PAYLOAD, safeJson).apply();
        scheduleAlarmsFromJson(context, safeJson);
    }

    public static void rescheduleAll(Context context) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String saved = prefs.getString(KEY_PAYLOAD, "");
        if (saved != null && !saved.isEmpty()) {
            scheduleAlarmsFromJson(context, saved);
        }
    }

    public static void scheduleSingleTestAlarm(
        Context context,
        int delaySeconds,
        String title,
        String body,
        String style,
        boolean sound,
        boolean vibrate,
        boolean wakeScreen,
        boolean fullScreen,
        String tone,
        String avatarSrc
    ) {
        if (context == null) return;
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        int safeDelay = Math.max(3, Math.min(60, delaySeconds));
        long triggerAt = System.currentTimeMillis() + (safeDelay * 1000L);

        Intent intent = new Intent(context, DueNotificationReceiver.class);
        intent.setAction(DueNotificationReceiver.ACTION_DUE_ALARM);
        intent.putExtra("alarmId", TEST_ALARM_ID);
        intent.putExtra("title", title != null ? title : "Moamen");
        intent.putExtra("body", body != null ? body : "");
        intent.putExtra("style", style != null ? style : "banner");
        intent.putExtra("sound", sound);
        intent.putExtra("vibrate", vibrate);
        intent.putExtra("wakeScreen", wakeScreen);
        intent.putExtra("fullScreen", fullScreen);
        intent.putExtra("tone", tone != null ? tone : "chime");
        intent.putExtra("avatarSrc", avatarSrc != null ? avatarSrc : "");

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pi = PendingIntent.getBroadcast(context, TEST_ALARM_ID, intent, flags);
        scheduleExactWakeAlarm(context, am, triggerAt, pi);
    }

    private static void scheduleExactWakeAlarm(
        Context context,
        AlarmManager am,
        long triggerAt,
        PendingIntent pi
    ) {
        if (am == null || pi == null) return;
        boolean canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms();

        // Use AlarmClock when exact alarms are granted — Android & Samsung One UI exempt
        // setAlarmClock() from Deep Doze & Sleeping Apps so alerts fire reliably while screen is off.
        if (canExact && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
                Intent openIntent = new Intent(context, MainActivity.class);
                openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                int showFlags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    showFlags |= PendingIntent.FLAG_IMMUTABLE;
                }
                PendingIntent showIntent = PendingIntent.getActivity(context, 77001, openIntent, showFlags);
                AlarmManager.AlarmClockInfo info = new AlarmManager.AlarmClockInfo(triggerAt, showIntent);
                am.setAlarmClock(info, pi);
                return;
            } catch (Exception ignored) {
                // Fall through to setExactAndAllowWhileIdle
            }
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (canExact) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
                } else {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
                }
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            }
        } catch (Exception ignored) {
        }
    }

    private static void cancelAlarmsFromJson(Context context, String rawJson) {
        if (rawJson == null || rawJson.isEmpty()) return;
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        try {
            JSONObject root = new JSONObject(rawJson);
            JSONArray alarms = root.optJSONArray("alarms");
            if (alarms == null) return;
            for (int i = 0; i < alarms.length(); i++) {
                JSONObject item = alarms.optJSONObject(i);
                if (item == null) continue;
                int id = item.optInt("id", 1000 + i);
                PendingIntent pi = buildPendingIntent(context, id, null, PendingIntent.FLAG_NO_CREATE);
                if (pi != null) {
                    am.cancel(pi);
                    pi.cancel();
                }
            }
        } catch (Exception ignored) {
        }
    }

    private static void scheduleAlarmsFromJson(Context context, String rawJson) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        try {
            JSONObject root = new JSONObject(rawJson);
            if (!root.optBoolean("enabled", false)) return;
            JSONArray alarms = root.optJSONArray("alarms");
            if (alarms == null) return;
            long now = System.currentTimeMillis();

            for (int i = 0; i < alarms.length(); i++) {
                JSONObject item = alarms.optJSONObject(i);
                if (item == null) continue;
                long triggerAt = item.optLong("triggerAtMillis", 0L);
                if (triggerAt <= now) continue;

                int id = item.optInt("id", 1000 + i);
                PendingIntent pi = buildPendingIntent(context, id, item, PendingIntent.FLAG_UPDATE_CURRENT);
                if (pi == null) continue;

                scheduleExactWakeAlarm(context, am, triggerAt, pi);
            }
        } catch (Exception ignored) {
        }
    }

    private static PendingIntent buildPendingIntent(Context context, int id, JSONObject item, int baseFlag) {
        Intent intent = new Intent(context, DueNotificationReceiver.class);
        intent.setAction(DueNotificationReceiver.ACTION_DUE_ALARM);
        if (item != null) {
            intent.putExtra("alarmId", id);
            intent.putExtra("title", item.optString("title", "Moamen"));
            intent.putExtra("body", item.optString("body", ""));
            intent.putExtra("style", item.optString("style", "banner"));
            intent.putExtra("sound", item.optBoolean("sound", true));
            intent.putExtra("vibrate", item.optBoolean("vibrate", true));
            intent.putExtra("wakeScreen", item.optBoolean("wakeScreen", true));
            intent.putExtra("fullScreen", item.optBoolean("fullScreen", false));
            intent.putExtra("tone", item.optString("tone", "chime"));
            intent.putExtra("avatarSrc", item.optString("avatarSrc", ""));
        }
        int flags = baseFlag;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(context, id, intent, flags);
    }
}
`;
fs.writeFileSync(path.join(javaPkgDir, 'DueAlarmScheduler.java'), dueAlarmSchedulerJava, 'utf8');

const dueNotificationReceiverJava = `package com.moamen.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.util.Base64;
import androidx.core.app.NotificationCompat;
import java.io.InputStream;

public class DueNotificationReceiver extends BroadcastReceiver {
    public static final String ACTION_DUE_ALARM = "com.moamen.app.ACTION_DUE_ALARM";
    private static final String CHANNEL_SILENT = "moamen_due_v2_silent";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;
        String action = intent.getAction();
        if (
            Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action)
                || "android.intent.action.QUICKBOOT_POWERON".equals(action)
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
                || Intent.ACTION_TIME_CHANGED.equals(action)
                || Intent.ACTION_TIMEZONE_CHANGED.equals(action)
        ) {
            DueAlarmScheduler.rescheduleAll(context);
            return;
        }

        int alarmId = intent.getIntExtra("alarmId", (int) (System.currentTimeMillis() % 100000));
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        String style = intent.getStringExtra("style");
        boolean sound = intent.getBooleanExtra("sound", true);
        boolean vibrate = intent.getBooleanExtra("vibrate", true);
        boolean wakeScreen = intent.getBooleanExtra("wakeScreen", true);
        boolean fullScreen = intent.getBooleanExtra("fullScreen", false);
        String tone = intent.getStringExtra("tone");
        String avatarSrc = intent.getStringExtra("avatarSrc");

        postNotification(
            context,
            alarmId,
            title != null ? title : "Moamen",
            body != null ? body : "",
            style != null ? style : "banner",
            sound,
            vibrate,
            wakeScreen,
            fullScreen,
            tone != null ? tone : "chime",
            avatarSrc != null ? avatarSrc : ""
        );
    }

    public static String normalizeTone(String tone) {
        if (tone == null) return "chime";
        switch (tone) {
            case "coin":
            case "samsung":
            case "urgent":
            case "crystal":
            case "system":
            case "chime":
            case "classic_ring":
            case "marimba_long":
            case "radar_bell":
            case "melody_gold":
            case "soft_harp":
            case "alarm_pulse":
                return tone;
            default:
                return "chime";
        }
    }

    public static Uri resolveToneUri(Context context, String rawTone) {
        String tone = normalizeTone(rawTone);
        if ("system".equals(tone) || context == null) {
            return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        }
        String resName = "tone_" + tone;
        int resId = context.getResources().getIdentifier(resName, "raw", context.getPackageName());
        if (resId != 0) {
            return Uri.parse("android.resource://" + context.getPackageName() + "/" + resId);
        }
        return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
    }

    private static Bitmap loadAvatarBitmap(Context context, String avatarSrc) {
        if (context == null) return null;
        try {
            if (avatarSrc != null && !avatarSrc.isEmpty()) {
                if (avatarSrc.startsWith("data:image/")) {
                    int commaIdx = avatarSrc.indexOf(',');
                    if (commaIdx > 0) {
                        String b64 = avatarSrc.substring(commaIdx + 1);
                        byte[] decoded = Base64.decode(b64, Base64.DEFAULT);
                        Bitmap bm = BitmapFactory.decodeByteArray(decoded, 0, decoded.length);
                        if (bm != null) return bm;
                    }
                } else if (!avatarSrc.startsWith("http://") && !avatarSrc.startsWith("https://")) {
                    String clean = avatarSrc.startsWith("/") ? avatarSrc.substring(1) : avatarSrc;
                    int qIdx = clean.indexOf('?');
                    if (qIdx >= 0) clean = clean.substring(0, qIdx);
                    try (InputStream is = context.getAssets().open("public/" + clean)) {
                        Bitmap bm = BitmapFactory.decodeStream(is);
                        if (bm != null) return bm;
                    } catch (Exception ignored) {
                    }
                }
            }
        } catch (Exception ignored) {
        }
        try {
            return BitmapFactory.decodeResource(context.getResources(), R.mipmap.ic_launcher);
        } catch (Exception ignored) {
            return null;
        }
    }

    public static void postNotification(
        Context context,
        int notifId,
        String title,
        String body,
        String style,
        boolean sound,
        boolean vibrate,
        boolean wakeScreen,
        boolean fullScreen
    ) {
        postNotification(context, notifId, title, body, style, sound, vibrate, wakeScreen, fullScreen, "chime", "");
    }

    public static void postNotification(
        Context context,
        int notifId,
        String title,
        String body,
        String style,
        boolean sound,
        boolean vibrate,
        boolean wakeScreen,
        boolean fullScreen,
        String rawTone
    ) {
        postNotification(context, notifId, title, body, style, sound, vibrate, wakeScreen, fullScreen, rawTone, "");
    }

    public static void postNotification(
        Context context,
        int notifId,
        String title,
        String body,
        String style,
        boolean sound,
        boolean vibrate,
        boolean wakeScreen,
        boolean fullScreen,
        String rawTone,
        String avatarSrc
    ) {
        if (context == null) return;
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        // Keep CPU awake during notification delivery & optionally wake locked screen
        PowerManager.WakeLock cpuWake = null;
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                cpuWake = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "moamen:DueCpuWake");
                cpuWake.acquire(5500L);
                if ((wakeScreen || fullScreen) && !pm.isInteractive()) {
                    @SuppressWarnings("deprecation")
                    PowerManager.WakeLock screenWl = pm.newWakeLock(
                        PowerManager.SCREEN_BRIGHT_WAKE_LOCK
                            | PowerManager.ACQUIRE_CAUSES_WAKEUP
                            | PowerManager.ON_AFTER_RELEASE,
                        "moamen:DueScreenWake"
                    );
                    screenWl.acquire(4500L);
                }
            }
        } catch (Exception ignored) {
        }

        try {
            String tone = normalizeTone(rawTone);
            Uri soundUri = sound ? resolveToneUri(context, tone) : null;
            boolean isHighUrgency = fullScreen || "urgent".equals(style);
            long[] vibPattern = isHighUrgency
                ? new long[]{0, 260, 120, 260, 120, 260}
                : new long[]{0, 180, 100, 180};

            String channelId;
            int priority;
            if (!sound && !vibrate && !fullScreen) {
                channelId = CHANNEL_SILENT;
                priority = NotificationCompat.PRIORITY_DEFAULT;
                ensureChannel(nm, channelId, "Quiet Payment Reminders", null, false, false, null);
            } else if (fullScreen) {
                channelId = "moamen_due_fs_v3_" + (sound ? tone : "muted");
                priority = NotificationCompat.PRIORITY_MAX;
                ensureChannel(nm, channelId, "Full-Screen Alerts (" + tone + ")", soundUri, true, vibrate, vibPattern);
            } else {
                channelId = "moamen_due_v3_" + (sound ? tone : "muted");
                priority = isHighUrgency ? NotificationCompat.PRIORITY_MAX : NotificationCompat.PRIORITY_HIGH;
                ensureChannel(nm, channelId, "Payment Alerts (" + tone + ")", soundUri, isHighUrgency, vibrate, vibPattern);
            }

            Intent openIntent = new Intent(context, MainActivity.class);
            openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                piFlags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent contentIntent = PendingIntent.getActivity(context, notifId, openIntent, piFlags);

            Bitmap avatarBitmap = loadAvatarBitmap(context, avatarSrc);

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(priority)
                .setCategory(fullScreen ? NotificationCompat.CATEGORY_ALARM : NotificationCompat.CATEGORY_REMINDER)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setContentIntent(contentIntent);

            if (avatarBitmap != null) {
                builder.setLargeIcon(avatarBitmap);
                builder.setStyle(
                    new NotificationCompat.BigPictureStyle()
                        .bigPicture(avatarBitmap)
                        .bigLargeIcon(avatarBitmap)
                        .setBigContentTitle(title)
                        .setSummaryText(body)
                );
            } else {
                builder.setStyle(new NotificationCompat.BigTextStyle().bigText(body));
            }

            if (fullScreen) {
                builder.setFullScreenIntent(contentIntent, true);
            }
            if (sound && soundUri != null) {
                builder.setSound(soundUri);
            }
            if (vibrate) {
                builder.setVibrate(vibPattern);
            }

            nm.notify(notifId, builder.build());
        } finally {
            if (cpuWake != null && cpuWake.isHeld()) {
                try {
                    cpuWake.release();
                } catch (Exception ignored) {
                }
            }
        }
    }

    private static void ensureChannel(
        NotificationManager nm,
        String channelId,
        String channelName,
        Uri soundUri,
        boolean alarmUsage,
        boolean vibrate,
        long[] vibPattern
    ) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        if (nm.getNotificationChannel(channelId) != null) return;

        int importance = (soundUri == null && !vibrate && !alarmUsage)
            ? NotificationManager.IMPORTANCE_DEFAULT
            : NotificationManager.IMPORTANCE_HIGH;

        NotificationChannel ch = new NotificationChannel(channelId, channelName, importance);
        ch.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
        ch.setBypassDnd(alarmUsage);
        if (soundUri != null) {
            AudioAttributes attrs = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(alarmUsage ? AudioAttributes.USAGE_ALARM : AudioAttributes.USAGE_NOTIFICATION)
                .build();
            ch.setSound(soundUri, attrs);
        } else {
            ch.setSound(null, null);
        }
        ch.enableVibration(vibrate);
        if (vibrate && vibPattern != null) {
            ch.setVibrationPattern(vibPattern);
        }
        nm.createNotificationChannel(ch);
    }
}
`;
fs.writeFileSync(path.join(javaPkgDir, 'DueNotificationReceiver.java'), dueNotificationReceiverJava, 'utf8');

// 6. Configure MainActivity.java with:
//    - Android 15+ edge-to-edge WindowInsetsCompat padding (no top/bottom bar overlap)
//    - Lock-screen wake support (setShowWhenLocked + setTurnScreenOn)
//    - 60 / 90 / 120 Hz Display.Mode refresh rate selector
//    - JS Bridge `window.MoamenNative` (icons, system bars, refresh rate, tone preview, screen-off alarms & readiness)
const aliasRowsJava = APP_ICONS.map((i) => `        { "${i.id}", "${i.alias}" }`).join(',\n');

const mainActivityJava = `package com.moamen.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    private static final int REQ_POST_NOTIFICATIONS = 4201;
    private static final String[][] LAUNCHER_ALIASES = new String[][] {
${aliasRowsJava}
    };
    private Ringtone activePreviewRingtone;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            @SuppressWarnings("deprecation")
            int lockFlags = WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON;
            getWindow().addFlags(lockFlags);
        }

        applySystemBarColors("#F6FAF9", true);
        applyRefreshRate(120);

        View content = findViewById(android.R.id.content);
        if (content != null) {
            ViewCompat.setOnApplyWindowInsetsListener(content, (v, windowInsets) -> {
                Insets bars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars()
                        | WindowInsetsCompat.Type.displayCutout()
                        | WindowInsetsCompat.Type.ime()
                );
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return WindowInsetsCompat.CONSUMED;
            });
            ViewCompat.requestApplyInsets(content);
        }

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new MoamenNativeBridge(), "MoamenNative");
        }

        // Handle phone hardware Back button & Android edge swipe-back natively inside the app
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView == null) {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                    setEnabled(true);
                    return;
                }
                webView.evaluateJavascript(
                    "(function(){ try { return (window.__moamenHandleBack && window.__moamenHandleBack()) ? 'handled' : 'exit'; } catch(e) { return 'exit'; } })()",
                    value -> {
                        if (!"\\"handled\\"".equals(value)) {
                            runOnUiThread(() -> {
                                setEnabled(false);
                                getOnBackPressedDispatcher().onBackPressed();
                                setEnabled(true);
                            });
                        }
                    }
                );
            }
        });
    }

    private void applyRefreshRate(int targetHz) {
        final float desired = (targetHz == 60 || targetHz == 90 || targetHz == 120) ? (float) targetHz : 120f;
        runOnUiThread(() -> {
            try {
                WindowManager.LayoutParams lp = getWindow().getAttributes();
                lp.preferredRefreshRate = desired;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    Display display = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                        ? getDisplay()
                        : getWindowManager().getDefaultDisplay();
                    if (display != null) {
                        Display.Mode[] modes = display.getSupportedModes();
                        Display.Mode bestMode = null;
                        float bestDiff = Float.MAX_VALUE;
                        for (Display.Mode m : modes) {
                            float diff = Math.abs(m.getRefreshRate() - desired);
                            if (diff < bestDiff) {
                                bestDiff = diff;
                                bestMode = m;
                            }
                        }
                        if (bestMode != null) {
                            lp.preferredDisplayModeId = bestMode.getModeId();
                        }
                    }
                }
                getWindow().setAttributes(lp);
            } catch (Exception ignored) {
            }
        });
    }

    private boolean checkNotifPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return true;
        return ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            == PackageManager.PERMISSION_GRANTED;
    }

    private void askNotifPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !checkNotifPermission()) {
            runOnUiThread(() -> ActivityCompat.requestPermissions(
                MainActivity.this,
                new String[]{Manifest.permission.POST_NOTIFICATIONS},
                REQ_POST_NOTIFICATIONS
            ));
        }
    }

    private String buildAlarmStatusJson() {
        boolean hasNotif = checkNotifPermission();
        boolean canExact = true;
        boolean ignoringBattery = true;
        boolean canFullScreen = true;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
                canExact = am == null || am.canScheduleExactAlarms();
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                ignoringBattery = pm == null || pm.isIgnoringBatteryOptimizations(getPackageName());
            }
            if (Build.VERSION.SDK_INT >= 34) {
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                canFullScreen = nm == null || nm.canUseFullScreenIntent();
            }
        } catch (Exception ignored) {
        }

        try {
            JSONObject obj = new JSONObject();
            obj.put("hasNotificationPermission", hasNotif);
            obj.put("canScheduleExactAlarms", canExact);
            obj.put("isIgnoringBatteryOptimizations", ignoringBattery);
            obj.put("canUseFullScreenIntent", canFullScreen);
            return obj.toString();
        } catch (Exception e) {
            return "{}";
        }
    }

    private void previewTone(String tone) {
        runOnUiThread(() -> {
            try {
                if (activePreviewRingtone != null && activePreviewRingtone.isPlaying()) {
                    activePreviewRingtone.stop();
                }
                Uri uri = DueNotificationReceiver.resolveToneUri(MainActivity.this, tone);
                Ringtone r = RingtoneManager.getRingtone(MainActivity.this, uri);
                if (r != null) {
                    activePreviewRingtone = r;
                    r.play();
                }
            } catch (Exception ignored) {
            }
        });
    }

    private void applySystemBarColors(String hexColor, boolean isLight) {
        int color = Color.parseColor("#F6FAF9");
        if (hexColor != null && hexColor.matches("^#[0-9a-fA-F]{6}$")) {
            try {
                color = Color.parseColor(hexColor);
            } catch (IllegalArgumentException ignored) {
            }
        }

        final int safeColor = color;
        runOnUiThread(() -> {
            View content = findViewById(android.R.id.content);
            if (content != null) {
                content.setBackgroundColor(safeColor);
            }
            getWindow().setStatusBarColor(safeColor);
            WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            if (controller != null) {
                controller.setAppearanceLightStatusBars(isLight);
                controller.setAppearanceLightNavigationBars(isLight);
            }
        });
    }

    private void switchLauncherIcon(String iconId) {
        String normalized = iconId;
        if ("default".equals(iconId) || "mint".equals(iconId) || "pistachio".equals(iconId) || "sage".equals(iconId)) normalized = "samsung_mint_wallet";
        else if ("beige".equals(iconId) || "caramel".equals(iconId)) normalized = "samsung_white_wallet";
        else if ("wallet".equals(iconId) || "olive".equals(iconId)) normalized = "samsung_mint_soft";
        else if ("visa".equals(iconId) || "sky".equals(iconId)) normalized = "samsung_sky_card";
        else if ("teal".equals(iconId)) normalized = "samsung_teal_transfer";
        else if ("coins".equals(iconId) || "honey".equals(iconId) || "terracotta".equals(iconId)) normalized = "samsung_gold_card";
        else if ("lavender".equals(iconId)) normalized = "samsung_cobalt_visa";
        else if ("dark_card".equals(iconId) || "charcoal".equals(iconId)) normalized = "samsung_obsidian_card";

        String targetAlias = ".LauncherSamsungMintWallet";
        for (String[] pair : LAUNCHER_ALIASES) {
            if (pair[0].equals(normalized)) {
                targetAlias = pair[1];
                break;
            }
        }

        PackageManager pm = getPackageManager();
        String pkg = getPackageName();
        ComponentName targetComp = new ComponentName(pkg, pkg + targetAlias);

        if (pm.getComponentEnabledSetting(targetComp) != PackageManager.COMPONENT_ENABLED_STATE_ENABLED) {
            pm.setComponentEnabledSetting(
                targetComp,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            );
        }

        for (String[] pair : LAUNCHER_ALIASES) {
            if (!pair[1].equals(targetAlias)) {
                ComponentName otherComp = new ComponentName(pkg, pkg + pair[1]);
                if (pm.getComponentEnabledSetting(otherComp) != PackageManager.COMPONENT_ENABLED_STATE_DISABLED) {
                    pm.setComponentEnabledSetting(
                        otherComp,
                        PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                        PackageManager.DONT_KILL_APP
                    );
                }
            }
        }
    }

    private class MoamenNativeBridge {
        @JavascriptInterface
        public void setAppIcon(String iconId) {
            switchLauncherIcon(iconId);
        }

        @JavascriptInterface
        public void setSystemBarColors(String hexColor, boolean isLight) {
            applySystemBarColors(hexColor, isLight);
        }

        @JavascriptInterface
        public void setRefreshRate(int hz) {
            applyRefreshRate(hz);
        }

        @JavascriptInterface
        public void requestNotificationPermission() {
            askNotifPermission();
        }

        @JavascriptInterface
        public boolean hasNotificationPermission() {
            return checkNotifPermission();
        }

        @JavascriptInterface
        public String getAlarmStatusJson() {
            return buildAlarmStatusJson();
        }

        @JavascriptInterface
        public void openExactAlarmSettings() {
            runOnUiThread(() -> {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        Intent i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                        i.setData(Uri.parse("package:" + getPackageName()));
                        startActivity(i);
                    }
                } catch (Exception ignored) {
                }
            });
        }

        @JavascriptInterface
        public void requestIgnoreBatteryOptimizations() {
            runOnUiThread(() -> {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                        i.setData(Uri.parse("package:" + getPackageName()));
                        startActivity(i);
                    }
                } catch (Exception e) {
                    try {
                        startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
                    } catch (Exception ignored) {
                    }
                }
            });
        }

        @JavascriptInterface
        public void openFullScreenIntentSettings() {
            runOnUiThread(() -> {
                try {
                    if (Build.VERSION.SDK_INT >= 34) {
                        Intent i = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
                        i.setData(Uri.parse("package:" + getPackageName()));
                        startActivity(i);
                        return;
                    }
                } catch (Exception ignored) {
                }
                try {
                    Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                    i.putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
                    startActivity(i);
                } catch (Exception ignored) {
                }
            });
        }

        @JavascriptInterface
        public void previewNotificationTone(String tone) {
            previewTone(tone);
        }

        @JavascriptInterface
        public void scheduleDueNotifications(String payloadJson) {
            DueAlarmScheduler.replaceAlarms(MainActivity.this, payloadJson);
        }

        @JavascriptInterface
        public void scheduleTestAlarm(
            int delaySeconds,
            String title,
            String body,
            String style,
            boolean sound,
            boolean vibrate,
            boolean wakeScreen,
            boolean fullScreen,
            String tone,
            String avatarSrc
        ) {
            DueAlarmScheduler.scheduleSingleTestAlarm(
                MainActivity.this,
                delaySeconds,
                title,
                body,
                style,
                sound,
                vibrate,
                wakeScreen,
                fullScreen,
                tone,
                avatarSrc
            );
        }

        @JavascriptInterface
        public void scheduleTestAlarm(
            int delaySeconds,
            String title,
            String body,
            String style,
            boolean sound,
            boolean vibrate,
            boolean wakeScreen,
            boolean fullScreen,
            String tone
        ) {
            scheduleTestAlarm(delaySeconds, title, body, style, sound, vibrate, wakeScreen, fullScreen, tone, "");
        }

        @JavascriptInterface
        public void sendTestNotification(
            String title,
            String body,
            String style,
            boolean sound,
            boolean vibrate,
            boolean wakeScreen,
            boolean fullScreen,
            String tone,
            String avatarSrc
        ) {
            DueNotificationReceiver.postNotification(
                MainActivity.this,
                990001,
                title,
                body,
                style,
                sound,
                vibrate,
                wakeScreen,
                fullScreen,
                tone,
                avatarSrc
            );
        }

        @JavascriptInterface
        public void sendTestNotification(
            String title,
            String body,
            String style,
            boolean sound,
            boolean vibrate,
            boolean wakeScreen,
            boolean fullScreen,
            String tone
        ) {
            sendTestNotification(title, body, style, sound, vibrate, wakeScreen, fullScreen, tone, "");
        }

        @JavascriptInterface
        public void sendTestNotification(
            String title,
            String body,
            String style,
            boolean sound,
            boolean vibrate,
            boolean wakeScreen,
            boolean fullScreen
        ) {
            sendTestNotification(title, body, style, sound, vibrate, wakeScreen, fullScreen, "chime", "");
        }
    }
}
`;
fs.writeFileSync(mainActivityPath, mainActivityJava, 'utf8');
console.log('Configured Android MainActivity, 60/90/120 Hz display modes, WAV tones, and screen-off DueNotificationReceiver.');
