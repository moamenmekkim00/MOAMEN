import { ThemeId } from './themes';
import { PageWallpaperChoice, sanitizePageWallpaperChoice } from './wallpapers';

export type IconSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const VALID_ICON_SIZES: IconSize[] = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl'];

/** Controls UI icons ONLY (bottom bar, settings button, header badge, action buttons, FAB). */
export const ICON_SIZE_OPTIONS: {
  id: IconSize;
  labelAr: string;
  labelEn: string;
  navPx: number;
  headerPx: number;
  actionPx: number;
  fabPx: number;
  badgePx: number;
  settingsPx: number;
  headerBtnClass: string;
  actionBtnClass: string;
  fabBtnClass: string;
}[] = [
  {
    id: 'xxs',
    labelAr: 'دقيق',
    labelEn: 'XXS',
    navPx: 15,
    headerPx: 14,
    actionPx: 14,
    fabPx: 18,
    badgePx: 16,
    settingsPx: 15,
    headerBtnClass: 'w-8 h-8',
    actionBtnClass: 'w-7 h-7',
    fabBtnClass: 'w-11 h-11',
  },
  {
    id: 'xs',
    labelAr: 'أصغر',
    labelEn: 'XS',
    navPx: 18,
    headerPx: 16,
    actionPx: 16,
    fabPx: 20,
    badgePx: 18,
    settingsPx: 17,
    headerBtnClass: 'w-9 h-9',
    actionBtnClass: 'w-8 h-8',
    fabBtnClass: 'w-12 h-12',
  },
  {
    id: 'sm',
    labelAr: 'صغير',
    labelEn: 'S',
    navPx: 22,
    headerPx: 18,
    actionPx: 18,
    fabPx: 23,
    badgePx: 20,
    settingsPx: 19,
    headerBtnClass: 'w-10 h-10',
    actionBtnClass: 'w-9 h-9',
    fabBtnClass: 'w-13 h-13',
  },
  {
    id: 'md',
    labelAr: 'متوسط',
    labelEn: 'M',
    navPx: 26,
    headerPx: 20,
    actionPx: 20,
    fabPx: 26,
    badgePx: 22,
    settingsPx: 21,
    headerBtnClass: 'w-11 h-11',
    actionBtnClass: 'w-10 h-10',
    fabBtnClass: 'w-14 h-14',
  },
  {
    id: 'lg',
    labelAr: 'كبير',
    labelEn: 'L',
    navPx: 30,
    headerPx: 24,
    actionPx: 24,
    fabPx: 30,
    badgePx: 26,
    settingsPx: 24,
    headerBtnClass: 'w-12 h-12',
    actionBtnClass: 'w-11 h-11',
    fabBtnClass: 'w-15 h-15',
  },
  {
    id: 'xl',
    labelAr: 'ضخم',
    labelEn: 'XL',
    navPx: 36,
    headerPx: 28,
    actionPx: 28,
    fabPx: 34,
    badgePx: 30,
    settingsPx: 26,
    headerBtnClass: 'w-13 h-13',
    actionBtnClass: 'w-12 h-12',
    fabBtnClass: 'w-16 h-16',
  },
];

export function getIconSizeConfig(size?: IconSize) {
  return ICON_SIZE_OPTIONS.find((o) => o.id === size) || ICON_SIZE_OPTIONS[2];
}

/** Controls character avatars & wallet images ONLY — completely separate from UI icon size. */
export const AVATAR_SIZE_OPTIONS: {
  id: IconSize;
  labelAr: string;
  labelEn: string;
  headerAvatarClass: string;
  avatarListClass: string;
  quickAvatarClass: string;
  quickBoxClass: string;
  walletLogoPx: number;
}[] = [
  {
    id: 'xxs',
    labelAr: 'دقيق',
    labelEn: 'XXS',
    headerAvatarClass: 'w-8 h-8',
    avatarListClass: 'w-8 h-8',
    quickAvatarClass: 'w-7 h-7',
    quickBoxClass: 'w-9 h-10',
    walletLogoPx: 30,
  },
  {
    id: 'xs',
    labelAr: 'أصغر',
    labelEn: 'XS',
    headerAvatarClass: 'w-9 h-9',
    avatarListClass: 'w-9 h-9',
    quickAvatarClass: 'w-8 h-8',
    quickBoxClass: 'w-10 h-11',
    walletLogoPx: 36,
  },
  {
    id: 'sm',
    labelAr: 'صغير',
    labelEn: 'S',
    headerAvatarClass: 'w-10 h-10',
    avatarListClass: 'w-10 h-10',
    quickAvatarClass: 'w-9 h-9',
    quickBoxClass: 'w-11 h-12',
    walletLogoPx: 44,
  },
  {
    id: 'md',
    labelAr: 'متوسط',
    labelEn: 'M',
    headerAvatarClass: 'w-12 h-12',
    avatarListClass: 'w-12 h-12',
    quickAvatarClass: 'w-10 h-10',
    quickBoxClass: 'w-12 h-14',
    walletLogoPx: 52,
  },
  {
    id: 'lg',
    labelAr: 'كبير',
    labelEn: 'L',
    headerAvatarClass: 'w-14 h-14',
    avatarListClass: 'w-14 h-14',
    quickAvatarClass: 'w-12 h-12',
    quickBoxClass: 'w-14 h-16',
    walletLogoPx: 60,
  },
  {
    id: 'xl',
    labelAr: 'ضخم',
    labelEn: 'XL',
    headerAvatarClass: 'w-16 h-16',
    avatarListClass: 'w-16 h-16',
    quickAvatarClass: 'w-14 h-14',
    quickBoxClass: 'w-16 h-18',
    walletLogoPx: 70,
  },
];

export function getAvatarSizeConfig(size?: IconSize) {
  return AVATAR_SIZE_OPTIONS.find((o) => o.id === size) || AVATAR_SIZE_OPTIONS[3];
}

// --- Icon Styles (Whole Program OR Per-Section — Samsung One UI & Clean Vector Styles, NO Pixar icons) ---

export type IconStyleId =
  | 'samsung'
  | 'colored_badge'
  | 'colored_line'
  | 'mono_outline'
  | 'mono_filled'
  | 'theme_adaptive';

export type SectionIconStyleChoice = 'inherit' | IconStyleId;

export type AppIconSection = 'nav' | 'header' | 'people' | 'wallets' | 'settings';

export interface SectionIconStyles {
  nav?: SectionIconStyleChoice;
  header?: SectionIconStyleChoice;
  people?: SectionIconStyleChoice;
  wallets?: SectionIconStyleChoice;
  settings?: SectionIconStyleChoice;
}

export const VALID_ICON_STYLES: IconStyleId[] = [
  'samsung',
  'colored_badge',
  'colored_line',
  'mono_outline',
  'mono_filled',
  'theme_adaptive',
];

export const VALID_SECTION_ICON_STYLES: SectionIconStyleChoice[] = [
  'inherit',
  ...VALID_ICON_STYLES,
];

export function normalizeIconStyle(val?: unknown): IconStyleId {
  if (typeof val === 'string') {
    if (VALID_ICON_STYLES.includes(val as IconStyleId)) {
      return val as IconStyleId;
    }
    // Seamlessly upgrade any retired 'pixar' preference to sleek Samsung One UI icons
    if (val === 'pixar') {
      return 'samsung';
    }
  }
  return 'samsung';
}

export function normalizeSectionIconStyle(val?: unknown): SectionIconStyleChoice {
  if (val === 'inherit') return 'inherit';
  if (val === 'pixar') return 'samsung';
  if (typeof val === 'string' && VALID_ICON_STYLES.includes(val as IconStyleId)) {
    return val as IconStyleId;
  }
  return 'inherit';
}

export const ICON_STYLE_OPTIONS: {
  id: IconStyleId;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  isColored: boolean;
}[] = [
  {
    id: 'samsung',
    labelAr: 'سامسونج One UI',
    labelEn: 'Samsung One UI',
    descAr: 'أيقونات سامسونج عصرية ملونة',
    descEn: 'Sleek Samsung One UI squircle icons',
    isColored: true,
  },
  {
    id: 'colored_badge',
    labelAr: 'ملون بظل ناعم',
    labelEn: 'Soft Colored',
    descAr: 'أيقونات ملونة داخل خلفية ناعمة',
    descEn: 'Vibrant icons in soft badges',
    isColored: true,
  },
  {
    id: 'colored_line',
    labelAr: 'خطوط ملونة',
    labelEn: 'Colored Line',
    descAr: 'خطوط أنيقة بألوان متنوعة',
    descEn: 'Minimal multi-colored strokes',
    isColored: true,
  },
  {
    id: 'mono_outline',
    labelAr: 'غير ملون خطي',
    labelEn: 'Uncolored Line',
    descAr: 'كلاسيكي غير ملون يتكيف مع الهاتف',
    descEn: 'Clean monochrome outline',
    isColored: false,
  },
  {
    id: 'mono_filled',
    labelAr: 'غير ملون ممتلئ',
    labelEn: 'Uncolored Solid',
    descAr: 'أيقونات غير ملونة بإطار ممتلئ',
    descEn: 'Bold monochrome chip style',
    isColored: false,
  },
  {
    id: 'theme_adaptive',
    labelAr: 'حسب مظهر التطبيق',
    labelEn: 'Theme Adaptive',
    descAr: 'تتغير ألوانها تلقائياً مع ثيم الهاتف',
    descEn: 'Auto-matches app & phone theme',
    isColored: true,
  },
];

export const ICON_SECTION_LABELS: {
  key: AppIconSection;
  labelAr: string;
  labelEn: string;
}[] = [
  { key: 'nav', labelAr: 'الشريط السفلي', labelEn: 'Bottom Bar' },
  { key: 'header', labelAr: 'الشريط العلوي وزر +', labelEn: 'Header & Add Button' },
  { key: 'people', labelAr: 'قسم الأشخاص والديون', labelEn: 'People & Debts' },
  { key: 'wallets', labelAr: 'قسم المحافظ', labelEn: 'Wallets Section' },
  { key: 'settings', labelAr: 'شاشة الإعدادات', labelEn: 'Settings Screen' },
];

export function resolveSectionIconStyle(
  globalStyle: IconStyleId | string | undefined,
  sectionStyles: SectionIconStyles | undefined,
  section: AppIconSection
): IconStyleId {
  const rawOverride = sectionStyles?.[section];
  if (rawOverride && rawOverride !== 'inherit') {
    return normalizeIconStyle(rawOverride);
  }
  return normalizeIconStyle(globalStyle);
}

// --- Per-Page Custom Settings (Receivables / Payables / Wallets) ---

export type AppPageKey = 'receivables' | 'payables' | 'wallets';
export type PageScaleId = 'compact' | 'normal' | 'large';
export type PageScaleChoice = 'inherit' | PageScaleId;
export type PageSizeChoice = 'inherit' | IconSize;

export interface PageCustomSettings {
  pageScale?: PageScaleChoice;
  iconSize?: PageSizeChoice;
  avatarSize?: PageSizeChoice;
  iconStyle?: SectionIconStyleChoice;
  wallpaperId?: PageWallpaperChoice;
}

export type PageSettingsMap = Partial<Record<AppPageKey, PageCustomSettings>>;

export const VALID_APP_PAGES: AppPageKey[] = ['receivables', 'payables', 'wallets'];
export const VALID_PAGE_SCALES: PageScaleId[] = ['compact', 'normal', 'large'];

export const APP_PAGE_META: {
  key: AppPageKey;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
}[] = [
  {
    key: 'receivables',
    labelAr: 'لي عند الناس',
    labelEn: 'Owed to Me',
    descAr: 'حجم البطاقات والأيقونات والصور لصفحة الديون المستحقة لك',
    descEn: 'Custom size, icons & style for Owed to Me',
  },
  {
    key: 'payables',
    labelAr: 'مطلوب مني',
    labelEn: 'I Owe',
    descAr: 'حجم البطاقات والأيقونات والصور لصفحة الديون المطلوبة منك',
    descEn: 'Custom size, icons & style for I Owe',
  },
  {
    key: 'wallets',
    labelAr: 'الأموال اللي معايا',
    labelEn: 'My Wallets',
    descAr: 'حجم البطاقات والأيقونات والصور لصفحة المحافظ',
    descEn: 'Custom size, icons & style for Wallets',
  },
];

export interface PageScaleConfig {
  id: PageScaleId;
  labelAr: string;
  labelEn: string;
  stackGapClass: string;
  heroAmountClass: string;
  summaryCardPadClass: string;
  summaryAmountClass: string;
  panelPadClass: string;
  panelTitleClass: string;
  rowPadClass: string;
  rowTitleClass: string;
  rowAmountClass: string;
  walletCardPadClass: string;
  walletBtnHeightClass: string;
}

export const PAGE_SCALE_OPTIONS: PageScaleConfig[] = [
  {
    id: 'compact',
    labelAr: 'مضغوط',
    labelEn: 'Compact',
    stackGapClass: 'space-y-3.5',
    heroAmountClass: 'text-3xl sm:text-4xl',
    summaryCardPadClass: 'p-3',
    summaryAmountClass: 'text-base sm:text-lg',
    panelPadClass: 'p-3.5',
    panelTitleClass: 'text-base',
    rowPadClass: 'py-2.5 first:pt-1 last:pb-0.5',
    rowTitleClass: 'text-xs font-bold',
    rowAmountClass: 'text-xs font-extrabold',
    walletCardPadClass: 'p-3',
    walletBtnHeightClass: 'min-h-[38px]',
  },
  {
    id: 'normal',
    labelAr: 'متوسط',
    labelEn: 'Normal',
    stackGapClass: 'space-y-5',
    heroAmountClass: 'text-4xl sm:text-[42px]',
    summaryCardPadClass: 'p-4',
    summaryAmountClass: 'text-lg sm:text-xl',
    panelPadClass: 'p-5',
    panelTitleClass: 'text-lg',
    rowPadClass: 'py-4 first:pt-2 last:pb-1',
    rowTitleClass: 'text-sm font-bold',
    rowAmountClass: 'text-sm font-extrabold',
    walletCardPadClass: 'p-4',
    walletBtnHeightClass: 'min-h-[44px]',
  },
  {
    id: 'large',
    labelAr: 'كبير',
    labelEn: 'Large',
    stackGapClass: 'space-y-6',
    heroAmountClass: 'text-[42px] sm:text-5xl',
    summaryCardPadClass: 'p-5',
    summaryAmountClass: 'text-xl sm:text-2xl',
    panelPadClass: 'p-6',
    panelTitleClass: 'text-xl',
    rowPadClass: 'py-5 first:pt-3 last:pb-2',
    rowTitleClass: 'text-base font-bold',
    rowAmountClass: 'text-base font-extrabold',
    walletCardPadClass: 'p-5',
    walletBtnHeightClass: 'min-h-[48px]',
  },
];

export function getPageScaleConfig(scale?: PageScaleId): PageScaleConfig {
  return PAGE_SCALE_OPTIONS.find((o) => o.id === scale) || PAGE_SCALE_OPTIONS[1];
}

export function resolvePageCustomConfig(
  page: AppPageKey,
  globalIconSize: IconSize | undefined,
  globalAvatarSize: IconSize | undefined,
  fallbackIconStyle: IconStyleId,
  pageSettings?: PageSettingsMap
) {
  const custom = pageSettings?.[page];
  const pageScale: PageScaleId =
    custom?.pageScale && custom.pageScale !== 'inherit' && VALID_PAGE_SCALES.includes(custom.pageScale)
      ? custom.pageScale
      : 'normal';
  const iconSize: IconSize =
    custom?.iconSize && custom.iconSize !== 'inherit' && VALID_ICON_SIZES.includes(custom.iconSize)
      ? custom.iconSize
      : globalIconSize || 'sm';
  const avatarSize: IconSize =
    custom?.avatarSize && custom.avatarSize !== 'inherit' && VALID_ICON_SIZES.includes(custom.avatarSize)
      ? custom.avatarSize
      : globalAvatarSize || 'md';
  const iconStyle: IconStyleId =
    custom?.iconStyle && custom.iconStyle !== 'inherit'
      ? normalizeIconStyle(custom.iconStyle)
      : normalizeIconStyle(fallbackIconStyle);
  const wallpaperId: PageWallpaperChoice = sanitizePageWallpaperChoice(custom?.wallpaperId);

  return {
    pageScale,
    scaleCfg: getPageScaleConfig(pageScale),
    iconSize,
    iconCfg: getIconSizeConfig(iconSize),
    avatarSize,
    avatarCfg: getAvatarSizeConfig(avatarSize),
    iconStyle,
    wallpaperId,
  };
}

// --- Flashing Status Color (Green / Yellow / Red) ---

export type StatusFlashColor = 'green' | 'yellow' | 'red';

export const VALID_STATUS_COLORS: StatusFlashColor[] = ['green', 'yellow', 'red'];

export const STATUS_COLOR_OPTIONS: {
  id: StatusFlashColor;
  labelAr: string;
  labelEn: string;
  pingClass: string;
  dotClass: string;
  swatchClass: string;
}[] = [
  {
    id: 'green',
    labelAr: 'أخضر',
    labelEn: 'Green',
    pingClass: 'bg-emerald-400',
    dotClass: 'bg-emerald-500',
    swatchClass: 'bg-emerald-500',
  },
  {
    id: 'yellow',
    labelAr: 'أصفر',
    labelEn: 'Yellow',
    pingClass: 'bg-amber-400',
    dotClass: 'bg-amber-500',
    swatchClass: 'bg-amber-400',
  },
  {
    id: 'red',
    labelAr: 'أحمر',
    labelEn: 'Red',
    pingClass: 'bg-red-400',
    dotClass: 'bg-red-500',
    swatchClass: 'bg-red-500',
  },
];

export function getStatusColorConfig(color?: StatusFlashColor) {
  return STATUS_COLOR_OPTIONS.find((c) => c.id === color) || STATUS_COLOR_OPTIONS[0];
}

// Legacy type aliases kept for backward-compatible backup parsing (ring option deleted from UI)
export type AvatarRingColor = 'none' | 'green' | 'red' | 'auto';
export type AvatarRingStyle = 'solid' | 'glow' | 'double' | 'dashed' | 'pulse';
export const VALID_AVATAR_RING_COLORS: AvatarRingColor[] = ['none', 'green', 'red', 'auto'];
export const VALID_AVATAR_RING_STYLES: AvatarRingStyle[] = [
  'solid',
  'glow',
  'double',
  'dashed',
  'pulse',
];

// --- Program UI Icon Keys (Pure crisp vector / Samsung One UI icons — zero Pixar icons) ---

export type UiIconKey =
  | 'settings'
  | 'plus'
  | 'search'
  | 'sound_on'
  | 'sound_off'
  | 'cloud_backup'
  | 'cloud_restore'
  | 'export_json'
  | 'import_json'
  | 'excel'
  | 'palette'
  | 'trash'
  | 'edit'
  | 'calendar'
  | 'phone'
  | 'size'
  | 'bell'
  | 'zap';

// --- Refresh Rate & Motion Speed (60 / 90 / 120 Hz) ---

export type RefreshRateHz = 60 | 90 | 120;

export const VALID_REFRESH_RATES: RefreshRateHz[] = [60, 90, 120];

export interface RefreshRateConfig {
  hz: RefreshRateHz;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  motionMs: number;
  swipeMs: number;
  ease: string;
  swipeThresholdRatio: number;
  swipeMinPx: number;
}

export const REFRESH_RATE_OPTIONS: RefreshRateConfig[] = [
  {
    hz: 60,
    labelAr: '60 Hz متوازن',
    labelEn: '60 Hz Standard',
    descAr: 'حركة ناعمة وتوفير للبطارية',
    descEn: 'Balanced motion & battery saver',
    motionMs: 240,
    swipeMs: 290,
    ease: 'cubic-bezier(0.25, 0.85, 0.35, 1)',
    swipeThresholdRatio: 0.2,
    swipeMinPx: 68,
  },
  {
    hz: 90,
    labelAr: '90 Hz سلس',
    labelEn: '90 Hz Smooth',
    descAr: 'سلاسة عالية واستجابة سريعة',
    descEn: 'Fluid motion & quick response',
    motionMs: 185,
    swipeMs: 225,
    ease: 'cubic-bezier(0.2, 0.92, 0.28, 1)',
    swipeThresholdRatio: 0.16,
    swipeMinPx: 54,
  },
  {
    hz: 120,
    labelAr: '120 Hz فائق',
    labelEn: '120 Hz Ultra',
    descAr: 'أقصى سرعة وانسيابية فورية',
    descEn: 'Pro-motion instant responsiveness',
    motionMs: 135,
    swipeMs: 165,
    ease: 'cubic-bezier(0.16, 0.98, 0.22, 1)',
    swipeThresholdRatio: 0.13,
    swipeMinPx: 44,
  },
];

export function sanitizeRefreshRateHz(val?: unknown): RefreshRateHz {
  const num = Number(val);
  if (num === 60 || num === 90 || num === 120) return num;
  return 120;
}

export function getRefreshRateConfig(hz?: RefreshRateHz | number): RefreshRateConfig {
  const safe = sanitizeRefreshRateHz(hz);
  return REFRESH_RATE_OPTIONS.find((o) => o.hz === safe) || REFRESH_RATE_OPTIONS[2];
}

// --- Phone Due-Date Notifications & Optional Person Alert Formats ---

export type NotificationAlertStyle = 'banner' | 'urgent' | 'detailed' | 'compact';
export type NotificationToneId =
  | 'chime'
  | 'coin'
  | 'samsung'
  | 'urgent'
  | 'crystal'
  | 'system'
  | 'classic_ring'
  | 'marimba_long'
  | 'radar_bell'
  | 'melody_gold'
  | 'soft_harp'
  | 'alarm_pulse';
export type PersonAlertFormat = 'badge' | 'icon' | 'pulse' | 'banner';
export type PersonAlertLevel = 'none' | 'warning' | 'urgent' | 'reminder';
export type NotificationDirectionScope = 'receivables' | 'both';

export const VALID_NOTIFICATION_STYLES: NotificationAlertStyle[] = [
  'banner',
  'urgent',
  'detailed',
  'compact',
];

export const VALID_NOTIFICATION_TONES: NotificationToneId[] = [
  'chime',
  'coin',
  'samsung',
  'urgent',
  'crystal',
  'system',
  'classic_ring',
  'marimba_long',
  'radar_bell',
  'melody_gold',
  'soft_harp',
  'alarm_pulse',
];

export const NOTIFICATION_TONE_OPTIONS: {
  id: NotificationToneId;
  labelAr: string;
  labelEn: string;
  isLong?: boolean;
  durationSec?: string;
}[] = [
  // Longer payment ringtones (~2.8s–3.6s)
  { id: 'classic_ring', labelAr: 'رنة طويلة', labelEn: 'Long Ring', isLong: true, durationSec: '3.2s' },
  { id: 'marimba_long', labelAr: 'ماريمبا ممتدة', labelEn: 'Marimba', isLong: true, durationSec: '3.0s' },
  { id: 'radar_bell', labelAr: 'جرس سداد ممتد', labelEn: 'Payment Bell', isLong: true, durationSec: '3.2s' },
  { id: 'melody_gold', labelAr: 'نغمة ذهبية', labelEn: 'Gold Melody', isLong: true, durationSec: '3.4s' },
  { id: 'soft_harp', labelAr: 'قيثارة هادئة', labelEn: 'Gentle Harp', isLong: true, durationSec: '3.0s' },
  { id: 'alarm_pulse', labelAr: 'منبه دفع قوي', labelEn: 'Strong Alarm', isLong: true, durationSec: '3.5s' },
  // Quick crisp notification tones
  { id: 'chime', labelAr: 'رنين ناعم', labelEn: 'Soft Chime' },
  { id: 'coin', labelAr: 'نغمة مالية', labelEn: 'Cash Bell' },
  { id: 'samsung', labelAr: 'سامسونج', labelEn: 'One UI' },
  { id: 'urgent', labelAr: 'جرس عاجل', labelEn: 'Urgent Ring' },
  { id: 'crystal', labelAr: 'كريستال', labelEn: 'Crystal' },
  { id: 'system', labelAr: 'الهاتف', labelEn: 'Phone Default' },
];

export const VALID_PERSON_ALERT_FORMATS: PersonAlertFormat[] = [
  'badge',
  'icon',
  'pulse',
  'banner',
];

export const VALID_PERSON_ALERT_LEVELS: PersonAlertLevel[] = [
  'none',
  'warning',
  'urgent',
  'reminder',
];

export interface NotificationSettings {
  enabled: boolean;
  notifyDaysBefore: 0 | 1 | 2 | 3;
  notifyTime: string; // HH:MM
  notifyOverdueDaily: boolean;
  notifyDirections: NotificationDirectionScope;
  alertStyle: NotificationAlertStyle;
  alertTone: NotificationToneId;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  wakeScreen: boolean;
  fullScreenAlert: boolean;
  personAlertFormat: PersonAlertFormat;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  notifyDaysBefore: 0,
  notifyTime: '09:00',
  notifyOverdueDaily: true,
  notifyDirections: 'receivables',
  alertStyle: 'banner',
  alertTone: 'chime',
  soundEnabled: true,
  vibrateEnabled: true,
  wakeScreen: true,
  fullScreenAlert: false,
  personAlertFormat: 'badge',
};

export function sanitizeNotificationSettings(val?: unknown): NotificationSettings {
  const raw = (val && typeof val === 'object' ? val : {}) as Partial<NotificationSettings>;
  const daysRaw = Number(raw.notifyDaysBefore);
  const notifyDaysBefore: 0 | 1 | 2 | 3 =
    daysRaw === 1 || daysRaw === 2 || daysRaw === 3 ? daysRaw : 0;
  const notifyTime =
    typeof raw.notifyTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(raw.notifyTime)
      ? raw.notifyTime
      : DEFAULT_NOTIFICATION_SETTINGS.notifyTime;
  const notifyDirections: NotificationDirectionScope =
    raw.notifyDirections === 'both' ? 'both' : 'receivables';
  const alertStyle: NotificationAlertStyle =
    typeof raw.alertStyle === 'string' &&
    VALID_NOTIFICATION_STYLES.includes(raw.alertStyle as NotificationAlertStyle)
      ? (raw.alertStyle as NotificationAlertStyle)
      : DEFAULT_NOTIFICATION_SETTINGS.alertStyle;
  const alertTone: NotificationToneId =
    typeof raw.alertTone === 'string' &&
    VALID_NOTIFICATION_TONES.includes(raw.alertTone as NotificationToneId)
      ? (raw.alertTone as NotificationToneId)
      : DEFAULT_NOTIFICATION_SETTINGS.alertTone;
  const personAlertFormat: PersonAlertFormat =
    typeof raw.personAlertFormat === 'string' &&
    VALID_PERSON_ALERT_FORMATS.includes(raw.personAlertFormat as PersonAlertFormat)
      ? (raw.personAlertFormat as PersonAlertFormat)
      : DEFAULT_NOTIFICATION_SETTINGS.personAlertFormat;

  return {
    enabled: Boolean(raw.enabled),
    notifyDaysBefore,
    notifyTime,
    notifyOverdueDaily:
      typeof raw.notifyOverdueDaily === 'boolean'
        ? raw.notifyOverdueDaily
        : DEFAULT_NOTIFICATION_SETTINGS.notifyOverdueDaily,
    notifyDirections,
    alertStyle,
    alertTone,
    soundEnabled:
      typeof raw.soundEnabled === 'boolean'
        ? raw.soundEnabled
        : DEFAULT_NOTIFICATION_SETTINGS.soundEnabled,
    vibrateEnabled:
      typeof raw.vibrateEnabled === 'boolean'
        ? raw.vibrateEnabled
        : DEFAULT_NOTIFICATION_SETTINGS.vibrateEnabled,
    wakeScreen:
      typeof raw.wakeScreen === 'boolean'
        ? raw.wakeScreen
        : DEFAULT_NOTIFICATION_SETTINGS.wakeScreen,
    fullScreenAlert:
      typeof raw.fullScreenAlert === 'boolean'
        ? raw.fullScreenAlert
        : DEFAULT_NOTIFICATION_SETTINGS.fullScreenAlert,
    personAlertFormat,
  };
}

export function sanitizePersonAlertLevel(val?: unknown): PersonAlertLevel {
  return typeof val === 'string' && VALID_PERSON_ALERT_LEVELS.includes(val as PersonAlertLevel)
    ? (val as PersonAlertLevel)
    : 'none';
}

export const NOTIFICATION_STYLE_OPTIONS: {
  id: NotificationAlertStyle;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
}[] = [
  {
    id: 'banner',
    labelAr: 'قياسي أنيق',
    labelEn: 'Standard Banner',
    descAr: 'اسم العميل والمبلغ المستحق بوضوح',
    descEn: 'Client name & due amount clearly',
  },
  {
    id: 'urgent',
    labelAr: 'تنبيه عاجل بارز',
    labelEn: 'Urgent Alert',
    descAr: 'إشعار عالي الأولوية مع نغمة واهتزاز قوي',
    descEn: 'High-priority heads-up with strong alert',
  },
  {
    id: 'detailed',
    labelAr: 'مفصّل بالكامل',
    labelEn: 'Detailed Summary',
    descAr: 'يعرض المتبقي والسبب وتاريخ الاستحقاق',
    descEn: 'Shows remaining, reason & due date',
  },
  {
    id: 'compact',
    labelAr: 'مختصر وخاص',
    labelEn: 'Compact & Private',
    descAr: 'يخفي المبلغ على شاشة القفل للخصوصية',
    descEn: 'Hides money amount on lock screen',
  },
];

export const PERSON_ALERT_FORMAT_OPTIONS: {
  id: PersonAlertFormat;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
}[] = [
  {
    id: 'badge',
    labelAr: 'شارة وأيقونة',
    labelEn: 'Tag & Icon',
    descAr: 'أيقونة مع نص مختصر بجانب الاسم',
    descEn: 'Icon + short label next to name',
  },
  {
    id: 'icon',
    labelAr: 'أيقونة فقط',
    labelEn: 'Icon Only',
    descAr: 'أيقونة تحذير صغيرة وأنيقة فقط',
    descEn: 'Compact minimal warning icon',
  },
  {
    id: 'pulse',
    labelAr: 'وميض نابض',
    labelEn: 'Pulsing Dot',
    descAr: 'أيقونة مع وميض خفيف يلفت الانتباه',
    descEn: 'Subtle animated pulsing indicator',
  },
  {
    id: 'banner',
    labelAr: 'شريط تنبيه',
    labelEn: 'Alert Strip',
    descAr: 'شريط ملاحظة واضح أسفل بيانات الشخص',
    descEn: 'Clear tinted alert strip under row',
  },
];

export const PERSON_ALERT_LEVEL_OPTIONS: {
  id: PersonAlertLevel;
  labelAr: string;
  labelEn: string;
  shortAr: string;
  shortEn: string;
}[] = [
  { id: 'none', labelAr: 'بدون تنبيه', labelEn: 'No Alert', shortAr: 'بدون', shortEn: 'None' },
  { id: 'warning', labelAr: 'تحذير', labelEn: 'Warning', shortAr: 'تحذير', shortEn: 'Warning' },
  { id: 'urgent', labelAr: 'تنبيه عاجل', labelEn: 'Urgent', shortAr: 'عاجل', shortEn: 'Urgent' },
  { id: 'reminder', labelAr: 'تذكير دفع', labelEn: 'Reminder', shortAr: 'تذكير', shortEn: 'Remind' },
];

// --- 40-Icon Navigation Library (Samsung One UI + Soft Colored + Colored Line + Uncolored) ---

export type NavIconKey =
  | 'arrow_down_left'
  | 'arrow_up_right'
  | 'arrow_down_line'
  | 'arrow_up_line'
  | 'inbox'
  | 'send'
  | 'wallet'
  | 'credit_card'
  | 'banknote'
  | 'coins'
  | 'hand_coins'
  | 'piggy_bank'
  | 'landmark'
  | 'receipt'
  | 'dollar'
  | 'briefcase'
  | 'trending_up'
  | 'trending_down'
  | 'arrow_down_circle'
  | 'arrow_up_circle'
  | 'repeat'
  | 'users'
  | 'user_check'
  | 'user_plus'
  | 'user_minus'
  | 'home'
  | 'shopping_bag'
  | 'shopping_cart'
  | 'gem'
  | 'vault'
  | 'shield_check'
  | 'pie_chart'
  | 'bar_chart'
  | 'calculator'
  | 'calendar_check'
  | 'clock'
  | 'star'
  | 'heart'
  | 'bookmark'
  | 'bell'
  | 'layers'
  | 'sparkles';

export interface NavIconsConfig {
  receivables: NavIconKey;
  payables: NavIconKey;
  wallets: NavIconKey;
}

export const DEFAULT_NAV_ICONS: NavIconsConfig = {
  receivables: 'arrow_down_left',
  payables: 'arrow_up_right',
  wallets: 'wallet',
};

export interface NavIconMeta {
  key: NavIconKey;
  labelAr: string;
  labelEn: string;
  colorClass: string;
  tintClass: string;
  gradientFrom: string;
  gradientTo: string;
}

export const NAV_ICON_LIBRARY: NavIconMeta[] = [
  { key: 'arrow_down_left', labelAr: 'سهم وارد', labelEn: 'Arrow In', colorClass: 'text-emerald-600 dark:text-emerald-400', tintClass: 'bg-emerald-50 dark:bg-emerald-950/50', gradientFrom: '#34D399', gradientTo: '#059669' },
  { key: 'arrow_up_right', labelAr: 'سهم صادر', labelEn: 'Arrow Out', colorClass: 'text-orange-600 dark:text-orange-400', tintClass: 'bg-orange-50 dark:bg-orange-950/50', gradientFrom: '#FB923C', gradientTo: '#EA580C' },
  { key: 'inbox', labelAr: 'الوارد', labelEn: 'Inbox', colorClass: 'text-sky-600 dark:text-sky-400', tintClass: 'bg-sky-50 dark:bg-sky-950/50', gradientFrom: '#38BDF8', gradientTo: '#0284C7' },
  { key: 'send', labelAr: 'الصادر', labelEn: 'Outbox', colorClass: 'text-violet-600 dark:text-violet-400', tintClass: 'bg-violet-50 dark:bg-violet-950/50', gradientFrom: '#A78BFA', gradientTo: '#7C3AED' },
  { key: 'wallet', labelAr: 'محفظة', labelEn: 'Wallet', colorClass: 'text-teal-600 dark:text-teal-400', tintClass: 'bg-teal-50 dark:bg-teal-950/50', gradientFrom: '#2DD4BF', gradientTo: '#0D9488' },
  { key: 'credit_card', labelAr: 'بطاقة فيزا', labelEn: 'Visa Card', colorClass: 'text-blue-600 dark:text-blue-400', tintClass: 'bg-blue-50 dark:bg-blue-950/50', gradientFrom: '#60A5FA', gradientTo: '#2563EB' },
  { key: 'banknote', labelAr: 'أموال نقدية', labelEn: 'Cash', colorClass: 'text-green-600 dark:text-green-400', tintClass: 'bg-green-50 dark:bg-green-950/50', gradientFrom: '#4ADE80', gradientTo: '#16A34A' },
  { key: 'coins', labelAr: 'عملات ذهبية', labelEn: 'Coins', colorClass: 'text-amber-600 dark:text-amber-400', tintClass: 'bg-amber-50 dark:bg-amber-950/50', gradientFrom: '#FBBF24', gradientTo: '#D97706' },
  { key: 'hand_coins', labelAr: 'تحصيل مالي', labelEn: 'Collect', colorClass: 'text-yellow-600 dark:text-yellow-400', tintClass: 'bg-yellow-50 dark:bg-yellow-950/50', gradientFrom: '#FACC15', gradientTo: '#CA8A04' },
  { key: 'piggy_bank', labelAr: 'حصالة', labelEn: 'Piggy Bank', colorClass: 'text-pink-600 dark:text-pink-400', tintClass: 'bg-pink-50 dark:bg-pink-950/50', gradientFrom: '#F472B6', gradientTo: '#DB2777' },
  { key: 'landmark', labelAr: 'بنك', labelEn: 'Bank', colorClass: 'text-indigo-600 dark:text-indigo-400', tintClass: 'bg-indigo-50 dark:bg-indigo-950/50', gradientFrom: '#818CF8', gradientTo: '#4F46E5' },
  { key: 'receipt', labelAr: 'فاتورة', labelEn: 'Receipt', colorClass: 'text-cyan-600 dark:text-cyan-400', tintClass: 'bg-cyan-50 dark:bg-cyan-950/50', gradientFrom: '#22D3EE', gradientTo: '#0891B2' },
  { key: 'dollar', labelAr: 'عملة مالية', labelEn: 'Dollar', colorClass: 'text-emerald-600 dark:text-emerald-400', tintClass: 'bg-emerald-50 dark:bg-emerald-950/50', gradientFrom: '#34D399', gradientTo: '#047857' },
  { key: 'briefcase', labelAr: 'حقيبة أعمال', labelEn: 'Business', colorClass: 'text-amber-700 dark:text-amber-400', tintClass: 'bg-amber-50 dark:bg-amber-950/50', gradientFrom: '#F59E0B', gradientTo: '#B45309' },
  { key: 'trending_up', labelAr: 'أرباح', labelEn: 'Growth', colorClass: 'text-lime-600 dark:text-lime-400', tintClass: 'bg-lime-50 dark:bg-lime-950/50', gradientFrom: '#A3E635', gradientTo: '#65A30D' },
  { key: 'trending_down', labelAr: 'مدفوعات', labelEn: 'Outflow', colorClass: 'text-rose-600 dark:text-rose-400', tintClass: 'bg-rose-50 dark:bg-rose-950/50', gradientFrom: '#FB7185', gradientTo: '#E11D48' },
  { key: 'arrow_down_circle', labelAr: 'دائرة وارد', labelEn: 'Receive', colorClass: 'text-emerald-600 dark:text-emerald-400', tintClass: 'bg-emerald-50 dark:bg-emerald-950/50', gradientFrom: '#34D399', gradientTo: '#059669' },
  { key: 'arrow_up_circle', labelAr: 'دائرة صادر', labelEn: 'Send Out', colorClass: 'text-rose-600 dark:text-rose-400', tintClass: 'bg-rose-50 dark:bg-rose-950/50', gradientFrom: '#FB7185', gradientTo: '#E11D48' },
  { key: 'repeat', labelAr: 'تحويلات', labelEn: 'Transfers', colorClass: 'text-sky-600 dark:text-sky-400', tintClass: 'bg-sky-50 dark:bg-sky-950/50', gradientFrom: '#38BDF8', gradientTo: '#0284C7' },
  { key: 'users', labelAr: 'الأشخاص', labelEn: 'People', colorClass: 'text-indigo-600 dark:text-indigo-400', tintClass: 'bg-indigo-50 dark:bg-indigo-950/50', gradientFrom: '#818CF8', gradientTo: '#4F46E5' },
  { key: 'user_check', labelAr: 'عملاء مسددين', labelEn: 'Settled', colorClass: 'text-teal-600 dark:text-teal-400', tintClass: 'bg-teal-50 dark:bg-teal-950/50', gradientFrom: '#2DD4BF', gradientTo: '#0D9488' },
  { key: 'user_plus', labelAr: 'دائنون', labelEn: 'Creditors', colorClass: 'text-emerald-600 dark:text-emerald-400', tintClass: 'bg-emerald-50 dark:bg-emerald-950/50', gradientFrom: '#34D399', gradientTo: '#059669' },
  { key: 'user_minus', labelAr: 'مدينون', labelEn: 'Debtors', colorClass: 'text-orange-600 dark:text-orange-400', tintClass: 'bg-orange-50 dark:bg-orange-950/50', gradientFrom: '#FB923C', gradientTo: '#EA580C' },
  { key: 'home', labelAr: 'الرئيسية', labelEn: 'Home', colorClass: 'text-blue-600 dark:text-blue-400', tintClass: 'bg-blue-50 dark:bg-blue-950/50', gradientFrom: '#60A5FA', gradientTo: '#2563EB' },
  { key: 'shopping_bag', labelAr: 'مشتريات', labelEn: 'Bag', colorClass: 'text-fuchsia-600 dark:text-fuchsia-400', tintClass: 'bg-fuchsia-50 dark:bg-fuchsia-950/50', gradientFrom: '#E879F9', gradientTo: '#C026D3' },
  { key: 'shopping_cart', labelAr: 'سلة مبيعات', labelEn: 'Cart', colorClass: 'text-purple-600 dark:text-purple-400', tintClass: 'bg-purple-50 dark:bg-purple-950/50', gradientFrom: '#C084FC', gradientTo: '#9333EA' },
  { key: 'gem', labelAr: 'مدخرات', labelEn: 'Savings', colorClass: 'text-cyan-600 dark:text-cyan-400', tintClass: 'bg-cyan-50 dark:bg-cyan-950/50', gradientFrom: '#22D3EE', gradientTo: '#0891B2' },
  { key: 'vault', labelAr: 'خزنة', labelEn: 'Vault', colorClass: 'text-slate-700 dark:text-slate-300', tintClass: 'bg-slate-100 dark:bg-slate-800', gradientFrom: '#94A3B8', gradientTo: '#475569' },
  { key: 'shield_check', labelAr: 'ضمان مالي', labelEn: 'Safe', colorClass: 'text-emerald-600 dark:text-emerald-400', tintClass: 'bg-emerald-50 dark:bg-emerald-950/50', gradientFrom: '#34D399', gradientTo: '#059669' },
  { key: 'pie_chart', labelAr: 'ملخص', labelEn: 'Summary', colorClass: 'text-violet-600 dark:text-violet-400', tintClass: 'bg-violet-50 dark:bg-violet-950/50', gradientFrom: '#A78BFA', gradientTo: '#7C3AED' },
  { key: 'bar_chart', labelAr: 'إحصائيات', labelEn: 'Stats', colorClass: 'text-blue-600 dark:text-blue-400', tintClass: 'bg-blue-50 dark:bg-blue-950/50', gradientFrom: '#60A5FA', gradientTo: '#2563EB' },
  { key: 'calculator', labelAr: 'حاسبة', labelEn: 'Ledger', colorClass: 'text-amber-600 dark:text-amber-400', tintClass: 'bg-amber-50 dark:bg-amber-950/50', gradientFrom: '#FBBF24', gradientTo: '#D97706' },
  { key: 'calendar_check', labelAr: 'مواعيد', labelEn: 'Schedule', colorClass: 'text-teal-600 dark:text-teal-400', tintClass: 'bg-teal-50 dark:bg-teal-950/50', gradientFrom: '#2DD4BF', gradientTo: '#0D9488' },
  { key: 'clock', labelAr: 'مؤجلات', labelEn: 'Pending', colorClass: 'text-orange-600 dark:text-orange-400', tintClass: 'bg-orange-50 dark:bg-orange-950/50', gradientFrom: '#FB923C', gradientTo: '#EA580C' },
  { key: 'star', labelAr: 'مميز', labelEn: 'Starred', colorClass: 'text-yellow-500 dark:text-yellow-400', tintClass: 'bg-yellow-50 dark:bg-yellow-950/50', gradientFrom: '#FACC15', gradientTo: '#EAB308' },
  { key: 'heart', labelAr: 'مفضل', labelEn: 'Favorite', colorClass: 'text-rose-500 dark:text-rose-400', tintClass: 'bg-rose-50 dark:bg-rose-950/50', gradientFrom: '#FB7185', gradientTo: '#E11D48' },
  { key: 'bookmark', labelAr: 'محفوظات', labelEn: 'Saved', colorClass: 'text-indigo-600 dark:text-indigo-400', tintClass: 'bg-indigo-50 dark:bg-indigo-950/50', gradientFrom: '#818CF8', gradientTo: '#4F46E5' },
  { key: 'bell', labelAr: 'تنبيهات', labelEn: 'Alerts', colorClass: 'text-amber-600 dark:text-amber-400', tintClass: 'bg-amber-50 dark:bg-amber-950/50', gradientFrom: '#FBBF24', gradientTo: '#D97706' },
  { key: 'layers', labelAr: 'دفاتر', labelEn: 'Books', colorClass: 'text-cyan-600 dark:text-cyan-400', tintClass: 'bg-cyan-50 dark:bg-cyan-950/50', gradientFrom: '#22D3EE', gradientTo: '#0891B2' },
  { key: 'sparkles', labelAr: 'متنوع', labelEn: 'Sparkles', colorClass: 'text-pink-600 dark:text-pink-400', tintClass: 'bg-pink-50 dark:bg-pink-950/50', gradientFrom: '#F472B6', gradientTo: '#DB2777' },
];

export const VALID_NAV_ICON_KEYS: NavIconKey[] = [
  ...NAV_ICON_LIBRARY.map((i) => i.key),
  'arrow_down_line',
  'arrow_up_line',
];

export function getNavIconMeta(key?: NavIconKey): NavIconMeta {
  const mapped: NavIconKey =
    key === 'arrow_down_line'
      ? 'inbox'
      : key === 'arrow_up_line'
      ? 'send'
      : key || 'wallet';
  return NAV_ICON_LIBRARY.find((i) => i.key === mapped) || NAV_ICON_LIBRARY[4];
}

// --- External Phone Launcher App Icons (16 Samsung One UI Icons: White, Mint, Sky Blue, Finance & Bank Cards) ---

export type AppIconCategory = 'white' | 'mint' | 'sky' | 'finance';

export type AppIconId =
  | 'samsung_white_wallet'
  | 'samsung_white_card'
  | 'samsung_white_finance'
  | 'samsung_pearl_m'
  | 'samsung_mint_wallet'
  | 'samsung_mint_card'
  | 'samsung_mint_coins'
  | 'samsung_mint_soft'
  | 'samsung_sky_wallet'
  | 'samsung_sky_card'
  | 'samsung_sky_soft'
  | 'samsung_sky_bank'
  | 'samsung_cobalt_visa'
  | 'samsung_gold_card'
  | 'samsung_teal_transfer'
  | 'samsung_obsidian_card';

export const APP_ICON_CATEGORIES: {
  id: 'all' | AppIconCategory;
  labelAr: string;
  labelEn: string;
}[] = [
  { id: 'all', labelAr: 'الكل (16)', labelEn: 'All (16)' },
  { id: 'white', labelAr: 'أبيض', labelEn: 'White' },
  { id: 'mint', labelAr: 'نعناعي', labelEn: 'Mint' },
  { id: 'sky', labelAr: 'سماوي', labelEn: 'Sky Blue' },
  { id: 'finance', labelAr: 'شرائح مالية', labelEn: 'Finance Chips' },
];

export const APP_ICON_OPTIONS: {
  id: AppIconId;
  category: AppIconCategory;
  labelAr: string;
  labelEn: string;
  bgHex: string;
  isLightBg?: boolean;
  src: string;
}[] = [
  // White Collection (Samsung Chip + Original Moamen Wallet Shape)
  { id: 'samsung_white_wallet', category: 'white', labelAr: 'أبيض شريحة', labelEn: 'White Chip', bgHex: '#FFFFFF', isLightBg: true, src: '/app-icons/samsung_white_wallet.png' },
  { id: 'samsung_white_card', category: 'white', labelAr: 'أبيض أزرق', labelEn: 'White Blue Chip', bgHex: '#FFFFFF', isLightBg: true, src: '/app-icons/samsung_white_card.png' },
  { id: 'samsung_white_finance', category: 'white', labelAr: 'أبيض ذهبي', labelEn: 'White Gold Chip', bgHex: '#FFFFFF', isLightBg: true, src: '/app-icons/samsung_white_finance.png' },
  { id: 'samsung_pearl_m', category: 'white', labelAr: 'لؤلؤي بلاتيني', labelEn: 'Pearl Platinum', bgHex: '#F4F8F7', isLightBg: true, src: '/app-icons/samsung_pearl_m.png' },

  // Mint Collection (Samsung Chip + Original Moamen Wallet Shape)
  { id: 'samsung_mint_wallet', category: 'mint', labelAr: 'نعناعي أصلي', labelEn: 'Mint Classic', bgHex: '#1CB98B', src: '/app-icons/samsung_mint_wallet.png' },
  { id: 'samsung_mint_card', category: 'mint', labelAr: 'نعناعي شريحة', labelEn: 'Mint Smart Chip', bgHex: '#2CC397', src: '/app-icons/samsung_mint_card.png' },
  { id: 'samsung_mint_coins', category: 'mint', labelAr: 'نعناعي ذهبي', labelEn: 'Mint Gold Chip', bgHex: '#16A87A', src: '/app-icons/samsung_mint_coins.png' },
  { id: 'samsung_mint_soft', category: 'mint', labelAr: 'نعناعي فاتح', labelEn: 'Soft Mint Chip', bgHex: '#D2F5E9', isLightBg: true, src: '/app-icons/samsung_mint_soft.png' },

  // Sky Blue Collection (Samsung Chip + Original Moamen Wallet Shape)
  { id: 'samsung_sky_wallet', category: 'sky', labelAr: 'سماوي أصلي', labelEn: 'Sky Classic', bgHex: '#359BF4', src: '/app-icons/samsung_sky_wallet.png' },
  { id: 'samsung_sky_card', category: 'sky', labelAr: 'سماوي فضي', labelEn: 'Sky Silver Chip', bgHex: '#41A6F8', src: '/app-icons/samsung_sky_card.png' },
  { id: 'samsung_sky_soft', category: 'sky', labelAr: 'سماوي فاتح', labelEn: 'Soft Sky Chip', bgHex: '#D2E9FF', isLightBg: true, src: '/app-icons/samsung_sky_soft.png' },
  { id: 'samsung_sky_bank', category: 'sky', labelAr: 'سماوي ملكي', labelEn: 'Royal Sky Chip', bgHex: '#2D8CE9', src: '/app-icons/samsung_sky_bank.png' },

  // Financial Designs & Bank Chip Collection (Samsung Chip + Original Moamen Wallet Shape)
  { id: 'samsung_cobalt_visa', category: 'finance', labelAr: 'كوبالت شريحة', labelEn: 'Cobalt Chip', bgHex: '#235AE2', src: '/app-icons/samsung_cobalt_visa.png' },
  { id: 'samsung_gold_card', category: 'finance', labelAr: 'شريحة ذهبية', labelEn: 'Gold Chip', bgHex: '#DFAC47', src: '/app-icons/samsung_gold_card.png' },
  { id: 'samsung_teal_transfer', category: 'finance', labelAr: 'تركواز شريحة', labelEn: 'Teal Chip', bgHex: '#1CB0B1', src: '/app-icons/samsung_teal_transfer.png' },
  { id: 'samsung_obsidian_card', category: 'finance', labelAr: 'شريحة سوداء', labelEn: 'Obsidian Chip', bgHex: '#1D2535', src: '/app-icons/samsung_obsidian_card.png' },
];

export const VALID_APP_ICON_IDS: AppIconId[] = APP_ICON_OPTIONS.map((i) => i.id);

// --- Internal Wallet Icons (Official Original Icon + 5 Additional Designs per Wallet + 12 Custom App Icons) ---

export type BuiltinWalletIconType = 'instapay' | 'vodafone_cash' | 'cash';

export type WalletIconId =
  | 'instapay_official'
  | 'instapay_violet_bolt'
  | 'instapay_sunset_flash'
  | 'instapay_cyan_rocket'
  | 'instapay_mint_card'
  | 'instapay_neon_pulse'
  | 'vodafone_official'
  | 'vodafone_classic_red'
  | 'vodafone_ruby_wallet'
  | 'vodafone_coral_phone'
  | 'vodafone_berry_orb'
  | 'vodafone_dark_crimson'
  | 'cash_official'
  | 'cash_emerald_bill'
  | 'cash_gold_coins'
  | 'cash_mint_bundle'
  | 'cash_sky_wallet'
  | 'cash_royal_bag'
  | 'app_orange_cash'
  | 'app_etisalat_cash'
  | 'app_we_pay'
  | 'app_telda'
  | 'app_fawry'
  | 'app_paypal'
  | 'app_bank_card'
  | 'app_savings_vault'
  | 'app_gold_wallet'
  | 'app_crypto_globe'
  | 'app_pink_wallet'
  | 'app_dark_vault';

export interface WalletIconsConfig {
  instapay: WalletIconId;
  vodafone_cash: WalletIconId;
  cash: WalletIconId;
}

export const DEFAULT_WALLET_ICONS: WalletIconsConfig = {
  instapay: 'instapay_official',
  vodafone_cash: 'vodafone_official',
  cash: 'cash_official',
};

export interface WalletIconOption {
  id: WalletIconId;
  walletType: BuiltinWalletIconType | 'custom';
  labelAr: string;
  labelEn: string;
  isOfficial?: boolean;
}

export const WALLET_ICON_OPTIONS: WalletIconOption[] = [
  // InstaPay (Official Original App Icon + 5 Additional Designs)
  { id: 'instapay_official', walletType: 'instapay', labelAr: 'الرسمي الأصلي', labelEn: 'Official App', isOfficial: true },
  { id: 'instapay_sunset_flash', walletType: 'instapay', labelAr: 'رسمي أبيض', labelEn: 'Official White' },
  { id: 'instapay_violet_bolt', walletType: 'instapay', labelAr: 'برق بنفسجي', labelEn: 'Purple Bolt' },
  { id: 'instapay_cyan_rocket', walletType: 'instapay', labelAr: 'ميدالية 3D', labelEn: '3D Medallion' },
  { id: 'instapay_mint_card', walletType: 'instapay', labelAr: 'تدرج أصلي', labelEn: 'Brand Split' },
  { id: 'instapay_neon_pulse', walletType: 'instapay', labelAr: 'بنفسجي داكن', labelEn: 'Dark Royal' },

  // Vodafone Cash (Official Original App Icon + 5 Additional Designs)
  { id: 'vodafone_official', walletType: 'vodafone_cash', labelAr: 'الرسمي الأصلي', labelEn: 'Official App', isOfficial: true },
  { id: 'vodafone_classic_red', walletType: 'vodafone_cash', labelAr: 'كلاسيك 3D', labelEn: '3D Glossy Red' },
  { id: 'vodafone_ruby_wallet', walletType: 'vodafone_cash', labelAr: 'رسمي أبيض', labelEn: 'Official White' },
  { id: 'vodafone_coral_phone', walletType: 'vodafone_cash', labelAr: 'كاش بشارة', labelEn: 'Cash Badge' },
  { id: 'vodafone_berry_orb', walletType: 'vodafone_cash', labelAr: 'بارز 3D', labelEn: '3D Glass Red' },
  { id: 'vodafone_dark_crimson', walletType: 'vodafone_cash', labelAr: 'أحمر داكن', labelEn: 'Dark Red' },

  // Cash (Original Official Cash Icon + 5 Additional Designs)
  { id: 'cash_official', walletType: 'cash', labelAr: 'الأصلي', labelEn: 'Original Cash', isOfficial: true },
  { id: 'cash_emerald_bill', walletType: 'cash', labelAr: 'ورقة وعملة 3D', labelEn: '3D Bill & Coin' },
  { id: 'cash_gold_coins', walletType: 'cash', labelAr: 'عملات ذهبية', labelEn: 'Gold Coins' },
  { id: 'cash_mint_bundle', walletType: 'cash', labelAr: 'حزمة نقود', labelEn: 'Mint Bundle' },
  { id: 'cash_sky_wallet', walletType: 'cash', labelAr: 'محفظة كاش', labelEn: 'Cash Wallet' },
  { id: 'cash_royal_bag', walletType: 'cash', labelAr: 'كيس الكنز', labelEn: 'Treasure Bag' },

  // Additional Application Icons (Orange Cash, Etisalat Cash, WE Pay, Telda, Fawry, PayPal, Bank, Vault, etc.)
  { id: 'app_orange_cash', walletType: 'custom', labelAr: 'أورانج كاش', labelEn: 'Orange Cash' },
  { id: 'app_etisalat_cash', walletType: 'custom', labelAr: 'اتصالات كاش', labelEn: 'Etisalat Cash' },
  { id: 'app_we_pay', walletType: 'custom', labelAr: 'وي باي', labelEn: 'WE Pay' },
  { id: 'app_telda', walletType: 'custom', labelAr: 'تيلدا', labelEn: 'Telda' },
  { id: 'app_fawry', walletType: 'custom', labelAr: 'فوري', labelEn: 'Fawry' },
  { id: 'app_paypal', walletType: 'custom', labelAr: 'باي بال', labelEn: 'PayPal' },
  { id: 'app_bank_card', walletType: 'custom', labelAr: 'بطاقة بنك', labelEn: 'Bank Card' },
  { id: 'app_savings_vault', walletType: 'custom', labelAr: 'خزنة ادخار', labelEn: 'Savings Vault' },
  { id: 'app_gold_wallet', walletType: 'custom', labelAr: 'محفظة ذهبية', labelEn: 'Gold Wallet' },
  { id: 'app_crypto_globe', walletType: 'custom', labelAr: 'حساب دولي', labelEn: 'Global Pay' },
  { id: 'app_pink_wallet', walletType: 'custom', labelAr: 'محفظة خاصة', labelEn: 'Pocket' },
  { id: 'app_dark_vault', walletType: 'custom', labelAr: 'محفظة داكنة', labelEn: 'Dark Vault' },
];

export const CUSTOM_APP_ICON_OPTIONS: WalletIconOption[] = WALLET_ICON_OPTIONS.filter(
  (o) => o.walletType === 'custom'
);

export const PRESET_WALLET_APPS: { name: string; iconId: WalletIconId }[] = [
  { name: 'Orange Cash', iconId: 'app_orange_cash' },
  { name: 'Etisalat Cash', iconId: 'app_etisalat_cash' },
  { name: 'WE Pay', iconId: 'app_we_pay' },
  { name: 'Telda', iconId: 'app_telda' },
  { name: 'Fawry', iconId: 'app_fawry' },
  { name: 'PayPal', iconId: 'app_paypal' },
  { name: 'Bank Card', iconId: 'app_bank_card' },
  { name: 'Savings Vault', iconId: 'app_savings_vault' },
];

export const VALID_WALLET_ICON_IDS: WalletIconId[] = WALLET_ICON_OPTIONS.map((o) => o.id);

const WALLET_ICON_IDS_BY_TYPE: Record<BuiltinWalletIconType, WalletIconId[]> = {
  instapay: WALLET_ICON_OPTIONS.filter((o) => o.walletType === 'instapay').map((o) => o.id),
  vodafone_cash: WALLET_ICON_OPTIONS.filter((o) => o.walletType === 'vodafone_cash').map((o) => o.id),
  cash: WALLET_ICON_OPTIONS.filter((o) => o.walletType === 'cash').map((o) => o.id),
};

export function sanitizeAnyWalletIconId(val?: unknown, fallback: WalletIconId = 'app_bank_card'): WalletIconId {
  if (typeof val === 'string' && VALID_WALLET_ICON_IDS.includes(val as WalletIconId)) {
    return val as WalletIconId;
  }
  return fallback;
}

export function sanitizeWalletIcons(val?: unknown): WalletIconsConfig {
  const raw = (val && typeof val === 'object' ? val : {}) as Partial<WalletIconsConfig>;
  const pick = (
    walletType: BuiltinWalletIconType,
    candidate: unknown
  ): WalletIconId => {
    if (
      typeof candidate === 'string' &&
      WALLET_ICON_IDS_BY_TYPE[walletType].includes(candidate as WalletIconId)
    ) {
      return candidate as WalletIconId;
    }
    return DEFAULT_WALLET_ICONS[walletType];
  };
  return {
    instapay: pick('instapay', raw.instapay),
    vodafone_cash: pick('vodafone_cash', raw.vodafone_cash),
    cash: pick('cash', raw.cash),
  };
}

export function normalizeAppIconId(val?: unknown): AppIconId {
  if (typeof val === 'string') {
    if (VALID_APP_ICON_IDS.includes(val as AppIconId)) return val as AppIconId;
    // Seamlessly map retired legacy icon IDs to the closest Samsung One UI icon
    if (val === 'default' || val === 'mint' || val === 'pistachio' || val === 'sage') return 'samsung_mint_wallet';
    if (val === 'beige' || val === 'caramel') return 'samsung_white_wallet';
    if (val === 'wallet' || val === 'olive') return 'samsung_mint_soft';
    if (val === 'sky' || val === 'visa') return 'samsung_sky_card';
    if (val === 'teal') return 'samsung_teal_transfer';
    if (val === 'honey' || val === 'coins' || val === 'terracotta') return 'samsung_gold_card';
    if (val === 'lavender') return 'samsung_cobalt_visa';
    if (val === 'charcoal' || val === 'dark_card') return 'samsung_obsidian_card';
  }
  return 'samsung_mint_wallet';
}

export function getAppIconSrc(iconId?: AppIconId | string): string {
  const normalized = normalizeAppIconId(iconId);
  const found = APP_ICON_OPTIONS.find((o) => o.id === normalized);
  return found ? found.src : '/app-icons/samsung_mint_wallet.png';
}

/** Maps active app theme to a matching Samsung One UI external launcher icon when theme-sync is enabled. */
export function getThemeMatchedAppIconId(themeId: ThemeId): AppIconId {
  switch (themeId) {
    case 'sky':
      return 'samsung_sky_wallet';
    case 'lavender':
      return 'samsung_cobalt_visa';
    case 'amber':
      return 'samsung_gold_card';
    case 'dark':
      return 'samsung_obsidian_card';
    case 'mint':
    default:
      return 'samsung_mint_wallet';
  }
}

export interface MoamenNativeBridge {
  setAppIcon?: (iconId: string) => void;
  setSystemBarColors?: (bgHex: string, isLight: boolean) => void;
  setRefreshRate?: (hz: number) => void;
  requestNotificationPermission?: () => void;
  hasNotificationPermission?: () => boolean;
  getAlarmStatusJson?: () => string;
  openExactAlarmSettings?: () => void;
  requestIgnoreBatteryOptimizations?: () => void;
  openFullScreenIntentSettings?: () => void;
  previewNotificationTone?: (tone: string) => void;
  scheduleDueNotifications?: (payloadJson: string) => void;
  scheduleTestAlarm?: (
    delaySeconds: number,
    title: string,
    body: string,
    style: string,
    sound: boolean,
    vibrate: boolean,
    wakeScreen: boolean,
    fullScreen: boolean,
    tone: string,
    avatarSrc?: string
  ) => void;
  sendTestNotification?: (
    title: string,
    body: string,
    style: string,
    sound: boolean,
    vibrate: boolean,
    wakeScreen: boolean,
    fullScreen?: boolean,
    tone?: string,
    avatarSrc?: string
  ) => void;
}

export function getNativeBridge(): MoamenNativeBridge | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { MoamenNative?: MoamenNativeBridge }).MoamenNative;
}

/** Applies 60 / 90 / 120 Hz motion timing tokens to CSS + native Android display refresh rate. */
export function applyRefreshRate(hz?: RefreshRateHz | number): void {
  const cfg = getRefreshRateConfig(hz);
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.dataset.refreshRate = String(cfg.hz);
    root.style.setProperty('--moamen-motion-ms', `${cfg.motionMs}ms`);
    root.style.setProperty('--moamen-swipe-ms', `${cfg.swipeMs}ms`);
    root.style.setProperty('--moamen-ease', cfg.ease);
  }
  try {
    getNativeBridge()?.setRefreshRate?.(cfg.hz);
  } catch {
    // Ignore if bridge unavailable
  }
}

/** Updates browser favicon + triggers native Android launcher alias switch when in APK. */
export function applyExternalAppIcon(iconId: AppIconId, triggerNative = false): void {
  const normalized = normalizeAppIconId(iconId);
  const src = getAppIconSrc(normalized);
  if (typeof document !== 'undefined') {
    const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (iconLink) iconLink.href = src;
    const appleLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (appleLink) appleLink.href = src;
  }
  if (triggerNative) {
    try {
      getNativeBridge()?.setAppIcon?.(normalized);
    } catch {
      // Ignore if bridge unavailable
    }
  }
}

export function syncSystemBars(bgHex: string, isLight: boolean): void {
  if (typeof document !== 'undefined') {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = bgHex;
  }
  try {
    getNativeBridge()?.setSystemBarColors?.(bgHex, isLight);
  } catch {
    // Ignore if bridge unavailable
  }
}

let sharedAudioCtx: AudioContext | null = null;

/** Soft synthesized UI navigation click/chime using Web Audio API (0 KB audio assets). */
export function playNavigationSound(direction: 'next' | 'prev' | 'tap' = 'tap'): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    const now = sharedAudioCtx.currentTime;
    const osc = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();

    const startFreq = direction === 'next' ? 520 : direction === 'prev' ? 420 : 480;
    const endFreq = direction === 'next' ? 680 : direction === 'prev' ? 350 : 600;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.055);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

    osc.connect(gain);
    gain.connect(sharedAudioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // Ignore audio context restrictions
  }
}

let activePreviewOscillators: OscillatorNode[] = [];

export function stopNotificationTonePreview(): void {
  for (const osc of activePreviewOscillators) {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      // Already stopped
    }
  }
  activePreviewOscillators = [];
}

/** Plays a selected notification alert tone (native Android raw WAV/ringtone or Web Audio synthesis). */
export function playNotificationTone(tone: NotificationToneId = 'chime'): void {
  stopNotificationTonePreview();

  const native = getNativeBridge();
  if (native?.previewNotificationTone) {
    try {
      native.previewNotificationTone(tone);
      return;
    } catch {
      // Fallback to Web Audio API below
    }
  }

  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }

    const ctx = sharedAudioCtx;
    const now = ctx.currentTime + 0.01;

    const note = (
      freq: number,
      startOffset: number,
      duration: number,
      type: OscillatorType = 'sine',
      peak = 0.16
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.linearRampToValueAtTime(peak, now + startOffset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.02);
      activePreviewOscillators.push(osc);
      osc.onended = () => {
        activePreviewOscillators = activePreviewOscillators.filter((o) => o !== osc);
      };
    };

    switch (tone) {
      case 'classic_ring':
        // Rich 2-phrase classic melodic ringtone (~3.2s)
        for (const rep of [0, 1.55]) {
          note(659.25, rep + 0.0, 0.24, 'sine', 0.17);
          note(783.99, rep + 0.22, 0.24, 'sine', 0.18);
          note(987.77, rep + 0.44, 0.26, 'sine', 0.19);
          note(1318.51, rep + 0.68, 0.48, 'sine', 0.2);
          note(987.77, rep + 1.04, 0.34, 'triangle', 0.14);
        }
        break;
      case 'marimba_long':
        // Warm rhythmic marimba ringtone (~3.0s)
        for (const rep of [0, 1.45]) {
          note(523.25, rep + 0.0, 0.18, 'triangle', 0.19);
          note(659.25, rep + 0.16, 0.18, 'triangle', 0.19);
          note(783.99, rep + 0.32, 0.2, 'triangle', 0.2);
          note(1046.5, rep + 0.5, 0.28, 'triangle', 0.21);
          note(783.99, rep + 0.76, 0.18, 'triangle', 0.17);
          note(880.0, rep + 0.94, 0.22, 'triangle', 0.18);
          note(1046.5, rep + 1.14, 0.34, 'triangle', 0.2);
        }
        break;
      case 'radar_bell':
        // Rhythmic unmistakable payment bell (~3.2s)
        for (const rep of [0, 1.05, 2.1]) {
          note(880.0, rep + 0.0, 0.22, 'sine', 0.18);
          note(1318.51, rep + 0.0, 0.22, 'triangle', 0.1);
          note(1108.73, rep + 0.22, 0.22, 'sine', 0.18);
          note(1318.51, rep + 0.44, 0.42, 'sine', 0.2);
        }
        break;
      case 'melody_gold':
        // Uplifting golden finance melody (~3.4s)
        for (const rep of [0, 1.65]) {
          note(587.33, rep + 0.0, 0.22, 'sine', 0.16);
          note(739.99, rep + 0.2, 0.22, 'sine', 0.17);
          note(880.0, rep + 0.4, 0.24, 'sine', 0.18);
          note(1174.66, rep + 0.62, 0.36, 'sine', 0.2);
          note(1108.73, rep + 0.96, 0.22, 'sine', 0.17);
          note(1174.66, rep + 1.18, 0.44, 'sine', 0.2);
        }
        break;
      case 'soft_harp':
        // Cascading gentle harp arpeggio (~3.0s)
        for (const rep of [0, 1.45]) {
          note(523.25, rep + 0.0, 0.45, 'sine', 0.14);
          note(659.25, rep + 0.14, 0.45, 'sine', 0.15);
          note(783.99, rep + 0.28, 0.45, 'sine', 0.15);
          note(987.77, rep + 0.42, 0.5, 'sine', 0.16);
          note(1046.5, rep + 0.58, 0.55, 'sine', 0.17);
          note(1318.51, rep + 0.76, 0.62, 'sine', 0.18);
        }
        break;
      case 'alarm_pulse':
        // Strong multi-pulse due-payment alarm (~3.5s)
        for (const rep of [0, 0.85, 1.7, 2.55]) {
          note(880.0, rep + 0.0, 0.16, 'square', 0.11);
          note(1174.66, rep + 0.18, 0.16, 'square', 0.12);
          note(1318.51, rep + 0.36, 0.28, 'triangle', 0.19);
        }
        break;
      case 'coin':
        note(987.77, 0.0, 0.16, 'triangle', 0.18);
        note(1318.51, 0.13, 0.36, 'triangle', 0.2);
        note(1567.98, 0.3, 0.42, 'triangle', 0.17);
        break;
      case 'samsung':
        note(523.25, 0.0, 0.18, 'sine', 0.16);
        note(659.25, 0.14, 0.18, 'sine', 0.17);
        note(783.99, 0.28, 0.24, 'sine', 0.18);
        note(1046.5, 0.44, 0.42, 'sine', 0.19);
        break;
      case 'urgent':
        for (const rep of [0, 0.62]) {
          note(880, rep + 0.0, 0.13, 'square', 0.11);
          note(1108.73, rep + 0.15, 0.13, 'square', 0.11);
          note(1318.51, rep + 0.3, 0.22, 'square', 0.12);
        }
        break;
      case 'crystal':
        note(783.99, 0.0, 0.22, 'sine', 0.14);
        note(987.77, 0.11, 0.26, 'sine', 0.15);
        note(1174.66, 0.22, 0.3, 'sine', 0.15);
        note(1567.98, 0.33, 0.48, 'sine', 0.16);
        break;
      case 'system':
        note(660, 0.0, 0.16, 'sine', 0.15);
        note(880, 0.13, 0.28, 'sine', 0.15);
        break;
      case 'chime':
      default:
        note(659.25, 0.0, 0.24, 'sine', 0.16);
        note(880, 0.16, 0.38, 'sine', 0.18);
        note(1046.5, 0.34, 0.44, 'sine', 0.16);
        break;
    }
  } catch {
    // Ignore audio context restrictions
  }
}


