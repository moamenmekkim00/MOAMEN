import { MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { resolveAvatarSrc } from './data/avatars';
import {
  applyExternalAppIcon,
  applyRefreshRate,
  AppPageKey,
  DEFAULT_NAV_ICONS,
  getAppIconSrc,
  getAvatarSizeConfig,
  getIconSizeConfig,
  getRefreshRateConfig,
  getStatusColorConfig,
  getThemeMatchedAppIconId,
  NavIconsConfig,
  normalizeAppIconId,
  PageCustomSettings,
  PersonAlertLevel,
  playNavigationSound,
  resolvePageCustomConfig,
  resolveSectionIconStyle,
  sanitizeAnyWalletIconId,
  sanitizeNotificationSettings,
  sanitizePersonAlertLevel,
  sanitizeRefreshRateHz,
  sanitizeWalletIcons,
  syncSystemBars,
  WalletIconId,
} from './data/customization';
import {
  getWallpaperBaseStyle,
  getWallpaperPatternStyle,
  resolvePageWallpaper,
  sanitizeWallpaperId,
} from './data/wallpapers';
import { STRINGS, ThemeId, THEMES } from './data/themes';
import {
  derivePinProtectedVaultId,
  normalizeBackupContact,
  normalizeCurrency,
  parseBackupJSONToState,
  pullBackupVaultFromCloud,
  pushBackupVaultToCloud,
  sanitizeDebtInput,
} from './services/debtService';
import {
  generateLocalId,
  loadLocalState,
  LocalAppState,
  saveLocalState,
} from './services/localStore';
import {
  FullScreenAlertEventDetail,
  syncScheduledDueNotifications,
} from './services/notificationService';
import {
  ChargeInput,
  ChargeRecord,
  DebtInput,
  DebtRecord,
  deriveDebtStatus,
  FIELD_LIMITS,
  isBuiltinWalletType,
  PaymentInput,
  PaymentRecord,
  roundMoney,
  UserProfile,
  WalletRecord,
  WalletTransaction,
  WalletTxType,
  WalletType,
} from './types/debt';
import { PeoplePageView } from './components/PeoplePageView';
import { WalletsView } from './components/WalletsView';
import { PersonModal } from './components/PersonModal';
import { PersonDetailSheet } from './components/PersonDetailSheet';
import { PaymentModal } from './components/PaymentModal';
import { ChargeModal } from './components/ChargeModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { SettingsModal } from './components/SettingsModal';
import { PageSettingsSheet } from './components/PageSettingsSheet';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';
import { FullScreenAlertOverlay } from './components/FullScreenAlertOverlay';
import { AppIcon } from './components/AppIcon';

type AppTab = AppPageKey;

function getPhonePrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function App() {
  const [appState, setAppState] = useState<LocalAppState>(() => loadLocalState());
  const stateRef = useRef<LocalAppState>(appState);
  stateRef.current = appState;

  const [phoneIsDark, setPhoneIsDark] = useState<boolean>(() => getPhonePrefersDark());
  const [backupBusy, setBackupBusy] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const autoBackupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>('receivables');

  // Modals
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtRecord | null>(null);
  const [detailDebtId, setDetailDebtId] = useState<string | null>(null);
  const [paymentDebt, setPaymentDebt] = useState<DebtRecord | null>(null);
  const [chargeDebt, setChargeDebt] = useState<DebtRecord | null>(null);
  const [deletingDebt, setDeletingDebt] = useState<DebtRecord | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingPageSettings, setEditingPageSettings] = useState<AppPageKey | null>(null);
  const [fullScreenAlert, setFullScreenAlert] = useState<FullScreenAlertEventDetail | null>(null);

  const {
    profile,
    debts,
    paymentsByDebt,
    chargesByDebt,
    wallets,
    walletTxs,
    backupContact,
    backupVaultKey,
    autoBackupEnabled,
    lastBackupAt,
  } = appState;
  const detailDebt = detailDebtId ? debts.find((d) => d.id === detailDebtId) || null : null;

  const lang = profile.language || 'ar';
  const effectiveThemeId: ThemeId = profile.followPhoneTheme
    ? phoneIsDark
      ? 'dark'
      : profile.theme === 'dark'
      ? 'mint'
      : profile.theme || 'mint'
    : profile.theme || 'mint';
  const theme = THEMES[effectiveThemeId];
  const t = STRINGS[lang];
  const iconCfg = getIconSizeConfig(profile.iconSize);
  const navBarCfg = getIconSizeConfig(profile.navIconSize ?? profile.iconSize);
  const profileAvatarCfg = getAvatarSizeConfig(profile.profileAvatarSize ?? profile.avatarSize);
  const statusColorCfg = getStatusColorConfig(profile.statusColor);
  const refreshRateCfg = getRefreshRateConfig(profile.refreshRateHz);
  const notificationSettings = sanitizeNotificationSettings(profile.notificationSettings);
  const hideAmounts = Boolean(profile.hideAmounts);
  const showPrivacyToggle = profile.showPrivacyToggle !== false;
  const hideWalletAmounts = Boolean(profile.hideWalletAmounts);
  const showWalletPrivacyToggle = profile.showWalletPrivacyToggle !== false;
  const walletIcons = sanitizeWalletIcons(profile.walletIcons);
  const activeWallpaper = resolvePageWallpaper(
    profile.wallpaperId,
    profile.pageSettings?.[activeTab]?.wallpaperId
  );
  const hasWallpaper = activeWallpaper.id !== 'none';
  const wallpaperIsDark = hasWallpaper && activeWallpaper.isDark;
  const refreshRateCfgRef = useRef(refreshRateCfg);
  refreshRateCfgRef.current = refreshRateCfg;

  const navIconStyle = resolveSectionIconStyle(profile.iconStyle, profile.sectionIconStyles, 'nav');
  const headerIconStyle = resolveSectionIconStyle(profile.iconStyle, profile.sectionIconStyles, 'header');
  const peopleIconStyle = resolveSectionIconStyle(profile.iconStyle, profile.sectionIconStyles, 'people');
  const walletsIconStyle = resolveSectionIconStyle(profile.iconStyle, profile.sectionIconStyles, 'wallets');
  const settingsIconStyle = resolveSectionIconStyle(profile.iconStyle, profile.sectionIconStyles, 'settings');

  // Independent per-page custom settings (size, icon size, image size, icon style)
  const receivablesCfg = resolvePageCustomConfig(
    'receivables',
    profile.iconSize,
    profile.avatarSize,
    peopleIconStyle,
    profile.pageSettings
  );
  const payablesCfg = resolvePageCustomConfig(
    'payables',
    profile.iconSize,
    profile.avatarSize,
    peopleIconStyle,
    profile.pageSettings
  );
  const walletsCfg = resolvePageCustomConfig(
    'wallets',
    profile.iconSize,
    profile.walletImageSize ?? profile.avatarSize,
    walletsIconStyle,
    profile.pageSettings
  );
  const activePeopleCfg = activeTab === 'payables' ? payablesCfg : receivablesCfg;

  const effectiveAppIconId = profile.autoAppIconByTheme
    ? getThemeMatchedAppIconId(effectiveThemeId)
    : normalizeAppIconId(profile.appIconId);

  const navIcons: NavIconsConfig = {
    ...DEFAULT_NAV_ICONS,
    ...(profile.navIcons || {}),
  };

  const visualTabs: AppTab[] =
    lang === 'ar'
      ? ['wallets', 'payables', 'receivables']
      : ['receivables', 'payables', 'wallets'];
  const activeVisualIdx = Math.max(0, visualTabs.indexOf(activeTab));

  const swipeContainerRef = useRef<HTMLDivElement | null>(null);
  const pagerViewportRef = useRef<HTMLDivElement | null>(null);
  const [swipeOffsetPx, setSwipeOffsetPx] = useState(0);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);

  const gestureRef = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    startTime: number;
    axis: 'x' | 'y' | null;
    active: boolean;
  }>({
    startX: 0,
    startY: 0,
    lastX: 0,
    startTime: 0,
    axis: null,
    active: false,
  });
  const suppressNextClickRef = useRef(false);

  const anyModalOpen =
    personModalOpen ||
    Boolean(detailDebtId) ||
    Boolean(paymentDebt) ||
    Boolean(chargeDebt) ||
    Boolean(deletingDebt) ||
    settingsOpen ||
    Boolean(editingPageSettings) ||
    Boolean(fullScreenAlert);

  const tabHistoryRef = useRef<AppTab[]>(['receivables']);
  const anyModalOpenRef = useRef(anyModalOpen);
  anyModalOpenRef.current = anyModalOpen;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const activeVisualIdxRef = useRef(activeVisualIdx);
  activeVisualIdxRef.current = activeVisualIdx;
  const visualTabsRef = useRef(visualTabs);
  visualTabsRef.current = visualTabs;
  const navSoundEnabledRef = useRef(profile.navSoundEnabled !== false);
  navSoundEnabledRef.current = profile.navSoundEnabled !== false;

  const modalStateRef = useRef({
    deletingDebt,
    paymentDebt,
    chargeDebt,
    personModalOpen,
    editingPageSettings,
    detailDebtId,
    settingsOpen,
  });
  modalStateRef.current = {
    deletingDebt,
    paymentDebt,
    chargeDebt,
    personModalOpen,
    editingPageSettings,
    detailDebtId,
    settingsOpen,
  };

  const pushPhoneHistory = useCallback(() => {
    if (typeof window === 'undefined' || !window.history?.pushState) return;
    try {
      window.history.pushState({ moamenNav: true }, '');
    } catch {
      // Ignore history restrictions in sandboxed webviews
    }
  }, []);

  const navigateToTab = useCallback(
    (nextTab: AppTab, soundDir: 'next' | 'prev' | 'tap' = 'tap', fromBack = false) => {
      setActiveTab((prev) => {
        if (prev === nextTab) return prev;
        if (navSoundEnabledRef.current) {
          playNavigationSound(soundDir);
        }
        if (!fromBack) {
          const hist = tabHistoryRef.current;
          if (hist[hist.length - 1] !== nextTab) {
            tabHistoryRef.current = [...hist.slice(-19), nextTab];
          }
          pushPhoneHistory();
        }
        if (typeof window !== 'undefined' && window.scrollY > 100) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return nextTab;
      });
    },
    [pushPhoneHistory]
  );

  const handlePhoneBack = useCallback((): boolean => {
    // 1. Let nested view modals (e.g. WalletsView Add/Withdraw/Delete dialogs) close first
    if (typeof window !== 'undefined') {
      const ev = new CustomEvent('moamen:back', { cancelable: true });
      window.dispatchEvent(ev);
      if (ev.defaultPrevented) {
        if (navSoundEnabledRef.current) playNavigationSound('prev');
        return true;
      }
    }

    // 2. Close top-most open modal/sheet in exact stack order
    const m = modalStateRef.current;
    if (m.deletingDebt) {
      setDeletingDebt(null);
      if (navSoundEnabledRef.current) playNavigationSound('prev');
      return true;
    }
    if (m.paymentDebt) {
      setPaymentDebt(null);
      if (navSoundEnabledRef.current) playNavigationSound('prev');
      return true;
    }
    if (m.chargeDebt) {
      setChargeDebt(null);
      if (navSoundEnabledRef.current) playNavigationSound('prev');
      return true;
    }
    if (m.personModalOpen) {
      setPersonModalOpen(false);
      setEditingDebt(null);
      if (navSoundEnabledRef.current) playNavigationSound('prev');
      return true;
    }
    if (m.editingPageSettings) {
      setEditingPageSettings(null);
      if (navSoundEnabledRef.current) playNavigationSound('prev');
      return true;
    }
    if (m.detailDebtId) {
      setDetailDebtId(null);
      if (navSoundEnabledRef.current) playNavigationSound('prev');
      return true;
    }
    if (m.settingsOpen) {
      setSettingsOpen(false);
      if (navSoundEnabledRef.current) playNavigationSound('prev');
      return true;
    }

    // 3. Step back through visited tab history, or back to home tab ('receivables')
    const hist = tabHistoryRef.current;
    if (hist.length > 1) {
      hist.pop();
      const prevTab = hist[hist.length - 1];
      if (prevTab && prevTab !== activeTabRef.current) {
        navigateToTab(prevTab, 'prev', true);
        return true;
      }
    }
    if (activeTabRef.current !== 'receivables') {
      tabHistoryRef.current = ['receivables'];
      navigateToTab('receivables', 'prev', true);
      return true;
    }

    return false;
  }, [navigateToTab]);

  // Push a browser history entry whenever a modal layer opens so browser/phone edge-back pops inside the app
  const openModalLayerCount =
    Number(Boolean(deletingDebt)) +
    Number(Boolean(paymentDebt)) +
    Number(Boolean(chargeDebt)) +
    Number(personModalOpen) +
    Number(Boolean(editingPageSettings)) +
    Number(Boolean(detailDebtId)) +
    Number(settingsOpen);
  const prevModalLayerCountRef = useRef(0);

  useEffect(() => {
    if (openModalLayerCount > prevModalLayerCountRef.current) {
      pushPhoneHistory();
    }
    prevModalLayerCountRef.current = openModalLayerCount;
  }, [openModalLayerCount, pushPhoneHistory]);

  // Wire global native Android back hook + browser popstate back gesture
  useEffect(() => {
    const win = window as unknown as { __moamenHandleBack?: () => boolean };
    win.__moamenHandleBack = handlePhoneBack;

    const onPopState = () => {
      handlePhoneBack();
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      if (win.__moamenHandleBack === handlePhoneBack) {
        delete win.__moamenHandleBack;
      }
    };
  }, [handlePhoneBack]);

  const stepVisualTab = useCallback(
    (delta: -1 | 1) => {
      const tabs = visualTabsRef.current;
      const curIdx = activeVisualIdxRef.current;
      const nextIdx = curIdx + delta;
      if (nextIdx < 0 || nextIdx >= tabs.length) return;
      navigateToTab(tabs[nextIdx], delta > 0 ? 'next' : 'prev');
    },
    [navigateToTab]
  );

  function hasHorizontalScrollableAncestor(
    target: EventTarget | null,
    boundary: HTMLElement | null
  ): boolean {
    let el = target instanceof HTMLElement ? target : null;
    while (el && el !== boundary) {
      if (el.scrollWidth > el.clientWidth + 4) {
        const style = window.getComputedStyle(el);
        if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
          return true;
        }
      }
      el = el.parentElement;
    }
    return false;
  }

  function isSwipeTargetBlocked(target: EventTarget | null): boolean {
    if (anyModalOpenRef.current) return true;
    if (typeof document !== 'undefined' && document.querySelector('[role="dialog"]')) {
      return true;
    }
    const el = target instanceof HTMLElement ? target : null;
    if (!el) return false;
    if (el.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [data-no-swipe]')) {
      return true;
    }
    return hasHorizontalScrollableAncestor(el, swipeContainerRef.current);
  }

  function computeDampedOffset(rawDx: number, curIdx: number, totalTabs: number): number {
    const atLeftEdge = curIdx === 0 && rawDx > 0;
    const atRightEdge = curIdx === totalTabs - 1 && rawDx < 0;
    if (atLeftEdge || atRightEdge) {
      return Math.round(rawDx * 0.26);
    }
    const maxDrag = (pagerViewportRef.current?.clientWidth || window.innerWidth || 380) * 0.92;
    return Math.max(-maxDrag, Math.min(maxDrag, rawDx));
  }

  function finishHorizontalGesture(rawDx: number, elapsedMs: number) {
    const width = pagerViewportRef.current?.clientWidth || window.innerWidth || 360;
    const rr = refreshRateCfgRef.current;
    const threshold = Math.min(width * rr.swipeThresholdRatio, rr.swipeMinPx + 14);
    const velocity = Math.abs(rawDx) / Math.max(1, elapsedMs);
    const shouldSwitch = Math.abs(rawDx) >= threshold || (velocity >= 0.3 && Math.abs(rawDx) >= 20);

    if (shouldSwitch) {
      // Dragging right (rawDx > 0) reveals the visual-left tab (index - 1)
      // Dragging left (rawDx < 0) reveals the visual-right tab (index + 1)
      stepVisualTab(rawDx > 0 ? -1 : 1);
    }
    setSwipeOffsetPx(0);
    setIsDraggingHorizontal(false);
  }

  // Native touch listeners with passive:false on touchmove for crisp horizontal lock & zero jitter
  useEffect(() => {
    const el = swipeContainerRef.current;
    if (!el) return;

    const onTouchStart = (e: globalThis.TouchEvent) => {
      if (e.touches.length !== 1 || isSwipeTargetBlocked(e.target)) {
        gestureRef.current.active = false;
        return;
      }
      const touch = e.touches[0];
      gestureRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        startTime: Date.now(),
        axis: null,
        active: true,
      };
    };

    const onTouchMove = (e: globalThis.TouchEvent) => {
      const g = gestureRef.current;
      if (!g.active || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const dx = touch.clientX - g.startX;
      const dy = touch.clientY - g.startY;

      if (g.axis === null) {
        if (Math.hypot(dx, dy) < 12) return;
        if (Math.abs(dx) > Math.abs(dy) * 1.35) {
          g.axis = 'x';
          setIsDraggingHorizontal(true);
        } else {
          g.axis = 'y';
          g.active = false;
          return;
        }
      }

      if (g.axis === 'x') {
        if (e.cancelable) e.preventDefault();
        g.lastX = touch.clientX;
        const damped = computeDampedOffset(
          dx,
          activeVisualIdxRef.current,
          visualTabsRef.current.length
        );
        setSwipeOffsetPx(damped);
      }
    };

    const onTouchEndOrCancel = () => {
      const g = gestureRef.current;
      if (!g.active) return;
      const wasHorizontal = g.axis === 'x';
      const rawDx = g.lastX - g.startX;
      const elapsed = Date.now() - g.startTime;
      g.active = false;
      g.axis = null;

      if (wasHorizontal) {
        finishHorizontalGesture(rawDx, elapsed);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEndOrCancel, { passive: true });
    el.addEventListener('touchcancel', onTouchEndOrCancel, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEndOrCancel);
      el.removeEventListener('touchcancel', onTouchEndOrCancel);
    };
  }, [stepVisualTab]);

  // Desktop mouse horizontal swipe support
  function handleMouseDown(e: ReactMouseEvent<HTMLDivElement>) {
    if (e.button !== 0 || isSwipeTargetBlocked(e.target)) return;
    const targetEl = e.target instanceof HTMLElement ? e.target : null;
    if (targetEl?.closest('button, a, label')) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startTime = Date.now();
    let lastX = startX;
    let axis: 'x' | 'y' | null = null;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (axis === null) {
        if (Math.hypot(dx, dy) < 16) return;
        if (Math.abs(dx) > Math.abs(dy) * 1.4) {
          axis = 'x';
          setIsDraggingHorizontal(true);
        } else {
          axis = 'y';
          cleanup();
          return;
        }
      }
      if (axis === 'x') {
        lastX = moveEvent.clientX;
        const damped = computeDampedOffset(
          dx,
          activeVisualIdxRef.current,
          visualTabsRef.current.length
        );
        setSwipeOffsetPx(damped);
      }
    };

    const onMouseUp = () => {
      cleanup();
      if (axis === 'x') {
        const rawDx = lastX - startX;
        if (Math.abs(rawDx) > 18) {
          suppressNextClickRef.current = true;
          setTimeout(() => {
            suppressNextClickRef.current = false;
          }, 80);
        }
        finishHorizontalGesture(rawDx, Date.now() - startTime);
      }
    };

    const cleanup = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function handleClickCapture(e: ReactMouseEvent<HTMLDivElement>) {
    if (suppressNextClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressNextClickRef.current = false;
    }
  }

  // Keyboard Left/Right arrow navigation between pages
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (anyModalOpenRef.current || document.querySelector('[role="dialog"]')) return;
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        stepVisualTab(-1);
      } else if (e.key === 'ArrowRight') {
        stepVisualTab(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stepVisualTab]);

  function commitState(updater: (prev: LocalAppState) => LocalAppState): LocalAppState {
    const next = updater(stateRef.current);
    stateRef.current = next;
    saveLocalState(next);
    setAppState(next);
    return next;
  }

  function markBackupDone() {
    commitState((prev) => ({
      ...prev,
      lastBackupAt: new Date().toISOString(),
    }));
  }

  // Track phone system dark/light appearance changes
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setPhoneIsDark(e.matches);
    setPhoneIsDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Sync HTML dir, lang, Tailwind v4 .dark class, and Android/browser status bar color
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.classList.toggle('dark', theme.isDark);
    const barColor = hasWallpaper ? activeWallpaper.baseColor : theme.bgHex;
    const isLightBar = hasWallpaper ? !activeWallpaper.isDark : !theme.isDark;
    document.body.style.backgroundColor = barColor;
    syncSystemBars(barColor, isLightBar);
  }, [lang, theme.isDark, theme.bgHex, hasWallpaper, activeWallpaper.baseColor, activeWallpaper.isDark]);

  // Keep browser favicon / apple-touch-icon synced with effective app icon (manual or theme-synced)
  useEffect(() => {
    applyExternalAppIcon(effectiveAppIconId, Boolean(profile.autoAppIconByTheme));
  }, [effectiveAppIconId, profile.autoAppIconByTheme]);

  // Apply 60 / 90 / 120 Hz motion tokens & native Android refresh rate
  useEffect(() => {
    applyRefreshRate(refreshRateCfg.hz);
  }, [refreshRateCfg.hz]);

  // Sync scheduled phone due-date alarms (Native Android AlarmManager + Web/PWA notifications)
  useEffect(() => {
    syncScheduledDueNotifications(debts, notificationSettings, lang);
    const runSync = () => {
      syncScheduledDueNotifications(
        stateRef.current.debts,
        sanitizeNotificationSettings(stateRef.current.profile.notificationSettings),
        stateRef.current.profile.language || 'ar'
      );
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        runSync();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    const heartbeat = notificationSettings.enabled
      ? window.setInterval(runSync, 60_000)
      : null;
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (heartbeat !== null) window.clearInterval(heartbeat);
    };
  }, [debts, notificationSettings, lang]);

  // Listen for optional full-screen payment-due alerts
  useEffect(() => {
    const onFullScreenAlert = (ev: Event) => {
      const detail = (ev as CustomEvent<FullScreenAlertEventDetail>).detail;
      if (detail?.title) {
        setFullScreenAlert(detail);
      }
    };
    window.addEventListener('moamen:fullscreen-alert', onFullScreenAlert);
    return () => window.removeEventListener('moamen:fullscreen-alert', onFullScreenAlert);
  }, []);

  // Clean up pending debounced auto-backup timer on unmount
  useEffect(() => {
    return () => {
      if (autoBackupTimerRef.current) {
        clearTimeout(autoBackupTimerRef.current);
      }
    };
  }, []);

  function scheduleAutoBackup() {
    const contact = stateRef.current.backupContact;
    if (!contact || !stateRef.current.autoBackupEnabled) return;

    if (autoBackupTimerRef.current) {
      clearTimeout(autoBackupTimerRef.current);
    }

    autoBackupTimerRef.current = setTimeout(() => {
      autoBackupTimerRef.current = null;
      const latest = stateRef.current;
      if (!latest.backupContact || !latest.autoBackupEnabled) return;
      const targetKey = latest.backupVaultKey || latest.backupContact;
      const isDerived = Boolean(latest.backupVaultKey);
      pushBackupVaultToCloud(targetKey, latest, isDerived)
        .then(() => {
          setDataError(null);
          markBackupDone();
        })
        .catch((err) => {
          console.error('Auto backup sync error:', err);
        });
    }, 700);
  }

  async function handleUpdateProfile(
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
  ) {
    commitState((prev) => {
      const updatedProfile: UserProfile = {
        ...prev.profile,
        ...patch,
        displayName:
          patch.displayName !== undefined
            ? patch.displayName.trim().slice(0, FIELD_LIMITS.displayNameMax) || 'حسابي'
            : prev.profile.displayName,
        avatarUrl:
          patch.avatarUrl !== undefined
            ? patch.avatarUrl.slice(0, FIELD_LIMITS.avatarMax)
            : prev.profile.avatarUrl,
        statusLabel:
          patch.statusLabel !== undefined
            ? patch.statusLabel.trim().slice(0, FIELD_LIMITS.statusLabelMax)
            : prev.profile.statusLabel,
        defaultCurrency:
          patch.defaultCurrency !== undefined
            ? normalizeCurrency(patch.defaultCurrency)
            : prev.profile.defaultCurrency,
        navIcons:
          patch.navIcons !== undefined
            ? { ...DEFAULT_NAV_ICONS, ...(prev.profile.navIcons || {}), ...patch.navIcons }
            : prev.profile.navIcons,
        sectionIconStyles:
          patch.sectionIconStyles !== undefined
            ? { ...(prev.profile.sectionIconStyles || {}), ...patch.sectionIconStyles }
            : prev.profile.sectionIconStyles,
        pageSettings:
          patch.pageSettings !== undefined
            ? { ...(prev.profile.pageSettings || {}), ...patch.pageSettings }
            : prev.profile.pageSettings,
        refreshRateHz:
          patch.refreshRateHz !== undefined
            ? sanitizeRefreshRateHz(patch.refreshRateHz)
            : prev.profile.refreshRateHz,
        notificationSettings:
          patch.notificationSettings !== undefined
            ? sanitizeNotificationSettings({
                ...sanitizeNotificationSettings(prev.profile.notificationSettings),
                ...patch.notificationSettings,
              })
            : prev.profile.notificationSettings,
        wallpaperId:
          patch.wallpaperId !== undefined
            ? sanitizeWallpaperId(patch.wallpaperId)
            : prev.profile.wallpaperId,
        walletIcons:
          patch.walletIcons !== undefined
            ? sanitizeWalletIcons({
                ...sanitizeWalletIcons(prev.profile.walletIcons),
                ...patch.walletIcons,
              })
            : prev.profile.walletIcons,
      };
      return { ...prev, profile: updatedProfile };
    });

    if (patch.appIconId !== undefined) {
      applyExternalAppIcon(patch.appIconId, true);
    }
    if (patch.refreshRateHz !== undefined) {
      applyRefreshRate(sanitizeRefreshRateHz(patch.refreshRateHz));
    }

    scheduleAutoBackup();
  }

  function handleToggleOutsideHideAmounts() {
    if (stateRef.current.profile.navSoundEnabled !== false) {
      playNavigationSound('tap');
    }
    commitState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        hideAmounts: !prev.profile.hideAmounts,
      },
    }));
    scheduleAutoBackup();
  }

  function handleToggleWalletHideAmounts() {
    if (stateRef.current.profile.navSoundEnabled !== false) {
      playNavigationSound('tap');
    }
    commitState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        hideWalletAmounts: !prev.profile.hideWalletAmounts,
      },
    }));
    scheduleAutoBackup();
  }

  function handleChangeWalletIcon(type: WalletType, iconId: WalletIconId) {
    if (stateRef.current.profile.navSoundEnabled !== false) {
      playNavigationSound('tap');
    }
    const safeIconId = sanitizeAnyWalletIconId(iconId);
    if (isBuiltinWalletType(type)) {
      commitState((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          walletIcons: sanitizeWalletIcons({
            ...sanitizeWalletIcons(prev.profile.walletIcons),
            [type]: safeIconId,
          }),
        },
      }));
    } else {
      commitState((prev) => ({
        ...prev,
        wallets: prev.wallets.map((w) =>
          w.walletType === type || w.id === type ? { ...w, iconId: safeIconId } : w
        ),
      }));
    }
    scheduleAutoBackup();
  }

  async function handleAddWallet(label: string, iconId: WalletIconId, initialBalance = 0) {
    const cleanLabel = label.trim().slice(0, 60);
    if (!cleanLabel) {
      throw new Error('Please enter an application name.');
    }
    if (stateRef.current.wallets.length >= 20) {
      throw new Error('Maximum limit of 20 wallets reached.');
    }
    const safeBalance = Math.min(FIELD_LIMITS.maxAmount, Math.max(0, roundMoney(initialBalance || 0)));
    const safeIconId = sanitizeAnyWalletIconId(iconId, 'app_bank_card');
    const customType = generateLocalId('app');
    const newWallet: WalletRecord = {
      id: `wallet_${customType}`,
      ownerId: 'local',
      walletType: customType,
      label: cleanLabel,
      iconId: safeIconId,
      balance: safeBalance,
      currency: stateRef.current.profile.defaultCurrency,
      isHidden: false,
      recentNote: safeBalance > 0 ? 'Initial balance' : '',
    };
    commitState((prev) => ({
      ...prev,
      wallets: [...prev.wallets, newWallet],
    }));
    scheduleAutoBackup();
  }

  async function handleDeleteCustomWallet(walletId: string) {
    const target = stateRef.current.wallets.find((w) => w.id === walletId);
    if (!target || isBuiltinWalletType(target.walletType)) return;
    commitState((prev) => ({
      ...prev,
      wallets: prev.wallets.filter((w) => w.id !== walletId),
    }));
    scheduleAutoBackup();
  }

  function handleQuickUpdateAlert(
    debt: DebtRecord,
    alertLevel: PersonAlertLevel,
    alertNote: string
  ) {
    const cleanLevel = sanitizePersonAlertLevel(alertLevel);
    const cleanNote =
      cleanLevel === 'none' ? '' : alertNote.trim().slice(0, FIELD_LIMITS.alertNoteMax);
    commitState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) =>
        d.id === debt.id ? { ...d, alertLevel: cleanLevel, alertNote: cleanNote } : d
      ),
    }));
    scheduleAutoBackup();
  }

  function handleUpdatePageSettings(page: AppPageKey, nextPageCfg: PageCustomSettings) {
    handleUpdateProfile({
      pageSettings: {
        ...(stateRef.current.profile.pageSettings || {}),
        [page]: nextPageCfg,
      },
    });
  }

  async function handlePersonSubmit(rawInput: DebtInput, initialPayment?: PaymentInput) {
    const input = sanitizeDebtInput(rawInput);

    if (editingDebt) {
      if (input.totalAmount < editingDebt.paidAmount) {
        throw new Error('لا يمكن تقليل المبلغ الأصلي عن المبلغ المدفوع بالفعل.');
      }
      const nextStatus = deriveDebtStatus(input.totalAmount, editingDebt.paidAmount);
      const updatedDebt: DebtRecord = {
        ...editingDebt,
        ...input,
        status: nextStatus,
      };
      commitState((prev) => ({
        ...prev,
        debts: prev.debts
          .map((d) => (d.id === editingDebt.id ? updatedDebt : d))
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      }));

      scheduleAutoBackup();
      return;
    }

    const initialAmount = initialPayment ? roundMoney(Number(initialPayment.amount) || 0) : 0;
    if (initialAmount < 0 || initialAmount > input.totalAmount) {
      throw new Error('قيمة الدفعة المبدئية يجب أن تكون بين 0 وإجمالي المبلغ.');
    }

    const paidAmount =
      initialAmount >= input.totalAmount - 0.001 && initialAmount > 0
        ? input.totalAmount
        : initialAmount;
    const status = deriveDebtStatus(input.totalAmount, paidAmount);
    const ownerId = 'local';
    const debtId = generateLocalId('debt');

    const newDebt: DebtRecord = {
      id: debtId,
      ownerId,
      direction: input.direction,
      debtorName: input.debtorName,
      debtorPhone: input.debtorPhone,
      avatarId: input.avatarId,
      title: input.title,
      category: input.category,
      totalAmount: input.totalAmount,
      paidAmount,
      currency: input.currency,
      givenDate: input.givenDate,
      dueDate: input.dueDate,
      installmentPlan: input.installmentPlan,
      status,
      notes: input.notes,
      alertLevel: input.alertLevel,
      alertNote: input.alertNote,
    };

    const paymentRecord: PaymentRecord | undefined =
      paidAmount > 0 && initialPayment
        ? {
            id: generateLocalId('pay'),
            ownerId,
            debtId,
            amount: paidAmount,
            paymentDate: initialPayment.paymentDate,
            method: initialPayment.method,
            note:
              initialPayment.note.trim().slice(0, FIELD_LIMITS.paymentNoteMax) ||
              'دفعة مبدئية عند التسجيل',
            createdAt: new Date().toISOString(),
          }
        : undefined;

    commitState((prev) => ({
      ...prev,
      debts: [...prev.debts, newDebt].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      paymentsByDebt: paymentRecord
        ? {
            ...prev.paymentsByDebt,
            [debtId]: [paymentRecord],
          }
        : prev.paymentsByDebt,
    }));

    scheduleAutoBackup();
  }

  async function handlePaymentSubmit(debt: DebtRecord, paymentInput: PaymentInput) {
    if (debt.status === 'محصل') {
      throw new Error('تم سداد هذا المبلغ بالكامل بالفعل.');
    }
    const rawAmount = roundMoney(Number(paymentInput.amount) || 0);
    const remaining = roundMoney(debt.totalAmount - debt.paidAmount);
    if (rawAmount <= 0) throw new Error('يرجى إدخال مبلغ أكبر من صفر.');
    if (rawAmount > remaining + 0.001) throw new Error('المبلغ المدخل أكبر من المبلغ المتبقي.');

    const actualAmount = rawAmount >= remaining - 0.001 ? remaining : rawAmount;
    const newPaidAmount =
      actualAmount === remaining ? debt.totalAmount : roundMoney(debt.paidAmount + actualAmount);
    const newStatus = deriveDebtStatus(debt.totalAmount, newPaidAmount);

    const paymentRecord: PaymentRecord = {
      id: generateLocalId('pay'),
      ownerId: 'local',
      debtId: debt.id,
      amount: actualAmount,
      paymentDate: paymentInput.paymentDate,
      method: paymentInput.method,
      note: paymentInput.note.trim().slice(0, FIELD_LIMITS.paymentNoteMax),
      createdAt: new Date().toISOString(),
    };

    commitState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) =>
        d.id === debt.id ? { ...d, paidAmount: newPaidAmount, status: newStatus } : d
      ),
      paymentsByDebt: {
        ...prev.paymentsByDebt,
        [debt.id]: [paymentRecord, ...(prev.paymentsByDebt[debt.id] || [])].sort((a, b) =>
          b.paymentDate.localeCompare(a.paymentDate)
        ),
      },
    }));

    scheduleAutoBackup();
  }

  async function handleChargeSubmit(debt: DebtRecord, input: ChargeInput) {
    const amount = roundMoney(Number(input.amount) || 0);
    if (amount <= 0) throw new Error('يرجى إدخال مبلغ أكبر من صفر.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.chargeDate)) throw new Error('التاريخ غير صالح.');

    const newTotal = roundMoney(debt.totalAmount + amount);
    if (newTotal > FIELD_LIMITS.maxAmount) throw new Error('المبلغ الإجمالي كبير جداً.');
    const newStatus = deriveDebtStatus(newTotal, debt.paidAmount);

    const chargeRecord: ChargeRecord = {
      id: generateLocalId('chg'),
      ownerId: 'local',
      debtId: debt.id,
      amount,
      chargeDate: input.chargeDate,
      note: input.note.trim().slice(0, FIELD_LIMITS.paymentNoteMax),
      createdAt: new Date().toISOString(),
    };

    commitState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) =>
        d.id === debt.id ? { ...d, totalAmount: newTotal, status: newStatus } : d
      ),
      chargesByDebt: {
        ...prev.chargesByDebt,
        [debt.id]: [chargeRecord, ...(prev.chargesByDebt[debt.id] || [])].sort((a, b) =>
          b.chargeDate.localeCompare(a.chargeDate)
        ),
      },
    }));

    scheduleAutoBackup();
  }

  async function handleWalletTransaction(
    wallet: WalletRecord,
    type: WalletTxType,
    rawAmount: number,
    note: string
  ) {
    const liveWallet =
      stateRef.current.wallets.find(
        (w) => w.id === wallet.id || w.walletType === wallet.walletType
      ) || wallet;

    const amount = roundMoney(Number(rawAmount) || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Please enter an amount greater than zero.');
    }
    if (type === 'withdraw' && amount > liveWallet.balance + 0.005) {
      throw new Error('Not enough balance in this wallet.');
    }

    const actualAmount =
      type === 'withdraw' && amount >= liveWallet.balance - 0.005
        ? liveWallet.balance
        : amount;

    const nextBalance =
      type === 'add'
        ? roundMoney(liveWallet.balance + actualAmount)
        : Math.max(0, roundMoney(liveWallet.balance - actualAmount));

    if (nextBalance > FIELD_LIMITS.maxAmount) {
      throw new Error('Amount is too large.');
    }

    const cleanNote = note.trim().slice(0, FIELD_LIMITS.walletNoteMax);
    const tx: WalletTransaction = {
      id: generateLocalId('wtx'),
      ownerId: 'local',
      walletId: liveWallet.id,
      walletType: liveWallet.walletType,
      ...(!isBuiltinWalletType(liveWallet.walletType) ? { walletLabel: liveWallet.label } : {}),
      type,
      amount: actualAmount,
      note: cleanNote,
      createdAt: new Date().toISOString(),
    };

    commitState((prev) => ({
      ...prev,
      wallets: prev.wallets.map((w) =>
        w.id === liveWallet.id || w.walletType === liveWallet.walletType
          ? {
              ...w,
              balance: nextBalance,
              recentNote: cleanNote || (type === 'add' ? 'Money added' : 'Money withdrawn'),
            }
          : w
      ),
      walletTxs: [tx, ...prev.walletTxs],
    }));

    scheduleAutoBackup();
  }

  async function handleToggleWalletHidden(walletId: string, isHidden: boolean) {
    const target = stateRef.current.wallets.find((w) => w.id === walletId);
    if (!target) return;
    commitState((prev) => ({
      ...prev,
      wallets: prev.wallets.map((w) => (w.id === walletId ? { ...w, isHidden } : w)),
    }));
    scheduleAutoBackup();
  }

  async function handleDeleteWalletTransaction(tx: WalletTransaction, adjustBalance: boolean) {
    commitState((prev) => {
      const nextWallets = prev.wallets.map((w) => {
        if (!adjustBalance || w.walletType !== tx.walletType) return w;
        const delta = tx.type === 'add' ? -tx.amount : tx.amount;
        const nextBalance = Math.max(0, roundMoney(w.balance + delta));
        return { ...w, balance: nextBalance };
      });
      return {
        ...prev,
        wallets: nextWallets,
        walletTxs: prev.walletTxs.filter((item) => item.id !== tx.id),
      };
    });

    scheduleAutoBackup();
  }

  async function handleClearWalletTransactions(
    txIds: string[],
    balanceMode: 'keep' | 'revert' | 'zero'
  ) {
    const idSet = new Set(txIds);
    if (idSet.size === 0 && balanceMode !== 'zero') return;

    commitState((prev) => {
      const removedTxs = prev.walletTxs.filter((item) => idSet.has(item.id));
      const remainingTxs = prev.walletTxs.filter((item) => !idSet.has(item.id));

      let nextWallets = prev.wallets;
      if (balanceMode === 'zero') {
        nextWallets = prev.wallets.map((w) => ({
          ...w,
          balance: 0,
          recentNote: '',
        }));
      } else if (balanceMode === 'revert' && removedTxs.length > 0) {
        const deltaByType: Record<string, number> = {};
        for (const tx of removedTxs) {
          deltaByType[tx.walletType] = roundMoney(
            (deltaByType[tx.walletType] || 0) + (tx.type === 'add' ? -tx.amount : tx.amount)
          );
        }
        nextWallets = prev.wallets.map((w) => {
          const delta = deltaByType[w.walletType] || 0;
          if (delta === 0) return w;
          return {
            ...w,
            balance: Math.max(0, roundMoney(w.balance + delta)),
          };
        });
      }

      // Keeps prev.profile (all settings, icons, themes, backups) 100% untouched
      return {
        ...prev,
        wallets: nextWallets,
        walletTxs: remainingTxs,
      };
    });

    scheduleAutoBackup();
  }

  async function handleDeleteConfirm(debt: DebtRecord) {
    commitState((prev) => {
      const nextPayments = { ...prev.paymentsByDebt };
      const nextCharges = { ...prev.chargesByDebt };
      delete nextPayments[debt.id];
      delete nextCharges[debt.id];
      return {
        ...prev,
        debts: prev.debts.filter((d) => d.id !== debt.id),
        paymentsByDebt: nextPayments,
        chargesByDebt: nextCharges,
      };
    });

    if (detailDebtId === debt.id) {
      setDetailDebtId(null);
    }

    scheduleAutoBackup();
  }

  // --- PIN-Protected Email or Phone Number Cloud Backup Handlers (Backups Only — No Login) ---

  async function handleSaveBackupContact(
    rawInput: string,
    rawPin: string
  ): Promise<{ contact: string; restored: boolean }> {
    const { display } = normalizeBackupContact(rawInput);
    const vaultKey = await derivePinProtectedVaultId(display, rawPin);
    setBackupBusy(true);
    try {
      const localState = commitState((prev) => ({
        ...prev,
        backupContact: display,
        backupVaultKey: vaultKey,
        autoBackupEnabled: true,
      }));

      const localHasData =
        localState.debts.length > 0 ||
        localState.wallets.some((w) => w.balance > 0 || w.isHidden) ||
        localState.walletTxs.length > 0;

      const cloud = await pullBackupVaultFromCloud(vaultKey, true);
      let restored = false;

      if (cloud.hasCloudData && !localHasData) {
        restored = true;
        commitState((prev) => ({
          ...prev,
          backupContact: display,
          backupVaultKey: vaultKey,
          profile: cloud.profile ? { ...cloud.profile, uid: 'local' } : prev.profile,
          debts: cloud.debts,
          paymentsByDebt: cloud.paymentsByDebt,
          chargesByDebt: cloud.chargesByDebt,
          wallets: cloud.wallets,
          walletTxs: cloud.walletTxs,
          deletedDebtIds: [],
          deletedWalletTxIds: [],
          autoBackupEnabled: true,
          lastBackupAt: new Date().toISOString(),
        }));
      } else {
        await pushBackupVaultToCloud(vaultKey, localState, true);
        commitState((prev) => ({
          ...prev,
          backupContact: display,
          backupVaultKey: vaultKey,
          deletedDebtIds: [],
          deletedWalletTxIds: [],
          autoBackupEnabled: true,
          lastBackupAt: new Date().toISOString(),
        }));
      }

      setDataError(null);
      return { contact: display, restored };
    } finally {
      setBackupBusy(false);
    }
  }

  function handleToggleAutoBackup(enabled: boolean) {
    const next = commitState((prev) => ({ ...prev, autoBackupEnabled: enabled }));
    if (enabled && next.backupContact) {
      const targetKey = next.backupVaultKey || next.backupContact;
      const isDerived = Boolean(next.backupVaultKey);
      setBackupBusy(true);
      pushBackupVaultToCloud(targetKey, next, isDerived)
        .then(() => {
          setDataError(null);
          markBackupDone();
        })
        .catch((err) => console.error('Auto backup enable sync error:', err))
        .finally(() => setBackupBusy(false));
    }
  }

  async function handleBackupNow() {
    const contact = stateRef.current.backupContact;
    if (!contact) return;
    const targetKey = stateRef.current.backupVaultKey || contact;
    const isDerived = Boolean(stateRef.current.backupVaultKey);
    setBackupBusy(true);
    try {
      await pushBackupVaultToCloud(targetKey, stateRef.current, isDerived);
      setDataError(null);
      markBackupDone();
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleRestoreFromCloud(): Promise<boolean> {
    const contact = stateRef.current.backupContact;
    if (!contact) return false;
    const targetKey = stateRef.current.backupVaultKey || contact;
    const isDerived = Boolean(stateRef.current.backupVaultKey);
    setBackupBusy(true);
    try {
      const cloud = await pullBackupVaultFromCloud(targetKey, isDerived);
      if (cloud.hasCloudData) {
        commitState((prev) => ({
          ...prev,
          profile: cloud.profile ? { ...cloud.profile, uid: 'local' } : prev.profile,
          debts: cloud.debts,
          paymentsByDebt: cloud.paymentsByDebt,
          chargesByDebt: cloud.chargesByDebt,
          wallets: cloud.wallets,
          walletTxs: cloud.walletTxs,
          deletedDebtIds: [],
          deletedWalletTxIds: [],
          lastBackupAt: new Date().toISOString(),
        }));
        setDataError(null);
        return true;
      }
      return false;
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleRestoreJsonFile(rawJsonText: string) {
    const res = parseBackupJSONToState(stateRef.current, rawJsonText);
    commitState(() => res.nextState);
    scheduleAutoBackup();
    return {
      importedDebts: res.importedDebts,
      importedWallets: res.importedWallets,
    };
  }

  function handleDisconnectBackupContact() {
    if (autoBackupTimerRef.current) {
      clearTimeout(autoBackupTimerRef.current);
      autoBackupTimerRef.current = null;
    }
    commitState((prev) => ({
      ...prev,
      backupContact: null,
      backupVaultKey: null,
    }));
  }

  function openAddModal() {
    setEditingDebt(null);
    setPersonModalOpen(true);
  }

  function openEditModal(debt: DebtRecord) {
    setEditingDebt(debt);
    setPersonModalOpen(true);
  }

  const currentDirection = activeTab === 'payables' ? 'payable' : 'receivable';

  const tabMetaMap: Record<AppTab, { label: string; iconKey: NavIconsConfig[keyof NavIconsConfig] }> = {
    receivables: { label: t.tabReceivables, iconKey: navIcons.receivables },
    payables: { label: t.tabPayables, iconKey: navIcons.payables },
    wallets: { label: t.tabWallets, iconKey: navIcons.wallets },
  };
  const viewportWidth = pagerViewportRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 360) || 360;
  const liveVisualProgress = Math.max(
    0,
    Math.min(visualTabs.length - 1, activeVisualIdx - swipeOffsetPx / viewportWidth)
  );

  return (
    <div
      ref={swipeContainerRef}
      onMouseDown={handleMouseDown}
      onClickCapture={handleClickCapture}
      className={`min-h-screen relative pb-[calc(5.2rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] transition-colors duration-200 ${
        hasWallpaper ? '' : theme.pageBgClass
      } ${
        isDraggingHorizontal ? 'select-none' : ''
      }`}
    >
      {/* Full-bleed WhatsApp / Telegram-style Wallpaper Layer */}
      {hasWallpaper && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-0 pointer-events-none transition-all duration-300"
          style={getWallpaperBaseStyle(activeWallpaper)}
        >
          <div
            className="absolute inset-0"
            style={getWallpaperPatternStyle(activeWallpaper)}
          />
        </div>
      )}

      <OfflineIndicator lang={lang} />

      {/* Responsive App Container */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-3 sm:pt-6 space-y-5">
        {/* Top Header - seamlessly matches page background or active wallpaper */}
        <header className={`flex items-center justify-between gap-4 ${hasWallpaper ? 'bg-transparent' : theme.pageBgClass}`}>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <img
                src={getAppIconSrc(effectiveAppIconId)}
                alt="Moamen"
                style={{ width: iconCfg.badgePx, height: iconCfg.badgePx }}
                className="rounded-lg object-cover shadow-xs transition-all"
              />
              <p
                className={`text-xs font-bold ${
                  wallpaperIsDark ? 'text-white/80' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {t.appName}
              </p>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`text-base sm:text-lg font-bold truncate ${
                  wallpaperIsDark ? 'text-white drop-shadow-xs' : 'text-slate-900 dark:text-white'
                }`}
              >
                {profile.displayName}
              </span>
              <button
                type="button"
                onClick={() => handleUpdateProfile({ statusActive: !profile.statusActive })}
                title={lang === 'ar' ? 'اضغط لتشغيل أو إيقاف الوميض' : 'Toggle flashing status'}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer shrink-0"
              >
                <span className="relative flex h-2.5 w-2.5">
                  {profile.statusActive && (
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusColorCfg.pingClass}`}
                    />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      profile.statusActive ? statusColorCfg.dotClass : 'bg-slate-400'
                    }`}
                  />
                </span>
                <span>
                  {profile.statusLabel || (profile.statusActive ? t.activeNow : t.pausedStatus)}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:block">
              <PWAInstallButton lang={lang} theme={theme} compact />
            </div>
            {activeTab !== 'wallets' && showPrivacyToggle && (
              <button
                type="button"
                data-no-swipe="true"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleOutsideHideAmounts();
                }}
                title={
                  hideAmounts
                    ? lang === 'ar'
                      ? 'إظهار أرصدة العملاء والدفعات'
                      : 'Show customer balances & payments'
                    : lang === 'ar'
                    ? 'إخفاء أرصدة العملاء والدفعات'
                    : 'Hide customer balances & payments'
                }
                aria-label={
                  hideAmounts
                    ? lang === 'ar'
                      ? 'إظهار أرصدة العملاء والدفعات'
                      : 'Show customer balances & payments'
                    : lang === 'ar'
                    ? 'إخفاء أرصدة العملاء والدفعات'
                    : 'Hide customer balances & payments'
                }
                aria-pressed={hideAmounts}
                className={`${iconCfg.headerBtnClass} rounded-full border shadow-sm flex items-center justify-center hover:scale-105 transition-all cursor-pointer touch-manipulation ${
                  hideAmounts
                    ? `${theme.accentSoftBg} ${theme.accentBorder} ${theme.accentText} dark:bg-slate-800`
                    : 'bg-white/95 dark:bg-slate-900 border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {hideAmounts ? (
                  <EyeOff
                    style={{
                      width: Math.max(16, iconCfg.headerPx - 2),
                      height: Math.max(16, iconCfg.headerPx - 2),
                    }}
                  />
                ) : (
                  <Eye
                    style={{
                      width: Math.max(16, iconCfg.headerPx - 2),
                      height: Math.max(16, iconCfg.headerPx - 2),
                    }}
                  />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label={t.settings}
              className={`${iconCfg.headerBtnClass} rounded-full bg-white/95 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 shadow-sm flex items-center justify-center hover:scale-105 transition-transform cursor-pointer`}
            >
              <AppIcon
                kind="ui"
                name="settings"
                styleId={headerIconStyle}
                sizePx={iconCfg.headerPx}
                theme={theme}
              />
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label={lang === 'ar' ? 'تغيير صورتي الشخصية' : 'Change profile photo'}
              className={`${profileAvatarCfg.headerAvatarClass} rounded-full cursor-pointer hover:scale-105 transition-all overflow-hidden shrink-0`}
            >
              <img
                src={resolveAvatarSrc(profile.avatarUrl)}
                alt={profile.displayName}
                className="w-full h-full rounded-full object-cover block"
              />
            </button>
          </div>
        </header>

        {dataError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-2xl p-3.5"
          >
            {dataError}
          </div>
        )}

        {/* Interactive Swipeable 3-Page Carousel (explicit dir="ltr" so RTL never shifts slides off-screen) */}
        <main
          ref={pagerViewportRef}
          dir="ltr"
          className="overflow-x-hidden touch-pan-y"
        >
          <div
            dir="ltr"
            style={{
              transform: `translate3d(calc(${-activeVisualIdx * (100 / 3)}% + ${swipeOffsetPx}px), 0, 0)`,
              transition: isDraggingHorizontal
                ? 'none'
                : `transform ${refreshRateCfg.swipeMs}ms ${refreshRateCfg.ease}`,
            }}
            className="flex items-start w-[300%] will-change-transform"
          >
            {visualTabs.map((tabId) => {
              const isCurrent = tabId === activeTab;
              return (
                <div
                  key={tabId}
                  dir={tabId === 'wallets' ? 'ltr' : lang === 'ar' ? 'rtl' : 'ltr'}
                  aria-hidden={!isCurrent}
                  className={`w-1/3 shrink-0 transition-opacity duration-200 ${
                    isCurrent
                      ? 'opacity-100'
                      : 'opacity-85 max-h-[60dvh] overflow-hidden pointer-events-none'
                  }`}
                >
                  {tabId === 'receivables' && (
                    <PeoplePageView
                      direction="receivable"
                      debts={debts}
                      loading={false}
                      defaultCurrency={profile.defaultCurrency}
                      theme={theme}
                      lang={lang}
                      pageScale={receivablesCfg.pageScale}
                      iconSize={receivablesCfg.iconSize}
                      avatarSize={receivablesCfg.avatarSize}
                      iconStyle={receivablesCfg.iconStyle}
                      personAlertFormat={notificationSettings.personAlertFormat}
                      hideAmounts={hideAmounts}
                      hasWallpaper={hasWallpaper}
                      wallpaperIsDark={wallpaperIsDark}
                      onOpenPageSettings={() => setEditingPageSettings('receivables')}
                      onSelectDebt={(d) => setDetailDebtId(d.id)}
                      onLogPayment={(d) => setPaymentDebt(d)}
                      onDeleteDebt={(d) => setDeletingDebt(d)}
                      onAddNew={openAddModal}
                    />
                  )}

                  {tabId === 'payables' && (
                    <PeoplePageView
                      direction="payable"
                      debts={debts}
                      loading={false}
                      defaultCurrency={profile.defaultCurrency}
                      theme={theme}
                      lang={lang}
                      pageScale={payablesCfg.pageScale}
                      iconSize={payablesCfg.iconSize}
                      avatarSize={payablesCfg.avatarSize}
                      iconStyle={payablesCfg.iconStyle}
                      personAlertFormat={notificationSettings.personAlertFormat}
                      hideAmounts={hideAmounts}
                      hasWallpaper={hasWallpaper}
                      wallpaperIsDark={wallpaperIsDark}
                      onOpenPageSettings={() => setEditingPageSettings('payables')}
                      onSelectDebt={(d) => setDetailDebtId(d.id)}
                      onLogPayment={(d) => setPaymentDebt(d)}
                      onDeleteDebt={(d) => setDeletingDebt(d)}
                      onAddNew={openAddModal}
                    />
                  )}

                  {tabId === 'wallets' && (
                    <WalletsView
                      wallets={wallets}
                      transactions={walletTxs}
                      loading={false}
                      defaultCurrency={profile.defaultCurrency}
                      theme={theme}
                      pageScale={walletsCfg.pageScale}
                      iconSize={walletsCfg.iconSize}
                      avatarSize={walletsCfg.avatarSize}
                      iconStyle={walletsCfg.iconStyle}
                      hideAmounts={hideWalletAmounts}
                      showPrivacyToggle={showWalletPrivacyToggle}
                      hasWallpaper={hasWallpaper}
                      walletIcons={walletIcons}
                      onChangeWalletIcon={handleChangeWalletIcon}
                      onAddWallet={handleAddWallet}
                      onDeleteCustomWallet={handleDeleteCustomWallet}
                      onToggleHideAmounts={handleToggleWalletHideAmounts}
                      onOpenPageSettings={() => setEditingPageSettings('wallets')}
                      onTransaction={handleWalletTransaction}
                      onDeleteTransaction={handleDeleteWalletTransaction}
                      onClearTransactions={handleClearWalletTransactions}
                      onToggleHidden={handleToggleWalletHidden}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Floating + Add Button positioned per language & sized by active page's iconSize */}
      {activeTab !== 'wallets' && (
        <button
          type="button"
          onClick={openAddModal}
          aria-label={lang === 'ar' ? 'إضافة شخص جديد' : 'Add new person'}
          className={`fixed bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-30 ${activePeopleCfg.iconCfg.fabBtnClass} rounded-full bg-white/95 dark:bg-slate-900 border border-emerald-200/80 dark:border-slate-700 shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer ${
            lang === 'ar' ? 'left-5 sm:left-8' : 'right-5 sm:right-8'
          }`}
        >
          <AppIcon
            kind="ui"
            name="plus"
            styleId={activePeopleCfg.iconStyle}
            sizePx={activePeopleCfg.iconCfg.fabPx}
            theme={theme}
            active
          />
        </button>
      )}

      {/* Sleek Icons-Only Fixed Bottom Tab Bar with Live Swipe-Synced Sliding Indicator */}
      <nav
        aria-label={lang === 'ar' ? 'الأقسام الرئيسية' : 'Main Navigation'}
        className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800"
      >
        <div dir="ltr" className="max-w-4xl mx-auto relative">
          {/* Live sliding indicator bar synced with swipe drag */}
          <div
            aria-hidden="true"
            style={{
              transform: `translate3d(${liveVisualProgress * 100}%, 0, 0)`,
              transition: isDraggingHorizontal
                ? 'none'
                : `transform ${refreshRateCfg.swipeMs}ms ${refreshRateCfg.ease}`,
            }}
            className="absolute top-0 left-0 w-1/3 flex justify-center pointer-events-none"
          >
            <span className={`h-0.5 w-10 rounded-full ${theme.accentBg}`} />
          </div>

          <div className="min-h-[58px] py-1.5 grid grid-cols-3 items-center">
            {visualTabs.map((tabId, idx) => {
              const tab = tabMetaMap[tabId];
              const active = activeTab === tabId;
              return (
                <button
                  key={tabId}
                  type="button"
                  onClick={() =>
                    navigateToTab(tabId, idx > activeVisualIdx ? 'next' : 'prev')
                  }
                  aria-label={tab.label}
                  title={tab.label}
                  className="h-full min-h-[44px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <span
                    className={`px-4 py-1.5 rounded-2xl transition-all flex items-center justify-center ${
                      active
                        ? `${theme.accentSoftBg} dark:bg-slate-800 scale-105 shadow-2xs`
                        : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    <AppIcon
                      kind="nav"
                      name={tab.iconKey}
                      styleId={navIconStyle}
                      sizePx={navBarCfg.navPx}
                      theme={theme}
                      active={active}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Modals */}
      <PersonModal
        isOpen={personModalOpen}
        direction={currentDirection}
        editingDebt={editingDebt}
        defaultCurrency={profile.defaultCurrency}
        theme={theme}
        lang={lang}
        onClose={() => {
          setPersonModalOpen(false);
          setEditingDebt(null);
        }}
        onSubmit={handlePersonSubmit}
      />

      <PersonDetailSheet
        debt={detailDebt}
        payments={detailDebt ? paymentsByDebt[detailDebt.id] || [] : []}
        charges={detailDebt ? chargesByDebt[detailDebt.id] || [] : []}
        theme={theme}
        lang={lang}
        iconSize={activePeopleCfg.iconSize}
        iconStyle={activePeopleCfg.iconStyle}
        personAlertFormat={notificationSettings.personAlertFormat}
        notificationsEnabled={notificationSettings.enabled}
        notifyTime={notificationSettings.notifyTime}
        hideAmounts={hideAmounts}
        onClose={() => setDetailDebtId(null)}
        onLogPayment={(d) => setPaymentDebt(d)}
        onAddCharge={(d) => setChargeDebt(d)}
        onEdit={openEditModal}
        onDelete={(d) => setDeletingDebt(d)}
        onQuickUpdateAlert={handleQuickUpdateAlert}
      />

      <PaymentModal
        debt={paymentDebt}
        theme={theme}
        lang={lang}
        onClose={() => setPaymentDebt(null)}
        onSubmit={handlePaymentSubmit}
      />

      <ChargeModal
        debt={chargeDebt}
        theme={theme}
        lang={lang}
        onClose={() => setChargeDebt(null)}
        onSubmit={handleChargeSubmit}
      />

      <ConfirmDeleteModal
        debt={deletingDebt}
        lang={lang}
        onClose={() => setDeletingDebt(null)}
        onConfirm={handleDeleteConfirm}
      />

      <PageSettingsSheet
        page={editingPageSettings}
        current={editingPageSettings ? profile.pageSettings?.[editingPageSettings] || {} : {}}
        globalIconSize={profile.iconSize || 'sm'}
        globalAvatarSize={
          editingPageSettings === 'wallets'
            ? profile.walletImageSize ?? profile.avatarSize ?? 'md'
            : profile.avatarSize || 'md'
        }
        fallbackIconStyle={editingPageSettings === 'wallets' ? walletsIconStyle : peopleIconStyle}
        globalWallpaperId={sanitizeWallpaperId(profile.wallpaperId)}
        navSoundEnabled={profile.navSoundEnabled !== false}
        theme={theme}
        lang={lang}
        onClose={() => setEditingPageSettings(null)}
        onChange={handleUpdatePageSettings}
      />

      <SettingsModal
        isOpen={settingsOpen}
        backupContact={backupContact}
        backupPinProtected={Boolean(backupVaultKey)}
        autoBackupEnabled={autoBackupEnabled}
        lastBackupAt={lastBackupAt}
        backupBusy={backupBusy}
        profile={profile}
        debts={debts}
        wallets={wallets}
        theme={theme}
        lang={lang}
        settingsIconStyle={settingsIconStyle}
        navIconStyle={navIconStyle}
        effectiveAppIconId={effectiveAppIconId}
        onClose={() => setSettingsOpen(false)}
        onUpdateProfile={handleUpdateProfile}
        onSaveBackupContact={handleSaveBackupContact}
        onToggleAutoBackup={handleToggleAutoBackup}
        onBackupNow={handleBackupNow}
        onRestoreFromCloud={handleRestoreFromCloud}
        onRestoreJsonFile={handleRestoreJsonFile}
        onDisconnectBackupContact={handleDisconnectBackupContact}
      />

      <FullScreenAlertOverlay
        alert={fullScreenAlert}
        theme={theme}
        lang={lang}
        onDismiss={() => setFullScreenAlert(null)}
        onOpenPerson={(id) => {
          setFullScreenAlert(null);
          const target = stateRef.current.debts.find((d) => d.id === id);
          if (target) {
            setActiveTab(target.direction === 'payable' ? 'payables' : 'receivables');
            setDetailDebtId(id);
          }
        }}
      />
    </div>
  );
}
