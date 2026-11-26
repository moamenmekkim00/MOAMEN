import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AVATAR_FILTER_TABS, AvatarFilter, PIXAR_AVATARS, resolveAvatarSrc } from '../data/avatars';
import {
  PERSON_ALERT_LEVEL_OPTIONS,
  PersonAlertLevel,
  sanitizePersonAlertLevel,
} from '../data/customization';
import { AppLanguage, ThemeConfig } from '../data/themes';
import { useSwipeBack } from '../hooks/useSwipeBack';
import {
  CURRENCIES,
  Currency,
  DebtDirection,
  DebtInput,
  DebtRecord,
  FIELD_LIMITS,
  getTodayISO,
  PAYMENT_METHODS,
  PaymentInput,
  PaymentMethod,
} from '../types/debt';

interface PersonModalProps {
  isOpen: boolean;
  direction: DebtDirection;
  editingDebt: DebtRecord | null;
  defaultCurrency: Currency;
  theme: ThemeConfig;
  lang: AppLanguage;
  onClose: () => void;
  onSubmit: (input: DebtInput, initialPayment?: PaymentInput) => Promise<void>;
}

export function PersonModal({
  isOpen,
  direction,
  editingDebt,
  defaultCurrency,
  theme,
  lang,
  onClose,
  onSubmit,
}: PersonModalProps) {
  const [debtorName, setDebtorName] = useState('');
  const [debtorPhone, setDebtorPhone] = useState('');
  const [avatarId, setAvatarId] = useState('young_man');
  const [avatarFilter, setAvatarFilter] = useState<AvatarFilter>('all');
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [currency, setCurrency] = useState<string>(defaultCurrency);
  const [givenDate, setGivenDate] = useState(getTodayISO());
  const [dueDate, setDueDate] = useState(getTodayISO());
  const [notes, setNotes] = useState('');
  const [alertLevel, setAlertLevel] = useState<PersonAlertLevel>('none');
  const [alertNote, setAlertNote] = useState('');

  const [hasInitialPayment, setHasInitialPayment] = useState(false);
  const [initialAmount, setInitialAmount] = useState('');
  const [initialDate, setInitialDate] = useState(getTodayISO());
  const [initialMethod, setInitialMethod] = useState<PaymentMethod>('نقدي');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingDebt) {
      setDebtorName(editingDebt.debtorName);
      setDebtorPhone(editingDebt.debtorPhone);
      setAvatarId(editingDebt.avatarId || 'young_man');
      setTitle(editingDebt.title);
      setTotalAmount(String(editingDebt.totalAmount));
      setCurrency(editingDebt.currency);
      setGivenDate(editingDebt.givenDate || getTodayISO());
      setDueDate(editingDebt.dueDate || getTodayISO());
      setNotes(editingDebt.notes || '');
      setAlertLevel(sanitizePersonAlertLevel(editingDebt.alertLevel));
      setAlertNote(editingDebt.alertNote || '');
      setHasInitialPayment(false);
      setInitialAmount('');
    } else {
      const today = getTodayISO();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekISO = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;

      setDebtorName('');
      setDebtorPhone('');
      setAvatarId(direction === 'payable' ? 'man_glasses' : 'young_man');
      setTitle(direction === 'payable' ? (lang === 'ar' ? 'مبلغ مستحق' : 'Amount owed') : (lang === 'ar' ? 'سلفة شخصية' : 'Personal loan'));
      setTotalAmount('');
      setCurrency(defaultCurrency);
      setGivenDate(today);
      setDueDate(nextWeekISO);
      setNotes('');
      setAlertLevel('none');
      setAlertNote('');
      setHasInitialPayment(false);
      setInitialAmount('');
      setInitialDate(today);
      setInitialMethod('نقدي');
    }
  }, [isOpen, editingDebt, defaultCurrency, direction, lang]);

  const { swipeHandlers, cardStyle } = useSwipeBack(isOpen, onClose);

  if (!isOpen) return null;

  const isAr = lang === 'ar';
  const filteredAvatars =
    avatarFilter === 'all'
      ? PIXAR_AVATARS
      : PIXAR_AVATARS.filter((a) => a.category === avatarFilter);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsedTotal = Number(totalAmount);
    if (!debtorName.trim()) {
      setError(isAr ? 'يرجى كتابة اسم الشخص.' : 'Please enter person name.');
      return;
    }
    if (!Number.isFinite(parsedTotal) || parsedTotal <= 0) {
      setError(isAr ? 'يرجى إدخال مبلغ صحيح أكبر من صفر.' : 'Please enter a valid positive amount.');
      return;
    }
    if (editingDebt && parsedTotal < editingDebt.paidAmount) {
      setError(
        isAr
          ? `المبلغ لا يمكن أن يقل عما تم دفعه (${editingDebt.paidAmount}).`
          : `Amount cannot be less than already paid (${editingDebt.paidAmount}).`
      );
      return;
    }

    let initialPayment: PaymentInput | undefined;
    if (!editingDebt && hasInitialPayment) {
      const initVal = Number(initialAmount);
      if (!Number.isFinite(initVal) || initVal <= 0 || initVal > parsedTotal) {
        setError(isAr ? 'الدفعة المبدئية يجب أن تكون بين 0 وإجمالي المبلغ.' : 'Invalid initial payment.');
        return;
      }
      initialPayment = {
        amount: initVal,
        paymentDate: initialDate,
        method: initialMethod,
        note: isAr ? 'دفعة مبدئية' : 'Initial payment',
      };
    }

    setSubmitting(true);
    try {
      await onSubmit(
        {
          direction: editingDebt ? editingDebt.direction : direction,
          debtorName: debtorName.trim(),
          debtorPhone: debtorPhone.trim(),
          avatarId,
          title: title.trim() || (isAr ? 'مستحق مالي' : 'Balance'),
          category: editingDebt?.category || 'سلفة شخصية',
          totalAmount: parsedTotal,
          currency,
          givenDate,
          dueDate,
          installmentPlan: editingDebt?.installmentPlan || 'دفعة واحدة',
          notes: notes.trim(),
          alertLevel,
          alertNote: alertLevel === 'none' ? '' : alertNote.trim(),
        },
        initialPayment
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : isAr ? 'تعذر الحفظ، حاول مرة أخرى.' : 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  }

  const heading = editingDebt
    ? isAr
      ? 'تعديل البيانات'
      : 'Edit Entry'
    : direction === 'receivable'
    ? isAr
      ? 'إضافة شخص (لي عنده فلوس)'
      : 'Add Person (Owed to Me)'
    : isAr
    ? 'إضافة شخص (مطلوب مني)'
    : 'Add Person (I Owe)';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        {...swipeHandlers}
        style={cardStyle}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 id="person-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
            {heading}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div role="alert" className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-xl p-3">
              {error}
            </div>
          )}

          {/* Pixar Avatar Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'اختر صورة الشخص (بيكسار)' : 'Choose Avatar (Pixar Style)'}
              </span>
              <img
                src={resolveAvatarSrc(avatarId)}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {AVATAR_FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setAvatarFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    avatarFilter === tab.key
                      ? `${theme.accentBg} text-white`
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {isAr ? tab.ar : tab.en}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
              {filteredAvatars.map((av) => {
                const selected = avatarId === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setAvatarId(av.id)}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      selected
                        ? `${theme.accentBorder} bg-white dark:bg-slate-800 scale-[1.03] shadow-xs`
                        : 'border-transparent hover:bg-white/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <img
                      src={av.src}
                      alt={isAr ? av.labelAr : av.labelEn}
                      loading="lazy"
                      className="w-11 h-11 rounded-full object-cover"
                    />
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 truncate max-w-full">
                      {isAr ? av.labelAr : av.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="p-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'اسم الشخص *' : 'Person Name *'}
              </label>
              <input
                id="p-name"
                type="text"
                required
                maxLength={FIELD_LIMITS.debtorNameMax}
                value={debtorName}
                onChange={(e) => setDebtorName(e.target.value)}
                placeholder={isAr ? 'مثال: مؤمن' : 'e.g. Momen'}
                className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label htmlFor="p-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'رقم الهاتف (اختياري)' : 'Phone (Optional)'}
              </label>
              <input
                id="p-phone"
                type="tel"
                dir="ltr"
                maxLength={FIELD_LIMITS.debtorPhoneMax}
                value={debtorPhone}
                onChange={(e) => setDebtorPhone(e.target.value)}
                placeholder="010xxxxxxxx"
                className="w-full h-11 px-3.5 text-sm text-right font-mono-num bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label htmlFor="p-amount" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {direction === 'receivable'
                  ? isAr
                    ? 'المبلغ المطلوب منه *'
                    : 'Amount Owed *'
                  : isAr
                  ? 'المبلغ المطلوب مني *'
                  : 'Amount I Owe *'}
              </label>
              <input
                id="p-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="5000"
                className="w-full h-11 px-3.5 text-sm font-mono-num bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label htmlFor="p-cur" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'العملة' : 'Currency'}
              </label>
              <select
                id="p-cur"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-11 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="p-due" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'تاريخ الاستحقاق *' : 'Due Date *'}
              </label>
              <input
                id="p-due"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-11 px-3.5 text-sm font-mono-num bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="p-title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'السبب / البيان' : 'Reason / Note'}
              </label>
              <input
                id="p-title"
                type="text"
                maxLength={FIELD_LIMITS.titleMax}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isAr ? 'سلفة، بضاعة، إيجار...' : 'Loan, Goods...'}
                className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          {!editingDebt && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="inline-flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasInitialPayment}
                  onChange={(e) => setHasInitialPayment(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <span>
                  {isAr ? 'تم دفع جزء من المبلغ بالفعل' : 'Partial amount already paid'}
                </span>
              </label>

              {hasInitialPayment && (
                <div className="grid grid-cols-3 gap-2.5 mt-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    placeholder={isAr ? 'المدفوع' : 'Paid'}
                    className="h-10 px-3 text-xs font-mono-num bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                  <input
                    type="date"
                    value={initialDate}
                    onChange={(e) => setInitialDate(e.target.value)}
                    className="h-10 px-2.5 text-xs font-mono-num bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                  <select
                    value={initialMethod}
                    onChange={(e) => setInitialMethod(e.target.value as PaymentMethod)}
                    className="h-10 px-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Optional warning / alert next to person */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'تحذير أو تنبيه بجانب الشخص (اختياري)' : 'Warning or Alert Next to Person (Optional)'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PERSON_ALERT_LEVEL_OPTIONS.map((opt) => {
                const active = alertLevel === opt.id;
                const activeTone =
                  opt.id === 'urgent'
                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                    : opt.id === 'warning'
                    ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                    : opt.id === 'reminder'
                    ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                    : `${theme.accentBorder} ${theme.accentSoftBg} ${theme.accentText}`;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setAlertLevel(opt.id);
                      if (opt.id === 'none') setAlertNote('');
                    }}
                    className={`h-10 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? activeTone
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isAr ? opt.labelAr : opt.labelEn}
                  </button>
                );
              })}
            </div>
            {alertLevel !== 'none' && (
              <input
                type="text"
                maxLength={FIELD_LIMITS.alertNoteMax}
                value={alertNote}
                onChange={(e) => setAlertNote(e.target.value)}
                placeholder={isAr ? 'نص التنبيه القصير (اختياري، مثال: متأخر عن السداد)' : 'Short alert label (optional)'}
                className="w-full h-10 px-3.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600"
              />
            )}
          </div>

          <div>
            <label htmlFor="p-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'ملاحظات إضافية' : 'Additional Notes'}
            </label>
            <input
              id="p-notes"
              type="text"
              maxLength={FIELD_LIMITS.notesMax}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isAr ? 'اختياري...' : 'Optional...'}
              className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-2xl transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-[2] h-12 text-sm font-semibold text-white ${theme.accentBg} ${theme.accentBgHover} disabled:opacity-60 rounded-2xl transition-colors cursor-pointer`}
            >
              {submitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
