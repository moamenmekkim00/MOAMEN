import { FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSwipeBack } from '../hooks/useSwipeBack';
import {
  Check,
  Eye,
  EyeOff,
  ListChecks,
  Palette,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  CUSTOM_APP_ICON_OPTIONS,
  getAvatarSizeConfig,
  getIconSizeConfig,
  getPageScaleConfig,
  IconSize,
  IconStyleId,
  PageScaleId,
  PRESET_WALLET_APPS,
  sanitizeAnyWalletIconId,
  sanitizeWalletIcons,
  WALLET_ICON_OPTIONS,
  WalletIconId,
  WalletIconsConfig,
} from '../data/customization';
import { ThemeConfig } from '../data/themes';
import {
  Currency,
  formatDisplayMoney,
  formatMoney,
  isBuiltinWalletType,
  roundMoney,
  WalletRecord,
  WalletTransaction,
  WalletTxType,
  WalletType,
} from '../types/debt';
import { AppIcon } from './AppIcon';
import { MoneyActionIcon, WalletHeroIcon, WalletLogo } from './WalletLogos';

interface WalletsViewProps {
  wallets: WalletRecord[];
  transactions: WalletTransaction[];
  loading: boolean;
  defaultCurrency: Currency;
  theme: ThemeConfig;
  pageScale?: PageScaleId;
  iconSize?: IconSize;
  avatarSize?: IconSize;
  iconStyle: IconStyleId;
  hideAmounts?: boolean;
  showPrivacyToggle?: boolean;
  onToggleHideAmounts?: () => void;
  hasWallpaper?: boolean;
  walletIcons?: WalletIconsConfig;
  onChangeWalletIcon?: (type: WalletType, iconId: WalletIconId) => void;
  onAddWallet?: (label: string, iconId: WalletIconId, initialBalance?: number) => Promise<void>;
  onDeleteCustomWallet?: (walletId: string) => Promise<void>;
  onTransaction: (
    wallet: WalletRecord,
    type: WalletTxType,
    amount: number,
    note: string
  ) => Promise<void>;
  onDeleteTransaction: (tx: WalletTransaction, adjustBalance: boolean) => Promise<void>;
  onClearTransactions: (
    txIds: string[],
    balanceMode: 'keep' | 'revert' | 'zero'
  ) => Promise<void>;
  onToggleHidden: (walletId: string, isHidden: boolean) => Promise<void>;
  onOpenPageSettings: () => void;
}

const BUILTIN_WALLET_NAMES: Record<'instapay' | 'vodafone_cash' | 'cash', string> = {
  instapay: 'InstaPay',
  vodafone_cash: 'Vodafone Cash',
  cash: 'Cash',
};

function txDate(createdAt: unknown): string {
  const t = createdAt as { toDate?: () => Date } | null | undefined;
  let d: Date;
  if (t && typeof t.toDate === 'function') {
    d = t.toDate();
  } else if (typeof createdAt === 'string' || typeof createdAt === 'number') {
    const parsed = new Date(createdAt);
    d = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  } else {
    d = new Date();
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

function parseDecimalAmount(raw: string): number {
  const normalized = raw
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٫,]/g, '.')
    .replace(/[^\d.]/g, '');
  if (!normalized || normalized === '.') return NaN;
  const parts = normalized.split('.');
  const clean = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : normalized;
  return roundMoney(Number(clean));
}

/** Wallet page: English only, two actions (Add Money / Withdraw Money) + history. */
export function WalletsView({
  wallets,
  transactions,
  loading,
  defaultCurrency,
  theme,
  pageScale,
  iconSize,
  avatarSize,
  iconStyle,
  hideAmounts = false,
  showPrivacyToggle = true,
  onToggleHideAmounts,
  hasWallpaper = false,
  walletIcons,
  onChangeWalletIcon,
  onAddWallet,
  onDeleteCustomWallet,
  onTransaction,
  onDeleteTransaction,
  onClearTransactions,
  onToggleHidden,
  onOpenPageSettings,
}: WalletsViewProps) {
  const scaleCfg = getPageScaleConfig(pageScale);
  const iconCfg = getIconSizeConfig(iconSize);
  const avatarCfg = getAvatarSizeConfig(avatarSize);
  const resolvedWalletIcons = sanitizeWalletIcons(walletIcons);
  const panelSurface = hasWallpaper
    ? 'bg-white/92 dark:bg-slate-900/90 backdrop-blur-[2px]'
    : 'bg-white dark:bg-slate-900';

  const getWalletName = (walletType: WalletType, fallbackLabel?: string): string => {
    if (isBuiltinWalletType(walletType)) {
      return BUILTIN_WALLET_NAMES[walletType];
    }
    const matched = wallets.find((w) => w.walletType === walletType);
    return matched?.label || fallbackLabel || String(walletType);
  };

  const getWalletIconId = (walletType: WalletType): WalletIconId => {
    if (isBuiltinWalletType(walletType)) {
      return resolvedWalletIcons[walletType];
    }
    const matched = wallets.find((w) => w.walletType === walletType);
    return sanitizeAnyWalletIconId(matched?.iconId, 'app_bank_card');
  };

  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);
  const [mode, setMode] = useState<WalletTxType>('add');
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingTx, setDeletingTx] = useState<WalletTransaction | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [iconPickerType, setIconPickerType] = useState<WalletType | null>(null);

  // Add Application / Wallet modal state
  const [addAppModalOpen, setAddAppModalOpen] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppIconId, setNewAppIconId] = useState<WalletIconId>('app_orange_cash');
  const [newAppBalanceInput, setNewAppBalanceInput] = useState('');
  const [newAppBusy, setNewAppBusy] = useState(false);
  const [newAppError, setNewAppError] = useState<string | null>(null);

  // Clear History modal state (Full Clear + Partial Clear)
  const [clearModalTab, setClearModalTab] = useState<'all' | 'partial' | null>(null);
  const [clearBusy, setClearBusy] = useState(false);
  const [partialTypeFilter, setPartialTypeFilter] = useState<'all' | WalletTxType>('all');
  const [partialWalletFilter, setPartialWalletFilter] = useState<'all' | WalletType>('all');
  const [selectedClearIds, setSelectedClearIds] = useState<string[]>([]);
  const [partialRevertBalances, setPartialRevertBalances] = useState(false);
  const [deleteAllBusy, setDeleteAllBusy] = useState(false);

  const activeWallet = activeWalletId
    ? wallets.find((w) => w.id === activeWalletId) || null
    : null;

  useEffect(() => {
    const onBack = (e: Event) => {
      if (addAppModalOpen) {
        e.preventDefault();
        if (!newAppBusy) setAddAppModalOpen(false);
      } else if (clearModalTab) {
        e.preventDefault();
        if (!clearBusy) setClearModalTab(null);
      } else if (iconPickerType) {
        e.preventDefault();
        setIconPickerType(null);
      } else if (deletingTx) {
        e.preventDefault();
        if (!deletingBusy) setDeletingTx(null);
      } else if (activeWalletId) {
        e.preventDefault();
        if (!submitting) setActiveWalletId(null);
      }
    };
    window.addEventListener('moamen:back', onBack);
    return () => window.removeEventListener('moamen:back', onBack);
  }, [
    addAppModalOpen,
    newAppBusy,
    clearModalTab,
    clearBusy,
    iconPickerType,
    deletingTx,
    deletingBusy,
    activeWalletId,
    submitting,
  ]);

  const addAppModalSwipe = useSwipeBack(Boolean(addAppModalOpen && !newAppBusy), () => {
    if (!newAppBusy) setAddAppModalOpen(false);
  });
  const clearModalSwipe = useSwipeBack(Boolean(clearModalTab && !clearBusy), () => {
    if (!clearBusy) setClearModalTab(null);
  });
  const iconPickerSwipe = useSwipeBack(Boolean(iconPickerType), () => {
    setIconPickerType(null);
  });
  const deleteModalSwipe = useSwipeBack(Boolean(deletingTx && !deletingBusy), () => {
    if (!deletingBusy) setDeletingTx(null);
  });
  const walletModalSwipe = useSwipeBack(Boolean(activeWallet && !submitting), () => {
    if (!submitting) setActiveWalletId(null);
  });

  const visibleWallets = wallets.filter((w) => !w.isHidden);
  const hiddenWallets = wallets.filter((w) => w.isHidden);
  const visibleTypes = new Set(visibleWallets.map((w) => w.walletType));
  const totalAvailable = visibleWallets.reduce((acc, w) => roundMoney(acc + w.balance), 0);
  const history = transactions.filter((tx) => visibleTypes.has(tx.walletType)).slice(0, 50);

  const partialFilteredTxs = transactions.filter((tx) => {
    if (partialTypeFilter !== 'all' && tx.type !== partialTypeFilter) return false;
    if (partialWalletFilter !== 'all' && tx.walletType !== partialWalletFilter) return false;
    return true;
  });

  function openClearModal(initialTab: 'all' | 'partial') {
    setPartialTypeFilter('all');
    setPartialWalletFilter('all');
    setPartialRevertBalances(false);
    setSelectedClearIds(transactions.map((tx) => tx.id));
    setClearModalTab(initialTab);
  }

  async function handleDeleteAllRecordsOnly() {
    if (deleteAllBusy || transactions.length === 0) return;
    setDeleteAllBusy(true);
    try {
      await onClearTransactions(
        transactions.map((tx) => tx.id),
        'keep'
      );
    } finally {
      setDeleteAllBusy(false);
    }
  }

  function applyPartialFilter(nextType: 'all' | WalletTxType, nextWallet: 'all' | WalletType) {
    setPartialTypeFilter(nextType);
    setPartialWalletFilter(nextWallet);
    const matching = transactions
      .filter((tx) => {
        if (nextType !== 'all' && tx.type !== nextType) return false;
        if (nextWallet !== 'all' && tx.walletType !== nextWallet) return false;
        return true;
      })
      .map((tx) => tx.id);
    setSelectedClearIds(matching);
  }

  function togglePartialTxSelection(txId: string) {
    setSelectedClearIds((prev) =>
      prev.includes(txId) ? prev.filter((id) => id !== txId) : [...prev, txId]
    );
  }

  function openAction(wallet: WalletRecord, actionMode: WalletTxType) {
    setActiveWalletId(wallet.id);
    setMode(actionMode);
    setAmountInput('');
    setNoteInput('');
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!activeWallet) return;
    const val = parseDecimalAmount(amountInput);
    if (!Number.isFinite(val) || val <= 0) {
      setError('Please enter an amount greater than zero.');
      return;
    }
    if (mode === 'withdraw' && activeWallet.balance <= 0) {
      setError('This wallet has 0 balance. Add money first before withdrawing.');
      return;
    }
    if (mode === 'withdraw' && val > activeWallet.balance + 0.005) {
      setError(
        hideAmounts
          ? 'Not enough balance in this wallet.'
          : `Not enough balance. Available: ${formatMoney(activeWallet.balance, activeWallet.currency)}`
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onTransaction(activeWallet, mode, val, noteInput);
      setActiveWalletId(null);
      setAmountInput('');
      setNoteInput('');
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not save the transaction. Please try again.'
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div dir="ltr" className={`${scaleCfg.stackGapClass} text-left`}>
      {/* Total balance + dedicated independent inside-Wallets privacy button */}
      <div className={`${panelSurface} border border-slate-200/80 dark:border-slate-800 rounded-3xl ${scaleCfg.panelPadClass} shadow-[0_6px_28px_-8px_rgba(15,23,42,0.07)] flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-4 min-w-0">
          <WalletHeroIcon size={Math.round(avatarCfg.walletLogoPx * 1.22)} />
          <div className="min-w-0">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Balance</p>
            <p className={`${scaleCfg.heroAmountClass} font-extrabold text-slate-900 dark:text-white font-mono-num tracking-tight truncate`}>
              {formatDisplayMoney(totalAvailable, defaultCurrency, hideAmounts)}
            </p>
          </div>
        </div>
        {showPrivacyToggle && onToggleHideAmounts && (
          <button
            type="button"
            data-no-swipe="true"
            onClick={(e) => {
              e.stopPropagation();
              onToggleHideAmounts();
            }}
            title={hideAmounts ? 'Show wallet balances' : 'Hide wallet balances'}
            aria-label={hideAmounts ? 'Show wallet balances' : 'Hide wallet balances'}
            aria-pressed={hideAmounts}
            className={`h-10 px-3.5 rounded-2xl border-2 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer touch-manipulation select-none transition-all active:scale-95 ${
              hideAmounts
                ? `${theme.accentBg} border-transparent text-white shadow-sm`
                : 'bg-slate-50 dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {hideAmounts ? (
              <EyeOff className="w-4 h-4 shrink-0" />
            ) : (
              <Eye className="w-4 h-4 shrink-0" />
            )}
            <span>{hideAmounts ? 'Show' : 'Hide'}</span>
          </button>
        )}
      </div>

      {/* Wallet cards */}
      <div className={`${panelSurface} border border-slate-200/80 dark:border-slate-800 rounded-3xl ${scaleCfg.panelPadClass} shadow-[0_6px_28px_-8px_rgba(15,23,42,0.07)] space-y-4`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className={`${scaleCfg.panelTitleClass} font-bold text-slate-900 dark:text-white`}>My Wallets</h2>
          <div className="flex items-center gap-1.5">
            {onAddWallet && wallets.length < 20 && (
              <button
                type="button"
                data-no-swipe="true"
                onClick={(e) => {
                  e.stopPropagation();
                  setNewAppName('');
                  setNewAppIconId('app_orange_cash');
                  setNewAppBalanceInput('');
                  setNewAppError(null);
                  setAddAppModalOpen(true);
                }}
                title="Add another payment app or icon"
                aria-label="Add another payment app or icon"
                className={`h-9 px-2.5 rounded-xl ${theme.accentBg} ${theme.accentBgHover} text-white flex items-center gap-1.5 text-xs font-bold cursor-pointer touch-manipulation transition-colors shadow-2xs`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Add App</span>
              </button>
            )}
            {onChangeWalletIcon && (
              <button
                type="button"
                data-no-swipe="true"
                onClick={(e) => {
                  e.stopPropagation();
                  setIconPickerType(wallets[0]?.walletType || 'instapay');
                }}
                title="Change wallet icons"
                aria-label="Change wallet icons"
                className="h-9 px-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 flex items-center gap-1.5 text-xs font-semibold cursor-pointer touch-manipulation transition-colors"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Icons</span>
              </button>
            )}
            <button
              type="button"
              data-no-swipe="true"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPageSettings();
              }}
              title="Customize Wallets page"
              aria-label="Customize Wallets page"
              className="w-9 h-9 rounded-xl bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer touch-manipulation transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : visibleWallets.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            All wallets are hidden. You can restore them below.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleWallets.map((wallet) => {
              const walletName = getWalletName(wallet.walletType, wallet.label);
              const walletIcon = getWalletIconId(wallet.walletType);
              return (
                <div
                  key={wallet.id}
                  className={`${scaleCfg.walletCardPadClass} rounded-2xl bg-slate-50/80 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 space-y-3.5`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        type="button"
                        data-no-swipe="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onChangeWalletIcon) setIconPickerType(wallet.walletType);
                        }}
                        title={`Change ${walletName} icon`}
                        aria-label={`Change ${walletName} icon`}
                        className="shrink-0 rounded-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer touch-manipulation"
                      >
                        <WalletLogo
                          type={wallet.walletType}
                          iconId={walletIcon}
                          size={avatarCfg.walletLogoPx}
                        />
                      </button>
                      <div className="min-w-0">
                        <h3 className={`${scaleCfg.rowTitleClass} text-slate-900 dark:text-white truncate`}>
                          {walletName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Available balance
                        </p>
                      </div>
                    </div>
                    <p className={`${scaleCfg.summaryAmountClass} font-extrabold text-slate-900 dark:text-white font-mono-num shrink-0`}>
                      {formatDisplayMoney(wallet.balance, wallet.currency, hideAmounts)}
                    </p>
                  </div>

                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => openAction(wallet, 'add')}
                      className={`${scaleCfg.walletBtnHeightClass} min-w-0 px-2 text-xs font-semibold text-white ${theme.accentBg} ${theme.accentBgHover} rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors`}
                    >
                      <MoneyActionIcon kind="add" size={Math.min(22, Math.max(18, iconCfg.headerPx))} />
                      <span className="truncate">Add Money</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openAction(wallet, 'withdraw')}
                      className={`${scaleCfg.walletBtnHeightClass} min-w-0 px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors`}
                    >
                      <MoneyActionIcon kind="withdraw" size={Math.min(22, Math.max(18, iconCfg.headerPx))} />
                      <span className="truncate">Withdraw</span>
                    </button>

                    <button
                      type="button"
                      data-no-swipe="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleHidden(wallet.id, true);
                      }}
                      title="Hide wallet"
                      aria-label={`Hide ${walletName}`}
                      className={`${scaleCfg.walletBtnHeightClass} w-11 bg-white dark:bg-slate-900 border border-red-200/80 dark:border-red-900/60 hover:bg-red-50 rounded-xl flex items-center justify-center cursor-pointer touch-manipulation transition-colors`}
                    >
                      <AppIcon
                        kind="ui"
                        name="trash"
                        styleId={iconStyle}
                        sizePx={iconCfg.headerPx}
                        theme={theme}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hiddenWallets.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">Hidden wallets:</p>
            <div className="flex flex-wrap gap-2">
              {hiddenWallets.map((w) => (
                <div key={w.id} className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    data-no-swipe="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleHidden(w.id, false);
                    }}
                    className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer touch-manipulation"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{getWalletName(w.walletType, w.label)}</span>
                  </button>
                  {!isBuiltinWalletType(w.walletType) && onDeleteCustomWallet && (
                    <button
                      type="button"
                      data-no-swipe="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustomWallet(w.id);
                      }}
                      title={`Remove ${getWalletName(w.walletType, w.label)}`}
                      aria-label={`Remove ${getWalletName(w.walletType, w.label)}`}
                      className="min-h-[38px] w-9 text-red-500 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 rounded-xl flex items-center justify-center cursor-pointer touch-manipulation"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className={`${panelSurface} border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-[0_6px_28px_-8px_rgba(15,23,42,0.07)] space-y-3`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
              Transaction History
            </h2>
            {transactions.length > 0 && (
              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono-num">
                {transactions.length}
              </span>
            )}
          </div>
          {transactions.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                data-no-swipe="true"
                onClick={(e) => {
                  e.stopPropagation();
                  openClearModal('partial');
                }}
                title="Partial clear wallet transactions"
                aria-label="Partial clear wallet transactions"
                className="h-8 px-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer touch-manipulation transition-colors"
              >
                <ListChecks className="w-3.5 h-3.5 shrink-0" />
                <span>Partial</span>
              </button>
              <button
                type="button"
                data-no-swipe="true"
                disabled={deleteAllBusy}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDeleteAllRecordsOnly();
                }}
                title="Delete all transaction records"
                aria-label="Delete all transaction records"
                className="h-8 px-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-950/80 border border-red-200/70 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer touch-manipulation transition-colors disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>{deleteAllBusy ? 'Deleting...' : 'Delete All'}</span>
              </button>
            </div>
          )}
        </div>
        {history.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-5 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            No transactions yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <WalletLogo
                    type={tx.walletType}
                    iconId={getWalletIconId(tx.walletType)}
                    size={Math.round(avatarCfg.walletLogoPx * 0.74)}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {tx.type === 'add' ? 'Added to' : 'Withdrew from'}{' '}
                      {getWalletName(tx.walletType, tx.walletLabel)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {txDate(tx.createdAt)}
                      {tx.note ? ` · ${tx.note}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-sm font-bold font-mono-num ${
                      tx.type === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E85D2E]'
                    }`}
                  >
                    {hideAmounts
                      ? formatDisplayMoney(tx.amount, defaultCurrency, true)
                      : `${tx.type === 'add' ? '+' : '−'}${formatDisplayMoney(tx.amount, defaultCurrency, false)}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeletingTx(tx)}
                    title="Delete transaction"
                    aria-label="Delete transaction"
                    className={`${iconCfg.actionBtnClass} rounded-xl bg-red-50/80 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/70 flex items-center justify-center cursor-pointer transition-colors`}
                  >
                    <AppIcon
                      kind="ui"
                      name="trash"
                      styleId={iconStyle}
                      sizePx={Math.max(13, iconCfg.actionPx - 2)}
                      theme={theme}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {transactions.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              data-no-swipe="true"
              disabled={deleteAllBusy}
              onClick={(e) => {
                e.stopPropagation();
                void handleDeleteAllRecordsOnly();
              }}
              title="Delete all transaction records"
              aria-label="Delete All"
              className="w-full h-11 px-4 rounded-2xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/70 border border-red-200/70 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer touch-manipulation transition-colors disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>{deleteAllBusy ? 'Deleting...' : `Delete All (${transactions.length})`}</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete Wallet Transaction Confirmation Modal */}
      {deletingTx &&
        createPortal(
          <div
            dir="ltr"
            onClick={(e) => {
              if (e.target === e.currentTarget && !deletingBusy) setDeletingTx(null);
            }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto text-left"
            role="dialog"
            aria-modal="true"
          >
            <div
              {...deleteModalSwipe.swipeHandlers}
              style={deleteModalSwipe.cardStyle}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <AppIcon kind="ui" name="trash" styleId={iconStyle} sizePx={22} theme={theme} />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Delete Transaction
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDeletingTx(null)}
                  aria-label="Close"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-3.5 space-y-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {deletingTx.type === 'add' ? 'Added to' : 'Withdrew from'}{' '}
                  {getWalletName(deletingTx.walletType, deletingTx.walletLabel)}
                </p>
                <p
                  className={`text-base font-extrabold font-mono-num ${
                    deletingTx.type === 'add' ? 'text-emerald-600' : 'text-[#E85D2E]'
                  }`}
                >
                  {hideAmounts
                    ? formatDisplayMoney(deletingTx.amount, defaultCurrency, true)
                    : `${deletingTx.type === 'add' ? '+' : '−'}${formatDisplayMoney(deletingTx.amount, defaultCurrency, false)}`}
                </p>
                {deletingTx.note && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {deletingTx.note}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={deletingBusy}
                  onClick={async () => {
                    setDeletingBusy(true);
                    try {
                      await onDeleteTransaction(deletingTx, false);
                      setDeletingTx(null);
                    } finally {
                      setDeletingBusy(false);
                    }
                  }}
                  className="w-full h-11 px-4 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-2xl cursor-pointer transition-colors"
                >
                  {deletingBusy ? 'Deleting...' : 'Delete Record Only (Keep Balance)'}
                </button>
                <button
                  type="button"
                  disabled={deletingBusy}
                  onClick={async () => {
                    setDeletingBusy(true);
                    try {
                      await onDeleteTransaction(deletingTx, true);
                      setDeletingTx(null);
                    } finally {
                      setDeletingBusy(false);
                    }
                  }}
                  className="w-full h-11 px-4 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 disabled:opacity-60 rounded-2xl cursor-pointer transition-colors"
                >
                  Delete & Revert Wallet Balance
                </button>
                <button
                  type="button"
                  disabled={deletingBusy}
                  onClick={() => setDeletingTx(null)}
                  className="w-full h-10 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Add / Withdraw modal */}
      {activeWallet &&
        createPortal(
          <div
            dir="ltr"
            onClick={(e) => {
              if (e.target === e.currentTarget && !submitting) setActiveWalletId(null);
            }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto text-left"
            role="dialog"
            aria-modal="true"
          >
            <div
              {...walletModalSwipe.swipeHandlers}
              style={walletModalSwipe.cardStyle}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md max-h-[88vh] overflow-y-auto p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <WalletLogo
                    type={activeWallet.walletType}
                    iconId={getWalletIconId(activeWallet.walletType)}
                    size={44}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {mode === 'add' ? 'Add Money' : 'Withdraw Money'} ·{' '}
                      {getWalletName(activeWallet.walletType, activeWallet.label)}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono-num">
                      Available: {formatDisplayMoney(activeWallet.balance, activeWallet.currency, hideAmounts)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveWalletId(null)}
                  aria-label="Close"
                  className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode switcher inside modal */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setMode('add');
                    setError(null);
                  }}
                  className={`h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'add'
                      ? `${theme.accentBg} text-white shadow-xs`
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Add Money
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('withdraw');
                    setError(null);
                  }}
                  className={`h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'withdraw'
                      ? 'bg-[#E85D2E] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Withdraw Money
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div
                    role="alert"
                    className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-xl p-3"
                  >
                    {error}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {mode === 'add' ? 'Amount to add' : 'Amount to withdraw'}
                    </label>
                    {mode === 'withdraw' && activeWallet.balance > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAmountInput(String(activeWallet.balance));
                          setError(null);
                        }}
                        className={`text-[11px] font-bold ${theme.accentText} hover:underline cursor-pointer`}
                      >
                        Withdraw All
                        {!hideAmounts && ` (${formatMoney(activeWallet.balance, activeWallet.currency)})`}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    value={amountInput}
                    onChange={(e) => {
                      setAmountInput(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="0.00"
                    className="w-full h-11 px-3.5 text-base font-mono-num bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    maxLength={140}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="e.g. customer transfer, expenses..."
                    className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveWalletId(null)}
                    className="flex-1 h-11 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`flex-[2] h-11 text-sm font-semibold text-white ${
                      mode === 'withdraw'
                        ? 'bg-[#E85D2E] hover:bg-[#d35124]'
                        : `${theme.accentBg} ${theme.accentBgHover}`
                    } disabled:opacity-60 rounded-2xl cursor-pointer transition-colors`}
                  >
                    {submitting ? 'Saving...' : mode === 'add' ? 'Add Money' : 'Withdraw Money'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Colorful Pixar Wallet Icons Picker Modal */}
      {iconPickerType &&
        onChangeWalletIcon &&
        createPortal(
          <div
            dir="ltr"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIconPickerType(null);
            }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto text-left"
            role="dialog"
            aria-modal="true"
            aria-label="Choose Wallet Icon"
          >
            <div
              {...iconPickerSwipe.swipeHandlers}
              style={iconPickerSwipe.cardStyle}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Palette className={`w-4 h-4 shrink-0 ${theme.accentText}`} />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    Wallet Icons
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIconPickerType(null)}
                  aria-label="Close"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Wallet Tabs (Built-in + Added Applications) */}
              <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                {wallets.map((w) => {
                  const wt = w.walletType;
                  const active = iconPickerType === wt;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setIconPickerType(wt)}
                      className={`h-9 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        active
                          ? `${theme.accentBg} text-white shadow-xs`
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <WalletLogo type={wt} iconId={getWalletIconId(wt)} size={20} />
                      <span className="truncate max-w-[90px]">{getWalletName(wt, w.label)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Icon Options for Selected Wallet */}
              <div className="grid grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-0.5">
                {(isBuiltinWalletType(iconPickerType)
                  ? WALLET_ICON_OPTIONS.filter((opt) => opt.walletType === iconPickerType)
                  : [
                      ...CUSTOM_APP_ICON_OPTIONS,
                      ...WALLET_ICON_OPTIONS.filter((opt) => opt.walletType !== 'custom'),
                    ]
                ).map((opt) => {
                  const selected = getWalletIconId(iconPickerType) === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChangeWalletIcon(iconPickerType, opt.id)}
                      className={`relative p-3 rounded-2xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                        selected
                          ? `${theme.accentBorder} bg-slate-50 dark:bg-slate-800 shadow-xs scale-[1.02]`
                          : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {opt.isOfficial && (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[8px] font-bold leading-none">
                          Official
                        </span>
                      )}
                      {selected && (
                        <span className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full ${theme.accentBg} text-white flex items-center justify-center`}>
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                      <WalletLogo type={iconPickerType} iconId={opt.id} size={52} />
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 text-center leading-tight">
                        {opt.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIconPickerType(null)}
                className={`w-full h-10 text-xs font-bold text-white ${theme.accentBg} ${theme.accentBgHover} rounded-2xl cursor-pointer transition-colors`}
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Clear Wallet History Modal (Full Clear + Partial Clear — Keeps All Settings Intact) */}
      {clearModalTab &&
        createPortal(
          <div
            dir="ltr"
            onClick={(e) => {
              if (e.target === e.currentTarget && !clearBusy) setClearModalTab(null);
            }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto text-left"
            role="dialog"
            aria-modal="true"
            aria-label="Clear Wallet History"
          >
            <div
              {...clearModalSwipe.swipeHandlers}
              style={clearModalSwipe.cardStyle}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      Clear Wallet History
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      All app settings & icons stay untouched
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={clearBusy}
                  onClick={() => setClearModalTab(null)}
                  aria-label="Close"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Switcher: Clear All vs Partial Clear */}
              <div className="px-5 pb-3 shrink-0">
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setClearModalTab('all')}
                    className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      clearModalTab === 'all'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All ({transactions.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setClearModalTab('partial')}
                    className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      clearModalTab === 'partial'
                        ? `${theme.accentBg} text-white shadow-xs`
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    <span>Partial Clear</span>
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {clearModalTab === 'all' ? (
                <div className="px-5 pb-5 space-y-3.5 overflow-y-auto">
                  <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-3.5 space-y-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      Clear all {transactions.length} wallet transaction records (balances stay untouched)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Deposits</p>
                        <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono-num mt-0.5">
                          {transactions.filter((tx) => tx.type === 'add').length}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Withdrawals</p>
                        <p className="text-sm font-extrabold text-[#E85D2E] font-mono-num mt-0.5">
                          {transactions.filter((tx) => tx.type === 'withdraw').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={clearBusy || transactions.length === 0}
                      onClick={async () => {
                        setClearBusy(true);
                        try {
                          await onClearTransactions(
                            transactions.map((tx) => tx.id),
                            'keep'
                          );
                          setClearModalTab(null);
                        } finally {
                          setClearBusy(false);
                        }
                      }}
                      className="w-full min-h-[44px] px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-2xl cursor-pointer transition-colors"
                    >
                      {clearBusy ? 'Clearing...' : 'Clear All Records Only (Keep Balances)'}
                    </button>

                    <button
                      type="button"
                      disabled={clearBusy}
                      onClick={() => setClearModalTab(null)}
                      className="w-full h-10 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-5 pb-5 flex flex-col gap-3 min-h-0 flex-1">
                  {/* Filter by Transaction Type */}
                  <div className="space-y-1.5 shrink-0">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Filter by Type
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: 'all', label: 'All Types' },
                          { id: 'add', label: 'Deposits (+)' },
                          { id: 'withdraw', label: 'Withdrawals (−)' },
                        ] as { id: 'all' | WalletTxType; label: string }[]
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => applyPartialFilter(opt.id, partialWalletFilter)}
                          className={`h-8 px-2 rounded-xl text-[11px] font-bold cursor-pointer transition-colors ${
                            partialTypeFilter === opt.id
                              ? `${theme.accentBg} text-white`
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter by Wallet */}
                  <div className="space-y-1.5 shrink-0">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Filter by Wallet
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          { id: 'all', label: 'All' },
                          ...wallets.map((w) => ({
                            id: w.walletType,
                            label: getWalletName(w.walletType, w.label),
                          })),
                        ] as { id: 'all' | WalletType; label: string }[]
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => applyPartialFilter(partialTypeFilter, opt.id)}
                          className={`h-8 px-2.5 rounded-xl text-[11px] font-bold truncate max-w-[120px] cursor-pointer transition-colors ${
                            partialWalletFilter === opt.id
                              ? `${theme.accentBg} text-white`
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select / Deselect All Matching */}
                  <div className="flex items-center justify-between text-[11px] shrink-0">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      Selected: <strong className="font-mono-num">{selectedClearIds.length}</strong> / {partialFilteredTxs.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedClearIds(partialFilteredTxs.map((t) => t.id))}
                        className={`font-bold ${theme.accentText} cursor-pointer`}
                      >
                        Select All
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <button
                        type="button"
                        onClick={() => setSelectedClearIds([])}
                        className="font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                      >
                        None
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Transaction Checklist */}
                  <div className="flex-1 min-h-[120px] max-h-[220px] overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                    {partialFilteredTxs.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">
                        No transactions match this filter.
                      </p>
                    ) : (
                      partialFilteredTxs.map((tx) => {
                        const checked = selectedClearIds.includes(tx.id);
                        return (
                          <button
                            key={tx.id}
                            type="button"
                            onClick={() => togglePartialTxSelection(tx.id)}
                            className={`w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors ${
                              checked
                                ? 'bg-red-50/60 dark:bg-red-950/25'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  checked
                                    ? 'bg-red-600 border-red-600 text-white'
                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                                }`}
                              >
                                {checked && <Check className="w-3 h-3" />}
                              </span>
                              <WalletLogo
                                type={tx.walletType}
                                iconId={getWalletIconId(tx.walletType)}
                                size={26}
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                                  {tx.type === 'add' ? 'Added' : 'Withdrew'} ·{' '}
                                  {getWalletName(tx.walletType, tx.walletLabel)}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {txDate(tx.createdAt)}
                                  {tx.note ? ` · ${tx.note}` : ''}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-xs font-bold font-mono-num shrink-0 ${
                                tx.type === 'add'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-[#E85D2E]'
                              }`}
                            >
                              {hideAmounts
                                ? formatDisplayMoney(tx.amount, defaultCurrency, true)
                                : `${tx.type === 'add' ? '+' : '−'}${formatDisplayMoney(tx.amount, defaultCurrency, false)}`}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Balance behavior toggle */}
                  <label className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 cursor-pointer shrink-0">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Also revert affected wallet balances
                    </span>
                    <input
                      type="checkbox"
                      checked={partialRevertBalances}
                      onChange={(e) => setPartialRevertBalances(e.target.checked)}
                      className="w-4 h-4 accent-red-600 cursor-pointer"
                    />
                  </label>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-[1fr_auto] gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={clearBusy || selectedClearIds.length === 0}
                      onClick={async () => {
                        setClearBusy(true);
                        try {
                          await onClearTransactions(
                            selectedClearIds,
                            partialRevertBalances ? 'revert' : 'keep'
                          );
                          setClearModalTab(null);
                        } finally {
                          setClearBusy(false);
                        }
                      }}
                      className="h-11 px-4 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-2xl cursor-pointer transition-colors"
                    >
                      {clearBusy
                        ? 'Clearing...'
                        : `Clear ${selectedClearIds.length} Selected`}
                    </button>
                    <button
                      type="button"
                      disabled={clearBusy}
                      onClick={() => setClearModalTab(null)}
                      className="h-11 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Add Another Application / Wallet Modal */}
      {addAppModalOpen &&
        onAddWallet &&
        createPortal(
          <div
            dir="ltr"
            onClick={(e) => {
              if (e.target === e.currentTarget && !newAppBusy) setAddAppModalOpen(false);
            }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto text-left"
            role="dialog"
            aria-modal="true"
            aria-label="Add Another Application"
          >
            <div
              {...addAppModalSwipe.swipeHandlers}
              style={addAppModalSwipe.cardStyle}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <WalletLogo iconId={newAppIconId} size={40} />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      Add Application / Wallet
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Add a new app icon like Cash, Vodafone or InstaPay
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={newAppBusy}
                  onClick={() => setAddAppModalOpen(false)}
                  aria-label="Close"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const cleanName = newAppName.trim();
                  if (!cleanName) {
                    setNewAppError('Please enter an application name.');
                    return;
                  }
                  let initBal = 0;
                  if (newAppBalanceInput.trim()) {
                    const parsed = parseDecimalAmount(newAppBalanceInput);
                    if (!Number.isFinite(parsed) || parsed < 0) {
                      setNewAppError('Please enter a valid starting balance.');
                      return;
                    }
                    initBal = parsed;
                  }
                  setNewAppBusy(true);
                  setNewAppError(null);
                  try {
                    await onAddWallet(cleanName, newAppIconId, initBal);
                    setAddAppModalOpen(false);
                  } catch (err) {
                    setNewAppError(
                      err instanceof Error && err.message
                        ? err.message
                        : 'Could not add application.'
                    );
                  } finally {
                    setNewAppBusy(false);
                  }
                }}
                className="px-5 pb-5 space-y-4 overflow-y-auto flex-1 min-h-0"
              >
                {newAppError && (
                  <div
                    role="alert"
                    className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-xl p-3"
                  >
                    {newAppError}
                  </div>
                )}

                {/* Quick App Presets */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Popular Apps
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_WALLET_APPS.map((preset) => {
                      const active =
                        newAppName.trim().toLowerCase() === preset.name.toLowerCase() &&
                        newAppIconId === preset.iconId;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setNewAppName(preset.name);
                            setNewAppIconId(preset.iconId);
                            if (newAppError) setNewAppError(null);
                          }}
                          className={`h-8 px-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border cursor-pointer transition-colors ${
                            active
                              ? `${theme.accentBorder} ${theme.accentSoftBg} text-slate-900 dark:text-white`
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <WalletLogo iconId={preset.iconId} size={18} />
                          <span>{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Application Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Application Name
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={newAppName}
                    onChange={(e) => {
                      setNewAppName(e.target.value);
                      if (newAppError) setNewAppError(null);
                    }}
                    placeholder="e.g. Orange Cash, Telda, Bank Card..."
                    className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600"
                  />
                </div>

                {/* Choose Icon */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Choose Icon
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-h-[210px] overflow-y-auto p-0.5">
                    {[
                      ...CUSTOM_APP_ICON_OPTIONS,
                      ...WALLET_ICON_OPTIONS.filter((o) => o.walletType !== 'custom'),
                    ].map((opt) => {
                      const selected = newAppIconId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setNewAppIconId(opt.id)}
                          className={`relative p-2.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                            selected
                              ? `${theme.accentBorder} bg-slate-50 dark:bg-slate-800 shadow-xs`
                              : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          {selected && (
                            <span
                              className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full ${theme.accentBg} text-white flex items-center justify-center`}
                            >
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                          <WalletLogo iconId={opt.id} size={42} />
                          <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 text-center leading-tight">
                            {opt.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Starting Balance */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Starting Balance (optional)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newAppBalanceInput}
                    onChange={(e) => {
                      setNewAppBalanceInput(e.target.value);
                      if (newAppError) setNewAppError(null);
                    }}
                    placeholder="0.00"
                    className="w-full h-11 px-3.5 text-sm font-mono-num bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={newAppBusy}
                    onClick={() => setAddAppModalOpen(false)}
                    className="flex-1 h-11 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={newAppBusy}
                    className={`flex-[2] h-11 text-xs font-bold text-white ${theme.accentBg} ${theme.accentBgHover} disabled:opacity-60 rounded-2xl cursor-pointer transition-colors`}
                  >
                    {newAppBusy ? 'Adding...' : 'Add Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
