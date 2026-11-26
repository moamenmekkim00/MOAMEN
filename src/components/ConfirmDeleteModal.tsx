import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { AppLanguage } from '../data/themes';
import { DebtRecord, formatMoney, getRemainingAmount } from '../types/debt';

interface ConfirmDeleteModalProps {
  debt: DebtRecord | null;
  lang?: AppLanguage;
  onClose: () => void;
  onConfirm: (debt: DebtRecord) => Promise<void>;
}

export function ConfirmDeleteModal({ debt, lang = 'ar', onClose, onConfirm }: ConfirmDeleteModalProps) {
  const [deleting, setDeleting] = useState(false);

  if (!debt) return null;

  const isAr = lang === 'ar';

  async function handleConfirm() {
    if (!debt) return;
    setDeleting(true);
    try {
      await onConfirm(debt);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            <h2 id="delete-modal-title" className="text-base font-bold">
              {isAr ? 'حذف السجل' : 'Delete Record'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {isAr ? (
              <>
                هل أنت متأكد من حذف سجل <strong>{debt.debtorName}</strong> (
                <span className="font-mono-num font-semibold">
                  {formatMoney(getRemainingAmount(debt) || debt.totalAmount, debt.currency)}
                </span>
                ) نهائياً؟
              </>
            ) : (
              <>
                Delete record for <strong>{debt.debtorName}</strong> (
                <span className="font-mono-num font-semibold">
                  {formatMoney(getRemainingAmount(debt) || debt.totalAmount, debt.currency)}
                </span>
                )?
              </>
            )}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer"
            >
              {isAr ? 'تراجع' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={deleting}
              className="flex-1 h-11 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-2xl cursor-pointer"
            >
              {deleting ? (isAr ? 'جاري الحذف...' : 'Deleting...') : isAr ? 'حذف' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
