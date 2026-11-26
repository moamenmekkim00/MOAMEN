import {
  DEFAULT_NAV_ICONS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_WALLET_ICONS,
  normalizeAppIconId,
  normalizeIconStyle,
  sanitizeAnyWalletIconId,
  sanitizeNotificationSettings,
  sanitizeRefreshRateHz,
  sanitizeWalletIcons,
} from '../data/customization';
import {
  BuiltinWalletType,
  ChargeRecord,
  Currency,
  DebtRecord,
  isBuiltinWalletType,
  PaymentRecord,
  UserProfile,
  WalletRecord,
  WalletTransaction,
  WalletType,
} from '../types/debt';

const STORAGE_KEY = 'moamen_local_state_v1';

export interface LocalAppState {
  profile: UserProfile;
  debts: DebtRecord[];
  paymentsByDebt: Record<string, PaymentRecord[]>;
  chargesByDebt: Record<string, ChargeRecord[]>;
  wallets: WalletRecord[];
  walletTxs: WalletTransaction[];
  deletedDebtIds: string[];
  deletedWalletTxIds: string[];
  /** Saved email or phone number used strictly for creating & restoring cloud backups. */
  backupContact: string | null;
  /** PBKDF2-derived 64-char hex vault ID (combines contact + secret backup PIN; raw PIN is never stored). */
  backupVaultKey: string | null;
  autoBackupEnabled: boolean;
  lastBackupAt: string | null;
}

export function generateLocalId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${rand}`;
}

export function createDefaultProfile(): UserProfile {
  return {
    uid: 'local',
    displayName: 'حسابي',
    avatarUrl: 'boy',
    statusActive: true,
    statusLabel: 'نشط الآن',
    statusColor: 'green',
    avatarRingColor: 'none',
    avatarRingStyle: 'solid',
    theme: 'mint',
    followPhoneTheme: false,
    autoAppIconByTheme: false,
    language: 'ar',
    defaultCurrency: 'EGP',
    iconSize: 'sm',
    navIconSize: 'sm',
    avatarSize: 'md',
    profileAvatarSize: 'md',
    walletImageSize: 'md',
    iconStyle: 'samsung',
    sectionIconStyles: {},
    pageSettings: {},
    navSoundEnabled: true,
    appIconId: 'samsung_mint_wallet',
    navIcons: { ...DEFAULT_NAV_ICONS },
    refreshRateHz: 120,
    notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
    hideAmounts: false,
    showPrivacyToggle: true,
    hideWalletAmounts: false,
    showWalletPrivacyToggle: true,
    wallpaperId: 'none',
    walletIcons: { ...DEFAULT_WALLET_ICONS },
  };
}

export function createDefaultWallets(currency: Currency = 'EGP'): WalletRecord[] {
  const defs: { type: WalletType; label: string }[] = [
    { type: 'instapay', label: 'InstaPay · إنستا باي' },
    { type: 'vodafone_cash', label: 'Vodafone Cash · فودافون كاش' },
    { type: 'cash', label: 'Cash · كاش' },
  ];
  return defs.map((d) => ({
    id: `wallet_${d.type}`,
    ownerId: 'local',
    walletType: d.type,
    label: d.label,
    balance: 0,
    currency,
    isHidden: false,
    recentNote: '',
  }));
}

export function createDefaultLocalState(): LocalAppState {
  const profile = createDefaultProfile();
  return {
    profile,
    debts: [],
    paymentsByDebt: {},
    chargesByDebt: {},
    wallets: createDefaultWallets(profile.defaultCurrency),
    walletTxs: [],
    deletedDebtIds: [],
    deletedWalletTxIds: [],
    backupContact: null,
    backupVaultKey: null,
    autoBackupEnabled: true,
    lastBackupAt: null,
  };
}

export function ensureAllDefaultWallets(
  wallets: WalletRecord[],
  currency: Currency
): WalletRecord[] {
  const order: Record<BuiltinWalletType, number> = { instapay: 0, vodafone_cash: 1, cash: 2 };
  const byType = new Map<string, WalletRecord>();
  const customWallets: WalletRecord[] = [];

  for (const w of wallets) {
    if (!w || typeof w.walletType !== 'string' || !w.walletType.trim()) continue;
    if (isBuiltinWalletType(w.walletType)) {
      byType.set(w.walletType, {
        ...w,
        id: `wallet_${w.walletType}`,
      });
    } else if (/^[a-zA-Z0-9_-]{1,64}$/.test(w.walletType)) {
      if (!byType.has(w.walletType)) {
        const custom: WalletRecord = {
          ...w,
          id: `wallet_${w.walletType}`,
          label: String(w.label || w.walletType).trim().slice(0, 60) || w.walletType,
          iconId: sanitizeAnyWalletIconId(w.iconId, 'app_bank_card'),
        };
        byType.set(w.walletType, custom);
        customWallets.push(custom);
      }
    }
  }

  for (const def of createDefaultWallets(currency)) {
    if (!byType.has(def.walletType)) {
      byType.set(def.walletType, def);
    }
  }

  const builtins = (['instapay', 'vodafone_cash', 'cash'] as BuiltinWalletType[])
    .map((t) => byType.get(t)!)
    .sort((a, b) => order[a.walletType as BuiltinWalletType] - order[b.walletType as BuiltinWalletType]);

  return [...builtins, ...customWallets].slice(0, 20);
}

export function loadLocalState(): LocalAppState {
  const fallback = createDefaultLocalState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<LocalAppState>;
    const profile: UserProfile = {
      ...fallback.profile,
      ...(parsed.profile || {}),
      iconStyle: normalizeIconStyle(parsed.profile?.iconStyle),
      appIconId: normalizeAppIconId(parsed.profile?.appIconId),
      refreshRateHz: sanitizeRefreshRateHz(parsed.profile?.refreshRateHz),
      notificationSettings: sanitizeNotificationSettings(parsed.profile?.notificationSettings),
      walletIcons: sanitizeWalletIcons(parsed.profile?.walletIcons),
    };
    const wallets = ensureAllDefaultWallets(
      Array.isArray(parsed.wallets) ? parsed.wallets : [],
      profile.defaultCurrency
    );
    return {
      profile,
      debts: Array.isArray(parsed.debts) ? parsed.debts : [],
      paymentsByDebt:
        parsed.paymentsByDebt && typeof parsed.paymentsByDebt === 'object'
          ? parsed.paymentsByDebt
          : {},
      chargesByDebt:
        parsed.chargesByDebt && typeof parsed.chargesByDebt === 'object'
          ? parsed.chargesByDebt
          : {},
      wallets,
      walletTxs: Array.isArray(parsed.walletTxs) ? parsed.walletTxs : [],
      deletedDebtIds: Array.isArray(parsed.deletedDebtIds) ? parsed.deletedDebtIds : [],
      deletedWalletTxIds: Array.isArray(parsed.deletedWalletTxIds) ? parsed.deletedWalletTxIds : [],
      backupContact:
        typeof parsed.backupContact === 'string' && parsed.backupContact.trim()
          ? parsed.backupContact.trim()
          : null,
      backupVaultKey:
        typeof parsed.backupVaultKey === 'string' && /^[a-f0-9]{64}$/.test(parsed.backupVaultKey)
          ? parsed.backupVaultKey
          : null,
      autoBackupEnabled:
        typeof parsed.autoBackupEnabled === 'boolean' ? parsed.autoBackupEnabled : true,
      lastBackupAt: typeof parsed.lastBackupAt === 'string' ? parsed.lastBackupAt : null,
    };
  } catch {
    return fallback;
  }
}

export function saveLocalState(state: LocalAppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}
