import { resolveAvatarSrc } from '../data/avatars';
import {
  getNativeBridge,
  NotificationAlertStyle,
  NotificationSettings,
  NotificationToneId,
  playNotificationTone,
} from '../data/customization';
import { AppLanguage } from '../data/themes';
import {
  DebtRecord,
  formatArabicDate,
  formatMoney,
  getDaysUntilDue,
  getRemainingAmount,
  getTodayISO,
} from '../types/debt';

const NOTIFIED_LOG_KEY = 'moamen_notified_due_v1';
const activeWebTimers = new Map<string, ReturnType<typeof setTimeout>>();

export type PhonePermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface NativeAlarmStatus {
  isNative: boolean;
  hasNotificationPermission: boolean;
  canScheduleExactAlarms: boolean;
  isIgnoringBatteryOptimizations: boolean;
  canUseFullScreenIntent: boolean;
}

export interface ScheduledDueAlarm {
  id: number;
  debtId: string;
  triggerAtMillis: number;
  title: string;
  body: string;
  style: NotificationAlertStyle;
  sound: boolean;
  vibrate: boolean;
  wakeScreen: boolean;
  fullScreen: boolean;
  tone: NotificationToneId;
  avatarSrc?: string;
}

export interface FullScreenAlertEventDetail {
  title: string;
  body: string;
  style: NotificationAlertStyle;
  debtId?: string;
  avatarSrc?: string;
}

function hashAlarmId(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (Math.abs(h) % 200000000) + 1000;
}

export function isNativeNotificationBridgeAvailable(): boolean {
  return Boolean(getNativeBridge()?.scheduleDueNotifications);
}

export function getNativeAlarmStatus(): NativeAlarmStatus {
  const native = getNativeBridge();
  if (native?.getAlarmStatusJson) {
    try {
      const parsed = JSON.parse(native.getAlarmStatusJson()) as Partial<NativeAlarmStatus>;
      return {
        isNative: true,
        hasNotificationPermission: Boolean(parsed.hasNotificationPermission),
        canScheduleExactAlarms: Boolean(parsed.canScheduleExactAlarms),
        isIgnoringBatteryOptimizations: Boolean(parsed.isIgnoringBatteryOptimizations),
        canUseFullScreenIntent: parsed.canUseFullScreenIntent !== false,
      };
    } catch {
      // Fallback below
    }
  }
  return {
    isNative: Boolean(native?.scheduleDueNotifications),
    hasNotificationPermission: getNotificationPermissionStatus() === 'granted',
    canScheduleExactAlarms: true,
    isIgnoringBatteryOptimizations: true,
    canUseFullScreenIntent: true,
  };
}

export function openNativeExactAlarmSettings(): void {
  try {
    getNativeBridge()?.openExactAlarmSettings?.();
  } catch {
    // Ignore
  }
}

export function requestNativeBatteryExemption(): void {
  try {
    getNativeBridge()?.requestIgnoreBatteryOptimizations?.();
  } catch {
    // Ignore
  }
}

export function openNativeFullScreenSettings(): void {
  try {
    getNativeBridge()?.openFullScreenIntentSettings?.();
  } catch {
    // Ignore
  }
}

export function previewAlertTone(tone: NotificationToneId): void {
  playNotificationTone(tone);
}

export function getNotificationPermissionStatus(): PhonePermissionStatus {
  const native = getNativeBridge();
  if (native?.hasNotificationPermission) {
    try {
      return native.hasNotificationPermission() ? 'granted' : 'default';
    } catch {
      // Fall through to web Notification API
    }
  }
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as PhonePermissionStatus;
}

export async function requestPhoneNotificationPermission(): Promise<PhonePermissionStatus> {
  const native = getNativeBridge();
  if (native?.requestNotificationPermission) {
    try {
      native.requestNotificationPermission();
      return native.hasNotificationPermission?.() ? 'granted' : 'default';
    } catch {
      // Fall through to web Notification API
    }
  }
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const res = await Notification.requestPermission();
    return res as PhonePermissionStatus;
  } catch {
    return 'denied';
  }
}

export function formatDueNotification(
  debt: DebtRecord,
  settings: NotificationSettings,
  lang: AppLanguage
): { title: string; body: string } {
  const isAr = lang === 'ar';
  const remaining = getRemainingAmount(debt);
  const moneyText = formatMoney(remaining, debt.currency);
  const diff = getDaysUntilDue(debt.dueDate);
  const isPayable = debt.direction === 'payable';
  const customNote = debt.alertNote?.trim();

  let timingAr = 'يستحق اليوم';
  let timingEn = 'Due today';
  if (diff < 0) {
    const d = Math.abs(diff);
    timingAr = d === 1 ? 'متأخر منذ يوم' : `متأخر ${d} أيام`;
    timingEn = d === 1 ? '1 day overdue' : `${d} days overdue`;
  } else if (diff === 1) {
    timingAr = 'يستحق غداً';
    timingEn = 'Due tomorrow';
  } else if (diff > 1) {
    timingAr = `بعد ${diff} أيام`;
    timingEn = `Due in ${diff} days`;
  }

  if (settings.alertStyle === 'compact') {
    return {
      title: isAr ? `تذكير موعد · ${debt.debtorName}` : `Payment Due · ${debt.debtorName}`,
      body: isAr
        ? `${timingAr}${customNote ? ` · ${customNote}` : ''}`
        : `${timingEn}${customNote ? ` · ${customNote}` : ''}`,
    };
  }

  if (settings.alertStyle === 'urgent') {
    const prefix = isAr ? '⚠️ تنبيه سداد عاجل' : '⚠️ Urgent Payment Alert';
    const actionAr = isPayable ? 'مستحق عليك لـ' : 'مستحق لك عند';
    const actionEn = isPayable ? 'You owe' : 'Payment due from';
    return {
      title: `${prefix}: ${debt.debtorName}`,
      body: isAr
        ? `${actionAr} ${debt.debtorName}: ${moneyText} (${timingAr})${customNote ? ` — ${customNote}` : ''}`
        : `${actionEn} ${debt.debtorName}: ${moneyText} (${timingEn})${customNote ? ` — ${customNote}` : ''}`,
    };
  }

  if (settings.alertStyle === 'detailed') {
    const pct = Math.min(100, Math.round((debt.paidAmount / Math.max(0.01, debt.totalAmount)) * 100));
    const dueLabel = formatArabicDate(debt.dueDate, lang);
    return {
      title: isAr
        ? `موعد سداد: ${debt.debtorName} (${timingAr})`
        : `Payment Due: ${debt.debtorName} (${timingEn})`,
      body: isAr
        ? `المتبقي ${moneyText} · ${debt.title} · المسدد ${pct}% · الاستحقاق ${dueLabel}${customNote ? ` · ${customNote}` : ''}`
        : `Left ${moneyText} · ${debt.title} · ${pct}% paid · Due ${dueLabel}${customNote ? ` · ${customNote}` : ''}`,
    };
  }

  // Standard 'banner' style
  return {
    title: isAr
      ? `موعد دفع ${debt.debtorName}`
      : `${debt.debtorName} — Payment Reminder`,
    body: isAr
      ? `المتبقي ${moneyText} · ${timingAr}${customNote ? ` · ${customNote}` : ''}`
      : `Remaining ${moneyText} · ${timingEn}${customNote ? ` · ${customNote}` : ''}`,
  };
}

function parseNotifyTime(hhmm: string): { hour: number; minute: number } {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm || '09:00');
  if (!m) return { hour: 9, minute: 0 };
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

function buildTriggerMillis(dueDateIso: string, daysBefore: number, notifyTime: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateIso)) return null;
  const [y, mo, d] = dueDateIso.split('-').map(Number);
  const { hour, minute } = parseNotifyTime(notifyTime);
  const target = new Date(y, mo - 1, d - daysBefore, hour, minute, 0, 0);
  if (Number.isNaN(target.getTime())) return null;
  return target.getTime();
}

function loadNotifiedLog(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(NOTIFIED_LOG_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function markNotifiedToday(debtId: string, todayIso: string): void {
  try {
    const log = loadNotifiedLog();
    log[debtId] = todayIso;
    // Prune stale entries older than 14 days
    const keys = Object.keys(log);
    if (keys.length > 200) {
      for (const k of keys.slice(0, keys.length - 150)) {
        delete log[k];
      }
    }
    window.localStorage.setItem(NOTIFIED_LOG_KEY, JSON.stringify(log));
  } catch {
    // Ignore storage quota errors
  }
}

async function deliverWebNotification(
  title: string,
  body: string,
  settings: NotificationSettings,
  tag: string,
  debtId?: string,
  avatarSrc?: string
): Promise<'sw' | 'web' | 'inapp'> {
  const safeAvatar = avatarSrc || '/pwa-192x192.png';

  if (settings.soundEnabled) {
    playNotificationTone(settings.alertTone);
  }
  if (settings.vibrateEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(
        settings.alertStyle === 'urgent' ? [220, 100, 220, 100, 260] : [160, 70, 160]
      );
    } catch {
      // Ignore vibration rejection
    }
  }

  if (settings.fullScreenAlert && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<FullScreenAlertEventDetail>('moamen:fullscreen-alert', {
        detail: {
          title,
          body,
          style: settings.alertStyle,
          debtId,
          avatarSrc: safeAvatar,
        },
      })
    );
  }

  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return 'inapp';
  }

  const options = {
    body,
    icon: safeAvatar,
    image: safeAvatar,
    badge: '/pwa-192x192.png',
    tag,
    requireInteraction: settings.alertStyle === 'urgent' || settings.fullScreenAlert,
    silent: !settings.soundEnabled,
  } as NotificationOptions;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options);
        return 'sw';
      }
    }
  } catch {
    // Fallback to window Notification constructor
  }

  try {
    new Notification(title, options);
    return 'web';
  } catch {
    return 'inapp';
  }
}

export function buildScheduledAlarms(
  debts: DebtRecord[],
  settings: NotificationSettings,
  lang: AppLanguage
): ScheduledDueAlarm[] {
  if (!settings.enabled) return [];

  const now = Date.now();
  const { hour, minute } = parseNotifyTime(settings.notifyTime);
  const alarms: ScheduledDueAlarm[] = [];

  for (const debt of debts) {
    if (debt.status === 'محصل' || getRemainingAmount(debt) <= 0) continue;
    if (settings.notifyDirections === 'receivables' && debt.direction !== 'receivable') continue;

    const diff = getDaysUntilDue(debt.dueDate);
    if (diff > 60) continue; // Keep alarm queue bounded & efficient

    const { title, body } = formatDueNotification(debt, settings, lang);

    // 1. Primary scheduled alarm (due date minus notifyDaysBefore at notifyTime)
    let triggerMs = buildTriggerMillis(debt.dueDate, settings.notifyDaysBefore, settings.notifyTime);

    // 2. If due today or already overdue and today's reminder time hasn't passed yet, schedule today;
    //    if it already passed and notifyOverdueDaily is on, schedule tomorrow at notifyTime
    if (triggerMs !== null && triggerMs <= now) {
      if (diff <= 0 && settings.notifyOverdueDaily) {
        const todayAtTime = new Date();
        todayAtTime.setHours(hour, minute, 0, 0);
        if (todayAtTime.getTime() > now) {
          triggerMs = todayAtTime.getTime();
        } else {
          const tomorrowAtTime = new Date();
          tomorrowAtTime.setDate(tomorrowAtTime.getDate() + 1);
          tomorrowAtTime.setHours(hour, minute, 0, 0);
          triggerMs = tomorrowAtTime.getTime();
        }
      } else {
        triggerMs = null;
      }
    }

    if (triggerMs !== null && triggerMs > now) {
      alarms.push({
        id: hashAlarmId(`${debt.id}_${debt.dueDate}`),
        debtId: debt.id,
        triggerAtMillis: triggerMs,
        title,
        body,
        style: settings.alertStyle,
        sound: settings.soundEnabled,
        vibrate: settings.vibrateEnabled,
        wakeScreen: settings.wakeScreen,
        fullScreen: settings.fullScreenAlert,
        tone: settings.alertTone,
        avatarSrc: resolveAvatarSrc(debt.avatarId),
      });
    }
  }

  return alarms.sort((a, b) => a.triggerAtMillis - b.triggerAtMillis).slice(0, 64);
}

/**
 * Syncs scheduled payment-due alarms to native Android AlarmManager (works even when app is closed,
 * phone screen is off, or after device reboot) AND schedules PWA/Web foreground reminders.
 */
export function syncScheduledDueNotifications(
  debts: DebtRecord[],
  settings: NotificationSettings,
  lang: AppLanguage
): void {
  // Clear existing web timers
  for (const timer of activeWebTimers.values()) {
    clearTimeout(timer);
  }
  activeWebTimers.clear();

  const alarms = buildScheduledAlarms(debts, settings, lang);

  // 1. Native Android AlarmManager + BOOT_COMPLETED persistent store
  const native = getNativeBridge();
  if (native?.scheduleDueNotifications) {
    try {
      native.scheduleDueNotifications(
        JSON.stringify({ enabled: settings.enabled, alarms })
      );
    } catch {
      // Ignore native bridge failure
    }
  }

  if (!settings.enabled || typeof window === 'undefined') return;

  // 2. Web / PWA: trigger due-today / overdue notifications once per day if permission granted
  const todayIso = getTodayISO();
  const notifiedLog = loadNotifiedLog();
  const now = Date.now();
  const { hour, minute } = parseNotifyTime(settings.notifyTime);
  const todayCutoff = new Date();
  todayCutoff.setHours(hour, minute, 0, 0);

  if (getNotificationPermissionStatus() === 'granted' || settings.fullScreenAlert) {
    for (const debt of debts) {
      if (debt.status === 'محصل' || getRemainingAmount(debt) <= 0) continue;
      if (settings.notifyDirections === 'receivables' && debt.direction !== 'receivable') continue;
      const diff = getDaysUntilDue(debt.dueDate);
      const isWithinLeadWindow = diff >= 0 && diff <= settings.notifyDaysBefore;
      const isOverdue = diff < 0 && settings.notifyOverdueDaily;

      if ((isWithinLeadWindow || isOverdue) && notifiedLog[debt.id] !== todayIso) {
        if (now >= todayCutoff.getTime()) {
          const { title, body } = formatDueNotification(debt, settings, lang);
          markNotifiedToday(debt.id, todayIso);
          void deliverWebNotification(
            title,
            body,
            settings,
            `moamen-due-${debt.id}`,
            debt.id,
            resolveAvatarSrc(debt.avatarId)
          );
        }
      }
    }

    // Also arm in-session timers for any alarm firing within the next 12 hours
    for (const alarm of alarms) {
      const delay = alarm.triggerAtMillis - now;
      if (delay > 0 && delay <= 12 * 60 * 60 * 1000) {
        const timer = setTimeout(() => {
          activeWebTimers.delete(alarm.debtId);
          markNotifiedToday(alarm.debtId, getTodayISO());
          void deliverWebNotification(
            alarm.title,
            alarm.body,
            settings,
            `moamen-due-${alarm.debtId}`,
            alarm.debtId,
            alarm.avatarSrc
          );
        }, delay);
        activeWebTimers.set(alarm.debtId, timer);
      }
    }
  }
}

export async function sendTestPhoneNotification(
  settings: NotificationSettings,
  lang: AppLanguage
): Promise<{ via: 'native' | 'sw' | 'web' | 'inapp'; title: string; body: string }> {
  const sampleDebt: DebtRecord = {
    id: 'sample_test',
    ownerId: 'local',
    direction: 'receivable',
    debtorName: lang === 'ar' ? 'أحمد محمود' : 'Ahmed Mahmoud',
    debtorPhone: '',
    avatarId: 'young_man',
    title: lang === 'ar' ? 'دفعة شهرية' : 'Monthly installment',
    category: 'سلفة شخصية',
    totalAmount: 2500,
    paidAmount: 1000,
    currency: 'EGP',
    givenDate: getTodayISO(),
    dueDate: getTodayISO(),
    installmentPlan: 'دفعة واحدة',
    status: 'جزئي',
    notes: '',
    alertLevel: 'warning',
    alertNote: lang === 'ar' ? 'موعد التحصيل اليوم' : 'Collection due today',
  };

  const { title, body } = formatDueNotification(sampleDebt, settings, lang);
  const sampleAvatarSrc = resolveAvatarSrc(sampleDebt.avatarId);

  const native = getNativeBridge();
  if (native?.sendTestNotification) {
    try {
      native.sendTestNotification(
        title,
        body,
        settings.alertStyle,
        settings.soundEnabled,
        settings.vibrateEnabled,
        settings.wakeScreen,
        settings.fullScreenAlert,
        settings.alertTone,
        sampleAvatarSrc
      );
      if (settings.fullScreenAlert && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent<FullScreenAlertEventDetail>('moamen:fullscreen-alert', {
            detail: { title, body, style: settings.alertStyle, avatarSrc: sampleAvatarSrc },
          })
        );
      }
      return { via: 'native', title, body };
    } catch {
      // Fallback to web notification
    }
  }

  const via = await deliverWebNotification(
    title,
    body,
    settings,
    'moamen-test-alert',
    undefined,
    sampleAvatarSrc
  );
  return { via, title, body };
}

/**
 * Schedules a real delayed payment-due alarm (e.g. 10 seconds later) so the user can lock
 * their phone screen and verify screen-off delivery, picture display, tone playback, and wake/full-screen behavior.
 */
export async function scheduleDelayedTestNotification(
  delaySeconds: number,
  settings: NotificationSettings,
  lang: AppLanguage
): Promise<{ via: 'native' | 'web'; title: string; body: string }> {
  const safeDelay = Math.max(3, Math.min(60, Math.round(delaySeconds)));
  const sampleDebt: DebtRecord = {
    id: 'sample_delayed_test',
    ownerId: 'local',
    direction: 'receivable',
    debtorName: lang === 'ar' ? 'أحمد محمود' : 'Ahmed Mahmoud',
    debtorPhone: '',
    avatarId: 'young_man',
    title: lang === 'ar' ? 'دفعة شهرية' : 'Monthly installment',
    category: 'سلفة شخصية',
    totalAmount: 2500,
    paidAmount: 1000,
    currency: 'EGP',
    givenDate: getTodayISO(),
    dueDate: getTodayISO(),
    installmentPlan: 'دفعة واحدة',
    status: 'جزئي',
    notes: '',
    alertLevel: 'urgent',
    alertNote: lang === 'ar' ? 'اختبار تنبيه والشاشة مغلقة' : 'Screen-off alert test',
  };

  const { title, body } = formatDueNotification(sampleDebt, settings, lang);
  const sampleAvatarSrc = resolveAvatarSrc(sampleDebt.avatarId);

  const native = getNativeBridge();
  if (native?.scheduleTestAlarm) {
    try {
      native.scheduleTestAlarm(
        safeDelay,
        title,
        body,
        settings.alertStyle,
        settings.soundEnabled,
        settings.vibrateEnabled,
        settings.wakeScreen,
        settings.fullScreenAlert,
        settings.alertTone,
        sampleAvatarSrc
      );
      return { via: 'native', title, body };
    } catch {
      // Fallback to Web timer
    }
  }

  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      void deliverWebNotification(
        title,
        body,
        settings,
        'moamen-delayed-test-alert',
        undefined,
        sampleAvatarSrc
      );
    }, safeDelay * 1000);
  }
  return { via: 'web', title, body };
}
