import { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { AppLanguage, ThemeConfig } from '../data/themes';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  lang: AppLanguage;
  theme: ThemeConfig;
  compact?: boolean;
}

export function PWAInstallButton({ lang, theme, compact = false }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isAr = lang === 'ar';

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          compact
            ? `min-h-[38px] px-3 py-1.5 rounded-full text-xs font-semibold text-white ${theme.accentBg} ${theme.accentBgHover} flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0`
            : `w-full min-h-[44px] px-4 py-2.5 rounded-2xl text-xs font-semibold text-white ${theme.accentBg} ${theme.accentBgHover} flex items-center justify-center gap-2 cursor-pointer transition-colors`
        }
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>{isAr ? 'تثبيت تطبيق Moamen على الهاتف' : 'Install Moamen App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            compact
              ? 'min-h-[38px] px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0'
              : 'w-full min-h-[44px] px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center gap-2 cursor-pointer'
          }
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>{isAr ? 'تثبيت على آيفون (iOS)' : 'Install on iPhone'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? 'تثبيت Moamen على الآيفون' : 'Install Moamen on iOS'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isAr ? (
                  <>
                    1. اضغط على زر <strong>المشاركة (Share)</strong> أسفل متصفح Safari.
                    <br />
                    2. اختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
                  </>
                ) : (
                  <>
                    1. Tap the <strong>Share</strong> button in Safari.
                    <br />
                    2. Tap <strong>Add to Home Screen</strong>.
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className={`w-full h-11 rounded-2xl text-xs font-semibold text-white ${theme.accentBg} cursor-pointer`}
              >
                {isAr ? 'حسناً' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

export function OfflineIndicator({ lang }: { lang: AppLanguage }) {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-amber-500 text-white text-xs font-semibold shadow-lg whitespace-nowrap">
      {lang === 'ar'
        ? 'أنت غير متصل بالإنترنت — يتم عرض البيانات المحفوظة'
        : 'Offline — showing cached data'}
    </div>
  );
}
