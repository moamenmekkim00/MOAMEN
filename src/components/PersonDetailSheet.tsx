import { useEffect, useState } from 'react';
import { BellRing, Check, X } from 'lucide-react';
import { resolveAvatarSrc } from '../data/avatars';
import {
  getIconSizeConfig,
  IconSize,
  IconStyleId,
  PERSON_ALERT_LEVEL_OPTIONS,
  PersonAlertFormat,
  PersonAlertLevel,
  sanitizePersonAlertLevel,
} from '../data/customization';
import { AppLanguage, ThemeConfig } from '../data/themes';
import {
  buildWhatsAppReminder,
  ChargeRecord,
  DebtRecord,
  FIELD_LIMITS,
  formatArabicDate,
  formatDisplayMoney,
  formatDueCountdown,
  getRemainingAmount,
  PaymentRecord,
} from '../types/debt';
import { AppIcon } from './AppIcon';
import { PersonAlertBadge } from './PersonAlertBadge';
import { useSwipeBack } from '../hooks/useSwipeBack';

interface PersonDetailSheetProps {
  debt: DebtRecord | null;
  payments: PaymentRecord[];
  charges: ChargeRecord[];
  theme: ThemeConfig;
  lang: AppLanguage;
  iconSize?: IconSize;
  iconStyle: IconStyleId;
  personAlertFormat: PersonAlertFormat;
  notificationsEnabled: boolean;
  notifyTime: string;
  hideAmounts?: boolean;
  onClose: () => void;
  onLogPayment: (debt: DebtRecord) => void;
  onAddCharge: (debt: DebtRecord) => void;
  onEdit: (debt: DebtRecord) => void;
  onDelete: (debt: DebtRecord) => void;
  onQuickUpdateAlert: (debt: DebtRecord, alertLevel: PersonAlertLevel, alertNote: string) => void;
}

export function PersonDetailSheet({
  debt,
  payments,
  charges,
  theme,
  lang,
  iconSize,
  iconStyle,
  personAlertFormat,
  notificationsEnabled,
  notifyTime,
  hideAmounts = false,
  onClose,
  onLogPayment,
  onAddCharge,
  onEdit,
  onDelete,
  onQuickUpdateAlert,
}: PersonDetailSheetProps) {
  const [copied, setCopied] = useState(false);
  const [draftAlertLevel, setDraftAlertLevel] = useState<PersonAlertLevel>('none');
  const [draftAlertNote, setDraftAlertNote] = useState('');
  const [alertSaved, setAlertSaved] = useState(false);
  const { swipeHandlers, cardStyle } = useSwipeBack(Boolean(debt), onClose);

  useEffect(() => {
    if (!debt) return;
    setDraftAlertLevel(sanitizePersonAlertLevel(debt.alertLevel));
    setDraftAlertNote(debt.alertNote || '');
    setAlertSaved(false);
  }, [debt]);

  if (!debt) return null;

  const iconCfg = getIconSizeConfig(iconSize);

  const isAr = lang === 'ar';
  const remaining = getRemainingAmount(debt);
  const progress = Math.min(100, Math.round((debt.paidAmount / debt.totalAmount) * 100));

  // Unified history: original amount + every added amount (charge) + every payment
  const chargesSum = charges.reduce((acc, c) => acc + c.amount, 0);
  const initialAmount = Math.round((debt.totalAmount - chargesSum) * 100) / 100;
  type HistoryEntry = {
    key: string;
    kind: 'initial' | 'charge' | 'payment';
    amount: number;
    date: string;
    note: string;
  };
  const history: HistoryEntry[] = [
    ...(initialAmount > 0.005
      ? [{ key: 'initial', kind: 'initial' as const, amount: initialAmount, date: debt.givenDate, note: debt.title }]
      : []),
    ...charges.map((c) => ({
      key: `c-${c.id}`,
      kind: 'charge' as const,
      amount: c.amount,
      date: c.chargeDate,
      note: c.note,
    })),
    ...payments.map((p) => ({
      key: `p-${p.id}`,
      kind: 'payment' as const,
      amount: p.amount,
      date: p.paymentDate,
      note: [p.method, p.note].filter(Boolean).join(' · '),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const kindLabel = (k: HistoryEntry['kind']) =>
    k === 'payment'
      ? isAr ? 'دفعة' : 'Payment'
      : k === 'charge'
      ? isAr ? 'إضافة مبلغ' : 'Charge'
      : isAr ? 'المبلغ الأساسي' : 'Initial';

  async function handleCopy() {
    if (!debt) return;
    try {
      await navigator.clipboard.writeText(buildWhatsAppReminder(debt));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard rejection
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-sheet-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        {...swipeHandlers}
        style={cardStyle}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={resolveAvatarSrc(debt.avatarId)}
              alt={debt.debtorName}
              className="w-12 h-12 rounded-full object-cover shrink-0 transition-all"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 id="person-sheet-title" className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {debt.debtorName}
                </h2>
                <PersonAlertBadge
                  level={draftAlertLevel}
                  note={draftAlertNote}
                  format={personAlertFormat === 'banner' ? 'badge' : personAlertFormat}
                  lang={lang}
                  placement="inline"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {debt.title} · {formatDueCountdown(debt, lang)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Numbers strip */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 text-center">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? 'الإجمالي' : 'Total'}
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono-num mt-1">
                {formatDisplayMoney(debt.totalAmount, debt.currency, hideAmounts)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? 'المدفوع' : 'Paid'}
              </p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono-num mt-1">
                {formatDisplayMoney(debt.paidAmount, debt.currency, hideAmounts)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? 'المتبقي' : 'Left'}
              </p>
              <p className="text-sm font-bold text-[#E85D2E] font-mono-num mt-1">
                {formatDisplayMoney(remaining, debt.currency, hideAmounts)}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{isAr ? `نسبة السداد: ${progress}%` : `Progress: ${progress}%`}</span>
              <span className="font-mono-num inline-flex items-center gap-1">
                <AppIcon kind="ui" name="calendar" styleId={iconStyle} sizePx={15} theme={theme} />
                <span>
                  {isAr ? 'الاستحقاق:' : 'Due:'} {formatArabicDate(debt.dueDate, lang)}
                </span>
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${theme.progressFill}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {debt.notes && (
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
              {debt.notes}
            </p>
          )}

          {/* Quick optional warning/alert control */}
          <div className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {isAr ? 'تحذير أو تنبيه بجانب الشخص (اختياري)' : 'Person Alert (Optional)'}
              </span>
              {alertSaved && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {isAr ? 'تم التحديث' : 'Saved'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {PERSON_ALERT_LEVEL_OPTIONS.map((opt) => {
                const active = draftAlertLevel === opt.id;
                const activeTone =
                  opt.id === 'urgent'
                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                    : opt.id === 'warning'
                    ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    : opt.id === 'reminder'
                    ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                    : `${theme.accentBorder} ${theme.accentSoftBg} ${theme.accentText}`;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      const nextNote = opt.id === 'none' ? '' : draftAlertNote;
                      setDraftAlertLevel(opt.id);
                      setDraftAlertNote(nextNote);
                      onQuickUpdateAlert(debt, opt.id, nextNote);
                      setAlertSaved(true);
                      window.setTimeout(() => setAlertSaved(false), 1400);
                    }}
                    className={`h-9 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                      active
                        ? activeTone
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isAr ? opt.labelAr : opt.labelEn}
                  </button>
                );
              })}
            </div>
            {draftAlertLevel !== 'none' && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={FIELD_LIMITS.alertNoteMax}
                  value={draftAlertNote}
                  onChange={(e) => setDraftAlertNote(e.target.value)}
                  placeholder={isAr ? 'ملاحظة تنبيه قصيرة (اختياري)...' : 'Short alert note (optional)...'}
                  className="flex-1 h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    onQuickUpdateAlert(debt, draftAlertLevel, draftAlertNote.trim());
                    setAlertSaved(true);
                    window.setTimeout(() => setAlertSaved(false), 1400);
                  }}
                  className={`h-9 px-3.5 rounded-xl text-xs font-semibold text-white ${theme.accentBg} ${theme.accentBgHover} cursor-pointer shrink-0`}
                >
                  {isAr ? 'حفظ' : 'Save'}
                </button>
              </div>
            )}
            {notificationsEnabled && debt.status !== 'محصل' && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                <BellRing className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {isAr
                    ? `تنبيه الهاتف مفعّل للاستحقاق (${formatArabicDate(debt.dueDate, lang)} · ${notifyTime})`
                    : `Phone alert armed for due date (${formatArabicDate(debt.dueDate, lang)} · ${notifyTime})`}
                </span>
              </p>
            )}
          </div>

          {/* Transactions History (charges + payments) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? `سجل العمليات (${history.length})` : `Transactions (${history.length})`}
            </h3>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                {isAr ? 'لا توجد عمليات مسجلة حتى الآن.' : 'No transactions yet.'}
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                {history.map((h) => (
                  <div key={h.key} className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                            h.kind === 'payment'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-orange-50 text-[#E85D2E] dark:bg-orange-950/50'
                          }`}
                        >
                          {kindLabel(h.kind)}
                        </span>
                        <span className="truncate">{h.note}</span>
                      </p>
                      <p className="text-slate-400 font-mono-num mt-0.5">
                        {formatArabicDate(h.date, lang)}
                      </p>
                    </div>
                    <span
                      className={`font-bold font-mono-num shrink-0 ${
                        h.kind === 'payment' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E85D2E]'
                      }`}
                    >
                      {hideAmounts
                        ? formatDisplayMoney(h.amount, debt.currency, true)
                        : `${h.kind === 'payment' ? '−' : '+'}${formatDisplayMoney(h.amount, debt.currency, false)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-2">
            <div className={`grid gap-2.5 ${debt.status !== 'محصل' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAddCharge(debt);
                }}
                className="h-12 text-sm font-semibold text-[#E85D2E] bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <AppIcon kind="ui" name="plus" styleId={iconStyle} sizePx={iconCfg.actionPx} theme={theme} />
                <span>{isAr ? 'إضافة مبلغ عليه' : 'Add Amount'}</span>
              </button>

              {debt.status !== 'محصل' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogPayment(debt);
                  }}
                  className={`h-12 text-sm font-semibold text-white ${theme.accentBg} ${theme.accentBgHover} rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer`}
                >
                  <AppIcon kind="nav" name="hand_coins" styleId={iconStyle} sizePx={iconCfg.actionPx} theme={theme} />
                  <span>{isAr ? 'تسجيل دفعة' : 'Record Payment'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {debt.direction === 'receivable' && debt.status !== 'محصل' && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="h-11 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AppIcon kind="ui" name="phone" styleId={iconStyle} sizePx={iconCfg.actionPx} theme={theme} />
                  )}
                  <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'واتساب' : 'Remind'}</span>
                </button>
              )}

              {debt.status !== 'محصل' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(debt);
                  }}
                  className="h-11 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <AppIcon kind="ui" name="edit" styleId={iconStyle} sizePx={iconCfg.actionPx} theme={theme} />
                  <span>{isAr ? 'تعديل' : 'Edit'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(debt);
                }}
                className={`h-11 px-3 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${
                  debt.status === 'محصل' ? 'col-span-3' : debt.direction === 'payable' ? 'col-span-2' : ''
                }`}
              >
                <AppIcon kind="ui" name="trash" styleId={iconStyle} sizePx={iconCfg.actionPx} theme={theme} />
                <span>{isAr ? 'حذف السجل' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
