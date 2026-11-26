import {
  AppIconId,
  AvatarRingColor,
  AvatarRingStyle,
  IconSize,
  IconStyleId,
  NavIconsConfig,
  NotificationSettings,
  PageSettingsMap,
  PersonAlertLevel,
  RefreshRateHz,
  SectionIconStyles,
  StatusFlashColor,
  WalletIconId,
  WalletIconsConfig,
} from '../data/customization';
import { AppLanguage, ThemeId } from '../data/themes';
import { WallpaperId } from '../data/wallpapers';

export const CURRENCIES = ['EGP', 'SAR', 'AED', 'KWD', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_LABELS: Record<Currency, { ar: string; en: string }> = {
  EGP: { ar: 'جنيه مصري (EGP)', en: 'Egyptian Pound (EGP)' },
  SAR: { ar: 'ريال سعودي (SAR)', en: 'Saudi Riyal (SAR)' },
  AED: { ar: 'درهم إماراتي (AED)', en: 'UAE Dirham (AED)' },
  KWD: { ar: 'دينار كويتي (KWD)', en: 'Kuwaiti Dinar (KWD)' },
  USD: { ar: 'دولار أمريكي (USD)', en: 'US Dollar (USD)' },
};

export const DEBT_CATEGORIES = [
  'سلفة شخصية',
  'تجارة وبضاعة',
  'شراكة وعمل',
  'أخرى',
] as const;
export type DebtCategory = (typeof DEBT_CATEGORIES)[number];

export const INSTALLMENT_PLANS = [
  'دفعة واحدة',
  'أقساط شهرية',
  'دفعات مرنة',
] as const;
export type InstallmentPlan = (typeof INSTALLMENT_PLANS)[number];

export const DEBT_STATUSES = ['نشط', 'جزئي', 'محصل'] as const;
export type DebtStatus = (typeof DEBT_STATUSES)[number];

export const PAYMENT_METHODS = [
  'نقدي',
  'تحويل بنكي',
  'محفظة إلكترونية',
  'أخرى',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type DebtDirection = 'receivable' | 'payable';
export type BuiltinWalletType = 'instapay' | 'vodafone_cash' | 'cash';
export type WalletType = BuiltinWalletType | (string & {});

export function isBuiltinWalletType(val: string): val is BuiltinWalletType {
  return val === 'instapay' || val === 'vodafone_cash' || val === 'cash';
}

export const FIELD_LIMITS = {
  displayNameMax: 100,
  avatarMax: 120000,
  statusLabelMax: 40,
  debtorNameMax: 100,
  debtorPhoneMax: 30,
  titleMax: 140,
  notesMax: 500,
  alertNoteMax: 80,
  paymentNoteMax: 200,
  walletNoteMax: 140,
  maxAmount: 1000000000,
} as const;

export interface UserProfile {
  uid: string;
  displayName: string;
  avatarUrl: string;
  statusActive: boolean;
  statusLabel: string;
  statusColor?: StatusFlashColor;
  avatarRingColor?: AvatarRingColor;
  avatarRingStyle?: AvatarRingStyle;
  theme: ThemeId;
  followPhoneTheme?: boolean;
  autoAppIconByTheme?: boolean;
  language: AppLanguage;
  defaultCurrency: Currency;
  iconSize?: IconSize;
  navIconSize?: IconSize;
  avatarSize?: IconSize;
  profileAvatarSize?: IconSize;
  walletImageSize?: IconSize;
  iconStyle?: IconStyleId;
  sectionIconStyles?: SectionIconStyles;
  pageSettings?: PageSettingsMap;
  navSoundEnabled?: boolean;
  appIconId?: AppIconId;
  navIcons?: NavIconsConfig;
  refreshRateHz?: RefreshRateHz;
  notificationSettings?: NotificationSettings;
  hideAmounts?: boolean;
  showPrivacyToggle?: boolean;
  hideWalletAmounts?: boolean;
  showWalletPrivacyToggle?: boolean;
  wallpaperId?: WallpaperId;
  walletIcons?: WalletIconsConfig;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DebtRecord {
  id: string;
  ownerId: string;
  direction: DebtDirection;
  debtorName: string;
  debtorPhone: string;
  avatarId: string;
  title: string;
  category: DebtCategory;
  totalAmount: number;
  paidAmount: number;
  currency: Currency | string;
  givenDate: string;
  dueDate: string;
  installmentPlan: InstallmentPlan;
  status: DebtStatus;
  notes: string;
  alertLevel?: PersonAlertLevel;
  alertNote?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DebtInput {
  direction: DebtDirection;
  debtorName: string;
  debtorPhone: string;
  avatarId: string;
  title: string;
  category: DebtCategory;
  totalAmount: number;
  currency: Currency | string;
  givenDate: string;
  dueDate: string;
  installmentPlan: InstallmentPlan;
  notes: string;
  alertLevel?: PersonAlertLevel;
  alertNote?: string;
}

export interface PaymentRecord {
  id: string;
  ownerId: string;
  debtId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  note: string;
  createdAt?: unknown;
}

export interface PaymentInput {
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  note: string;
}

export interface ChargeRecord {
  id: string;
  ownerId: string;
  debtId: string;
  amount: number;
  chargeDate: string;
  note: string;
  createdAt?: unknown;
}

export interface ChargeInput {
  amount: number;
  chargeDate: string;
  note: string;
}

export type WalletTxType = 'add' | 'withdraw';

export interface WalletTransaction {
  id: string;
  ownerId: string;
  walletId: string;
  walletType: WalletType;
  walletLabel?: string;
  type: WalletTxType;
  amount: number;
  note: string;
  createdAt?: unknown;
}

export interface WalletRecord {
  id: string;
  ownerId: string;
  walletType: WalletType;
  label: string;
  iconId?: WalletIconId;
  balance: number;
  currency: Currency | string;
  isHidden: boolean;
  recentNote: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type CollectionUrgency = 'overdue' | 'due_today' | 'due_soon' | 'upcoming' | 'settled';

export function roundMoney(val: number): number {
  return Math.round(val * 100) / 100;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getRemainingAmount(debt: Pick<DebtRecord, 'totalAmount' | 'paidAmount'>): number {
  return Math.max(0, roundMoney(debt.totalAmount - debt.paidAmount));
}

export function deriveDebtStatus(totalAmount: number, paidAmount: number): DebtStatus {
  if (paidAmount >= totalAmount) return 'محصل';
  if (paidAmount > 0) return 'جزئي';
  return 'نشط';
}

export function getDaysUntilDue(dueDate: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return 0;
  const todayStr = getTodayISO();
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const [dy, dm, dd] = dueDate.split('-').map(Number);
  const todayUtc = Date.UTC(ty, tm - 1, td);
  const dueUtc = Date.UTC(dy, dm - 1, dd);
  return Math.round((dueUtc - todayUtc) / 86400000);
}

export function getCollectionUrgency(debt: DebtRecord): CollectionUrgency {
  if (debt.status === 'محصل' || getRemainingAmount(debt) <= 0) {
    return 'settled';
  }
  const diff = getDaysUntilDue(debt.dueDate);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'due_today';
  if (diff <= 7) return 'due_soon';
  return 'upcoming';
}

export function formatDueCountdown(debt: DebtRecord, lang: AppLanguage = 'ar'): string {
  if (debt.status === 'محصل') return lang === 'ar' ? 'تم السداد بالكامل' : 'Settled';
  const diff = getDaysUntilDue(debt.dueDate);
  if (lang === 'en') {
    if (diff < -1) return `${Math.abs(diff)}d overdue`;
    if (diff === -1) return '1d overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `In ${diff} days`;
  }
  if (diff < -1) return `متأخر ${Math.abs(diff)} أيام`;
  if (diff === -1) return 'متأخر يوم';
  if (diff === 0) return 'يستحق اليوم';
  if (diff === 1) return 'يستحق غداً';
  if (diff <= 7) return `خلال ${diff} أيام`;
  return `بعد ${diff} يوم`;
}

export const MASKED_AMOUNT = '••••••';

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatMoney(amount: number, currency: Currency | string): string {
  return `${formatNumber(amount)} ${currency}`;
}

export function formatDisplayNumber(amount: number, hidden?: boolean): string {
  return hidden ? '••••' : formatNumber(amount);
}

export function formatDisplayMoney(
  amount: number,
  currency: Currency | string,
  hidden?: boolean
): string {
  return hidden ? MASKED_AMOUNT : formatMoney(amount, currency);
}

export function formatArabicDate(isoDate: string, lang: AppLanguage = 'ar'): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function buildWhatsAppReminder(debt: DebtRecord): string {
  const remaining = getRemainingAmount(debt);
  return [
    `السلام عليكم أ/ ${debt.debtorName}`,
    `تذكير ودي بخصوص (${debt.title})`,
    `المبلغ المتبقي: ${formatMoney(remaining, debt.currency)}`,
    `موعد الاستحقاق: ${formatArabicDate(debt.dueDate, 'ar')}`,
    `تحياتي وتقديري.`,
  ].join('\n');
}

export function exportDebtsToCSV(debts: DebtRecord[]): void {
  const headers = [
    'النوع',
    'اسم الشخص',
    'رقم الهاتف',
    'البيان',
    'المبلغ الأصلي',
    'المدفوع',
    'المتبقي',
    'العملة',
    'تاريخ التسجيل',
    'تاريخ الاستحقاق',
    'الحالة',
    'ملاحظات',
  ];

  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = debts.map((d) =>
    [
      d.direction === 'payable' ? 'مطلوب مني' : 'لي عند الغير',
      d.debtorName,
      d.debtorPhone,
      d.title,
      d.totalAmount,
      d.paidAmount,
      getRemainingAmount(d),
      d.currency,
      d.givenDate,
      d.dueDate,
      d.status,
      d.notes,
    ]
      .map(escapeCsv)
      .join(',')
  );

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hesabaty-debts-${getTodayISO()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface HesabatyBackupPayload {
  version: 1;
  exportedAt: string;
  profile: {
    displayName: string;
    avatarUrl: string;
    statusActive: boolean;
    statusLabel: string;
    statusColor?: StatusFlashColor;
    avatarRingColor?: AvatarRingColor;
    avatarRingStyle?: AvatarRingStyle;
    theme: ThemeId;
    followPhoneTheme?: boolean;
    autoAppIconByTheme?: boolean;
    language: AppLanguage;
    defaultCurrency: Currency;
    iconSize?: IconSize;
    navIconSize?: IconSize;
    avatarSize?: IconSize;
    profileAvatarSize?: IconSize;
    walletImageSize?: IconSize;
    iconStyle?: IconStyleId;
    sectionIconStyles?: SectionIconStyles;
    pageSettings?: PageSettingsMap;
    navSoundEnabled?: boolean;
    appIconId?: AppIconId;
    navIcons?: NavIconsConfig;
    refreshRateHz?: RefreshRateHz;
    notificationSettings?: NotificationSettings;
    hideAmounts?: boolean;
    showPrivacyToggle?: boolean;
    hideWalletAmounts?: boolean;
    showWalletPrivacyToggle?: boolean;
    wallpaperId?: WallpaperId;
    walletIcons?: WalletIconsConfig;
  };
  debts: Array<{
    direction: DebtDirection;
    debtorName: string;
    debtorPhone: string;
    avatarId: string;
    title: string;
    category: DebtCategory;
    totalAmount: number;
    paidAmount: number;
    currency: string;
    givenDate: string;
    dueDate: string;
    installmentPlan: InstallmentPlan;
    notes: string;
    alertLevel?: PersonAlertLevel;
    alertNote?: string;
  }>;
  wallets: Array<{
    walletType: WalletType;
    label: string;
    iconId?: WalletIconId;
    balance: number;
    currency: string;
    isHidden: boolean;
    recentNote: string;
  }>;
}
