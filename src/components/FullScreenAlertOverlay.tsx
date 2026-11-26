import { useEffect } from 'react';
import { BellRing, Check, ExternalLink, X } from 'lucide-react';
import { AppLanguage, ThemeConfig } from '../data/themes';
import { FullScreenAlertEventDetail } from '../services/notificationService';
import { useSwipeBack } from '../hooks/useSwipeBack';

interface FullScreenAlertOverlayProps {
  alert: FullScreenAlertEventDetail | null;
  theme: ThemeConfig;
  lang: AppLanguage;
  onDismiss: () => void;
  onOpenPerson?: (debtId: string) => void;
}

/**
 * Optional full-screen payment-due alert overlay.
 * Only shown when the user explicitly turns on "Full-Screen Alert" in Notification Settings.
 */
export function FullScreenAlertOverlay({
  alert,
  theme,
  lang,
  onDismiss,
  onOpenPerson,
}: FullScreenAlertOverlayProps) {
  const { swipeHandlers, cardStyle } = useSwipeBack(Boolean(alert), onDismiss);

  useEffect(() => {
    if (!alert) return;
    const onBack = (e: Event) => {
      e.preventDefault();
      onDismiss();
    };
    window.addEventListener('moamen:back', onBack);
    return () => window.removeEventListener('moamen:back', onBack);
  }, [alert, onDismiss]);

  if (!alert) return null;

  const isAr = lang === 'ar';
  const isUrgent = alert.style === 'urgent';

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="fullscreen-alert-title"
      className={`fixed inset-0 z-[70] flex flex-col items-center justify-center p-6 ${
        isUrgent
          ? 'bg-gradient-to-b from-red-950 via-slate-950 to-slate-950'
          : 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950'
      } text-white`}
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label={isAr ? 'إغلاق' : 'Dismiss'}
        className="absolute top-[calc(1.25rem+env(safe-area-inset-top))] end-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      <div
        {...swipeHandlers}
        style={cardStyle}
        className="w-full max-w-sm flex flex-col items-center text-center space-y-6"
      >
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden="true"
            className={`absolute w-28 h-28 rounded-full animate-ping opacity-25 ${
              isUrgent ? 'bg-red-500' : 'bg-emerald-400'
            }`}
          />
          {alert.avatarSrc ? (
            <div className="relative">
              <img
                src={alert.avatarSrc}
                alt={alert.title}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white/25 shadow-2xl"
              />
              <span
                className={`absolute -bottom-1 -end-1 w-9 h-9 rounded-full flex items-center justify-center ring-4 ring-slate-950 shadow-lg ${
                  isUrgent ? 'bg-red-500' : theme.accentBg
                }`}
              >
                <BellRing className="w-4 h-4 text-white" />
              </span>
            </div>
          ) : (
            <span
              className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl ${
                isUrgent ? 'bg-red-500/90' : theme.accentBg
              }`}
            >
              <BellRing className="w-9 h-9 text-white" />
            </span>
          )}
        </div>

        <div className="space-y-2.5 px-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            {isAr ? 'تنبيه موعد سداد · مؤمن' : 'Payment Due Alert · Moamen'}
          </p>
          <h2 id="fullscreen-alert-title" className="text-2xl font-extrabold leading-snug">
            {alert.title}
          </h2>
          <p className="text-sm text-white/80 leading-relaxed">{alert.body}</p>
        </div>

        <div className="w-full space-y-2.5 pt-4">
          {alert.debtId && onOpenPerson && (
            <button
              type="button"
              onClick={() => {
                const targetId = alert.debtId!;
                onDismiss();
                onOpenPerson(targetId);
              }}
              className="w-full h-12 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{isAr ? 'عرض تفاصيل الشخص' : 'View Person Details'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onDismiss}
            className={`w-full h-12 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              isUrgent
                ? 'bg-red-500 hover:bg-red-600'
                : `${theme.accentBg} ${theme.accentBgHover}`
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'تم، إغلاق التنبيه' : 'Got It, Dismiss'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
