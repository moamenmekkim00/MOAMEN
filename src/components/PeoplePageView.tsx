import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { resolveAvatarSrc } from '../data/avatars';
import {
  getAvatarSizeConfig,
  getIconSizeConfig,
  getPageScaleConfig,
  IconSize,
  IconStyleId,
  PageScaleId,
  PersonAlertFormat,
  PersonAlertLevel,
} from '../data/customization';
import { AppLanguage, STRINGS, ThemeConfig } from '../data/themes';
import {
  Currency,
  DebtDirection,
  DebtRecord,
  formatArabicDate,
  formatDisplayMoney,
  formatDisplayNumber,
  formatDueCountdown,
  getCollectionUrgency,
  getRemainingAmount,
  roundMoney,
} from '../types/debt';
import { AppIcon } from './AppIcon';
import { PersonAlertBadge } from './PersonAlertBadge';

type FilterMode = 'all' | 'unpaid' | 'settled';

interface PeoplePageViewProps {
  direction: DebtDirection;
  debts: DebtRecord[];
  loading: boolean;
  defaultCurrency: Currency;
  theme: ThemeConfig;
  lang: AppLanguage;
  pageScale?: PageScaleId;
  iconSize?: IconSize;
  avatarSize?: IconSize;
  iconStyle: IconStyleId;
  personAlertFormat: PersonAlertFormat;
  hideAmounts?: boolean;
  hasWallpaper?: boolean;
  wallpaperIsDark?: boolean;
  onSelectDebt: (debt: DebtRecord) => void;
  onLogPayment: (debt: DebtRecord) => void;
  onDeleteDebt: (debt: DebtRecord) => void;
  onAddNew: () => void;
  onOpenPageSettings: () => void;
}

export function PeoplePageView({
  direction,
  debts,
  loading,
  defaultCurrency,
  theme,
  lang,
  pageScale,
  iconSize,
  avatarSize,
  iconStyle,
  personAlertFormat,
  hideAmounts = false,
  hasWallpaper = false,
  wallpaperIsDark = false,
  onSelectDebt,
  onLogPayment,
  onDeleteDebt,
  onAddNew,
  onOpenPageSettings,
}: PeoplePageViewProps) {
  const t = STRINGS[lang];
  const isAr = lang === 'ar';
  const scaleCfg = getPageScaleConfig(pageScale);
  const iconCfg = getIconSizeConfig(iconSize);
  const avatarCfg = getAvatarSizeConfig(avatarSize);
  const cardSurface = hasWallpaper
    ? 'bg-white/92 dark:bg-slate-900/90 backdrop-blur-[2px]'
    : 'bg-white/95 dark:bg-slate-900';
  const panelSurface = hasWallpaper
    ? 'bg-white/92 dark:bg-slate-900/90 backdrop-blur-[2px]'
    : 'bg-white dark:bg-slate-900';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [quickPerson, setQuickPerson] = useState<string | null>(null);

  const scopedDebts = useMemo(
    () => debts.filter((d) => d.direction === direction),
    [debts, direction]
  );

  // Aggregate summary by currency (primarily defaultCurrency or first currency present)
  const summary = useMemo(() => {
    let total = 0;
    let paid = 0;
    let remaining = 0;
    let displayCurrency: string = defaultCurrency;

    const firstWithData = scopedDebts[0];
    if (firstWithData && !scopedDebts.some((d) => d.currency === defaultCurrency)) {
      displayCurrency = firstWithData.currency;
    }

    for (const d of scopedDebts) {
      total = roundMoney(total + d.totalAmount);
      paid = roundMoney(paid + d.paidAmount);
      remaining = roundMoney(remaining + getRemainingAmount(d));
    }

    return { total, paid, remaining, displayCurrency };
  }, [scopedDebts, defaultCurrency]);

  // Unique quick-access people strip
  const quickPeople = useMemo(() => {
    const rank: Record<PersonAlertLevel, number> = { none: 0, reminder: 1, warning: 2, urgent: 3 };
    const map = new Map<
      string,
      { name: string; avatarId: string; hasActive: boolean; alertLevel: PersonAlertLevel }
    >();
    for (const d of scopedDebts) {
      const key = d.debtorName.trim();
      const lvl: PersonAlertLevel = d.alertLevel || 'none';
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          name: key,
          avatarId: d.avatarId,
          hasActive: d.status !== 'محصل',
          alertLevel: lvl,
        });
      } else {
        if (d.status !== 'محصل') existing.hasActive = true;
        if (rank[lvl] > rank[existing.alertLevel]) existing.alertLevel = lvl;
      }
    }
    return Array.from(map.values());
  }, [scopedDebts]);

  const filteredDebts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scopedDebts.filter((d) => {
      if (filter === 'unpaid' && d.status === 'محصل') return false;
      if (filter === 'settled' && d.status !== 'محصل') return false;
      if (quickPerson && d.debtorName.trim() !== quickPerson) return false;
      if (q) {
        const hay = `${d.debtorName} ${d.title} ${d.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [scopedDebts, filter, quickPerson, search]);

  return (
    <div className={scaleCfg.stackGapClass}>
      {/* Hero Total Remaining (matches screenshot top balance) */}
      <div className="space-y-1">
        <p
          className={`${scaleCfg.heroAmountClass} font-extrabold font-mono-num tracking-tight leading-none ${
            wallpaperIsDark ? 'text-white drop-shadow-xs' : 'text-slate-900 dark:text-white'
          }`}
        >
          {formatDisplayMoney(summary.remaining, summary.displayCurrency, hideAmounts)}
        </p>
        <p
          className={`text-sm ${
            wallpaperIsDark ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {direction === 'receivable' ? t.totalRemaining : t.totalIOweRemaining}
        </p>
      </div>

      {/* Two Summary Cards Side-by-Side (matches screenshot) */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className={`${cardSurface} border border-slate-200/70 dark:border-slate-800 rounded-2xl ${scaleCfg.summaryCardPadClass} shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]`}>
          <p className={`${scaleCfg.summaryAmountClass} font-bold text-slate-900 dark:text-white font-mono-num`}>
            {formatDisplayMoney(summary.total, summary.displayCurrency, hideAmounts)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {direction === 'receivable' ? t.totalOwed : t.totalIOwe}
          </p>
        </div>

        <div className={`${cardSurface} border border-slate-200/70 dark:border-slate-800 rounded-2xl ${scaleCfg.summaryCardPadClass} shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]`}>
          <p className={`${scaleCfg.summaryAmountClass} font-bold text-slate-900 dark:text-white font-mono-num`}>
            {formatDisplayMoney(summary.paid, summary.displayCurrency, hideAmounts)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {direction === 'receivable' ? t.paid : t.iPaid}
          </p>
        </div>
      </div>

      {/* Horizontal Quick People Strip (matches screenshot) */}
      {quickPeople.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto py-1 no-scrollbar">
          {quickPeople.map((person) => {
            const active = quickPerson === person.name;
            return (
              <button
                key={person.name}
                type="button"
                onClick={() => setQuickPerson(active ? null : person.name)}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
              >
                <div
                  className={`relative ${avatarCfg.quickBoxClass} rounded-2xl flex items-center justify-center p-1 transition-all ${
                    active
                      ? `${theme.accentBg} shadow-md scale-105`
                      : `${theme.accentSoftBg} dark:bg-slate-800 group-hover:scale-105`
                  }`}
                >
                  <img
                    src={resolveAvatarSrc(person.avatarId)}
                    alt={person.name}
                    className={`${avatarCfg.quickAvatarClass} rounded-full object-cover transition-all`}
                  />
                  {person.alertLevel !== 'none' && (
                    <span
                      aria-hidden="true"
                      className={`absolute -top-0.5 -end-0.5 w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                        person.alertLevel === 'urgent'
                          ? 'bg-red-500'
                          : person.alertLevel === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-sky-500'
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`text-xs max-w-[64px] truncate ${
                    active
                      ? wallpaperIsDark
                        ? 'font-bold text-white drop-shadow-xs'
                        : `font-bold ${theme.accentText}`
                      : wallpaperIsDark
                      ? 'text-white/85'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {person.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main White Rounded People Panel (matches screenshot) */}
      <section className={`${panelSurface} border border-slate-200/70 dark:border-slate-800 rounded-3xl ${scaleCfg.panelPadClass} shadow-[0_8px_30px_-10px_rgba(15,23,42,0.08)] space-y-4`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className={`${scaleCfg.panelTitleClass} font-bold text-slate-900 dark:text-white`}>
            {direction === 'receivable' ? t.people : t.payablesTitle}
          </h2>
          <div className="flex items-center gap-2">
            {quickPerson && (
              <button
                type="button"
                onClick={() => setQuickPerson(null)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
              >
                {isAr ? `عرض الكل (${scopedDebts.length})` : 'Show all'}
              </button>
            )}
            <button
              type="button"
              onClick={onOpenPageSettings}
              title={isAr ? 'إعدادات هذه الصفحة' : 'Customize this page'}
              aria-label={isAr ? 'إعدادات هذه الصفحة' : 'Customize this page'}
              className="w-9 h-9 rounded-xl bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <span
            aria-hidden="true"
            className={`absolute top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center ${
              isAr ? 'right-3' : 'left-3'
            }`}
          >
            <AppIcon
              kind="ui"
              name="search"
              styleId={iconStyle}
              sizePx={Math.min(20, iconCfg.actionPx)}
              theme={theme}
            />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full h-11 text-sm bg-slate-100/80 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
              isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'
            }`}
          />
        </div>

        {/* Filter Pills (matches screenshot All / Unpaid / Settled) */}
        <div className="flex items-center gap-2">
          {(
            [
              { key: 'all', label: t.filterAll },
              { key: 'unpaid', label: t.filterUnpaid },
              { key: 'settled', label: t.filterSettled },
            ] as { key: FilterMode; label: string }[]
          ).map((btn) => {
            const active = filter === btn.key;
            return (
              <button
                key={btn.key}
                type="button"
                onClick={() => setFilter(btn.key)}
                className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? `${theme.accentBg} text-white shadow-xs`
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* People List Rows */}
        {loading ? (
          <div className="space-y-3 pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredDebts.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {scopedDebts.length === 0
                ? direction === 'receivable'
                  ? t.emptyReceivables
                  : t.emptyPayables
                : isAr
                ? 'لا توجد نتائج مطابقة للبحث.'
                : 'No matching entries found.'}
            </p>
            {scopedDebts.length === 0 && (
              <button
                type="button"
                onClick={onAddNew}
                className={`min-h-[42px] px-5 py-2 text-xs font-semibold text-white ${theme.accentBg} ${theme.accentBgHover} rounded-full cursor-pointer`}
              >
                {isAr ? '+ إضافة شخص الآن' : '+ Add Person'}
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDebts.map((debt) => {
              const remaining = getRemainingAmount(debt);
              const progress = Math.min(100, Math.round((debt.paidAmount / debt.totalAmount) * 100));
              const urgency = getCollectionUrgency(debt);
              const isSettled = debt.status === 'محصل';

              return (
                <div key={debt.id} className={`${scaleCfg.rowPadClass} space-y-2.5`}>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectDebt(debt)}
                      className="flex items-center gap-3.5 min-w-0 flex-1 text-start cursor-pointer group"
                    >
                      <img
                        src={resolveAvatarSrc(debt.avatarId)}
                        alt={debt.debtorName}
                        className={`${avatarCfg.avatarListClass} rounded-full object-cover shrink-0 transition-all`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className={`${scaleCfg.rowTitleClass} text-slate-900 dark:text-white group-hover:underline truncate`}>
                            {debt.debtorName}
                          </p>
                          <PersonAlertBadge
                            level={debt.alertLevel}
                            note={debt.alertNote}
                            format={personAlertFormat}
                            lang={lang}
                            placement="inline"
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono-num">
                          {direction === 'receivable'
                            ? t.paidOf(
                                formatDisplayNumber(debt.paidAmount, hideAmounts),
                                formatDisplayNumber(debt.totalAmount, hideAmounts)
                              )
                            : t.iPaidOf(
                                formatDisplayNumber(debt.paidAmount, hideAmounts),
                                formatDisplayNumber(debt.totalAmount, hideAmounts)
                              )}
                        </p>
                        <p
                          className={`text-[11px] mt-0.5 ${
                            urgency === 'overdue'
                              ? 'text-red-600 dark:text-red-400 font-semibold'
                              : isSettled
                              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {t.due}: {formatArabicDate(debt.dueDate, lang)} · {formatDueCountdown(debt, lang)}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className={isAr ? 'text-left' : 'text-right'}>
                        <p
                          className={`${scaleCfg.rowAmountClass} font-mono-num ${
                            isSettled
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-[#E85D2E]'
                          }`}
                        >
                          {isSettled
                            ? t.settledLabel
                            : formatDisplayMoney(remaining, debt.currency, hideAmounts)}
                        </p>
                        {!isSettled && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {t.left}
                          </p>
                        )}
                      </div>

                      {!isSettled ? (
                        <button
                          type="button"
                          onClick={() => onLogPayment(debt)}
                          title={isAr ? 'تسجيل دفعة' : 'Log payment'}
                          aria-label={isAr ? `تسجيل دفعة لـ ${debt.debtorName}` : `Pay ${debt.debtorName}`}
                          className={`${iconCfg.actionBtnClass} rounded-full flex items-center justify-center ${theme.accentSoftBg} dark:bg-slate-800 hover:scale-110 transition-transform cursor-pointer`}
                        >
                          <AppIcon
                            kind="ui"
                            name="plus"
                            styleId={iconStyle}
                            sizePx={iconCfg.actionPx}
                            theme={theme}
                          />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onDeleteDebt(debt)}
                          title={isAr ? 'حذف السجل المكتمل' : 'Delete settled'}
                          aria-label={isAr ? `حذف ${debt.debtorName}` : `Delete ${debt.debtorName}`}
                          className={`${iconCfg.actionBtnClass} rounded-full flex items-center justify-center bg-red-50/80 dark:bg-slate-800 hover:bg-red-100 hover:scale-110 transition-all cursor-pointer`}
                        >
                          <AppIcon
                            kind="ui"
                            name="trash"
                            styleId={iconStyle}
                            sizePx={iconCfg.actionPx}
                            theme={theme}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  <PersonAlertBadge
                    level={debt.alertLevel}
                    note={debt.alertNote}
                    format={personAlertFormat}
                    lang={lang}
                    placement="below"
                  />

                  {/* Progress meter bar (fills as payments are recorded) */}
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${theme.progressFill}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
