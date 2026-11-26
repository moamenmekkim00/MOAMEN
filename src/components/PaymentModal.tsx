import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AppLanguage, ThemeConfig } from '../data/themes';
import { useSwipeBack } from '../hooks/useSwipeBack';
import {
  DebtRecord,
  FIELD_LIMITS,
  formatMoney,
  getRemainingAmount,
  getTodayISO,
  PAYMENT_METHODS,
  PaymentInput,
  PaymentMethod,
  roundMoney,
} from '../types/debt';

interface PaymentModalProps {
  debt: DebtRecord | null;
  theme?: ThemeConfig;
  lang?: AppLanguage;
  onClose: () => void;
  onSubmit: (debt: DebtRecord, payment: PaymentInput) => Promise<void>;
}

export function PaymentModal({ debt, theme, lang = 'ar', onClose, onSubmit }: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayISO());
  const [method, setMethod] = useState<PaymentMethod>('نقدي');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!debt) return;
    const remaining = getRemainingAmount(debt);
    setAmount(String(remaining));
    setPaymentDate(getTodayISO());
    setMethod('نقدي');
    setNote('');
    setError(null);
  }, [debt]);

  const { swipeHandlers, cardStyle } = useSwipeBack(Boolean(debt), onClose);

  if (!debt) return null;

  const isAr = lang === 'ar';
  const remaining = getRemainingAmount(debt);
  const accentBtn = theme ? `${theme.accentBg} ${theme.accentBgHover}` : 'bg-teal-700 hover:bg-teal-800';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!debt) return;
    setError(null);

    const parsed = roundMoney(Number(amount));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError(isAr ? 'يرجى إدخال مبلغ صحيح أكبر من صفر.' : 'Enter a valid positive amount.');
      return;
    }
    if (parsed > remaining + 0.001) {
      setError(
        isAr
          ? `المبلغ أكبر من المتبقي (${formatMoney(remaining, debt.currency)}).`
          : `Amount exceeds remaining (${formatMoney(remaining, debt.currency)}).`
      );
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(debt, {
        amount: parsed,
        paymentDate,
        method,
        note: note.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : isAr ? 'تعذر تسجيل الدفعة.' : 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        {...swipeHandlers}
        style={cardStyle}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md max-h-[88vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 id="payment-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
            {debt.direction === 'payable'
              ? isAr
                ? 'تسجيل دفعة سداد'
                : 'Record Repayment'
              : isAr
              ? 'تسجيل دفعة تحصيل'
              : 'Record Payment'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{debt.debtorName}</span>
              <span>{debt.title}</span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {isAr ? 'المبلغ المتبقي حالياً' : 'Remaining balance'}
              </span>
              <span className="text-lg font-bold text-[#E85D2E] font-mono-num">
                {formatMoney(remaining, debt.currency)}
              </span>
            </div>
          </div>

          {error && (
            <div role="alert" className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-xl p-3">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="pay-amount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? `قيمة الدفعة (${debt.currency}) *` : `Amount (${debt.currency}) *`}
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAmount(String(roundMoney(remaining / 2)))}
                  className="font-medium text-emerald-700 dark:text-emerald-400 underline cursor-pointer"
                >
                  {isAr ? 'النصف' : 'Half'}
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => setAmount(String(remaining))}
                  className="font-medium text-emerald-700 dark:text-emerald-400 underline cursor-pointer"
                >
                  {isAr ? 'الكل' : 'Full'}
                </button>
              </div>
            </div>
            <input
              id="pay-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={remaining}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-11 px-3.5 text-base font-mono-num bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pay-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'التاريخ *' : 'Date *'}
              </label>
              <input
                id="pay-date"
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-11 px-3 text-sm font-mono-num bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label htmlFor="pay-method" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'الطريقة' : 'Method'}
              </label>
              <select
                id="pay-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full h-11 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="pay-note" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'ملاحظة (اختياري)' : 'Note (optional)'}
            </label>
            <input
              id="pay-note"
              type="text"
              maxLength={FIELD_LIMITS.paymentNoteMax}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isAr ? 'تحويل إنستا باي / كاش...' : 'InstaPay / Cash...'}
              className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-[2] h-12 text-sm font-semibold text-white ${accentBtn} disabled:opacity-60 rounded-2xl cursor-pointer`}
            >
              {submitting ? (isAr ? 'جاري التسجيل...' : 'Saving...') : isAr ? 'تأكيد الدفعة' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
