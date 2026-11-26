import { AlertOctagon, AlertTriangle, BellRing } from 'lucide-react';
import { PersonAlertFormat, PersonAlertLevel } from '../data/customization';
import { AppLanguage } from '../data/themes';

interface PersonAlertBadgeProps {
  level?: PersonAlertLevel;
  note?: string;
  format: PersonAlertFormat;
  lang: AppLanguage;
  placement?: 'inline' | 'below';
}

function getAlertVisuals(level: Exclude<PersonAlertLevel, 'none'>, lang: AppLanguage) {
  const isAr = lang === 'ar';
  if (level === 'urgent') {
    return {
      Icon: AlertOctagon,
      defaultLabel: isAr ? 'عاجل' : 'Urgent',
      textClass: 'text-red-600 dark:text-red-400',
      softBgClass: 'bg-red-50 dark:bg-red-950/50 border-red-200/80 dark:border-red-900/70',
      dotClass: 'bg-red-500',
      pingClass: 'bg-red-400',
    };
  }
  if (level === 'reminder') {
    return {
      Icon: BellRing,
      defaultLabel: isAr ? 'تذكير' : 'Reminder',
      textClass: 'text-sky-600 dark:text-sky-400',
      softBgClass: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200/80 dark:border-sky-900/70',
      dotClass: 'bg-sky-500',
      pingClass: 'bg-sky-400',
    };
  }
  return {
    Icon: AlertTriangle,
    defaultLabel: isAr ? 'تحذير' : 'Warning',
    textClass: 'text-amber-600 dark:text-amber-400',
    softBgClass: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-900/70',
    dotClass: 'bg-amber-500',
    pingClass: 'bg-amber-400',
  };
}

/**
 * Renders the user-chosen optional warning or alert next to a person
 * using the configured visual format (badge, icon, pulse, or banner).
 */
export function PersonAlertBadge({
  level,
  note,
  format,
  lang,
  placement = 'inline',
}: PersonAlertBadgeProps) {
  if (!level || level === 'none') return null;
  const v = getAlertVisuals(level, lang);
  const Icon = v.Icon;
  const label = note?.trim() || v.defaultLabel;

  // 'banner' renders below the main row line; inline formats render right next to the person's name
  if (format === 'banner') {
    if (placement === 'inline') return null;
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${v.softBgClass} ${v.textClass}`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
    );
  }

  if (placement === 'below') return null;

  if (format === 'icon') {
    return (
      <span
        title={label}
        aria-label={label}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${v.softBgClass} ${v.textClass}`}
      >
        <Icon className="w-3 h-3" />
      </span>
    );
  }

  if (format === 'pulse') {
    return (
      <span
        title={label}
        aria-label={label}
        className={`inline-flex items-center gap-1.5 shrink-0 text-[11px] font-semibold ${v.textClass}`}
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${v.pingClass}`}
          />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${v.dotClass}`} />
        </span>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {note?.trim() && <span className="max-w-[96px] truncate">{note.trim()}</span>}
      </span>
    );
  }

  // Default: 'badge' (clean icon + short text label next to name)
  return (
    <span
      title={label}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold shrink-0 max-w-[130px] ${v.softBgClass} ${v.textClass}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}
