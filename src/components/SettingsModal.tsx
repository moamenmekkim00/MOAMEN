import { ChangeEvent, ReactNode, useEffect, useRef, useState } from 'react';
import {
  BellRing,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudCheck,
  Eye,
  EyeOff,
  Image,
  LayoutGrid,
  Lock,
  Mail,
  Maximize2,
  Music,
  Palette,
  Phone,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  SlidersHorizontal,
  Smartphone,
  Square,
  Timer,
  Trash2,
  User,
  Vibrate,
  Volume2,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import {
  AVATAR_FILTER_TABS,
  AvatarFilter,
  compressImageFile,
  PIXAR_AVATARS,
  resolveAvatarSrc,
} from '../data/avatars';
import {
  APP_ICON_CATEGORIES,
  APP_ICON_OPTIONS,
  APP_PAGE_META,
  AppIconCategory,
  AppIconId,
  AppIconSection,
  AppPageKey,
  AVATAR_SIZE_OPTIONS,
  DEFAULT_NAV_ICONS,
  getAvatarSizeConfig,
  getIconSizeConfig,
  getStatusColorConfig,
  ICON_SECTION_LABELS,
  ICON_SIZE_OPTIONS,
  ICON_STYLE_OPTIONS,
  IconSize,
  IconStyleId,
  NAV_ICON_LIBRARY,
  NavIconKey,
  NavIconsConfig,
  NOTIFICATION_STYLE_OPTIONS,
  NOTIFICATION_TONE_OPTIONS,
  NotificationSettings,
  NotificationToneId,
  PAGE_SCALE_OPTIONS,
  PageCustomSettings,
  PageScaleChoice,
  PageSizeChoice,
  PERSON_ALERT_FORMAT_OPTIONS,
  playNavigationSound,
  REFRESH_RATE_OPTIONS,
  RefreshRateHz,
  DEFAULT_WALLET_ICONS,
  sanitizeNotificationSettings,
  sanitizeRefreshRateHz,
  sanitizeWalletIcons,
  SectionIconStyleChoice,
  STATUS_COLOR_OPTIONS,
  stopNotificationTonePreview,
  WALLET_ICON_OPTIONS,
} from '../data/customization';
import {
  getWallpaperBaseStyle,
  getWallpaperById,
  getWallpaperPatternStyle,
  PageWallpaperChoice,
  WALLPAPER_CATEGORIES,
  WALLPAPER_OPTIONS,
  WallpaperCategory,
  WallpaperId,
} from '../data/wallpapers';
import { AppLanguage, STRINGS, ThemeConfig, ThemeId, THEMES } from '../data/themes';
import {
  BuiltinWalletType,
  CURRENCIES,
  Currency,
  DebtRecord,
  exportDebtsToCSV,
  getTodayISO,
  UserProfile,
  WalletRecord,
} from '../types/debt';
import { exportFullBackupJSON } from '../services/debtService';
import {
  formatDueNotification,
  getNativeAlarmStatus,
  getNotificationPermissionStatus,
  isNativeNotificationBridgeAvailable,
  NativeAlarmStatus,
  openNativeExactAlarmSettings,
  openNativeFullScreenSettings,
  PhonePermissionStatus,
  previewAlertTone,
  requestNativeBatteryExemption,
  requestPhoneNotificationPermission,
  scheduleDelayedTestNotification,
  sendTestPhoneNotification,
} from '../services/notificationService';
import { AppIcon } from './AppIcon';
import { PersonAlertBadge } from './PersonAlertBadge';
import { PWAInstallButton } from './PWAInstallButton';
import { WalletLogo } from './WalletLogos';
import { useSwipeBack } from '../hooks/useSwipeBack';

interface SettingsModalProps {
  isOpen: boolean;
  backupContact: string | null;
  backupPinProtected: boolean;
  autoBackupEnabled: boolean;
  lastBackupAt: string | null;
  backupBusy: boolean;
  profile: UserProfile;
  debts: DebtRecord[];
  wallets: WalletRecord[];
  theme: ThemeConfig;
  lang: AppLanguage;
  settingsIconStyle: IconStyleId;
  navIconStyle: IconStyleId;
  effectiveAppIconId: AppIconId;
  onClose: () => void;
  onUpdateProfile: (
    patch: Partial<
      Pick<
        UserProfile,
        | 'displayName'
        | 'avatarUrl'
        | 'statusActive'
        | 'statusLabel'
        | 'statusColor'
        | 'theme'
        | 'followPhoneTheme'
        | 'autoAppIconByTheme'
        | 'language'
        | 'defaultCurrency'
        | 'iconSize'
        | 'navIconSize'
        | 'avatarSize'
        | 'profileAvatarSize'
        | 'walletImageSize'
        | 'iconStyle'
        | 'sectionIconStyles'
        | 'pageSettings'
        | 'navSoundEnabled'
        | 'appIconId'
        | 'navIcons'
        | 'refreshRateHz'
        | 'notificationSettings'
        | 'hideAmounts'
        | 'showPrivacyToggle'
        | 'hideWalletAmounts'
        | 'showWalletPrivacyToggle'
        | 'wallpaperId'
        | 'walletIcons'
      >
    >
  ) => Promise<void>;
  onSaveBackupContact: (
    rawInput: string,
    rawPin: string
  ) => Promise<{ contact: string; restored: boolean }>;
  onToggleAutoBackup: (enabled: boolean) => void;
  onBackupNow: () => Promise<void>;
  onRestoreFromCloud: () => Promise<boolean>;
  onRestoreJsonFile: (rawJsonText: string) => Promise<{ importedDebts: number; importedWallets: number }>;
  onDisconnectBackupContact: () => void;
}

type NavPickerFilter = 'all' | 'samsung' | 'colored' | 'mono';
type SettingsFolderId =
  | 'speed_alerts'
  | 'profile'
  | 'appearance'
  | 'icons_sizes'
  | 'pages_bar'
  | 'backup';

function formatBackupTime(iso: string | null, lang: AppLanguage): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function mapBackupError(err: unknown, isAr: boolean): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('backup/invalid-contact')) {
    return isAr
      ? 'يرجى إدخال رقم هاتف صحيح أو بريد إلكتروني صحيح.'
      : 'Please enter a valid phone number or email address.';
  }
  if (msg.includes('backup/invalid-pin')) {
    return isAr
      ? 'يرجى إدخال رمز سري للنسخ الاحتياطي (من 4 إلى 32 رقم أو حرف).'
      : 'Please enter a secret backup PIN (4 to 32 digits or characters).';
  }
  if (msg.includes('Missing or insufficient permissions') || msg.includes('permission-denied')) {
    return isAr
      ? 'تعذر الوصول للنسخ الاحتياطي السحابي حالياً. حاول مرة أخرى بعد لحظات.'
      : 'Could not reach cloud backup permissions right now. Please try again shortly.';
  }
  if (msg.includes('network') || msg.includes('offline') || msg.includes('unavailable')) {
    return isAr
      ? 'تعذر الاتصال بالإنترنت. تأكد من الشبكة وحاول مجدداً.'
      : 'Network error. Please check your connection and try again.';
  }
  return isAr
    ? 'حدث خطأ أثناء حفظ النسخة الاحتياطية. حاول مرة أخرى.'
    : 'Something went wrong while syncing backup. Please try again.';
}

export function SettingsModal({
  isOpen,
  backupContact,
  backupPinProtected,
  autoBackupEnabled,
  lastBackupAt,
  backupBusy,
  profile,
  debts,
  wallets,
  theme,
  lang,
  settingsIconStyle,
  navIconStyle,
  effectiveAppIconId,
  onClose,
  onUpdateProfile,
  onSaveBackupContact,
  onToggleAutoBackup,
  onBackupNow,
  onRestoreFromCloud,
  onRestoreJsonFile,
  onDisconnectBackupContact,
}: SettingsModalProps) {
  const isAr = lang === 'ar';
  const t = STRINGS[lang];
  const [nameInput, setNameInput] = useState(profile.displayName);
  const [statusLabelInput, setStatusLabelInput] = useState(profile.statusLabel);
  const [savingName, setSavingName] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  // Full 132-avatar gallery toggle & filter inside settings
  const [avatarGalleryOpen, setAvatarGalleryOpen] = useState(false);
  const [avatarFilter, setAvatarFilter] = useState<AvatarFilter>('all');

  // Section-specific icon style panel toggle
  const [sectionStylesOpen, setSectionStylesOpen] = useState(false);

  // Per-page custom settings tab
  const [editingCustomPage, setEditingCustomPage] = useState<AppPageKey>('receivables');

  // Bottom bar icon editor active slot & colored/uncolored filter
  const [editingNavTab, setEditingNavTab] = useState<keyof NavIconsConfig>('receivables');
  const [navPickerFilter, setNavPickerFilter] = useState<NavPickerFilter>('all');

  // Samsung chip external app icons category filter & Pixar internal wallet icons tab
  const [appIconCategory, setAppIconCategory] = useState<'all' | AppIconCategory>('all');
  const [editingWalletIconType, setEditingWalletIconType] = useState<BuiltinWalletType>('instapay');

  // PIN-protected Email or Phone Number Backup state (no login required)
  const [contactInput, setContactInput] = useState(backupContact || '');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);

  // Folder navigation state (null = folder list home) & phone notifications state
  const [openFolder, setOpenFolder] = useState<SettingsFolderId | null>(null);
  const [wallpaperScope, setWallpaperScope] = useState<'global' | AppPageKey>('global');
  const [wallpaperCat, setWallpaperCat] = useState<WallpaperCategory>('all');
  const [permStatus, setPermStatus] = useState<PhonePermissionStatus>(() =>
    getNotificationPermissionStatus()
  );
  const [alarmStatus, setAlarmStatus] = useState<NativeAlarmStatus>(() => getNativeAlarmStatus());
  const [testingNotif, setTestingNotif] = useState(false);
  const [delayedTestBusy, setDelayedTestBusy] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNameInput(profile.displayName);
    setStatusLabelInput(profile.statusLabel);
  }, [profile.displayName, profile.statusLabel]);

  useEffect(() => {
    setContactInput(backupContact || '');
    if (backupContact) setEditingContact(false);
  }, [backupContact]);

  useEffect(() => {
    if (!isOpen) {
      stopNotificationTonePreview();
      setPinInput('');
      setShowPin(false);
      return;
    }
    setOpenFolder(null);
    const refreshStatus = () => {
      setPermStatus(getNotificationPermissionStatus());
      setAlarmStatus(getNativeAlarmStatus());
    };
    refreshStatus();
    window.addEventListener('focus', refreshStatus);
    return () => {
      stopNotificationTonePreview();
      window.removeEventListener('focus', refreshStatus);
    };
  }, [isOpen]);

  useEffect(() => {
    if (openFolder !== 'speed_alerts') {
      stopNotificationTonePreview();
    }
  }, [openFolder]);

  // Native phone back returns from a folder to the folder list before closing Settings
  useEffect(() => {
    if (!isOpen || openFolder === null) return;
    const onBack = (e: Event) => {
      e.preventDefault();
      setOpenFolder(null);
      scrollBodyRef.current?.scrollTo({ top: 0 });
    };
    window.addEventListener('moamen:back', onBack);
    return () => window.removeEventListener('moamen:back', onBack);
  }, [isOpen, openFolder]);

  const { swipeHandlers, cardStyle } = useSwipeBack(isOpen, () => {
    if (openFolder !== null) {
      setOpenFolder(null);
      scrollBodyRef.current?.scrollTo({ top: 0 });
    } else {
      onClose();
    }
  });

  if (!isOpen) return null;

  const formattedLastBackup = formatBackupTime(lastBackupAt, lang);
  const currentNavIcons: NavIconsConfig = {
    ...DEFAULT_NAV_ICONS,
    ...(profile.navIcons || {}),
  };
  const currentIconSize = profile.iconSize || 'sm';
  const currentNavIconSize = profile.navIconSize ?? currentIconSize;
  const currentAvatarSize = profile.avatarSize || 'md';
  const currentProfileAvatarSize = profile.profileAvatarSize ?? currentAvatarSize;
  const currentWalletImageSize = profile.walletImageSize ?? currentAvatarSize;

  const currentIconCfg = getIconSizeConfig(currentIconSize);
  const currentNavBarCfg = getIconSizeConfig(currentNavIconSize);
  const currentWalletImgCfg = getAvatarSizeConfig(currentWalletImageSize);

  const iconSizeIdx = Math.max(
    0,
    ICON_SIZE_OPTIONS.findIndex((o) => o.id === currentIconSize)
  );
  const navIconSizeIdx = Math.max(
    0,
    ICON_SIZE_OPTIONS.findIndex((o) => o.id === currentNavIconSize)
  );
  const avatarSizeIdx = Math.max(
    0,
    AVATAR_SIZE_OPTIONS.findIndex((o) => o.id === currentAvatarSize)
  );
  const profileAvatarSizeIdx = Math.max(
    0,
    AVATAR_SIZE_OPTIONS.findIndex((o) => o.id === currentProfileAvatarSize)
  );
  const walletImageSizeIdx = Math.max(
    0,
    AVATAR_SIZE_OPTIONS.findIndex((o) => o.id === currentWalletImageSize)
  );

  const currentIconStyle: IconStyleId = profile.iconStyle || 'samsung';
  const currentSectionStyles = profile.sectionIconStyles || {};
  const currentStatusColor = profile.statusColor || 'green';
  const statusColorCfg = getStatusColorConfig(currentStatusColor);
  const followPhoneTheme = Boolean(profile.followPhoneTheme);
  const autoAppIconByTheme = Boolean(profile.autoAppIconByTheme);
  const navSoundEnabled = profile.navSoundEnabled !== false;
  const currentRefreshRate: RefreshRateHz = sanitizeRefreshRateHz(profile.refreshRateHz);
  const notifSettings: NotificationSettings = sanitizeNotificationSettings(
    profile.notificationSettings
  );
  const hideAmounts = Boolean(profile.hideAmounts);
  const showPrivacyToggle = profile.showPrivacyToggle !== false;
  const hideWalletAmounts = Boolean(profile.hideWalletAmounts);
  const showWalletPrivacyToggle = profile.showWalletPrivacyToggle !== false;
  const currentWalletIcons = sanitizeWalletIcons(profile.walletIcons);
  const currentToneMeta = NOTIFICATION_TONE_OPTIONS.find((o) => o.id === notifSettings.alertTone);
  const longToneOptions = NOTIFICATION_TONE_OPTIONS.filter((o) => o.isLong);
  const shortToneOptions = NOTIFICATION_TONE_OPTIONS.filter((o) => !o.isLong);
  const currentGlobalWallpaper = getWallpaperById(profile.wallpaperId);
  const isNativeNotif = isNativeNotificationBridgeAvailable();

  const sampleNotifDebt: DebtRecord = {
    id: 'preview',
    ownerId: 'local',
    direction: 'receivable',
    debtorName: isAr ? 'أحمد محمود' : 'Ahmed Mahmoud',
    debtorPhone: '',
    avatarId: 'young_man',
    title: isAr ? 'دفعة شهرية' : 'Monthly installment',
    category: 'سلفة شخصية',
    totalAmount: 2500,
    paidAmount: 1000,
    currency: profile.defaultCurrency || 'EGP',
    givenDate: getTodayISO(),
    dueDate: getTodayISO(),
    installmentPlan: 'دفعة واحدة',
    status: 'جزئي',
    notes: '',
    alertLevel: 'warning',
    alertNote: isAr ? 'موعد التحصيل اليوم' : 'Collection due today',
  };
  const notifPreview = formatDueNotification(sampleNotifDebt, notifSettings, lang);

  const filteredAvatars =
    avatarFilter === 'all'
      ? PIXAR_AVATARS
      : PIXAR_AVATARS.filter((a) => a.category === avatarFilter);

  const previewNavStyleForGrid: IconStyleId =
    navPickerFilter === 'samsung'
      ? 'samsung'
      : navPickerFilter === 'colored'
      ? navIconStyle === 'mono_outline' || navIconStyle === 'mono_filled'
        ? 'colored_badge'
        : navIconStyle
      : navPickerFilter === 'mono'
      ? navIconStyle === 'mono_filled'
        ? 'mono_filled'
        : 'mono_outline'
      : navIconStyle;

  const visibleNavIcons = NAV_ICON_LIBRARY;
  const visibleAppIcons =
    appIconCategory === 'all'
      ? APP_ICON_OPTIONS
      : APP_ICON_OPTIONS.filter((opt) => opt.category === appIconCategory);

  function showToast(msg: string) {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 2600);
  }

  function updateNotif(patch: Partial<NotificationSettings>) {
    onUpdateProfile({
      notificationSettings: { ...notifSettings, ...patch },
    });
  }

  async function handleToggleNotifications() {
    const nextEnabled = !notifSettings.enabled;
    if (nextEnabled) {
      const status = await requestPhoneNotificationPermission();
      setPermStatus(status);
      updateNotif({ enabled: true });
      if (navSoundEnabled) playNavigationSound('tap');
      showToast(
        status === 'granted' || isNativeNotif
          ? isAr
            ? 'تم تفعيل تنبيهات مواعيد السداد على الهاتف'
            : 'Phone payment alerts enabled'
          : isAr
          ? 'تم التفعيل — اسمح بالإشعارات من المتصفح أو الهاتف لتصلك حتى عند إغلاق الشاشة'
          : 'Enabled — allow browser/phone notifications to alert even when screen is off'
      );
    } else {
      updateNotif({ enabled: false });
      showToast(isAr ? 'تم إيقاف تنبيهات الاستحقاق' : 'Due notifications paused');
    }
  }

  async function handleTestNotification() {
    setTestingNotif(true);
    try {
      if (permStatus !== 'granted') {
        const status = await requestPhoneNotificationPermission();
        setPermStatus(status);
      }
      const res = await sendTestPhoneNotification(notifSettings, lang);
      showToast(
        res.via === 'native' || res.via === 'sw' || res.via === 'web'
          ? isAr
            ? `تم إرسال إشعار تجريبي: ${res.title}`
            : `Test notification sent: ${res.title}`
          : `${res.title} — ${res.body}`
      );
    } finally {
      setTestingNotif(false);
    }
  }

  async function handleDelayedScreenOffTest() {
    setDelayedTestBusy(true);
    try {
      if (permStatus !== 'granted') {
        const status = await requestPhoneNotificationPermission();
        setPermStatus(status);
      }
      await scheduleDelayedTestNotification(10, notifSettings, lang);
      showToast(
        isAr
          ? 'تم جدولة تنبيه بعد 10 ثوانٍ — أغلق شاشة الهاتف الآن لتجربته'
          : 'Alert scheduled in 10s — lock your phone screen now to test'
      );
    } finally {
      setDelayedTestBusy(false);
    }
  }

  const currentStyleMeta = ICON_STYLE_OPTIONS.find((s) => s.id === currentIconStyle);
  const folders: {
    id: SettingsFolderId;
    titleAr: string;
    titleEn: string;
    summaryAr: string;
    summaryEn: string;
    iconBg: string;
    iconColor: string;
    icon: ReactNode;
  }[] = [
    {
      id: 'speed_alerts',
      titleAr: 'السرعة والإشعارات',
      titleEn: 'Speed & Notifications',
      summaryAr: `${currentRefreshRate} Hz · ${
        notifSettings.enabled
          ? `${currentToneMeta?.labelAr || 'رنين'}${notifSettings.fullScreenAlert ? ' · ملء الشاشة' : ''}`
          : 'الإشعارات متوقفة'
      }`,
      summaryEn: `${currentRefreshRate} Hz · ${
        notifSettings.enabled
          ? `${currentToneMeta?.labelEn || 'Chime'}${notifSettings.fullScreenAlert ? ' · Full-Screen' : ''}`
          : 'Alerts off'
      }`,
      iconBg: 'bg-amber-500/12 dark:bg-amber-400/15',
      iconColor: 'text-amber-600 dark:text-amber-400',
      icon: <Zap className="w-4 h-4" />,
    },
    {
      id: 'profile',
      titleAr: 'الملف الشخصي والخصوصية',
      titleEn: 'Profile & Privacy',
      summaryAr: `${profile.displayName}${
        hideAmounts || hideWalletAmounts
          ? ' · إخفاء مفعّل'
          : profile.statusActive
          ? ` · ${statusColorCfg.labelAr}`
          : ''
      }`,
      summaryEn: `${profile.displayName}${
        hideAmounts || hideWalletAmounts
          ? ' · Privacy active'
          : profile.statusActive
          ? ` · ${statusColorCfg.labelEn}`
          : ''
      }`,
      iconBg: 'bg-emerald-500/12 dark:bg-emerald-400/15',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'appearance',
      titleAr: 'المظهر وخلفيات واتساب وتليجرام',
      titleEn: 'Themes, Wallpapers & Language',
      summaryAr: `${theme.nameAr}${
        currentGlobalWallpaper.id !== 'none' ? ` · ${currentGlobalWallpaper.labelAr}` : ' · 25 خلفية'
      } · ${profile.defaultCurrency}`,
      summaryEn: `${theme.nameEn}${
        currentGlobalWallpaper.id !== 'none' ? ` · ${currentGlobalWallpaper.labelEn}` : ' · 25 Wallpapers'
      } · ${profile.defaultCurrency}`,
      iconBg: 'bg-violet-500/12 dark:bg-violet-400/15',
      iconColor: 'text-violet-600 dark:text-violet-400',
      icon: <Palette className="w-4 h-4" />,
    },
    {
      id: 'icons_sizes',
      titleAr: 'الأيقونات والأحجام والصوت',
      titleEn: 'Icons, Sizes & Sound',
      summaryAr: `${currentStyleMeta?.labelAr || 'سامسونج'} · ${navSoundEnabled ? 'الصوت مفعّل' : 'صامت'}`,
      summaryEn: `${currentStyleMeta?.labelEn || 'Samsung'} · ${navSoundEnabled ? 'Sound on' : 'Muted'}`,
      iconBg: 'bg-sky-500/12 dark:bg-sky-400/15',
      iconColor: 'text-sky-600 dark:text-sky-400',
      icon: <Sliders className="w-4 h-4" />,
    },
    {
      id: 'pages_bar',
      titleAr: 'الصفحات والمحافظ وأيقونة التطبيق',
      titleEn: 'Pages, Wallet Icons & App Icon',
      summaryAr: 'أيقونات المحافظ · الشريط · 16 شريحة سامسونج',
      summaryEn: 'Wallet icons · Bottom bar · 16 Samsung chip icons',
      iconBg: 'bg-teal-500/12 dark:bg-teal-400/15',
      iconColor: 'text-teal-600 dark:text-teal-400',
      icon: <LayoutGrid className="w-4 h-4" />,
    },
    {
      id: 'backup',
      titleAr: 'النسخ الاحتياطي والملفات',
      titleEn: 'Backup & Files',
      summaryAr: backupContact ? backupContact : 'إضافة رقم هاتف أو بريد · تصدير واسترجاع',
      summaryEn: backupContact ? backupContact : 'Add phone or email · Export & restore',
      iconBg: 'bg-indigo-500/12 dark:bg-indigo-400/15',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      icon: <Cloud className="w-4 h-4" />,
    },
  ];
  const activeFolderMeta = openFolder ? folders.find((f) => f.id === openFolder) || null : null;

  async function handleSaveProfileText() {
    setSavingName(true);
    try {
      await onUpdateProfile({
        displayName: nameInput.trim() || profile.displayName,
        statusLabel: statusLabelInput.trim(),
      });
      showToast(isAr ? 'تم حفظ الاسم والحالة' : 'Profile updated');
    } finally {
      setSavingName(false);
    }
  }

  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 220);
      await onUpdateProfile({ avatarUrl: dataUrl });
      showToast(isAr ? 'تم تحديث صورتك الشخصية' : 'Profile photo updated');
    } catch (err) {
      setRestoreMsg(err instanceof Error ? err.message : 'Error uploading image');
    }
    e.target.value = '';
  }

  async function handleSaveBackupContactSubmit() {
    setSavingContact(true);
    setBackupError(null);
    try {
      const res = await onSaveBackupContact(contactInput, pinInput);
      setContactInput(res.contact);
      setPinInput('');
      setShowPin(false);
      setEditingContact(false);
      showToast(
        res.restored
          ? isAr
            ? `تمت استعادة النسخة الاحتياطية المحمية لـ ${res.contact}`
            : `Protected backup restored for ${res.contact}`
          : isAr
          ? `تم تفعيل النسخ الاحتياطي المحمي برمز سري لـ ${res.contact}`
          : `PIN-protected backup saved for ${res.contact}`
      );
    } catch (err) {
      setBackupError(mapBackupError(err, isAr));
    } finally {
      setSavingContact(false);
    }
  }

  function updatePageCustom(pageKey: AppPageKey, patch: Partial<PageCustomSettings>) {
    const existing = profile.pageSettings?.[pageKey] || {};
    onUpdateProfile({
      pageSettings: {
        ...(profile.pageSettings || {}),
        [pageKey]: {
          ...existing,
          ...patch,
        },
      },
    });
    if (navSoundEnabled) playNavigationSound('tap');
  }

  async function handleManualBackup() {
    setBackupError(null);
    try {
      await onBackupNow();
      showToast(isAr ? 'تم حفظ النسخة الاحتياطية بنجاح' : 'Backup saved successfully');
    } catch (err) {
      setBackupError(mapBackupError(err, isAr));
    }
  }

  async function handleCloudRestore() {
    setBackupError(null);
    try {
      const found = await onRestoreFromCloud();
      if (found) {
        showToast(isAr ? 'تمت استعادة النسخة الاحتياطية بنجاح' : 'Backup restored successfully');
      } else {
        setBackupError(
          isAr
            ? 'لا توجد نسخة احتياطية محفوظة لهذا الرقم أو البريد حتى الآن.'
            : 'No saved cloud backup found yet for this phone number or email.'
        );
      }
    } catch (err) {
      setBackupError(mapBackupError(err, isAr));
    }
  }

  async function handleBackupRestore(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    setRestoreMsg(null);
    try {
      const text = await file.text();
      const res = await onRestoreJsonFile(text);
      setRestoreMsg(
        isAr
          ? `تم استرجاع ${res.importedDebts} معاملة و ${res.importedWallets} محفظة بنجاح.`
          : `Restored ${res.importedDebts} entries and ${res.importedWallets} wallets.`
      );
    } catch (err) {
      setRestoreMsg(err instanceof Error ? err.message : 'تعذر قراءة الملف.');
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        {...swipeHandlers}
        style={cardStyle}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {activeFolderMeta ? (
              <button
                type="button"
                onClick={() => {
                  setOpenFolder(null);
                  if (navSoundEnabled) playNavigationSound('prev');
                  scrollBodyRef.current?.scrollTo({ top: 0 });
                }}
                aria-label={isAr ? 'رجوع للمجلدات' : 'Back to folders'}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer shrink-0 transition-colors"
              >
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            ) : (
              <AppIcon
                kind="ui"
                name="settings"
                styleId={settingsIconStyle}
                sizePx={20}
                theme={theme}
              />
            )}
            <h2
              id="settings-title"
              className="text-sm font-bold text-slate-900 dark:text-white truncate"
            >
              {activeFolderMeta
                ? isAr
                  ? activeFolderMeta.titleAr
                  : activeFolderMeta.titleEn
                : isAr
                ? 'الإعدادات'
                : 'Settings'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={scrollBodyRef} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {savedToast && (
            <div className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl px-3.5 py-2 flex items-center gap-2">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{savedToast}</span>
            </div>
          )}

          {/* Folder Home Directory */}
          {openFolder === null && (
            <div className="space-y-2">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => {
                    setOpenFolder(folder.id);
                    if (navSoundEnabled) playNavigationSound('next');
                    scrollBodyRef.current?.scrollTo({ top: 0 });
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3 text-start cursor-pointer transition-all active:scale-[0.99]"
                >
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${folder.iconBg} ${folder.iconColor}`}
                  >
                    {folder.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {isAr ? folder.titleAr : folder.titleEn}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {isAr ? folder.summaryAr : folder.summaryEn}
                    </p>
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 shrink-0">
                    {isAr ? (
                      <ChevronLeft className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Folder 1: Compact Speed (60/90/120 Hz) & Phone Payment-Due Notifications + Optional Full-Screen */}
          {openFolder === 'speed_alerts' && (
            <section className="space-y-4">
              {/* Compact Refresh Rate Segmented Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Zap className={`w-3.5 h-3.5 ${theme.accentText}`} />
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {isAr ? 'معدل التحديث' : 'Refresh Rate'}
                    </h3>
                  </div>
                  <span className={`text-[11px] font-bold font-mono-num ${theme.accentText}`}>
                    {currentRefreshRate} Hz
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 bg-slate-100/80 dark:bg-slate-800/70 p-1 rounded-xl">
                  {REFRESH_RATE_OPTIONS.map((opt) => {
                    const selected = currentRefreshRate === opt.hz;
                    return (
                      <button
                        key={opt.hz}
                        type="button"
                        onClick={() => {
                          onUpdateProfile({ refreshRateHz: opt.hz });
                          if (navSoundEnabled) playNavigationSound('tap');
                          showToast(
                            isAr ? `تم الضبط على ${opt.hz} Hz` : `Set to ${opt.hz} Hz`
                          );
                        }}
                        className={`h-9 rounded-lg text-xs font-bold font-mono-num transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          selected
                            ? `${theme.accentBg} text-white shadow-xs`
                            : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>{opt.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phone Payment-Due Notifications */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <BellRing className={`w-3.5 h-3.5 ${theme.accentText}`} />
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {isAr ? 'إشعارات مواعيد السداد' : 'Payment-Due Alerts'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleNotifications}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shrink-0 ${
                      notifSettings.enabled
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {notifSettings.enabled ? (isAr ? 'مفعّل' : 'On') : isAr ? 'متوقف' : 'Off'}
                  </button>
                </div>

                {notifSettings.enabled && (
                  <div className="space-y-2.5">
                    {/* Timing & Lead Days */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {isAr ? 'وقت التذكير' : 'Reminder Time'}
                        </label>
                        <input
                          type="time"
                          value={notifSettings.notifyTime}
                          onChange={(e) => {
                            if (e.target.value) updateNotif({ notifyTime: e.target.value });
                          }}
                          className="w-full h-8 px-2 text-xs font-mono-num bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {isAr ? 'قبل الموعد' : 'Before Due'}
                        </label>
                        <select
                          value={notifSettings.notifyDaysBefore}
                          onChange={(e) =>
                            updateNotif({
                              notifyDaysBefore: Number(e.target.value) as 0 | 1 | 2 | 3,
                            })
                          }
                          className="w-full h-8 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                        >
                          <option value={0}>{isAr ? 'في نفس اليوم' : 'On due date'}</option>
                          <option value={1}>{isAr ? 'قبل يوم' : '1 day before'}</option>
                          <option value={2}>{isAr ? 'قبل يومين' : '2 days before'}</option>
                          <option value={3}>{isAr ? 'قبل 3 أيام' : '3 days before'}</option>
                        </select>
                      </div>
                    </div>

                    {/* Scope & Daily Overdue */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateNotif({
                            notifyDirections:
                              notifSettings.notifyDirections === 'receivables'
                                ? 'both'
                                : 'receivables',
                          })
                        }
                        className="h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                      >
                        <span>{isAr ? 'النطاق' : 'Scope'}</span>
                        <span className={theme.accentText}>
                          {notifSettings.notifyDirections === 'receivables'
                            ? isAr
                              ? 'العملاء'
                              : 'Clients'
                            : isAr
                            ? 'الكل'
                            : 'All'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateNotif({
                            notifyOverdueDaily: !notifSettings.notifyOverdueDaily,
                          })
                        }
                        className="h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                      >
                        <span>{isAr ? 'المتأخر يومياً' : 'Daily Overdue'}</span>
                        <span
                          className={
                            notifSettings.notifyOverdueDaily
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }
                        >
                          {notifSettings.notifyOverdueDaily
                            ? isAr
                              ? 'مفعّل'
                              : 'On'
                            : isAr
                            ? 'إيقاف'
                            : 'Off'}
                        </span>
                      </button>
                    </div>

                    {/* Compact Sound / Vibrate / Wake */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateNotif({ soundEnabled: !notifSettings.soundEnabled })}
                        className={`h-9 px-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          notifSettings.soundEnabled
                            ? `${theme.accentBorder} ${theme.accentSoftBg} ${theme.accentText}`
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAr ? 'صوت' : 'Sound'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateNotif({ vibrateEnabled: !notifSettings.vibrateEnabled })
                        }
                        className={`h-9 px-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          notifSettings.vibrateEnabled
                            ? `${theme.accentBorder} ${theme.accentSoftBg} ${theme.accentText}`
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Vibrate className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAr ? 'اهتزاز' : 'Vibrate'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateNotif({ wakeScreen: !notifSettings.wakeScreen })}
                        className={`h-9 px-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          notifSettings.wakeScreen
                            ? `${theme.accentBorder} ${theme.accentSoftBg} ${theme.accentText}`
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAr ? 'إيقاظ' : 'Wake'}</span>
                      </button>
                    </div>

                    {/* Optional Full-Screen Alert Toggle */}
                    <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Maximize2 className={`w-3.5 h-3.5 shrink-0 ${theme.accentText}`} />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {isAr ? 'إشعار بملء الشاشة (اختياري)' : 'Full-Screen Alert (Optional)'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = !notifSettings.fullScreenAlert;
                          updateNotif({ fullScreenAlert: nextVal });
                          if (navSoundEnabled) playNavigationSound('tap');
                        }}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shrink-0 ${
                          notifSettings.fullScreenAlert
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {notifSettings.fullScreenAlert
                          ? isAr
                            ? 'مفعّل'
                            : 'On'
                          : isAr
                          ? 'إيقاف'
                          : 'Off'}
                      </button>
                    </div>

                    {/* Compact Notification Format Chips */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {isAr ? 'شكل الإشعار' : 'Notification Style'}
                      </p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {NOTIFICATION_STYLE_OPTIONS.map((opt) => {
                          const selected = notifSettings.alertStyle === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                updateNotif({ alertStyle: opt.id });
                                if (navSoundEnabled) playNavigationSound('tap');
                              }}
                              className={`h-9 px-1.5 rounded-xl border text-[11px] font-bold text-center truncate transition-all cursor-pointer ${
                                selected
                                  ? `${theme.accentBorder} ${theme.accentSoftBg} ${theme.accentText} dark:bg-slate-800`
                                  : 'border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {isAr ? opt.labelAr : opt.labelEn}
                            </button>
                          );
                        })}
                      </div>

                      {/* Compact Live Preview with Person Picture (shown even when screen is off) */}
                      <div className="rounded-xl bg-slate-900 text-white px-3 py-2.5 flex items-center gap-2.5">
                        <img
                          src={resolveAvatarSrc(sampleNotifDebt.avatarId)}
                          alt={sampleNotifDebt.debtorName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20 shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="inline-flex items-center gap-1 font-semibold">
                              <BellRing className="w-3 h-3 text-emerald-400" />
                              <span>{t.appName}</span>
                            </span>
                            <span className="font-mono-num">
                              {notifSettings.fullScreenAlert
                                ? isAr
                                  ? 'ملء الشاشة · بالصورة'
                                  : 'Full-Screen · Photo'
                                : isAr
                                ? `${notifSettings.notifyTime} · بالصورة`
                                : `${notifSettings.notifyTime} · Photo`}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold leading-snug truncate">
                            {notifPreview.title}
                          </p>
                          <p className="text-[10px] text-slate-300 line-clamp-2">
                            {notifPreview.body}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Selectable Payment Notification Tone: Long Ringtones (~3s) + Short Tones */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 inline-flex items-center gap-1">
                          <Music className="w-3.5 h-3.5" />
                          <span>{isAr ? 'رنات ونغمات إشعارات الدفع' : 'Payment Alert Ringtones'}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold ${theme.accentText}`}>
                            {isAr ? currentToneMeta?.labelAr : currentToneMeta?.labelEn}
                          </span>
                          <button
                            type="button"
                            onClick={() => stopNotificationTonePreview()}
                            title={isAr ? 'إيقاف الصوت' : 'Stop preview'}
                            aria-label={isAr ? 'إيقاف الصوت' : 'Stop preview'}
                            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
                          >
                            <Square className="w-2.5 h-2.5 fill-current" />
                          </button>
                        </div>
                      </div>

                      {/* 6 Longer Payment Ringtones (~3.0 - 3.5s) */}
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {isAr ? 'رنات أطول للمدفوعات المطلوبة (3 ثوانٍ)' : 'Longer Payment Ringtones (~3s)'}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {longToneOptions.map((opt) => {
                            const selected = notifSettings.alertTone === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  updateNotif({
                                    alertTone: opt.id as NotificationToneId,
                                    soundEnabled: true,
                                  });
                                  previewAlertTone(opt.id);
                                }}
                                className={`h-9 px-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                                  selected
                                    ? `${theme.accentBorder} ${theme.accentSoftBg} ${theme.accentText} dark:bg-slate-800`
                                    : 'border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <span className="inline-flex items-center gap-1 min-w-0">
                                  <Volume2 className="w-3 h-3 shrink-0 opacity-80" />
                                  <span className="truncate">{isAr ? opt.labelAr : opt.labelEn}</span>
                                </span>
                                <span className="text-[9.5px] font-mono-num opacity-70 shrink-0">
                                  {opt.durationSec || '3.0s'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 6 Short Quick Tones */}
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {isAr ? 'نغمات سريعة' : 'Short Tones'}
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {shortToneOptions.map((opt) => {
                            const selected = notifSettings.alertTone === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  updateNotif({
                                    alertTone: opt.id as NotificationToneId,
                                    soundEnabled: true,
                                  });
                                  previewAlertTone(opt.id);
                                }}
                                className={`h-8 px-2 rounded-xl border text-[10.5px] font-bold truncate transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                  selected
                                    ? `${theme.accentBorder} ${theme.accentSoftBg} ${theme.accentText} dark:bg-slate-800`
                                    : 'border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <Volume2 className="w-3 h-3 shrink-0 opacity-75" />
                                <span className="truncate">{isAr ? opt.labelAr : opt.labelEn}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Compact Immediate & Screen-Off (10s) Test Row */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        disabled={testingNotif}
                        onClick={handleTestNotification}
                        className={`h-9 px-2 text-[11px] font-bold text-white ${theme.accentBg} ${theme.accentBgHover} disabled:opacity-60 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors`}
                      >
                        <BellRing className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {testingNotif
                            ? isAr
                              ? 'جاري...'
                              : 'Sending...'
                            : isAr
                            ? 'تجربة الآن'
                            : 'Test Now'}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={delayedTestBusy}
                        onClick={handleDelayedScreenOffTest}
                        className="h-9 px-2 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Timer className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {isAr ? 'بعد 10ث (الشاشة مغلقة)' : 'In 10s (Lock Screen)'}
                        </span>
                      </button>
                    </div>

                    {/* Native Android Screen-Off Reliability Checks (Battery / Exact Alarms / Full-Screen) */}
                    {alarmStatus.isNative &&
                      (!alarmStatus.canScheduleExactAlarms ||
                        !alarmStatus.isIgnoringBatteryOptimizations ||
                        (notifSettings.fullScreenAlert && !alarmStatus.canUseFullScreenIntent)) && (
                        <div className="rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/70 p-2.5 space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {isAr
                                ? 'ضمان وصول الإشعار والشاشة مغلقة'
                                : 'Screen-Off Alert Permissions'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {!alarmStatus.canScheduleExactAlarms && (
                              <button
                                type="button"
                                onClick={openNativeExactAlarmSettings}
                                className="h-8 px-2.5 rounded-lg bg-amber-600 text-white text-[11px] font-bold cursor-pointer"
                              >
                                {isAr ? 'السماح بالمنبه الدقيق' : 'Allow Exact Alarms'}
                              </button>
                            )}
                            {!alarmStatus.isIgnoringBatteryOptimizations && (
                              <button
                                type="button"
                                onClick={requestNativeBatteryExemption}
                                className="h-8 px-2.5 rounded-lg bg-amber-600 text-white text-[11px] font-bold cursor-pointer"
                              >
                                {isAr ? 'استثناء البطارية' : 'Allow Background'}
                              </button>
                            )}
                            {notifSettings.fullScreenAlert && !alarmStatus.canUseFullScreenIntent && (
                              <button
                                type="button"
                                onClick={openNativeFullScreenSettings}
                                className="h-8 px-2.5 rounded-lg bg-amber-600 text-white text-[11px] font-bold cursor-pointer"
                              >
                                {isAr ? 'إذن ملء الشاشة' : 'Full-Screen Permission'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Compact Person Alert Style */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {isAr ? 'شكل التنبيه بجانب الشخص (اختياري)' : 'Person Alert Style (Optional)'}
                  </p>

                  <div className="grid grid-cols-4 gap-1.5">
                    {PERSON_ALERT_FORMAT_OPTIONS.map((opt) => {
                      const selected = notifSettings.personAlertFormat === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            updateNotif({ personAlertFormat: opt.id });
                            if (navSoundEnabled) playNavigationSound('tap');
                          }}
                          className={`h-9 px-1.5 rounded-xl border text-[11px] font-bold text-center truncate transition-all cursor-pointer ${
                            selected
                              ? `${theme.accentBorder} ${theme.accentSoftBg} ${theme.accentText} dark:bg-slate-800`
                              : 'border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {isAr ? opt.labelAr : opt.labelEn}
                        </button>
                      );
                    })}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {isAr ? 'أحمد محمود' : 'Ahmed Mahmoud'}
                      </span>
                      <PersonAlertBadge
                        level="warning"
                        note={isAr ? 'متأخر عن السداد' : 'Overdue'}
                        format={notifSettings.personAlertFormat}
                        lang={lang}
                        placement="inline"
                      />
                    </div>
                    <PersonAlertBadge
                      level="warning"
                      note={isAr ? 'متأخر عن السداد' : 'Overdue'}
                      format={notifSettings.personAlertFormat}
                      lang={lang}
                      placement="below"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Folder 2: Profile + Flashing Color (Green/Yellow/Red) */}
          {openFolder === 'profile' && (
          <section className="space-y-4">

            <div className="flex items-center gap-4">
              <img
                src={resolveAvatarSrc(profile.avatarUrl)}
                alt={profile.displayName}
                className="w-16 h-16 rounded-full object-cover shrink-0 transition-all"
              />
              <div className="flex-1 space-y-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    {isAr ? 'رفع صورتي من الجهاز' : 'Upload Photo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarGalleryOpen((v) => !v)}
                    className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-xl cursor-pointer transition-colors ${
                      avatarGalleryOpen
                        ? `${theme.accentBg} text-white`
                        : `${theme.accentSoftBg} dark:bg-slate-800 ${theme.accentText}`
                    }`}
                  >
                    {avatarGalleryOpen
                      ? isAr
                        ? 'إخفاء صور بيكسار'
                        : 'Hide Avatars'
                      : isAr
                      ? `صور بيكسار (${PIXAR_AVATARS.length})`
                      : `Pixar Avatars (${PIXAR_AVATARS.length})`}
                  </button>
                </div>
                {!avatarGalleryOpen && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {PIXAR_AVATARS.slice(0, 8).map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => onUpdateProfile({ avatarUrl: av.id })}
                        className={`w-8 h-8 rounded-full overflow-hidden border-2 shrink-0 cursor-pointer ${
                          profile.avatarUrl === av.id ? theme.accentBorder : 'border-transparent'
                        }`}
                      >
                        <img src={av.src} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {avatarGalleryOpen && (
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {AVATAR_FILTER_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setAvatarFilter(tab.key)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                        avatarFilter === tab.key
                          ? `${theme.accentBg} text-white`
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isAr ? tab.ar : tab.en}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1">
                  {filteredAvatars.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      title={isAr ? av.labelAr : av.labelEn}
                      onClick={() => {
                        onUpdateProfile({ avatarUrl: av.id });
                        showToast(isAr ? 'تم تغيير صورتك الشخصية' : 'Profile avatar updated');
                      }}
                      className={`flex flex-col items-center gap-1 p-1 rounded-xl border-2 cursor-pointer transition-all ${
                        profile.avatarUrl === av.id
                          ? `${theme.accentBorder} bg-white dark:bg-slate-900 scale-105`
                          : 'border-transparent hover:bg-white/70 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <img
                        src={av.src}
                        alt={isAr ? av.labelAr : av.labelEn}
                        loading="lazy"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'الاسم المعروض' : 'Display Name'}
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'نص الحالة بجانب الوميض' : 'Status Text'}
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={statusLabelInput}
                  onChange={(e) => setStatusLabelInput(e.target.value)}
                  placeholder={isAr ? 'مثال: نشط الآن' : 'e.g. Active'}
                  className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            {/* Flashing Status Toggle + Yellow / Red / Green Color Control */}
            <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    {profile.statusActive && (
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusColorCfg.pingClass}`}
                      />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 ${
                        profile.statusActive ? statusColorCfg.dotClass : 'bg-slate-400'
                      }`}
                    />
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {isAr ? 'الوميض بجانب الاسم' : 'Flashing Status Dot'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateProfile({ statusActive: !profile.statusActive })}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    profile.statusActive
                      ? `${statusColorCfg.dotClass} text-white`
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {profile.statusActive ? (isAr ? 'مفعّل' : 'On') : isAr ? 'متوقف' : 'Off'}
                </button>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr ? 'لون الوميض (أخضر · أصفر · أحمر)' : 'Flashing Color (Green · Yellow · Red)'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_COLOR_OPTIONS.map((opt) => {
                    const selected = currentStatusColor === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onUpdateProfile({ statusColor: opt.id, statusActive: true })}
                        className={`h-9 px-3 rounded-xl border-2 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          selected
                            ? `${theme.accentBorder} bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs`
                            : 'border-transparent bg-white/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span className="relative flex h-2.5 w-2.5">
                          {selected && (
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${opt.pingClass}`}
                            />
                          )}
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${opt.swatchClass}`} />
                        </span>
                        <span>{isAr ? opt.labelAr : opt.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Privacy 1: Outside (Customer Balances, Payments & Top Totals) */}
            <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {hideAmounts ? (
                    <EyeOff className={`w-4 h-4 shrink-0 ${theme.accentText}`} />
                  ) : (
                    <Eye className={`w-4 h-4 shrink-0 ${theme.accentText}`} />
                  )}
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {isAr
                      ? 'إخفاء أرصدة العملاء والدفعات (خارج المحافظ)'
                      : 'Hide Customer Balances & Payments (Outside)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateProfile({ hideAmounts: !hideAmounts });
                    if (navSoundEnabled) playNavigationSound('tap');
                  }}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shrink-0 ${
                    hideAmounts
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {hideAmounts ? (isAr ? 'مخفي' : 'Hidden') : isAr ? 'ظاهر' : 'Visible'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                  {isAr
                    ? 'إظهار زر الإخفاء السريع في الأعلى'
                    : 'Show Quick Hide Button at Top'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateProfile({ showPrivacyToggle: !showPrivacyToggle });
                    if (navSoundEnabled) playNavigationSound('tap');
                  }}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shrink-0 ${
                    showPrivacyToggle
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {showPrivacyToggle ? (isAr ? 'تشغيل' : 'On') : isAr ? 'إيقاف' : 'Off'}
                </button>
              </div>
            </div>

            {/* Privacy 2: Independent Inside-Wallets Privacy Toggle */}
            <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Wallet className={`w-4 h-4 shrink-0 ${theme.accentText}`} />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {isAr
                      ? 'إخفاء أرصدة المحافظ (مستقل داخل المحافظ)'
                      : 'Hide Wallet Balances (Independent)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateProfile({ hideWalletAmounts: !hideWalletAmounts });
                    if (navSoundEnabled) playNavigationSound('tap');
                  }}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shrink-0 ${
                    hideWalletAmounts
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {hideWalletAmounts ? (isAr ? 'مخفي' : 'Hidden') : isAr ? 'ظاهر' : 'Visible'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                  {isAr
                    ? 'إظهار زر الإخفاء المخصص داخل المحافظ'
                    : 'Show Dedicated Hide Button Inside Wallets'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateProfile({ showWalletPrivacyToggle: !showWalletPrivacyToggle });
                    if (navSoundEnabled) playNavigationSound('tap');
                  }}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shrink-0 ${
                    showWalletPrivacyToggle
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {showWalletPrivacyToggle ? (isAr ? 'تشغيل' : 'On') : isAr ? 'إيقاف' : 'Off'}
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={savingName}
              onClick={handleSaveProfileText}
              className={`w-full h-10 text-xs font-semibold text-white ${theme.accentBg} ${theme.accentBgHover} rounded-xl cursor-pointer`}
            >
              {savingName ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ الاسم والحالة' : 'Save Name & Status'}
            </button>
          </section>
          )}

          {/* Folder 3: Themes, Phone Appearance Adaptation, Language & Currency */}
          {openFolder === 'appearance' && (
          <section className="space-y-4">

            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(THEMES) as ThemeId[]).map((tid) => {
                const item = THEMES[tid];
                const selected = profile.theme === tid;
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => onUpdateProfile({ theme: tid })}
                    className={`p-2 rounded-2xl border-2 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      selected
                        ? `${theme.accentBorder} bg-slate-50 dark:bg-slate-800`
                        : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-full border border-black/10"
                      style={{ backgroundColor: item.swatch }}
                    />
                    <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight">
                      {isAr ? item.nameAr : item.nameEn}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Follow Phone Appearance Toggle */}
            <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isAr ? 'تغيير المظهر والأيقونات حسب مظهر الهاتف' : 'Follow Phone Light/Dark Mode'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'يتحول المظهر وألوان الأيقونات تلقائياً مع الوضع الفاتح أو الداكن للهاتف'
                    : 'Automatically adapts app theme & icons to your phone appearance'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onUpdateProfile({ followPhoneTheme: !followPhoneTheme })}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                  followPhoneTheme
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {followPhoneTheme ? (isAr ? 'تلقائي' : 'Auto') : isAr ? 'يدوي' : 'Manual'}
              </button>
            </div>

            {/* WhatsApp & Telegram Style Colorful & Illustrated Wallpapers (Global or Per-Page) */}
            {(() => {
              const currentSelectedWp: PageWallpaperChoice =
                wallpaperScope === 'global'
                  ? profile.wallpaperId || 'none'
                  : profile.pageSettings?.[wallpaperScope]?.wallpaperId || 'inherit';
              const visibleWallpapers = WALLPAPER_OPTIONS.filter(
                (wp) => wp.id !== 'none' && (wallpaperCat === 'all' || wp.category === wallpaperCat)
              );

              function applyWallpaperSelection(choice: PageWallpaperChoice) {
                if (wallpaperScope === 'global') {
                  const id = choice === 'inherit' ? 'none' : (choice as WallpaperId);
                  onUpdateProfile({ wallpaperId: id });
                  if (navSoundEnabled) playNavigationSound('tap');
                  const meta = getWallpaperById(id);
                  showToast(
                    isAr
                      ? `خلفية الرئيسية والكل: ${meta.labelAr}`
                      : `Home wallpaper: ${meta.labelEn}`
                  );
                } else {
                  updatePageCustom(wallpaperScope, { wallpaperId: choice });
                  const meta =
                    choice === 'inherit' ? null : getWallpaperById(choice);
                  const pageMeta = APP_PAGE_META.find((m) => m.key === wallpaperScope);
                  showToast(
                    choice === 'inherit'
                      ? isAr
                        ? `صفحة ${pageMeta?.labelAr}: نفس الخلفية العامة`
                        : `${pageMeta?.labelEn}: using global wallpaper`
                      : isAr
                      ? `خلفية ${pageMeta?.labelAr}: ${meta?.labelAr}`
                      : `${pageMeta?.labelEn} wallpaper: ${meta?.labelEn}`
                  );
                }
              }

              return (
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Image className={`w-4 h-4 shrink-0 ${theme.accentText}`} />
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {isAr ? 'خلفيات واتساب وتليجرام (رسومات وألوان)' : 'WhatsApp & Telegram Wallpapers'}
                      </h3>
                    </div>
                    <span className={`text-[10px] font-bold shrink-0 ${theme.accentText}`}>
                      {currentSelectedWp === 'inherit'
                        ? isAr
                          ? 'نفس العام'
                          : 'Global'
                        : isAr
                        ? getWallpaperById(currentSelectedWp).labelAr
                        : getWallpaperById(currentSelectedWp).labelEn}
                    </span>
                  </div>

                  {/* Scope selector: Global (Home/All) vs Specific Page */}
                  <div className="grid grid-cols-4 gap-1 bg-slate-200/60 dark:bg-slate-900/70 p-1 rounded-xl">
                    {(
                      [
                        { key: 'global', ar: 'الرئيسية/الكل', en: 'All / Home' },
                        { key: 'receivables', ar: 'لي عند الناس', en: 'Owed' },
                        { key: 'payables', ar: 'مطلوب مني', en: 'I Owe' },
                        { key: 'wallets', ar: 'المحافظ', en: 'Wallets' },
                      ] as { key: 'global' | AppPageKey; ar: string; en: string }[]
                    ).map((sc) => {
                      const active = wallpaperScope === sc.key;
                      return (
                        <button
                          key={sc.key}
                          type="button"
                          onClick={() => setWallpaperScope(sc.key)}
                          className={`h-8 px-1 rounded-lg text-[10px] font-bold truncate cursor-pointer transition-all ${
                            active
                              ? `${theme.accentBg} text-white shadow-xs`
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {isAr ? sc.ar : sc.en}
                        </button>
                      );
                    })}
                  </div>

                  {/* Category filter pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                    {WALLPAPER_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setWallpaperCat(cat.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                          wallpaperCat === cat.id
                            ? `${theme.accentBg} text-white`
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        {isAr ? cat.labelAr : cat.labelEn}
                      </button>
                    ))}
                  </div>

                  {/* 3-column miniature wallpaper gallery */}
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-0.5">
                    {wallpaperScope !== 'global' && (
                      <button
                        type="button"
                        onClick={() => applyWallpaperSelection('inherit')}
                        className={`relative h-20 rounded-2xl border-2 overflow-hidden flex flex-col items-center justify-center p-1.5 gap-1 cursor-pointer transition-all bg-white dark:bg-slate-900 ${
                          currentSelectedWp === 'inherit'
                            ? `${theme.accentBorder} ring-2 ring-emerald-400/30`
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {currentSelectedWp === 'inherit' && (
                          <span className={`absolute top-1 end-1 w-4 h-4 rounded-full ${theme.accentBg} text-white flex items-center justify-center`}>
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                        <RotateCcw className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-full">
                          {isAr ? 'نفس العام' : 'Use Global'}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => applyWallpaperSelection('none')}
                      className={`relative h-20 rounded-2xl border-2 overflow-hidden flex flex-col items-center justify-center p-1.5 gap-1 cursor-pointer transition-all bg-white dark:bg-slate-900 ${
                        currentSelectedWp === 'none'
                          ? `${theme.accentBorder} ring-2 ring-emerald-400/30`
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {currentSelectedWp === 'none' && (
                        <span className={`absolute top-1 end-1 w-4 h-4 rounded-full ${theme.accentBg} text-white flex items-center justify-center`}>
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                      <span
                        className="w-5 h-5 rounded-full border border-black/10"
                        style={{ backgroundColor: theme.bgHex }}
                      />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-full">
                        {isAr ? 'بدون خلفية' : 'Plain Theme'}
                      </span>
                    </button>

                    {visibleWallpapers.map((wp) => {
                      const selected = currentSelectedWp === wp.id;
                      return (
                        <button
                          key={wp.id}
                          type="button"
                          onClick={() => applyWallpaperSelection(wp.id)}
                          style={getWallpaperBaseStyle(wp)}
                          className={`relative h-20 rounded-2xl border-2 overflow-hidden flex items-end justify-center p-1.5 cursor-pointer transition-all ${
                            selected
                              ? `${theme.accentBorder} ring-2 ring-emerald-400/40 scale-[1.02]`
                              : 'border-black/10 dark:border-white/10 hover:scale-[1.01]'
                          }`}
                        >
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              ...getWallpaperPatternStyle(wp),
                              backgroundSize: `${Math.round(wp.patternSize * 0.55)}px ${Math.round(wp.patternSize * 0.55)}px`,
                              opacity: Math.min(0.45, wp.patternOpacity * 2.15),
                            }}
                          />
                          {selected && (
                            <span className={`absolute top-1 end-1 z-10 w-4 h-4 rounded-full ${theme.accentBg} text-white flex items-center justify-center shadow-xs`}>
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                          <span
                            className={`relative z-10 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold leading-tight truncate max-w-full ${
                              wp.isDark
                                ? 'bg-black/55 text-white'
                                : 'bg-white/85 text-slate-900'
                            }`}
                          >
                            {isAr ? wp.labelAr : wp.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'اللغة والاتجاه' : 'Language'}
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => onUpdateProfile({ language: 'ar' })}
                    className={`h-9 text-xs font-semibold rounded-lg cursor-pointer ${
                      profile.language === 'ar'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    العربية
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateProfile({ language: 'en' })}
                    className={`h-9 text-xs font-semibold rounded-lg cursor-pointer ${
                      profile.language === 'en'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'العملة الافتراضية' : 'Default Currency'}
                </label>
                <select
                  value={profile.defaultCurrency}
                  onChange={(e) => onUpdateProfile({ defaultCurrency: e.target.value as Currency })}
                  className="w-full h-11 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
          )}

          {/* Folder 4: Granular Sizes, Icon Styles & Navigation Sound */}
          {openFolder === 'icons_sizes' && (
          <section className="space-y-4">

            {/* 1. Profile Picture Size (Independent) */}
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isAr ? 'حجم الصورة الشخصية (في الأعلى)' : 'Profile Picture Size (Header)'}
                </label>
                <div className="flex items-center gap-2">
                  <img
                    src={resolveAvatarSrc(profile.avatarUrl)}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {isAr
                      ? AVATAR_SIZE_OPTIONS[profileAvatarSizeIdx]?.labelAr
                      : AVATAR_SIZE_OPTIONS[profileAvatarSizeIdx]?.labelEn}
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={AVATAR_SIZE_OPTIONS.length - 1}
                step={1}
                value={profileAvatarSizeIdx}
                onChange={(e) => {
                  const opt = AVATAR_SIZE_OPTIONS[Number(e.target.value)];
                  if (opt) onUpdateProfile({ profileAvatarSize: opt.id });
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              <div className="grid grid-cols-6 gap-1">
                {AVATAR_SIZE_OPTIONS.map((opt) => {
                  const selected = currentProfileAvatarSize === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdateProfile({ profileAvatarSize: opt.id })}
                      className={`h-8 text-[10px] font-semibold rounded-lg cursor-pointer transition-all ${
                        selected
                          ? `${theme.accentBg} text-white shadow-xs`
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700'
                      }`}
                    >
                      {isAr ? opt.labelAr : opt.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Wallet Images Size (Independent) */}
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isAr ? 'حجم صور المحفظة (المحافظ)' : 'Wallet Images Size'}
                </label>
                <div className="flex items-center gap-2">
                  <WalletLogo
                    type="instapay"
                    iconId={currentWalletIcons.instapay}
                    size={Math.min(30, Math.round(currentWalletImgCfg.walletLogoPx * 0.55))}
                  />
                  <span className="text-[11px] font-mono-num font-bold text-slate-500 dark:text-slate-400">
                    {currentWalletImgCfg.walletLogoPx}px
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={AVATAR_SIZE_OPTIONS.length - 1}
                step={1}
                value={walletImageSizeIdx}
                onChange={(e) => {
                  const opt = AVATAR_SIZE_OPTIONS[Number(e.target.value)];
                  if (opt) onUpdateProfile({ walletImageSize: opt.id });
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              <div className="grid grid-cols-6 gap-1">
                {AVATAR_SIZE_OPTIONS.map((opt) => {
                  const selected = currentWalletImageSize === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdateProfile({ walletImageSize: opt.id })}
                      className={`h-8 text-[10px] font-semibold rounded-lg cursor-pointer transition-all ${
                        selected
                          ? `${theme.accentBg} text-white shadow-xs`
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700'
                      }`}
                    >
                      {isAr ? opt.labelAr : opt.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Bottom Bar / Bottom Frame Icons Size (Independent) */}
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isAr ? 'حجم أيقونات الشريط السفلي (الإطار السفلي)' : 'Bottom Frame Icons Size'}
                </label>
                <div className="flex items-center gap-2">
                  <AppIcon
                    kind="nav"
                    name={currentNavIcons.wallets}
                    styleId={navIconStyle}
                    sizePx={Math.min(28, currentNavBarCfg.navPx)}
                    theme={theme}
                    active
                  />
                  <span className="text-[11px] font-mono-num font-bold text-slate-500 dark:text-slate-400">
                    {currentNavBarCfg.navPx}px
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={ICON_SIZE_OPTIONS.length - 1}
                step={1}
                value={navIconSizeIdx}
                onChange={(e) => {
                  const opt = ICON_SIZE_OPTIONS[Number(e.target.value)];
                  if (opt) onUpdateProfile({ navIconSize: opt.id });
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              <div className="grid grid-cols-6 gap-1">
                {ICON_SIZE_OPTIONS.map((opt) => {
                  const selected = currentNavIconSize === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdateProfile({ navIconSize: opt.id })}
                      className={`h-8 text-[10px] font-semibold rounded-lg cursor-pointer transition-all ${
                        selected
                          ? `${theme.accentBg} text-white shadow-xs`
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700'
                      }`}
                    >
                      {isAr ? opt.labelAr : opt.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. People & Characters Avatars Size (Independent) */}
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isAr ? 'حجم صور الأشخاص والشخصيات' : 'People & Characters Size'}
                </label>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {isAr
                    ? AVATAR_SIZE_OPTIONS[avatarSizeIdx]?.labelAr
                    : AVATAR_SIZE_OPTIONS[avatarSizeIdx]?.labelEn}
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={AVATAR_SIZE_OPTIONS.length - 1}
                step={1}
                value={avatarSizeIdx}
                onChange={(e) => {
                  const opt = AVATAR_SIZE_OPTIONS[Number(e.target.value)];
                  if (opt) onUpdateProfile({ avatarSize: opt.id });
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              <div className="grid grid-cols-6 gap-1">
                {AVATAR_SIZE_OPTIONS.map((opt) => {
                  const selected = currentAvatarSize === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdateProfile({ avatarSize: opt.id })}
                      className={`h-8 text-[10px] font-semibold rounded-lg cursor-pointer transition-all ${
                        selected
                          ? `${theme.accentBg} text-white shadow-xs`
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700'
                      }`}
                    >
                      {isAr ? opt.labelAr : opt.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. General UI Icons Size (Header, Search, Actions, + Button) */}
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isAr ? 'حجم باقي أيقونات البرنامج' : 'General UI Icons Size'}
                </label>
                <div className="flex items-center gap-2">
                  <AppIcon
                    kind="ui"
                    name="settings"
                    styleId={settingsIconStyle}
                    sizePx={currentIconCfg.headerPx}
                    theme={theme}
                  />
                  <span className="text-[11px] font-mono-num font-bold text-slate-500 dark:text-slate-400">
                    {currentIconCfg.headerPx}px
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={ICON_SIZE_OPTIONS.length - 1}
                step={1}
                value={iconSizeIdx}
                onChange={(e) => {
                  const opt = ICON_SIZE_OPTIONS[Number(e.target.value)];
                  if (opt) onUpdateProfile({ iconSize: opt.id });
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              <div className="grid grid-cols-6 gap-1">
                {ICON_SIZE_OPTIONS.map((opt) => {
                  const selected = currentIconSize === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdateProfile({ iconSize: opt.id })}
                      className={`h-8 text-[10px] font-semibold rounded-lg cursor-pointer transition-all ${
                        selected
                          ? `${theme.accentBg} text-white shadow-xs`
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700'
                      }`}
                    >
                      {isAr ? opt.labelAr : opt.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Overall Program Icon Style + Per-Section Override */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {isAr ? 'مظهر الأيقونات للبرنامج بالكامل' : 'Overall Program Icon Style'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'اختر نمط سامسونج One UI أو ملون أو غير ملون أو متكيف مع مظهر الهاتف'
                      : 'Choose Samsung One UI, colored, uncolored, or theme-adaptive'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ICON_STYLE_OPTIONS.map((st) => {
                  const selected = currentIconStyle === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        onUpdateProfile({ iconStyle: st.id });
                        if (navSoundEnabled) playNavigationSound('tap');
                        showToast(
                          isAr ? `مظهر الأيقونات: ${st.labelAr}` : `Icon style: ${st.labelEn}`
                        );
                      }}
                      className={`p-2.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 cursor-pointer transition-all text-center ${
                        selected
                          ? `${theme.accentBorder} bg-white dark:bg-slate-900 shadow-xs`
                          : 'border-transparent bg-white/70 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 h-8">
                        <AppIcon kind="nav" name="wallet" styleId={st.id} sizePx={20} theme={theme} active />
                        <AppIcon kind="nav" name="arrow_down_left" styleId={st.id} sizePx={18} theme={theme} />
                        <AppIcon kind="ui" name="settings" styleId={st.id} sizePx={18} theme={theme} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                        {isAr ? st.labelAr : st.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Per-Section Icon Style Customization */}
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setSectionStylesOpen((v) => !v)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <span>
                    {isAr
                      ? 'تخصيص مظهر الأيقونات لقسم محدد فقط'
                      : 'Customize Icon Style per Section'}
                  </span>
                  <span className={`text-[11px] font-bold ${theme.accentText}`}>
                    {sectionStylesOpen
                      ? isAr
                        ? 'إخفاء'
                        : 'Hide'
                      : isAr
                      ? 'فتح التخصيص'
                      : 'Customize'}
                  </span>
                </button>

                {sectionStylesOpen && (
                  <div className="space-y-2">
                    {ICON_SECTION_LABELS.map((sec) => {
                      const val: SectionIconStyleChoice =
                        currentSectionStyles[sec.key as AppIconSection] || 'inherit';
                      return (
                        <div
                          key={sec.key}
                          className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 border border-slate-200/60 dark:border-slate-800"
                        >
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                            {isAr ? sec.labelAr : sec.labelEn}
                          </span>
                          <select
                            value={val}
                            onChange={(e) => {
                              const nextChoice = e.target.value as SectionIconStyleChoice;
                              onUpdateProfile({
                                sectionIconStyles: {
                                  ...currentSectionStyles,
                                  [sec.key]: nextChoice,
                                },
                              });
                            }}
                            className="h-8 px-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                          >
                            <option value="inherit">
                              {isAr ? 'نفس المظهر العام' : 'Same as Overall'}
                            </option>
                            {ICON_STYLE_OPTIONS.map((st) => (
                              <option key={st.id} value={st.id}>
                                {isAr ? st.labelAr : st.labelEn}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateProfile({
                          sectionIconStyles: {
                            nav: 'inherit',
                            header: 'inherit',
                            people: 'inherit',
                            wallets: 'inherit',
                            settings: 'inherit',
                          },
                        });
                        showToast(
                          isAr
                            ? 'تمت إعادة جميع الأقسام للمظهر العام'
                            : 'All sections reset to overall style'
                        );
                      }}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                    >
                      {isAr ? 'إعادة جميع الأقسام للمظهر العام' : 'Reset all sections to overall'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Sound Toggle */}
            <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <AppIcon
                  kind="ui"
                  name={navSoundEnabled ? 'sound_on' : 'sound_off'}
                  styleId={settingsIconStyle}
                  sizePx={20}
                  theme={theme}
                />
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {isAr ? 'صوت التنقل بين الصفحات' : 'Navigation Sound'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !navSoundEnabled;
                  onUpdateProfile({ navSoundEnabled: nextVal });
                  if (nextVal) playNavigationSound('tap');
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shrink-0 ${
                  navSoundEnabled
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {navSoundEnabled ? (isAr ? 'مفعّل' : 'On') : isAr ? 'صامت' : 'Off'}
              </button>
            </div>
          </section>
          )}

          {/* Folder 5: Per-Page Custom Settings, Bottom Bar Icons & 16 Samsung Phone App Icons */}
          {openFolder === 'pages_bar' && (
          <section className="space-y-4">
            {/* Per-Page Independent Custom Settings (Size, Icon Size, Image Size, Icon Style) */}
            {(() => {
              const pageCustom = profile.pageSettings?.[editingCustomPage] || {};
              const pScale: PageScaleChoice = pageCustom.pageScale || 'inherit';
              const pIconSize: PageSizeChoice = pageCustom.iconSize || 'inherit';
              const pAvatarSize: PageSizeChoice = pageCustom.avatarSize || 'inherit';
              const pIconStyle: SectionIconStyleChoice = pageCustom.iconStyle || 'inherit';
              const activePageMeta =
                APP_PAGE_META.find((m) => m.key === editingCustomPage) || APP_PAGE_META[0];
              return (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <SlidersHorizontal className={`w-4 h-4 shrink-0 ${theme.accentText}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {isAr ? 'إعدادات مخصصة لكل صفحة على حدة' : 'Per-Page Custom Settings'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isAr
                            ? 'تحكم مستقل بحجم البطاقات والأيقونات والصور والنمط لكل صفحة'
                            : 'Independent layout size, icon size, image size & style per page'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updatePageCustom(editingCustomPage, {
                          pageScale: 'inherit',
                          iconSize: 'inherit',
                          avatarSize: 'inherit',
                          iconStyle: 'inherit',
                          wallpaperId: 'inherit',
                        });
                        showToast(
                          isAr
                            ? `تمت إعادة صفحة "${activePageMeta.labelAr}" للافتراضي`
                            : `${activePageMeta.labelEn} reset to default`
                        );
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{isAr ? 'افتراضي' : 'Reset'}</span>
                    </button>
                  </div>

                  {/* Page Selector Tabs */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {APP_PAGE_META.map((pm) => {
                      const active = editingCustomPage === pm.key;
                      const custom = profile.pageSettings?.[pm.key];
                      const hasOverride = Boolean(
                        custom &&
                          ((custom.pageScale && custom.pageScale !== 'inherit') ||
                            (custom.iconSize && custom.iconSize !== 'inherit') ||
                            (custom.avatarSize && custom.avatarSize !== 'inherit') ||
                            (custom.iconStyle && custom.iconStyle !== 'inherit') ||
                            (custom.wallpaperId && custom.wallpaperId !== 'inherit'))
                      );
                      return (
                        <button
                          key={pm.key}
                          type="button"
                          onClick={() => setEditingCustomPage(pm.key)}
                          className={`h-9 px-2 rounded-xl border-2 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                            active
                              ? `${theme.accentBorder} bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs`
                              : 'border-transparent bg-white/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span className="truncate">{isAr ? pm.labelAr : pm.labelEn}</span>
                          {hasOverride && (
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.accentBg}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Page Scale */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {isAr ? 'حجم الصفحة والبطاقات' : 'Page & Card Size'}
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                      <button
                        type="button"
                        onClick={() => updatePageCustom(editingCustomPage, { pageScale: 'inherit' })}
                        className={`h-8 rounded-lg text-[10px] font-semibold cursor-pointer ${
                          pScale === 'inherit'
                            ? `${theme.accentBg} text-white`
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700'
                        }`}
                      >
                        {isAr ? 'افتراضي' : 'Auto'}
                      </button>
                      {PAGE_SCALE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updatePageCustom(editingCustomPage, { pageScale: opt.id })}
                          className={`h-8 rounded-lg text-[10px] font-semibold cursor-pointer ${
                            pScale === opt.id
                              ? `${theme.accentBg} text-white`
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700'
                          }`}
                        >
                          {isAr ? opt.labelAr : opt.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page Icon Size */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {isAr ? 'حجم الأيقونات في هذه الصفحة' : 'Icon Size on This Page'}
                      </span>
                      <button
                        type="button"
                        onClick={() => updatePageCustom(editingCustomPage, { iconSize: 'inherit' })}
                        className={`text-[10px] font-semibold cursor-pointer ${
                          pIconSize === 'inherit' ? theme.accentText : 'text-slate-400'
                        }`}
                      >
                        {pIconSize === 'inherit'
                          ? isAr
                            ? 'نفس العام ✓'
                            : 'General ✓'
                          : isAr
                          ? 'استخدام العام'
                          : 'Use General'}
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {ICON_SIZE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            updatePageCustom(editingCustomPage, { iconSize: opt.id as IconSize })
                          }
                          className={`h-7 rounded-lg text-[10px] font-semibold cursor-pointer ${
                            pIconSize === opt.id
                              ? `${theme.accentBg} text-white`
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700'
                          }`}
                        >
                          {isAr ? opt.labelAr : opt.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page Images / Logos Size */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {editingCustomPage === 'wallets'
                          ? isAr
                            ? 'حجم شعارات المحافظ في هذه الصفحة'
                            : 'Wallet Logos Size'
                          : isAr
                          ? 'حجم الصور والشخصيات في هذه الصفحة'
                          : 'Avatars Size'}
                      </span>
                      <button
                        type="button"
                        onClick={() => updatePageCustom(editingCustomPage, { avatarSize: 'inherit' })}
                        className={`text-[10px] font-semibold cursor-pointer ${
                          pAvatarSize === 'inherit' ? theme.accentText : 'text-slate-400'
                        }`}
                      >
                        {pAvatarSize === 'inherit'
                          ? isAr
                            ? 'نفس العام ✓'
                            : 'General ✓'
                          : isAr
                          ? 'استخدام العام'
                          : 'Use General'}
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {AVATAR_SIZE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            updatePageCustom(editingCustomPage, { avatarSize: opt.id as IconSize })
                          }
                          className={`h-7 rounded-lg text-[10px] font-semibold cursor-pointer ${
                            pAvatarSize === opt.id
                              ? `${theme.accentBg} text-white`
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700'
                          }`}
                        >
                          {isAr ? opt.labelAr : opt.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page Icon Style */}
                  <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                      {isAr ? 'نمط أيقونات الصفحة' : 'Page Icon Style'}
                    </span>
                    <select
                      value={pIconStyle}
                      onChange={(e) =>
                        updatePageCustom(editingCustomPage, {
                          iconStyle: e.target.value as SectionIconStyleChoice,
                        })
                      }
                      className="h-8 px-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <option value="inherit">{isAr ? 'نفس المظهر العام' : 'Same as Overall'}</option>
                      {ICON_STYLE_OPTIONS.map((st) => (
                        <option key={st.id} value={st.id}>
                          {isAr ? st.labelAr : st.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })()}

            {/* 40+ Colored & Uncolored Bottom Bar Icons Editor */}
            <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isAr
                    ? `أيقونات الشريط السفلي (${NAV_ICON_LIBRARY.length} أيقونة ملونة وغير ملونة)`
                    : `Bottom Bar Icons (${NAV_ICON_LIBRARY.length} Colored & Uncolored)`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateProfile({ navIcons: { ...DEFAULT_NAV_ICONS } });
                    showToast(isAr ? 'تمت استعادة الأيقونات الافتراضية' : 'Default icons restored');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isAr ? 'الافتراضي' : 'Reset'}</span>
                </button>
              </div>

              {/* 3 Bottom Bar Slots */}
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { key: 'receivables', label: t.tabReceivables },
                    { key: 'payables', label: t.tabPayables },
                    { key: 'wallets', label: t.tabWallets },
                  ] as { key: keyof NavIconsConfig; label: string }[]
                ).map((tab) => {
                  const active = editingNavTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setEditingNavTab(tab.key)}
                      className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        active
                          ? `${theme.accentBorder} bg-white dark:bg-slate-900 shadow-xs`
                          : 'border-transparent bg-white/60 dark:bg-slate-900/40 text-slate-500'
                      }`}
                    >
                      <AppIcon
                        kind="nav"
                        name={currentNavIcons[tab.key]}
                        styleId={navIconStyle}
                        sizePx={22}
                        theme={theme}
                        active={active}
                      />
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-full">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Filter & Quick Style Switch for Bottom Bar (All / Samsung / Colored / Uncolored) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {(
                  [
                    { id: 'all', ar: `الكل (${NAV_ICON_LIBRARY.length})`, en: `All (${NAV_ICON_LIBRARY.length})` },
                    { id: 'samsung', ar: 'سامسونج', en: 'Samsung' },
                    { id: 'colored', ar: 'ملونة', en: 'Colored' },
                    { id: 'mono', ar: 'غير ملونة', en: 'Uncolored' },
                  ] as { id: NavPickerFilter; ar: string; en: string }[]
                ).map((f) => {
                  const active = navPickerFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setNavPickerFilter(f.id);
                        if (f.id === 'samsung') {
                          onUpdateProfile({
                            sectionIconStyles: { ...currentSectionStyles, nav: 'samsung' },
                          });
                        } else if (f.id === 'colored') {
                          onUpdateProfile({
                            sectionIconStyles: { ...currentSectionStyles, nav: 'colored_badge' },
                          });
                        } else if (f.id === 'mono') {
                          onUpdateProfile({
                            sectionIconStyles: { ...currentSectionStyles, nav: 'mono_outline' },
                          });
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                        active
                          ? `${theme.accentBg} text-white`
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isAr ? f.ar : f.en}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-5 gap-1.5 max-h-56 overflow-y-auto pt-1 p-0.5">
                {visibleNavIcons.map((item) => {
                  const selected = currentNavIcons[editingNavTab] === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      title={isAr ? item.labelAr : item.labelEn}
                      aria-label={isAr ? item.labelAr : item.labelEn}
                      onClick={() => {
                        const updated: NavIconsConfig = {
                          ...currentNavIcons,
                          [editingNavTab]: item.key as NavIconKey,
                        };
                        onUpdateProfile({ navIcons: updated });
                        if (navSoundEnabled) playNavigationSound('tap');
                      }}
                      className={`p-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        selected
                          ? `${theme.accentBorder} bg-white dark:bg-slate-900 shadow-xs scale-[1.04]`
                          : 'border-transparent bg-white/70 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900'
                      }`}
                    >
                      <AppIcon
                        kind="nav"
                        name={item.key}
                        styleId={previewNavStyleForGrid}
                        sizePx={22}
                        theme={theme}
                        active={selected}
                      />
                      <span className="text-[9px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-full">
                        {isAr ? item.labelAr : item.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Internal Colorful 3D Pixar-Style Wallet Icons (5 InstaPay + 5 Vodafone Cash + 5 Cash) */}
            <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {isAr
                      ? 'أيقونات المحافظ الداخلية (الأصلي + 5 تصاميم لكل محفظة)'
                      : 'Internal Wallet Icons (Official + 5 Designs Each)'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? '6 لإنستا باي · 6 لفودافون كاش · 6 للكاش (18 شكل)'
                      : '6 InstaPay · 6 Vodafone Cash · 6 Cash (18 total)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateProfile({ walletIcons: { ...DEFAULT_WALLET_ICONS } });
                    if (navSoundEnabled) playNavigationSound('tap');
                    showToast(
                      isAr ? 'تمت استعادة أيقونات المحافظ الافتراضية' : 'Default wallet icons restored'
                    );
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isAr ? 'الافتراضي' : 'Reset'}</span>
                </button>
              </div>

              {/* 3 Wallet Tabs */}
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { key: 'instapay', ar: 'إنستا باي', en: 'InstaPay' },
                    { key: 'vodafone_cash', ar: 'فودافون كاش', en: 'Vodafone' },
                    { key: 'cash', ar: 'كاش', en: 'Cash' },
                  ] as { key: BuiltinWalletType; ar: string; en: string }[]
                ).map((wt) => {
                  const active = editingWalletIconType === wt.key;
                  return (
                    <button
                      key={wt.key}
                      type="button"
                      onClick={() => setEditingWalletIconType(wt.key)}
                      className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        active
                          ? `${theme.accentBorder} bg-white dark:bg-slate-900 shadow-xs`
                          : 'border-transparent bg-white/60 dark:bg-slate-900/40 text-slate-500'
                      }`}
                    >
                      <WalletLogo
                        type={wt.key}
                        iconId={currentWalletIcons[wt.key]}
                        size={28}
                      />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-full">
                        {isAr ? wt.ar : wt.en}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 6 Options (Official Original + 5 Additional Designs) for Active Wallet */}
              <div className="grid grid-cols-3 gap-2">
                {WALLET_ICON_OPTIONS.filter((opt) => opt.walletType === editingWalletIconType).map(
                  (opt) => {
                    const selected = currentWalletIcons[editingWalletIconType] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onUpdateProfile({
                            walletIcons: {
                              ...currentWalletIcons,
                              [editingWalletIconType]: opt.id,
                            },
                          });
                          if (navSoundEnabled) playNavigationSound('tap');
                          showToast(
                            isAr
                              ? `أيقونة المحفظة: ${opt.labelAr}`
                              : `Wallet icon: ${opt.labelEn}`
                          );
                        }}
                        className={`relative p-2.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                          selected
                            ? `${theme.accentBorder} bg-white dark:bg-slate-900 shadow-xs scale-[1.03]`
                            : 'border-transparent bg-white/70 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900'
                        }`}
                      >
                        {opt.isOfficial && (
                          <span className="absolute top-1.5 start-1.5 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[8px] font-bold leading-none">
                            {isAr ? 'الأصلي' : 'Official'}
                          </span>
                        )}
                        {selected && (
                          <span
                            className={`absolute top-1.5 end-1.5 w-3.5 h-3.5 rounded-full ${theme.accentBg} text-white flex items-center justify-center`}
                          >
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                        <WalletLogo type={editingWalletIconType} iconId={opt.id} size={44} />
                        <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 text-center leading-tight truncate max-w-full">
                          {isAr ? opt.labelAr : opt.labelEn}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* External Phone App Icon Picker (16 Samsung Chip-Style Icons Preserving Original App Icon Shape) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {isAr
                      ? `أيقونة البرنامج الخارجية (${APP_ICON_OPTIONS.length} شريحة سامسونج)`
                      : `Phone App Icon (${APP_ICON_OPTIONS.length} Samsung Chip Icons)`}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? 'نمط شريحة سامسونج مع الحفاظ على الشكل الأصلي لأيقونة التطبيق'
                      : 'Samsung chip style preserving the original Moamen wallet icon shape'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateProfile({ autoAppIconByTheme: !autoAppIconByTheme })
                  }
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold cursor-pointer shrink-0 transition-colors ${
                    autoAppIconByTheme
                      ? `${theme.accentBg} text-white`
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {autoAppIconByTheme
                    ? isAr
                      ? 'حسب المظهر ✓'
                      : 'Auto Theme ✓'
                    : isAr
                    ? 'حسب المظهر'
                    : 'Auto Theme'}
                </button>
              </div>

              {/* Samsung Icon Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {APP_ICON_CATEGORIES.map((cat) => {
                  const active = appIconCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setAppIconCategory(cat.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                        active
                          ? `${theme.accentBg} text-white`
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {isAr ? cat.labelAr : cat.labelEn}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {visibleAppIcons.map((opt) => {
                  const selected = effectiveAppIconId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onUpdateProfile({ appIconId: opt.id, autoAppIconByTheme: false });
                        if (navSoundEnabled) playNavigationSound('tap');
                        showToast(
                          isAr
                            ? `تم اختيار أيقونة "${opt.labelAr}" للتطبيق`
                            : `App icon set to "${opt.labelEn}"`
                        );
                      }}
                      className={`p-2 rounded-2xl border-2 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        selected
                          ? `${theme.accentBorder} bg-slate-50 dark:bg-slate-800 shadow-xs scale-[1.03]`
                          : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span
                        className={`w-12 h-12 rounded-[26%] overflow-hidden shadow-xs block shrink-0 ${
                          opt.isLightBg ? 'border border-slate-200/80 dark:border-slate-700' : ''
                        }`}
                        style={{ backgroundColor: opt.bgHex }}
                      >
                        <img
                          src={opt.src}
                          alt={isAr ? opt.labelAr : opt.labelEn}
                          className="w-full h-full object-cover block"
                        />
                      </span>
                      <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight">
                        {isAr ? opt.labelAr : opt.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
          )}

          {/* Folder 6: Direct Email or Phone Number Backup ONLY (No Login, No Password) + Local Files */}
          {openFolder === 'backup' && (
          <section className="space-y-3">

            {backupError && (
              <div
                role="alert"
                className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-xl p-3"
              >
                {backupError}
              </div>
            )}

            {backupContact && !editingContact ? (
              <div className="space-y-3">
                <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900 rounded-2xl p-3.5 flex items-center gap-3">
                  <CloudCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {isAr ? 'النسخ الاحتياطي مفعّل على:' : 'Cloud Backup Active For:'}
                      </p>
                      {backupPinProtected && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{isAr ? 'محمي برمز سري' : 'PIN Locked'}</span>
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate mt-0.5 flex items-center gap-1.5"
                      dir="ltr"
                    >
                      {backupContact.includes('@') ? (
                        <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                      <span className="truncate">{backupContact}</span>
                    </p>
                    {formattedLastBackup && (
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {isAr ? `آخر نسخة احتياطية: ${formattedLastBackup}` : `Last backup: ${formattedLastBackup}`}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setContactInput(backupContact);
                      setPinInput('');
                      setShowPin(false);
                      setEditingContact(true);
                      setBackupError(null);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-white/80 dark:bg-slate-900/70 border border-emerald-200 dark:border-emerald-800 rounded-lg cursor-pointer shrink-0"
                  >
                    {isAr ? 'تغيير' : 'Change'}
                  </button>
                </div>

                {!backupPinProtected && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 flex items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        {isAr ? 'أضف رمزاً سرياً لحماية نسختك' : 'Add a Secret PIN to Lock Your Backup'}
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 leading-snug">
                        {isAr
                          ? 'حتى لا يتمكن أي شخص يعرف رقم هاتفك من استعادة بياناتك.'
                          : 'Prevents anyone who knows your phone number from restoring your data.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setContactInput(backupContact);
                        setPinInput('');
                        setShowPin(false);
                        setEditingContact(true);
                        setBackupError(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      {isAr ? 'تأمين الآن' : 'Lock Now'}
                    </button>
                  </div>
                )}

                {/* Automatic Backup Toggle */}
                <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-3.5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {isAr ? 'النسخ الاحتياطي التلقائي' : 'Automatic Backup'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAr
                        ? 'حفظ نسخة احتياطية تلقائياً فور أي تعديل بدون تسجيل دخول'
                        : 'Automatically save backups whenever you make changes'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleAutoBackup(!autoBackupEnabled)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                      autoBackupEnabled
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {autoBackupEnabled ? (isAr ? 'مفعّل' : 'On') : isAr ? 'متوقف' : 'Off'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={backupBusy}
                    onClick={handleManualBackup}
                    className={`min-h-[44px] px-3 text-xs font-semibold text-white ${theme.accentBg} ${theme.accentBgHover} disabled:opacity-60 rounded-xl flex items-center justify-center gap-2 cursor-pointer`}
                  >
                    <AppIcon
                      kind="ui"
                      name="cloud_backup"
                      styleId={settingsIconStyle}
                      sizePx={18}
                      theme={theme}
                    />
                    <span>
                      {backupBusy
                        ? isAr
                          ? 'جاري الحفظ...'
                          : 'Saving...'
                        : isAr
                        ? 'نسخ احتياطي الآن'
                        : 'Backup Now'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={backupBusy}
                    onClick={handleCloudRestore}
                    className="min-h-[44px] px-3 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-60 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <AppIcon
                      kind="ui"
                      name="cloud_restore"
                      styleId={settingsIconStyle}
                      sizePx={18}
                      theme={theme}
                    />
                    <span>{isAr ? 'استعادة النسخة' : 'Restore Backup'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AppIcon
                    kind="ui"
                    name="cloud_backup"
                    styleId={settingsIconStyle}
                    sizePx={30}
                    theme={theme}
                  />
                  <div className="space-y-0.5 flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {isAr
                        ? 'نسخ احتياطي محمي برقم الهاتف + رمز سري'
                        : 'PIN-Protected Cloud Backup'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {isAr
                        ? 'أدخل رقم هاتفك أو بريدك الإلكتروني مع رمز سري تختاره أنت (4 أرقام أو أحرف على الأقل). لا يمكن لأي شخص استعادة بياناتك بدون معرفة الاثنين معاً.'
                        : 'Enter your phone number or email plus a secret backup PIN (at least 4 digits/chars). Nobody can restore your data without knowing both.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <input
                    type="text"
                    name="backup-vault-contact"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    inputMode="email"
                    dir="ltr"
                    value={contactInput}
                    onChange={(e) => setContactInput(e.target.value)}
                    placeholder={
                      isAr ? 'أدخل رقم الهاتف أو البريد الإلكتروني' : 'Enter phone number or email'
                    }
                    className="w-full h-11 px-3.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />

                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3.5 pointer-events-none" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      name="backup-vault-pin"
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      dir="ltr"
                      maxLength={32}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Enter' &&
                          contactInput.trim() &&
                          pinInput.trim().length >= 4 &&
                          !savingContact &&
                          !backupBusy
                        ) {
                          handleSaveBackupContactSubmit();
                        }
                      }}
                      placeholder={
                        isAr ? 'الرمز السري للنسخ الاحتياطي (4 أرقام أو أكثر)' : 'Secret Backup PIN (4+ digits/chars)'
                      }
                      className="w-full h-11 pl-10 pr-11 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((v) => !v)}
                      aria-label={showPin ? (isAr ? 'إخفاء الرمز' : 'Hide PIN') : isAr ? 'إظهار الرمز' : 'Show PIN'}
                      className="absolute top-1/2 -translate-y-1/2 right-2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={
                        savingContact ||
                        backupBusy ||
                        !contactInput.trim() ||
                        pinInput.trim().length < 4
                      }
                      onClick={handleSaveBackupContactSubmit}
                      className={`flex-1 h-11 px-4 text-xs font-bold text-white ${theme.accentBg} ${theme.accentBgHover} disabled:opacity-50 rounded-xl cursor-pointer transition-colors`}
                    >
                      {savingContact || backupBusy
                        ? isAr
                          ? 'جاري تأمين وحفظ النسخة...'
                          : 'Securing & Saving Backup...'
                        : isAr
                        ? 'حفظ وتفعيل النسخ المحمي'
                        : 'Save & Lock Backup'}
                    </button>
                    {editingContact && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingContact(false);
                          setContactInput(backupContact || '');
                          setPinInput('');
                          setShowPin(false);
                          setBackupError(null);
                        }}
                        className="h-11 px-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
                      >
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {restoreMsg && (
              <div className="bg-slate-100 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded-xl p-3">
                {restoreMsg}
              </div>
            )}

            <input
              ref={backupInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleBackupRestore}
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => exportFullBackupJSON(profile, debts, wallets)}
                className="min-h-[44px] px-3 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <AppIcon
                  kind="ui"
                  name="export_json"
                  styleId={settingsIconStyle}
                  sizePx={18}
                  theme={theme}
                />
                <span>{isAr ? 'تصدير نسخة' : 'Export JSON'}</span>
              </button>

              <button
                type="button"
                disabled={restoring}
                onClick={() => backupInputRef.current?.click()}
                className="min-h-[44px] px-3 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <AppIcon
                  kind="ui"
                  name="import_json"
                  styleId={settingsIconStyle}
                  sizePx={18}
                  theme={theme}
                />
                <span>{restoring ? '...' : isAr ? 'استرجاع ملف' : 'Restore File'}</span>
              </button>

              <button
                type="button"
                onClick={() => exportDebtsToCSV(debts)}
                className="min-h-[44px] px-3 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <AppIcon
                  kind="ui"
                  name="excel"
                  styleId={settingsIconStyle}
                  sizePx={18}
                  theme={theme}
                />
                <span>{isAr ? 'ملف Excel' : 'Export CSV'}</span>
              </button>
            </div>
          </section>
          )}

          {/* Remove Backup Contact & PWA Install */}
          {openFolder === 'backup' && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <PWAInstallButton lang={lang} theme={theme} />
            {backupContact && (
              <button
                type="button"
                onClick={() => {
                  onDisconnectBackupContact();
                  setContactInput('');
                  setEditingContact(false);
                  showToast(isAr ? 'تم إيقاف النسخ الاحتياطي السحابي' : 'Cloud backup removed');
                }}
                className="w-full h-11 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isAr ? 'إزالة رقم / بريد النسخ الاحتياطي' : 'Remove Backup Phone / Email'}</span>
              </button>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
