import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  AppIconId,
  AppIconSection,
  AppPageKey,
  AvatarRingColor,
  AvatarRingStyle,
  DEFAULT_NAV_ICONS,
  IconSize,
  IconStyleId,
  NavIconKey,
  NavIconsConfig,
  normalizeAppIconId,
  normalizeIconStyle,
  normalizeSectionIconStyle,
  PageCustomSettings,
  PageScaleChoice,
  PageSettingsMap,
  PageSizeChoice,
  sanitizeAnyWalletIconId,
  sanitizeNotificationSettings,
  sanitizePersonAlertLevel,
  sanitizeRefreshRateHz,
  sanitizeWalletIcons,
  SectionIconStyleChoice,
  SectionIconStyles,
  StatusFlashColor,
  VALID_APP_PAGES,
  VALID_AVATAR_RING_COLORS,
  VALID_AVATAR_RING_STYLES,
  VALID_ICON_SIZES,
  VALID_NAV_ICON_KEYS,
  VALID_PAGE_SCALES,
  VALID_STATUS_COLORS,
} from '../data/customization';
import { sanitizePageWallpaperChoice, sanitizeWallpaperId } from '../data/wallpapers';
import { AppLanguage, ThemeId, THEMES } from '../data/themes';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  ChargeInput,
  ChargeRecord,
  CURRENCIES,
  Currency,
  DebtInput,
  DebtRecord,
  deriveDebtStatus,
  FIELD_LIMITS,
  HesabatyBackupPayload,
  isBuiltinWalletType,
  PaymentInput,
  PaymentRecord,
  roundMoney,
  UserProfile,
  WalletRecord,
  WalletTransaction,
  WalletTxType,
  WalletType,
} from '../types/debt';
import { ensureAllDefaultWallets, generateLocalId, LocalAppState } from './localStore';

const VALID_THEMES: ThemeId[] = ['mint', 'sky', 'lavender', 'amber', 'dark'];
const VALID_LANGS: AppLanguage[] = ['ar', 'en'];

function sanitizeIconSize(val?: unknown, fallback: IconSize = 'sm'): IconSize {
  return typeof val === 'string' && VALID_ICON_SIZES.includes(val as IconSize)
    ? (val as IconSize)
    : fallback;
}

function sanitizeStatusColor(val?: unknown): StatusFlashColor {
  return typeof val === 'string' && VALID_STATUS_COLORS.includes(val as StatusFlashColor)
    ? (val as StatusFlashColor)
    : 'green';
}

function sanitizeAvatarRingColor(val?: unknown): AvatarRingColor {
  return typeof val === 'string' && VALID_AVATAR_RING_COLORS.includes(val as AvatarRingColor)
    ? (val as AvatarRingColor)
    : 'none';
}

function sanitizeAvatarRingStyle(val?: unknown): AvatarRingStyle {
  return typeof val === 'string' && VALID_AVATAR_RING_STYLES.includes(val as AvatarRingStyle)
    ? (val as AvatarRingStyle)
    : 'solid';
}

function sanitizeIconStyle(val?: unknown): IconStyleId {
  return normalizeIconStyle(val);
}

function sanitizeSectionIconStyles(val?: unknown): SectionIconStyles {
  const raw = (val && typeof val === 'object' ? val : {}) as Record<string, unknown>;
  const sections: AppIconSection[] = ['nav', 'header', 'people', 'wallets', 'settings'];
  const out: SectionIconStyles = {};
  for (const s of sections) {
    const v = raw[s];
    if (typeof v === 'string') {
      out[s] = normalizeSectionIconStyle(v);
    }
  }
  return out;
}

function sanitizePageSettings(val?: unknown): PageSettingsMap {
  const raw = (val && typeof val === 'object' ? val : {}) as Record<string, unknown>;
  const out: PageSettingsMap = {};
  for (const page of VALID_APP_PAGES) {
    const entry = raw[page];
    if (!entry || typeof entry !== 'object') continue;
    const obj = entry as Record<string, unknown>;
    const clean: PageCustomSettings = {};
    if (
      typeof obj.pageScale === 'string' &&
      (obj.pageScale === 'inherit' || VALID_PAGE_SCALES.includes(obj.pageScale as 'compact' | 'normal' | 'large'))
    ) {
      clean.pageScale = obj.pageScale as PageScaleChoice;
    }
    if (
      typeof obj.iconSize === 'string' &&
      (obj.iconSize === 'inherit' || VALID_ICON_SIZES.includes(obj.iconSize as IconSize))
    ) {
      clean.iconSize = obj.iconSize as PageSizeChoice;
    }
    if (
      typeof obj.avatarSize === 'string' &&
      (obj.avatarSize === 'inherit' || VALID_ICON_SIZES.includes(obj.avatarSize as IconSize))
    ) {
      clean.avatarSize = obj.avatarSize as PageSizeChoice;
    }
    if (typeof obj.iconStyle === 'string') {
      clean.iconStyle = normalizeSectionIconStyle(obj.iconStyle);
    }
    if (typeof obj.wallpaperId === 'string') {
      clean.wallpaperId = sanitizePageWallpaperChoice(obj.wallpaperId);
    }
    if (Object.keys(clean).length > 0) {
      out[page as AppPageKey] = clean;
    }
  }
  return out;
}

function sanitizeAppIconId(val?: unknown): AppIconId {
  return normalizeAppIconId(val);
}

function sanitizeNavIcons(val?: unknown): NavIconsConfig {
  const raw = (val && typeof val === 'object' ? val : {}) as Partial<NavIconsConfig>;
  const pick = (k: unknown, fallback: NavIconKey): NavIconKey =>
    typeof k === 'string' && VALID_NAV_ICON_KEYS.includes(k as NavIconKey)
      ? (k as NavIconKey)
      : fallback;
  return {
    receivables: pick(raw.receivables, DEFAULT_NAV_ICONS.receivables),
    payables: pick(raw.payables, DEFAULT_NAV_ICONS.payables),
    wallets: pick(raw.wallets, DEFAULT_NAV_ICONS.wallets),
  };
}

export function normalizeCurrency(c?: string): Currency {
  if (!c) return 'EGP';
  if (c === 'ج.م') return 'EGP';
  if (c === 'ر.س') return 'SAR';
  if (c === 'د.إ') return 'AED';
  if (c === 'د.ك') return 'KWD';
  if (c === '$') return 'USD';
  return (CURRENCIES.includes(c as Currency) ? c : 'EGP') as Currency;
}

export function sanitizeDebtInput(input: DebtInput): DebtInput {
  const debtorName = input.debtorName.trim().slice(0, FIELD_LIMITS.debtorNameMax);
  const debtorPhone = input.debtorPhone.trim().slice(0, FIELD_LIMITS.debtorPhoneMax);
  const avatarId = (input.avatarId || 'boy').slice(0, FIELD_LIMITS.avatarMax);
  const title = input.title.trim().slice(0, FIELD_LIMITS.titleMax) || 'مستحق مالي';
  const notes = input.notes.trim().slice(0, FIELD_LIMITS.notesMax);
  const alertLevel = sanitizePersonAlertLevel(input.alertLevel);
  const alertNote =
    alertLevel === 'none'
      ? ''
      : (input.alertNote || '').trim().slice(0, FIELD_LIMITS.alertNoteMax);
  const totalAmount = Math.min(
    FIELD_LIMITS.maxAmount,
    Math.max(0.01, roundMoney(Number(input.totalAmount) || 0))
  );

  if (!debtorName) throw new Error('يرجى إدخال اسم الشخص.');
  if (totalAmount <= 0) throw new Error('يجب أن يكون المبلغ أكبر من صفر.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.givenDate)) throw new Error('تاريخ البداية غير صالح.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) throw new Error('تاريخ الاستحقاق غير صالح.');

  return {
    ...input,
    debtorName,
    debtorPhone,
    avatarId,
    title,
    notes,
    alertLevel,
    alertNote,
    totalAmount,
    currency: normalizeCurrency(input.currency),
  };
}

function serializeTimestamp(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return new Date(val).toISOString();
  const maybeTs = val as { toDate?: () => Date };
  if (typeof maybeTs.toDate === 'function') {
    return maybeTs.toDate().toISOString();
  }
  return new Date().toISOString();
}

function txMillis(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const maybeTs = val as { toMillis?: () => number };
  if (maybeTs && typeof maybeTs.toMillis === 'function') {
    return maybeTs.toMillis();
  }
  return 0;
}

// --- Firestore Cloud Operations ---

const ALLOWED_USER_PROFILE_KEYS = new Set([
  'uid',
  'displayName',
  'avatarUrl',
  'statusActive',
  'statusLabel',
  'statusColor',
  'avatarRingColor',
  'avatarRingStyle',
  'theme',
  'followPhoneTheme',
  'autoAppIconByTheme',
  'language',
  'defaultCurrency',
  'createdAt',
  'updatedAt',
  'iconSize',
  'navIconSize',
  'avatarSize',
  'profileAvatarSize',
  'walletImageSize',
  'iconStyle',
  'sectionIconStyles',
  'pageSettings',
  'navSoundEnabled',
  'appIconId',
  'navIcons',
  'refreshRateHz',
  'notificationSettings',
  'hideAmounts',
  'showPrivacyToggle',
  'hideWalletAmounts',
  'showWalletPrivacyToggle',
  'wallpaperId',
  'walletIcons',
]);

export async function syncProfileToCloud(uid: string, profile: UserProfile): Promise<void> {
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);
  const safeTheme = VALID_THEMES.includes(profile.theme) ? profile.theme : 'mint';
  const safeLang = VALID_LANGS.includes(profile.language) ? profile.language : 'ar';
  const safeCurrency = normalizeCurrency(profile.defaultCurrency);
  const cleanFields = {
    displayName: (profile.displayName || 'حسابي').trim().slice(0, FIELD_LIMITS.displayNameMax) || 'حسابي',
    avatarUrl: (profile.avatarUrl || 'boy').slice(0, FIELD_LIMITS.avatarMax),
    statusActive: Boolean(profile.statusActive),
    statusLabel: (profile.statusLabel || '').trim().slice(0, FIELD_LIMITS.statusLabelMax),
    statusColor: sanitizeStatusColor(profile.statusColor),
    avatarRingColor: sanitizeAvatarRingColor(profile.avatarRingColor),
    avatarRingStyle: sanitizeAvatarRingStyle(profile.avatarRingStyle),
    theme: safeTheme,
    followPhoneTheme: Boolean(profile.followPhoneTheme),
    autoAppIconByTheme: Boolean(profile.autoAppIconByTheme),
    language: safeLang,
    defaultCurrency: safeCurrency,
    iconSize: sanitizeIconSize(profile.iconSize, 'sm'),
    navIconSize: sanitizeIconSize(profile.navIconSize ?? profile.iconSize, 'sm'),
    avatarSize: sanitizeIconSize(profile.avatarSize, 'md'),
    profileAvatarSize: sanitizeIconSize(profile.profileAvatarSize ?? profile.avatarSize, 'md'),
    walletImageSize: sanitizeIconSize(profile.walletImageSize ?? profile.avatarSize, 'md'),
    iconStyle: sanitizeIconStyle(profile.iconStyle),
    sectionIconStyles: sanitizeSectionIconStyles(profile.sectionIconStyles),
    pageSettings: sanitizePageSettings(profile.pageSettings),
    navSoundEnabled: profile.navSoundEnabled !== false,
    appIconId: sanitizeAppIconId(profile.appIconId),
    navIcons: sanitizeNavIcons(profile.navIcons),
    refreshRateHz: sanitizeRefreshRateHz(profile.refreshRateHz),
    notificationSettings: sanitizeNotificationSettings(profile.notificationSettings),
    hideAmounts: Boolean(profile.hideAmounts),
    showPrivacyToggle: profile.showPrivacyToggle !== false,
    hideWalletAmounts: Boolean(profile.hideWalletAmounts),
    showWalletPrivacyToggle: profile.showWalletPrivacyToggle !== false,
    wallpaperId: sanitizeWallpaperId(profile.wallpaperId),
    walletIcons: sanitizeWalletIcons(profile.walletIcons),
    updatedAt: serverTimestamp(),
  };
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const existingData = snap.data() as Record<string, unknown>;
      const hasValidUid = existingData.uid === uid;
      const hasValidCreatedAt = Boolean(
        existingData.createdAt &&
          typeof (existingData.createdAt as { toDate?: unknown }).toDate === 'function'
      );
      const hasUnknownKeys = Object.keys(existingData).some(
        (key) => !ALLOWED_USER_PROFILE_KEYS.has(key)
      );

      if (hasValidUid && hasValidCreatedAt && !hasUnknownKeys) {
        await updateDoc(ref, cleanFields);
      } else {
        await setDoc(ref, {
          uid,
          ...cleanFields,
          createdAt: hasValidCreatedAt ? existingData.createdAt : serverTimestamp(),
        });
      }
    } else {
      await setDoc(ref, {
        uid,
        ...cleanFields,
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function createDebtInCloud(
  uid: string,
  debt: DebtRecord,
  initialPayment?: PaymentRecord
): Promise<void> {
  const debtRef = doc(db, 'debts', debt.id);
  const path = `debts/${debt.id}`;

  const debtPayload = {
    ownerId: uid,
    direction: debt.direction,
    debtorName: debt.debtorName,
    debtorPhone: debt.debtorPhone,
    avatarId: debt.avatarId,
    title: debt.title,
    category: debt.category,
    totalAmount: debt.totalAmount,
    paidAmount: debt.paidAmount,
    currency: normalizeCurrency(debt.currency),
    givenDate: debt.givenDate,
    dueDate: debt.dueDate,
    installmentPlan: debt.installmentPlan,
    status: deriveDebtStatus(debt.totalAmount, debt.paidAmount),
    notes: debt.notes,
    alertLevel: sanitizePersonAlertLevel(debt.alertLevel),
    alertNote: (debt.alertNote || '').trim().slice(0, FIELD_LIMITS.alertNoteMax),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    if (initialPayment && debt.paidAmount > 0) {
      const batch = writeBatch(db);
      batch.set(debtRef, debtPayload);
      const paymentRef = doc(db, 'debts', debt.id, 'payments', initialPayment.id);
      batch.set(paymentRef, {
        ownerId: uid,
        debtId: debt.id,
        amount: initialPayment.amount,
        paymentDate: initialPayment.paymentDate,
        method: initialPayment.method,
        note: initialPayment.note.trim().slice(0, FIELD_LIMITS.paymentNoteMax),
        createdAt: serverTimestamp(),
      });
      await batch.commit();
    } else {
      await setDoc(debtRef, {
        ...debtPayload,
        paidAmount: 0,
        status: 'نشط',
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateDebtDetailsInCloud(
  debtId: string,
  currentPaidAmount: number,
  rawInput: DebtInput
): Promise<void> {
  const input = sanitizeDebtInput(rawInput);
  const nextStatus = deriveDebtStatus(input.totalAmount, currentPaidAmount);
  const path = `debts/${debtId}`;

  try {
    await updateDoc(doc(db, 'debts', debtId), {
      direction: input.direction,
      debtorName: input.debtorName,
      debtorPhone: input.debtorPhone,
      avatarId: input.avatarId,
      title: input.title,
      category: input.category,
      totalAmount: input.totalAmount,
      currency: input.currency,
      givenDate: input.givenDate,
      dueDate: input.dueDate,
      installmentPlan: input.installmentPlan,
      status: nextStatus,
      notes: input.notes,
      alertLevel: sanitizePersonAlertLevel(input.alertLevel),
      alertNote: (input.alertNote || '').trim().slice(0, FIELD_LIMITS.alertNoteMax),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function logDebtPaymentInCloud(
  uid: string,
  debt: DebtRecord,
  payment: PaymentRecord,
  newPaidAmount: number
): Promise<void> {
  const newStatus = deriveDebtStatus(debt.totalAmount, newPaidAmount);
  const debtRef = doc(db, 'debts', debt.id);
  const paymentRef = doc(db, 'debts', debt.id, 'payments', payment.id);
  const path = `debts/${debt.id}/payments/${payment.id}`;

  try {
    const batch = writeBatch(db);
    batch.set(paymentRef, {
      ownerId: uid,
      debtId: debt.id,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      method: payment.method,
      note: payment.note.trim().slice(0, FIELD_LIMITS.paymentNoteMax),
      createdAt: serverTimestamp(),
    });
    batch.update(debtRef, {
      direction: debt.direction || 'receivable',
      avatarId: debt.avatarId || 'man_glasses',
      paidAmount: newPaidAmount,
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function logDebtChargeInCloud(
  uid: string,
  debt: DebtRecord,
  charge: ChargeRecord,
  newTotal: number
): Promise<void> {
  const newStatus = deriveDebtStatus(newTotal, debt.paidAmount);
  const debtRef = doc(db, 'debts', debt.id);
  const chargeRef = doc(db, 'debts', debt.id, 'charges', charge.id);
  const path = `debts/${debt.id}/charges/${charge.id}`;

  try {
    const batch = writeBatch(db);
    batch.set(chargeRef, {
      ownerId: uid,
      debtId: debt.id,
      amount: charge.amount,
      chargeDate: charge.chargeDate,
      note: charge.note.trim().slice(0, FIELD_LIMITS.paymentNoteMax),
      createdAt: serverTimestamp(),
    });
    batch.update(debtRef, {
      totalAmount: newTotal,
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteDebtInCloud(uid: string, debtId: string): Promise<void> {
  const path = `debts/${debtId}`;
  try {
    const debtRef = doc(db, 'debts', debtId);
    const snap = await getDoc(debtRef);
    if (!snap.exists()) return;

    const paymentsSnap = await getDocs(
      query(collection(db, 'debts', debtId, 'payments'), where('ownerId', '==', uid))
    );
    const chargesSnap = await getDocs(
      query(collection(db, 'debts', debtId, 'charges'), where('ownerId', '==', uid))
    );
    const batch = writeBatch(db);
    for (const p of paymentsSnap.docs) {
      batch.delete(p.ref);
    }
    for (const c of chargesSnap.docs) {
      batch.delete(c.ref);
    }
    batch.delete(debtRef);
    await batch.commit();
  } catch (err) {
    try {
      await deleteDoc(doc(db, 'debts', debtId));
    } catch {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

// --- Wallets Cloud Operations ---

function cloudWalletId(uid: string, type: WalletType): string {
  return `${uid}_${type}`;
}

export async function ensureWalletInCloud(uid: string, wallet: WalletRecord): Promise<void> {
  const wid = cloudWalletId(uid, wallet.walletType);
  const ref = doc(db, 'wallets', wid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerId: uid,
        walletType: wallet.walletType,
        label: wallet.label.slice(0, 60),
        ...(wallet.iconId ? { iconId: sanitizeAnyWalletIconId(wallet.iconId) } : {}),
        balance: Math.max(0, roundMoney(wallet.balance)),
        currency: normalizeCurrency(wallet.currency),
        isHidden: Boolean(wallet.isHidden),
        recentNote: (wallet.recentNote || '').slice(0, FIELD_LIMITS.walletNoteMax),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `wallets/${wid}`);
  }
}

export async function applyWalletTransactionInCloud(
  uid: string,
  wallet: WalletRecord,
  tx: WalletTransaction,
  nextBalance: number
): Promise<void> {
  const wid = cloudWalletId(uid, wallet.walletType);
  await ensureWalletInCloud(uid, wallet);

  const walletRef = doc(db, 'wallets', wid);
  const txRef = doc(db, 'walletTransactions', tx.id);
  const path = `walletTransactions/${tx.id}`;

  try {
    const batch = writeBatch(db);
    batch.update(walletRef, {
      balance: nextBalance,
      currency: normalizeCurrency(wallet.currency),
      recentNote: (tx.note || (tx.type === 'add' ? 'Money added' : 'Money withdrawn')).slice(
        0,
        FIELD_LIMITS.walletNoteMax
      ),
      updatedAt: serverTimestamp(),
    });
    batch.set(txRef, {
      ownerId: uid,
      walletId: wid,
      walletType: wallet.walletType,
      ...(tx.walletLabel ? { walletLabel: tx.walletLabel.slice(0, 60) } : {}),
      type: tx.type,
      amount: tx.amount,
      note: tx.note.slice(0, FIELD_LIMITS.walletNoteMax),
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function syncWalletHiddenInCloud(
  uid: string,
  wallet: WalletRecord,
  isHidden: boolean
): Promise<void> {
  const wid = cloudWalletId(uid, wallet.walletType);
  await ensureWalletInCloud(uid, wallet);
  try {
    await updateDoc(doc(db, 'wallets', wid), {
      isHidden,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `wallets/${wid}`);
  }
}

export async function deleteWalletTransactionInCloud(
  uid: string,
  txId: string,
  updatedWallet?: WalletRecord
): Promise<void> {
  const txRef = doc(db, 'walletTransactions', txId);
  try {
    const snap = await getDoc(txRef);
    if (snap.exists()) {
      await deleteDoc(txRef);
    }
    if (updatedWallet) {
      const wid = cloudWalletId(uid, updatedWallet.walletType);
      await ensureWalletInCloud(uid, updatedWallet);
      await updateDoc(doc(db, 'wallets', wid), {
        balance: Math.max(0, roundMoney(updatedWallet.balance)),
        currency: normalizeCurrency(updatedWallet.currency),
        recentNote: (updatedWallet.recentNote || '').slice(0, FIELD_LIMITS.walletNoteMax),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `walletTransactions/${txId}`);
  }
}

// --- Full Cloud Backup & Restore ---

export async function pushLocalBackupToCloud(
  uid: string,
  state: LocalAppState
): Promise<void> {
  // 1. Sync user profile
  await syncProfileToCloud(uid, state.profile);

  // 2. Delete any locally deleted debts & wallet transactions from cloud
  for (const deletedId of state.deletedDebtIds) {
    await deleteDebtInCloud(uid, deletedId);
  }
  for (const deletedTxId of state.deletedWalletTxIds || []) {
    await deleteWalletTransactionInCloud(uid, deletedTxId);
  }

  // 3. Fetch existing cloud wallets & transactions
  const existingTxSnap = await getDocs(
    query(collection(db, 'walletTransactions'), where('ownerId', '==', uid))
  );
  const existingTxIds = new Set(existingTxSnap.docs.map((d) => d.id));

  for (const wallet of state.wallets) {
    const wid = cloudWalletId(uid, wallet.walletType);
    const wRef = doc(db, 'wallets', wid);
    const wSnap = await getDoc(wRef);

    const pendingTxs = state.walletTxs
      .filter((tx) => tx.walletType === wallet.walletType && !existingTxIds.has(tx.id))
      .sort((a, b) => txMillis(a.createdAt) - txMillis(b.createdAt));

    if (!wSnap.exists()) {
      // Replay from initial balance if possible so walletTransactions pass atomic balance rules
      let startBal = wallet.balance;
      for (const tx of pendingTxs) {
        startBal =
          tx.type === 'add'
            ? roundMoney(startBal - tx.amount)
            : roundMoney(startBal + tx.amount);
      }

      if (startBal >= 0 && pendingTxs.length > 0) {
        await setDoc(wRef, {
          ownerId: uid,
          walletType: wallet.walletType,
          label: wallet.label.slice(0, 60),
          ...(wallet.iconId ? { iconId: sanitizeAnyWalletIconId(wallet.iconId) } : {}),
          balance: startBal,
          currency: normalizeCurrency(wallet.currency),
          isHidden: Boolean(wallet.isHidden),
          recentNote: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        let running = startBal;
        for (const tx of pendingTxs) {
          running =
            tx.type === 'add'
              ? roundMoney(running + tx.amount)
              : Math.max(0, roundMoney(running - tx.amount));
          await applyWalletTransactionInCloud(
            uid,
            { ...wallet, balance: running },
            tx,
            running
          );
        }
      } else {
        await setDoc(wRef, {
          ownerId: uid,
          walletType: wallet.walletType,
          label: wallet.label.slice(0, 60),
          ...(wallet.iconId ? { iconId: sanitizeAnyWalletIconId(wallet.iconId) } : {}),
          balance: Math.max(0, roundMoney(wallet.balance)),
          currency: normalizeCurrency(wallet.currency),
          isHidden: Boolean(wallet.isHidden),
          recentNote: (wallet.recentNote || '').slice(0, FIELD_LIMITS.walletNoteMax),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      const cloudBal = Number((wSnap.data() as WalletRecord).balance || 0);
      let running = cloudBal;
      for (const tx of pendingTxs) {
        if (tx.type === 'withdraw' && tx.amount > running + 0.001) continue;
        running =
          tx.type === 'add'
            ? roundMoney(running + tx.amount)
            : Math.max(0, roundMoney(running - tx.amount));
        await applyWalletTransactionInCloud(
          uid,
          { ...wallet, balance: running },
          tx,
          running
        );
      }
      // Ensure final balance & metadata match local state
      await updateDoc(wRef, {
        ...(wallet.iconId ? { iconId: sanitizeAnyWalletIconId(wallet.iconId) } : {}),
        balance: Math.max(0, roundMoney(wallet.balance)),
        currency: normalizeCurrency(wallet.currency),
        isHidden: Boolean(wallet.isHidden),
        recentNote: (wallet.recentNote || '').slice(0, FIELD_LIMITS.walletNoteMax),
        updatedAt: serverTimestamp(),
      });
    }
  }

  // 4. Sync debts, charges, and payments
  for (const debt of state.debts) {
    const debtRef = doc(db, 'debts', debt.id);
    const snap = await getDoc(debtRef);
    const localCharges = [...(state.chargesByDebt[debt.id] || [])].sort((a, b) =>
      a.chargeDate.localeCompare(b.chargeDate)
    );
    const localPayments = [...(state.paymentsByDebt[debt.id] || [])].sort((a, b) =>
      a.paymentDate.localeCompare(b.paymentDate)
    );

    if (!snap.exists()) {
      const chargesSum = roundMoney(localCharges.reduce((s, c) => s + c.amount, 0));
      const baseTotal = Math.max(0.01, roundMoney(debt.totalAmount - chargesSum));

      const baseDebt: DebtRecord = {
        ...debt,
        ownerId: uid,
        totalAmount: baseTotal,
        paidAmount: 0,
        status: 'نشط',
      };
      await createDebtInCloud(uid, baseDebt);

      let runningTotal = baseTotal;
      for (const ch of localCharges) {
        const nextTotal = roundMoney(runningTotal + ch.amount);
        await logDebtChargeInCloud(
          uid,
          { ...baseDebt, totalAmount: runningTotal, paidAmount: 0 },
          ch,
          nextTotal
        );
        runningTotal = nextTotal;
      }

      let runningPaid = 0;
      for (const pay of localPayments) {
        const remaining = roundMoney(runningTotal - runningPaid);
        if (remaining <= 0) break;
        const amt = Math.min(remaining, roundMoney(pay.amount));
        if (amt <= 0) continue;
        const nextPaid = amt >= remaining - 0.001 ? runningTotal : roundMoney(runningPaid + amt);
        await logDebtPaymentInCloud(
          uid,
          {
            ...baseDebt,
            totalAmount: runningTotal,
            paidAmount: runningPaid,
            status: deriveDebtStatus(runningTotal, runningPaid),
          },
          { ...pay, amount: amt },
          nextPaid
        );
        runningPaid = nextPaid;
      }

      // Handle any paidAmount difference from legacy JSON imports without payment rows
      const missingPaid = roundMoney(debt.paidAmount - runningPaid);
      if (missingPaid > 0.005 && runningPaid < runningTotal) {
        const amt = Math.min(roundMoney(runningTotal - runningPaid), missingPaid);
        const nextPaid =
          amt >= runningTotal - runningPaid - 0.001 ? runningTotal : roundMoney(runningPaid + amt);
        await logDebtPaymentInCloud(
          uid,
          {
            ...baseDebt,
            totalAmount: runningTotal,
            paidAmount: runningPaid,
            status: deriveDebtStatus(runningTotal, runningPaid),
          },
          {
            id: generateLocalId('pay'),
            ownerId: uid,
            debtId: debt.id,
            amount: amt,
            paymentDate: debt.givenDate,
            method: 'نقدي',
            note: 'مزامنة تلقائية',
          },
          nextPaid
        );
      }
    } else {
      const cloudDebt = snap.data() as DebtRecord;
      const cloudChargesSnap = await getDocs(
        query(collection(db, 'debts', debt.id, 'charges'), where('ownerId', '==', uid))
      );
      const cloudChargeIds = new Set(cloudChargesSnap.docs.map((d) => d.id));
      const cloudPaymentsSnap = await getDocs(
        query(collection(db, 'debts', debt.id, 'payments'), where('ownerId', '==', uid))
      );
      const cloudPaymentIds = new Set(cloudPaymentsSnap.docs.map((d) => d.id));

      let runningTotal = Number(cloudDebt.totalAmount || 0);
      let runningPaid = Number(cloudDebt.paidAmount || 0);

      for (const ch of localCharges) {
        if (cloudChargeIds.has(ch.id)) continue;
        const nextTotal = roundMoney(runningTotal + ch.amount);
        await logDebtChargeInCloud(
          uid,
          { ...debt, totalAmount: runningTotal, paidAmount: runningPaid },
          ch,
          nextTotal
        );
        runningTotal = nextTotal;
      }

      for (const pay of localPayments) {
        if (cloudPaymentIds.has(pay.id)) continue;
        const remaining = roundMoney(runningTotal - runningPaid);
        if (remaining <= 0) break;
        const amt = Math.min(remaining, roundMoney(pay.amount));
        if (amt <= 0) continue;
        const nextPaid = amt >= remaining - 0.001 ? runningTotal : roundMoney(runningPaid + amt);
        await logDebtPaymentInCloud(
          uid,
          {
            ...debt,
            totalAmount: runningTotal,
            paidAmount: runningPaid,
            status: deriveDebtStatus(runningTotal, runningPaid),
          },
          { ...pay, amount: amt },
          nextPaid
        );
        runningPaid = nextPaid;
      }

      // Sync edited metadata if debt is not settled in cloud
      if (deriveDebtStatus(runningTotal, runningPaid) !== 'محصل') {
        const targetTotal = Math.max(runningPaid, debt.totalAmount);
        await updateDebtDetailsInCloud(debt.id, runningPaid, {
          direction: debt.direction,
          debtorName: debt.debtorName,
          debtorPhone: debt.debtorPhone,
          avatarId: debt.avatarId,
          title: debt.title,
          category: debt.category,
          totalAmount: targetTotal,
          currency: normalizeCurrency(debt.currency),
          givenDate: debt.givenDate,
          dueDate: debt.dueDate,
          installmentPlan: debt.installmentPlan,
          notes: debt.notes,
          alertLevel: debt.alertLevel,
          alertNote: debt.alertNote,
        });
      }
    }
  }
}

export async function pullCloudBackup(uid: string): Promise<{
  hasCloudData: boolean;
  profile?: UserProfile;
  debts: DebtRecord[];
  paymentsByDebt: Record<string, PaymentRecord[]>;
  chargesByDebt: Record<string, ChargeRecord[]>;
  wallets: WalletRecord[];
  walletTxs: WalletTransaction[];
}> {
  const userSnap = await getDoc(doc(db, 'users', uid));
  let profile: UserProfile | undefined;
  if (userSnap.exists()) {
    const raw = userSnap.data() as Partial<UserProfile>;
    profile = {
      uid,
      displayName: (raw.displayName || 'حسابي').slice(0, FIELD_LIMITS.displayNameMax),
      avatarUrl: raw.avatarUrl || 'boy',
      statusActive: typeof raw.statusActive === 'boolean' ? raw.statusActive : true,
      statusLabel: typeof raw.statusLabel === 'string' ? raw.statusLabel : 'نشط الآن',
      statusColor: sanitizeStatusColor(raw.statusColor),
      avatarRingColor: sanitizeAvatarRingColor(raw.avatarRingColor),
      avatarRingStyle: sanitizeAvatarRingStyle(raw.avatarRingStyle),
      theme: raw.theme && VALID_THEMES.includes(raw.theme) ? raw.theme : 'mint',
      followPhoneTheme: Boolean(raw.followPhoneTheme),
      autoAppIconByTheme: Boolean(raw.autoAppIconByTheme),
      language: raw.language && VALID_LANGS.includes(raw.language) ? raw.language : 'ar',
      defaultCurrency: normalizeCurrency(raw.defaultCurrency),
      iconSize: sanitizeIconSize(raw.iconSize, 'sm'),
      navIconSize: sanitizeIconSize(raw.navIconSize ?? raw.iconSize, 'sm'),
      avatarSize: sanitizeIconSize(raw.avatarSize, 'md'),
      profileAvatarSize: sanitizeIconSize(raw.profileAvatarSize ?? raw.avatarSize, 'md'),
      walletImageSize: sanitizeIconSize(raw.walletImageSize ?? raw.avatarSize, 'md'),
      iconStyle: sanitizeIconStyle(raw.iconStyle),
      sectionIconStyles: sanitizeSectionIconStyles(raw.sectionIconStyles),
      pageSettings: sanitizePageSettings(raw.pageSettings),
      navSoundEnabled: typeof raw.navSoundEnabled === 'boolean' ? raw.navSoundEnabled : true,
      appIconId: sanitizeAppIconId(raw.appIconId),
      navIcons: sanitizeNavIcons(raw.navIcons),
      refreshRateHz: sanitizeRefreshRateHz(raw.refreshRateHz),
      notificationSettings: sanitizeNotificationSettings(raw.notificationSettings),
      hideAmounts: Boolean(raw.hideAmounts),
      showPrivacyToggle: typeof raw.showPrivacyToggle === 'boolean' ? raw.showPrivacyToggle : true,
      hideWalletAmounts: Boolean(raw.hideWalletAmounts),
      showWalletPrivacyToggle:
        typeof raw.showWalletPrivacyToggle === 'boolean' ? raw.showWalletPrivacyToggle : true,
      wallpaperId: sanitizeWallpaperId(raw.wallpaperId),
      walletIcons: sanitizeWalletIcons(raw.walletIcons),
    };
  }

  const debtsSnap = await getDocs(
    query(collection(db, 'debts'), where('ownerId', '==', uid))
  );
  const debts: DebtRecord[] = debtsSnap.docs
    .map((d) => {
      const raw = d.data() as Partial<DebtRecord>;
      return {
        id: d.id,
        ownerId: uid,
        direction: (raw.direction === 'payable' ? 'payable' : 'receivable') as DebtRecord['direction'],
        debtorName: raw.debtorName || '',
        debtorPhone: raw.debtorPhone || '',
        avatarId: raw.avatarId || 'man_glasses',
        title: raw.title || '',
        category: raw.category || 'سلفة شخصية',
        totalAmount: Number(raw.totalAmount || 0),
        paidAmount: Number(raw.paidAmount || 0),
        currency: normalizeCurrency(raw.currency),
        givenDate: raw.givenDate || '',
        dueDate: raw.dueDate || '',
        installmentPlan: raw.installmentPlan || 'دفعة واحدة',
        status: raw.status || 'نشط',
        notes: raw.notes || '',
        alertLevel: sanitizePersonAlertLevel(raw.alertLevel),
        alertNote: String(raw.alertNote || '').slice(0, FIELD_LIMITS.alertNoteMax),
      };
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const paymentsByDebt: Record<string, PaymentRecord[]> = {};
  const chargesByDebt: Record<string, ChargeRecord[]> = {};

  for (const debt of debts) {
    const [paySnap, chSnap] = await Promise.all([
      getDocs(query(collection(db, 'debts', debt.id, 'payments'), where('ownerId', '==', uid))),
      getDocs(query(collection(db, 'debts', debt.id, 'charges'), where('ownerId', '==', uid))),
    ]);

    paymentsByDebt[debt.id] = paySnap.docs
      .map((d) => {
        const raw = d.data() as Omit<PaymentRecord, 'id'>;
        return {
          ...raw,
          id: d.id,
          createdAt: serializeTimestamp(raw.createdAt),
        };
      })
      .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

    chargesByDebt[debt.id] = chSnap.docs
      .map((d) => {
        const raw = d.data() as Omit<ChargeRecord, 'id'>;
        return {
          ...raw,
          id: d.id,
          createdAt: serializeTimestamp(raw.createdAt),
        };
      })
      .sort((a, b) => b.chargeDate.localeCompare(a.chargeDate));
  }

  const walletsSnap = await getDocs(
    query(collection(db, 'wallets'), where('ownerId', '==', uid))
  );
  const rawWallets: WalletRecord[] = walletsSnap.docs.map((d) => {
    const raw = d.data() as Omit<WalletRecord, 'id'>;
    return {
      ...raw,
      id: `wallet_${raw.walletType}`,
      currency: normalizeCurrency(raw.currency),
    };
  });

  const wallets = ensureAllDefaultWallets(
    rawWallets,
    profile?.defaultCurrency || 'EGP'
  );

  const txSnap = await getDocs(
    query(collection(db, 'walletTransactions'), where('ownerId', '==', uid))
  );
  const walletTxs: WalletTransaction[] = txSnap.docs
    .map((d) => {
      const raw = d.data() as Omit<WalletTransaction, 'id'>;
      return {
        ...raw,
        id: d.id,
        walletId: `wallet_${raw.walletType}`,
        createdAt: serializeTimestamp(raw.createdAt),
      };
    })
    .sort((a, b) => txMillis(b.createdAt) - txMillis(a.createdAt));

  const hasCloudData =
    userSnap.exists() ||
    debts.length > 0 ||
    rawWallets.some((w) => w.balance > 0 || w.isHidden) ||
    walletTxs.length > 0;

  return {
    hasCloudData,
    profile,
    debts,
    paymentsByDebt,
    chargesByDebt,
    wallets,
    walletTxs,
  };
}

// --- Full JSON Backup & Restore (Works Locally & Offline) ---

export function exportFullBackupJSON(
  profile: UserProfile,
  debts: DebtRecord[],
  wallets: WalletRecord[]
): void {
  const payload: HesabatyBackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: {
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      statusActive: profile.statusActive,
      statusLabel: profile.statusLabel,
      statusColor: sanitizeStatusColor(profile.statusColor),
      avatarRingColor: sanitizeAvatarRingColor(profile.avatarRingColor),
      avatarRingStyle: sanitizeAvatarRingStyle(profile.avatarRingStyle),
      theme: profile.theme,
      followPhoneTheme: Boolean(profile.followPhoneTheme),
      autoAppIconByTheme: Boolean(profile.autoAppIconByTheme),
      language: profile.language,
      defaultCurrency: profile.defaultCurrency,
      iconSize: sanitizeIconSize(profile.iconSize, 'sm'),
      navIconSize: sanitizeIconSize(profile.navIconSize ?? profile.iconSize, 'sm'),
      avatarSize: sanitizeIconSize(profile.avatarSize, 'md'),
      profileAvatarSize: sanitizeIconSize(profile.profileAvatarSize ?? profile.avatarSize, 'md'),
      walletImageSize: sanitizeIconSize(profile.walletImageSize ?? profile.avatarSize, 'md'),
      iconStyle: sanitizeIconStyle(profile.iconStyle),
      sectionIconStyles: sanitizeSectionIconStyles(profile.sectionIconStyles),
      pageSettings: sanitizePageSettings(profile.pageSettings),
      navSoundEnabled: profile.navSoundEnabled !== false,
      appIconId: sanitizeAppIconId(profile.appIconId),
      navIcons: sanitizeNavIcons(profile.navIcons),
      refreshRateHz: sanitizeRefreshRateHz(profile.refreshRateHz),
      notificationSettings: sanitizeNotificationSettings(profile.notificationSettings),
      hideAmounts: Boolean(profile.hideAmounts),
      showPrivacyToggle: profile.showPrivacyToggle !== false,
      hideWalletAmounts: Boolean(profile.hideWalletAmounts),
      showWalletPrivacyToggle: profile.showWalletPrivacyToggle !== false,
      wallpaperId: sanitizeWallpaperId(profile.wallpaperId),
      walletIcons: sanitizeWalletIcons(profile.walletIcons),
    },
    debts: debts.map((d) => ({
      direction: d.direction,
      debtorName: d.debtorName,
      debtorPhone: d.debtorPhone,
      avatarId: d.avatarId,
      title: d.title,
      category: d.category,
      totalAmount: d.totalAmount,
      paidAmount: d.paidAmount,
      currency: d.currency,
      givenDate: d.givenDate,
      dueDate: d.dueDate,
      installmentPlan: d.installmentPlan,
      notes: d.notes,
      alertLevel: sanitizePersonAlertLevel(d.alertLevel),
      alertNote: String(d.alertNote || '').slice(0, FIELD_LIMITS.alertNoteMax),
    })),
    wallets: wallets.map((w) => ({
      walletType: w.walletType,
      label: w.label,
      ...(w.iconId ? { iconId: sanitizeAnyWalletIconId(w.iconId) } : {}),
      balance: w.balance,
      currency: w.currency,
      isHidden: w.isHidden,
      recentNote: w.recentNote,
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hesabaty-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseBackupJSONToState(
  current: LocalAppState,
  rawJsonText: string
): { nextState: LocalAppState; importedDebts: number; importedWallets: number } {
  const parsed = JSON.parse(rawJsonText) as Partial<HesabatyBackupPayload>;
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.debts)) {
    throw new Error('ملف النسخة الاحتياطية غير صالح أو تالف.');
  }

  let nextProfile = { ...current.profile };
  if (parsed.profile) {
    const safeTheme =
      parsed.profile.theme && THEMES[parsed.profile.theme] ? parsed.profile.theme : 'mint';
    nextProfile = {
      ...nextProfile,
      displayName: (parsed.profile.displayName || 'حسابي').slice(0, FIELD_LIMITS.displayNameMax),
      avatarUrl: (parsed.profile.avatarUrl || 'boy').slice(0, FIELD_LIMITS.avatarMax),
      statusActive: Boolean(parsed.profile.statusActive),
      statusLabel: (parsed.profile.statusLabel || '').slice(0, FIELD_LIMITS.statusLabelMax),
      statusColor: sanitizeStatusColor(parsed.profile.statusColor),
      avatarRingColor: sanitizeAvatarRingColor(parsed.profile.avatarRingColor),
      avatarRingStyle: sanitizeAvatarRingStyle(parsed.profile.avatarRingStyle),
      theme: safeTheme,
      followPhoneTheme: Boolean(parsed.profile.followPhoneTheme),
      autoAppIconByTheme: Boolean(parsed.profile.autoAppIconByTheme),
      language: parsed.profile.language === 'en' ? 'en' : 'ar',
      defaultCurrency: normalizeCurrency(parsed.profile.defaultCurrency),
      iconSize: sanitizeIconSize(parsed.profile.iconSize, 'sm'),
      navIconSize: sanitizeIconSize(parsed.profile.navIconSize ?? parsed.profile.iconSize, 'sm'),
      avatarSize: sanitizeIconSize(parsed.profile.avatarSize, 'md'),
      profileAvatarSize: sanitizeIconSize(parsed.profile.profileAvatarSize ?? parsed.profile.avatarSize, 'md'),
      walletImageSize: sanitizeIconSize(parsed.profile.walletImageSize ?? parsed.profile.avatarSize, 'md'),
      iconStyle: sanitizeIconStyle(parsed.profile.iconStyle),
      sectionIconStyles: sanitizeSectionIconStyles(parsed.profile.sectionIconStyles),
      pageSettings: sanitizePageSettings(parsed.profile.pageSettings),
      navSoundEnabled:
        typeof parsed.profile.navSoundEnabled === 'boolean'
          ? parsed.profile.navSoundEnabled
          : nextProfile.navSoundEnabled,
      appIconId: sanitizeAppIconId(parsed.profile.appIconId),
      navIcons: parsed.profile.navIcons
        ? sanitizeNavIcons(parsed.profile.navIcons)
        : nextProfile.navIcons,
      refreshRateHz:
        parsed.profile.refreshRateHz !== undefined
          ? sanitizeRefreshRateHz(parsed.profile.refreshRateHz)
          : nextProfile.refreshRateHz,
      notificationSettings:
        parsed.profile.notificationSettings !== undefined
          ? sanitizeNotificationSettings(parsed.profile.notificationSettings)
          : nextProfile.notificationSettings,
      hideAmounts:
        typeof parsed.profile.hideAmounts === 'boolean'
          ? parsed.profile.hideAmounts
          : nextProfile.hideAmounts,
      showPrivacyToggle:
        typeof parsed.profile.showPrivacyToggle === 'boolean'
          ? parsed.profile.showPrivacyToggle
          : nextProfile.showPrivacyToggle,
      hideWalletAmounts:
        typeof parsed.profile.hideWalletAmounts === 'boolean'
          ? parsed.profile.hideWalletAmounts
          : nextProfile.hideWalletAmounts,
      showWalletPrivacyToggle:
        typeof parsed.profile.showWalletPrivacyToggle === 'boolean'
          ? parsed.profile.showWalletPrivacyToggle
          : nextProfile.showWalletPrivacyToggle,
      wallpaperId:
        parsed.profile.wallpaperId !== undefined
          ? sanitizeWallpaperId(parsed.profile.wallpaperId)
          : nextProfile.wallpaperId,
      walletIcons:
        parsed.profile.walletIcons !== undefined
          ? sanitizeWalletIcons(parsed.profile.walletIcons)
          : nextProfile.walletIcons,
    };
  }

  const nextDebts = [...current.debts];
  const nextPaymentsByDebt = { ...current.paymentsByDebt };
  let importedDebts = 0;

  for (const d of parsed.debts) {
    if (!d.debtorName || !d.totalAmount || d.totalAmount <= 0) continue;
    const total = roundMoney(Number(d.totalAmount));
    const paid = Math.min(total, Math.max(0, roundMoney(Number(d.paidAmount || 0))));
    const id = generateLocalId('debt');
    const givenDate = /^\d{4}-\d{2}-\d{2}$/.test(String(d.givenDate))
      ? String(d.givenDate)
      : new Date().toISOString().slice(0, 10);
    const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(String(d.dueDate))
      ? String(d.dueDate)
      : new Date().toISOString().slice(0, 10);

    const record: DebtRecord = {
      id,
      ownerId: current.profile.uid,
      direction: d.direction === 'payable' ? 'payable' : 'receivable',
      debtorName: String(d.debtorName).slice(0, FIELD_LIMITS.debtorNameMax),
      debtorPhone: String(d.debtorPhone || '').slice(0, FIELD_LIMITS.debtorPhoneMax),
      avatarId: String(d.avatarId || 'boy').slice(0, FIELD_LIMITS.avatarMax),
      title: String(d.title || 'مستحق مالي').slice(0, FIELD_LIMITS.titleMax),
      category: d.category || 'سلفة شخصية',
      totalAmount: total,
      paidAmount: paid,
      currency: normalizeCurrency(d.currency),
      givenDate,
      dueDate,
      installmentPlan: d.installmentPlan || 'دفعة واحدة',
      status: deriveDebtStatus(total, paid),
      notes: String(d.notes || '').slice(0, FIELD_LIMITS.notesMax),
      alertLevel: sanitizePersonAlertLevel(d.alertLevel),
      alertNote: String(d.alertNote || '').slice(0, FIELD_LIMITS.alertNoteMax),
    };
    nextDebts.push(record);
    if (paid > 0) {
      nextPaymentsByDebt[id] = [
        {
          id: generateLocalId('pay'),
          ownerId: current.profile.uid,
          debtId: id,
          amount: paid,
          paymentDate: givenDate,
          method: 'نقدي',
          note: 'استرجاع من نسخة احتياطية',
          createdAt: new Date().toISOString(),
        },
      ];
    }
    importedDebts += 1;
  }
  nextDebts.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const walletsByType = new Map<WalletType, WalletRecord>(
    current.wallets.map((w) => [w.walletType, { ...w }])
  );
  let importedWallets = 0;
  if (Array.isArray(parsed.wallets)) {
    for (const w of parsed.wallets) {
      if (!w || typeof w.walletType !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(w.walletType)) continue;
      walletsByType.set(w.walletType, {
        id: `wallet_${w.walletType}`,
        ownerId: current.profile.uid,
        walletType: w.walletType,
        label: String(w.label || w.walletType).slice(0, 60),
        ...(!isBuiltinWalletType(w.walletType) || w.iconId
          ? { iconId: sanitizeAnyWalletIconId(w.iconId) }
          : {}),
        balance: Math.max(0, roundMoney(Number(w.balance || 0))),
        currency: normalizeCurrency(w.currency),
        isHidden: Boolean(w.isHidden),
        recentNote: String(w.recentNote || '').slice(0, FIELD_LIMITS.walletNoteMax),
      });
      importedWallets += 1;
    }
  }

  return {
    nextState: {
      ...current,
      profile: nextProfile,
      debts: nextDebts,
      paymentsByDebt: nextPaymentsByDebt,
      wallets: ensureAllDefaultWallets(Array.from(walletsByType.values()), nextProfile.defaultCurrency),
    },
    importedDebts,
    importedWallets,
  };
}

// --- Direct Email / Phone Number Backup Vault (No Login, No Password, Backups Only) ---

const ARABIC_DIGITS_MAP: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
};

function convertArabicDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (ch) => ARABIC_DIGITS_MAP[ch] ?? ch);
}

export interface NormalizedBackupContact {
  display: string;
  canonical: string;
  kind: 'email' | 'phone';
}

/** Validates and normalizes an email address or phone number for backup-only vault keying. */
export function normalizeBackupContact(rawInput: string): NormalizedBackupContact {
  const cleaned = convertArabicDigits(rawInput || '').trim();
  if (!cleaned) {
    throw new Error('backup/empty-contact');
  }

  if (cleaned.includes('@')) {
    const email = cleaned.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) {
      throw new Error('backup/invalid-contact');
    }
    return {
      display: email,
      canonical: `email:${email}`,
      kind: 'email',
    };
  }

  // Phone number mode: keep digits only (strip spaces, hyphens, parentheses, leading +)
  const digits = cleaned.replace(/[\s\-().+]/g, '');
  if (!/^\d{7,16}$/.test(digits)) {
    throw new Error('backup/invalid-contact');
  }

  return {
    display: digits,
    canonical: `phone:${digits}`,
    kind: 'phone',
  };
}

/** Validates and normalizes the user's secret backup PIN/passcode (4–32 characters). */
export function normalizeBackupPin(rawPin: string): string {
  const cleaned = convertArabicDigits(rawPin || '').trim();
  if (cleaned.length < 4 || cleaned.length > 32) {
    throw new Error('backup/invalid-pin');
  }
  return cleaned;
}

/** Pure-JS SHA-256 fallback for environments where Web Crypto subtle API is unavailable. */
function sha256FallbackHex(message: string): string {
  const bytes = new TextEncoder().encode(message);
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const bitLen = bytes.length * 8;
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);

  const w = new Uint32Array(64);
  const rotr = (n: number, x: number) => (x >>> n) | (x << (32 - n));

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => v.toString(16).padStart(8, '0'))
    .join('');
}

/** Derives a legacy 64-char SHA-256 vault ID from contact only (used only for backward-compat devices without a PIN yet). */
export async function deriveBackupVaultId(rawContact: string): Promise<string> {
  const { canonical } = normalizeBackupContact(rawContact);
  const input = `moamen-backup-v1:${canonical}`;
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
      const data = new TextEncoder().encode(input);
      const buf = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fallback to pure JS SHA-256
  }
  return sha256FallbackHex(input);
}

/**
 * Derives a hardened 64-char lowercase hex vault ID using PBKDF2-SHA256 (100,000 iterations)
 * combining BOTH the normalized phone/email AND the user's secret backup PIN.
 * Anyone who knows only the phone number cannot derive this vault ID or access the backup.
 */
export async function derivePinProtectedVaultId(
  rawContact: string,
  rawPin: string
): Promise<string> {
  const { canonical } = normalizeBackupContact(rawContact);
  const pin = normalizeBackupPin(rawPin);
  const saltText = `moamen-backup-v2:${canonical}`;

  try {
    if (
      typeof crypto !== 'undefined' &&
      crypto.subtle &&
      typeof crypto.subtle.importKey === 'function' &&
      typeof crypto.subtle.deriveBits === 'function'
    ) {
      const enc = new TextEncoder();
      const baseKey = await crypto.subtle.importKey(
        'raw',
        enc.encode(pin),
        'PBKDF2',
        false,
        ['deriveBits']
      );
      const bits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: enc.encode(saltText),
          iterations: 100000,
          hash: 'SHA-256',
        },
        baseKey,
        256
      );
      return Array.from(new Uint8Array(bits))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fallback below if Web Crypto PBKDF2 is unavailable
  }

  let acc = sha256FallbackHex(`${saltText}:${pin}`);
  for (let i = 0; i < 4096; i++) {
    acc = sha256FallbackHex(`${acc}:${saltText}:${pin}`);
  }
  return acc;
}

function buildSanitizedVaultFields(state: LocalAppState) {
  const p = state.profile;
  const safeTheme = VALID_THEMES.includes(p.theme) ? p.theme : 'mint';
  const safeLang = VALID_LANGS.includes(p.language) ? p.language : 'ar';
  const safeCurrency = normalizeCurrency(p.defaultCurrency);

  const profile = {
    displayName: (p.displayName || 'حسابي').trim().slice(0, FIELD_LIMITS.displayNameMax) || 'حسابي',
    avatarUrl: (p.avatarUrl || 'boy').slice(0, FIELD_LIMITS.avatarMax),
    statusActive: Boolean(p.statusActive),
    statusLabel: (p.statusLabel || '').trim().slice(0, FIELD_LIMITS.statusLabelMax),
    statusColor: sanitizeStatusColor(p.statusColor),
    theme: safeTheme,
    followPhoneTheme: Boolean(p.followPhoneTheme),
    autoAppIconByTheme: Boolean(p.autoAppIconByTheme),
    language: safeLang,
    defaultCurrency: safeCurrency,
    iconSize: sanitizeIconSize(p.iconSize, 'sm'),
    navIconSize: sanitizeIconSize(p.navIconSize ?? p.iconSize, 'sm'),
    avatarSize: sanitizeIconSize(p.avatarSize, 'md'),
    profileAvatarSize: sanitizeIconSize(p.profileAvatarSize ?? p.avatarSize, 'md'),
    walletImageSize: sanitizeIconSize(p.walletImageSize ?? p.avatarSize, 'md'),
    iconStyle: sanitizeIconStyle(p.iconStyle),
    sectionIconStyles: sanitizeSectionIconStyles(p.sectionIconStyles),
    pageSettings: sanitizePageSettings(p.pageSettings),
    navSoundEnabled: p.navSoundEnabled !== false,
    appIconId: sanitizeAppIconId(p.appIconId),
    navIcons: sanitizeNavIcons(p.navIcons),
    refreshRateHz: sanitizeRefreshRateHz(p.refreshRateHz),
    notificationSettings: sanitizeNotificationSettings(p.notificationSettings),
    hideAmounts: Boolean(p.hideAmounts),
    showPrivacyToggle: p.showPrivacyToggle !== false,
    hideWalletAmounts: Boolean(p.hideWalletAmounts),
    showWalletPrivacyToggle: p.showWalletPrivacyToggle !== false,
    wallpaperId: sanitizeWallpaperId(p.wallpaperId),
    walletIcons: sanitizeWalletIcons(p.walletIcons),
  };

  const debts = state.debts.slice(0, 500).map((d) => ({
    id: String(d.id || generateLocalId('debt')).slice(0, 128),
    direction: d.direction === 'payable' ? 'payable' : 'receivable',
    debtorName: String(d.debtorName || '').slice(0, FIELD_LIMITS.debtorNameMax),
    debtorPhone: String(d.debtorPhone || '').slice(0, FIELD_LIMITS.debtorPhoneMax),
    avatarId: String(d.avatarId || 'boy').slice(0, FIELD_LIMITS.avatarMax),
    title: String(d.title || 'مستحق مالي').slice(0, FIELD_LIMITS.titleMax),
    category: d.category || 'سلفة شخصية',
    totalAmount: Math.min(FIELD_LIMITS.maxAmount, Math.max(0.01, roundMoney(Number(d.totalAmount) || 0.01))),
    paidAmount: Math.max(0, roundMoney(Number(d.paidAmount) || 0)),
    currency: normalizeCurrency(d.currency),
    givenDate: /^\d{4}-\d{2}-\d{2}$/.test(String(d.givenDate)) ? String(d.givenDate) : new Date().toISOString().slice(0, 10),
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(String(d.dueDate)) ? String(d.dueDate) : new Date().toISOString().slice(0, 10),
    installmentPlan: d.installmentPlan || 'دفعة واحدة',
    status: deriveDebtStatus(
      Math.max(0.01, roundMoney(Number(d.totalAmount) || 0.01)),
      Math.max(0, roundMoney(Number(d.paidAmount) || 0))
    ),
    notes: String(d.notes || '').slice(0, FIELD_LIMITS.notesMax),
    alertLevel: sanitizePersonAlertLevel(d.alertLevel),
    alertNote: String(d.alertNote || '').slice(0, FIELD_LIMITS.alertNoteMax),
  }));

  const allowedDebtIds = new Set(debts.map((d) => d.id));

  const paymentsByDebt: Record<string, PaymentRecord[]> = {};
  for (const [debtId, list] of Object.entries(state.paymentsByDebt || {})) {
    if (!allowedDebtIds.has(debtId) || !Array.isArray(list)) continue;
    paymentsByDebt[debtId] = list.slice(0, 100).map((pay) => ({
      id: String(pay.id || generateLocalId('pay')).slice(0, 128),
      ownerId: 'local',
      debtId,
      amount: Math.max(0.01, roundMoney(Number(pay.amount) || 0.01)),
      paymentDate: /^\d{4}-\d{2}-\d{2}$/.test(String(pay.paymentDate))
        ? String(pay.paymentDate)
        : new Date().toISOString().slice(0, 10),
      method: pay.method || 'نقدي',
      note: String(pay.note || '').slice(0, FIELD_LIMITS.paymentNoteMax),
      createdAt: serializeTimestamp(pay.createdAt),
    }));
  }

  const chargesByDebt: Record<string, ChargeRecord[]> = {};
  for (const [debtId, list] of Object.entries(state.chargesByDebt || {})) {
    if (!allowedDebtIds.has(debtId) || !Array.isArray(list)) continue;
    chargesByDebt[debtId] = list.slice(0, 100).map((ch) => ({
      id: String(ch.id || generateLocalId('chg')).slice(0, 128),
      ownerId: 'local',
      debtId,
      amount: Math.max(0.01, roundMoney(Number(ch.amount) || 0.01)),
      chargeDate: /^\d{4}-\d{2}-\d{2}$/.test(String(ch.chargeDate))
        ? String(ch.chargeDate)
        : new Date().toISOString().slice(0, 10),
      note: String(ch.note || '').slice(0, FIELD_LIMITS.paymentNoteMax),
      createdAt: serializeTimestamp(ch.createdAt),
    }));
  }

  const wallets = ensureAllDefaultWallets(state.wallets || [], safeCurrency)
    .slice(0, 20)
    .map((w) => ({
      id: `wallet_${w.walletType}`,
      walletType: w.walletType,
      label: String(w.label || w.walletType).slice(0, 60),
      ...(!isBuiltinWalletType(w.walletType) || w.iconId
        ? { iconId: sanitizeAnyWalletIconId(w.iconId, 'app_bank_card') }
        : {}),
      balance: Math.max(0, roundMoney(Number(w.balance) || 0)),
      currency: normalizeCurrency(w.currency),
      isHidden: Boolean(w.isHidden),
      recentNote: String(w.recentNote || '').slice(0, FIELD_LIMITS.walletNoteMax),
    }));

  const walletTxs = (state.walletTxs || []).slice(0, 500).map((tx) => ({
    id: String(tx.id || generateLocalId('wtx')).slice(0, 128),
    walletId: `wallet_${tx.walletType}`,
    walletType: tx.walletType,
    ...(tx.walletLabel ? { walletLabel: String(tx.walletLabel).slice(0, 60) } : {}),
    type: tx.type === 'withdraw' ? 'withdraw' : 'add',
    amount: Math.max(0.01, roundMoney(Number(tx.amount) || 0.01)),
    note: String(tx.note || '').slice(0, FIELD_LIMITS.walletNoteMax),
    createdAt: serializeTimestamp(tx.createdAt),
  }));

  return {
    profile,
    debts,
    paymentsByDebt,
    chargesByDebt,
    wallets,
    walletTxs,
  };
}

/** Saves the current local app state into Firestore /backupVaults/{vaultId} (zero raw PII or PIN stored). */
export async function pushBackupVaultToCloud(
  vaultKeyOrContact: string,
  state: LocalAppState,
  isPreDerivedKey = false
): Promise<void> {
  const vaultId =
    isPreDerivedKey && /^[a-f0-9]{64}$/.test(vaultKeyOrContact)
      ? vaultKeyOrContact
      : await deriveBackupVaultId(vaultKeyOrContact);
  const path = `backupVaults/${vaultId}`;
  const ref = doc(db, 'backupVaults', vaultId);
  const fields = buildSanitizedVaultFields(state);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        ...fields,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        vaultId,
        version: 2,
        ...fields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/** Pulls an existing cloud backup snapshot from Firestore /backupVaults/{vaultId}. */
export async function pullBackupVaultFromCloud(
  vaultKeyOrContact: string,
  isPreDerivedKey = false
): Promise<{
  hasCloudData: boolean;
  profile?: UserProfile;
  debts: DebtRecord[];
  paymentsByDebt: Record<string, PaymentRecord[]>;
  chargesByDebt: Record<string, ChargeRecord[]>;
  wallets: WalletRecord[];
  walletTxs: WalletTransaction[];
}> {
  const vaultId =
    isPreDerivedKey && /^[a-f0-9]{64}$/.test(vaultKeyOrContact)
      ? vaultKeyOrContact
      : await deriveBackupVaultId(vaultKeyOrContact);
  const path = `backupVaults/${vaultId}`;
  const ref = doc(db, 'backupVaults', vaultId);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return {
        hasCloudData: false,
        debts: [],
        paymentsByDebt: {},
        chargesByDebt: {},
        wallets: ensureAllDefaultWallets([], 'EGP'),
        walletTxs: [],
      };
    }

    const data = snap.data() as Record<string, unknown>;
    const rawProfile = (data.profile && typeof data.profile === 'object'
      ? data.profile
      : {}) as Partial<UserProfile>;

    const profile: UserProfile = {
      uid: 'local',
      displayName: (rawProfile.displayName || 'حسابي').slice(0, FIELD_LIMITS.displayNameMax),
      avatarUrl: rawProfile.avatarUrl || 'boy',
      statusActive: typeof rawProfile.statusActive === 'boolean' ? rawProfile.statusActive : true,
      statusLabel: typeof rawProfile.statusLabel === 'string' ? rawProfile.statusLabel : 'نشط الآن',
      statusColor: sanitizeStatusColor(rawProfile.statusColor),
      avatarRingColor: 'none',
      avatarRingStyle: 'solid',
      theme: rawProfile.theme && VALID_THEMES.includes(rawProfile.theme) ? rawProfile.theme : 'mint',
      followPhoneTheme: Boolean(rawProfile.followPhoneTheme),
      autoAppIconByTheme: Boolean(rawProfile.autoAppIconByTheme),
      language: rawProfile.language && VALID_LANGS.includes(rawProfile.language) ? rawProfile.language : 'ar',
      defaultCurrency: normalizeCurrency(rawProfile.defaultCurrency),
      iconSize: sanitizeIconSize(rawProfile.iconSize, 'sm'),
      navIconSize: sanitizeIconSize(rawProfile.navIconSize ?? rawProfile.iconSize, 'sm'),
      avatarSize: sanitizeIconSize(rawProfile.avatarSize, 'md'),
      profileAvatarSize: sanitizeIconSize(rawProfile.profileAvatarSize ?? rawProfile.avatarSize, 'md'),
      walletImageSize: sanitizeIconSize(rawProfile.walletImageSize ?? rawProfile.avatarSize, 'md'),
      iconStyle: sanitizeIconStyle(rawProfile.iconStyle),
      sectionIconStyles: sanitizeSectionIconStyles(rawProfile.sectionIconStyles),
      pageSettings: sanitizePageSettings(rawProfile.pageSettings),
      navSoundEnabled: typeof rawProfile.navSoundEnabled === 'boolean' ? rawProfile.navSoundEnabled : true,
      appIconId: sanitizeAppIconId(rawProfile.appIconId),
      navIcons: sanitizeNavIcons(rawProfile.navIcons),
      refreshRateHz: sanitizeRefreshRateHz(rawProfile.refreshRateHz),
      notificationSettings: sanitizeNotificationSettings(rawProfile.notificationSettings),
      hideAmounts: Boolean(rawProfile.hideAmounts),
      showPrivacyToggle:
        typeof rawProfile.showPrivacyToggle === 'boolean' ? rawProfile.showPrivacyToggle : true,
      hideWalletAmounts: Boolean(rawProfile.hideWalletAmounts),
      showWalletPrivacyToggle:
        typeof rawProfile.showWalletPrivacyToggle === 'boolean'
          ? rawProfile.showWalletPrivacyToggle
          : true,
      wallpaperId: sanitizeWallpaperId(rawProfile.wallpaperId),
      walletIcons: sanitizeWalletIcons(rawProfile.walletIcons),
    };

    const rawDebts = Array.isArray(data.debts) ? (data.debts as Partial<DebtRecord>[]) : [];
    const debts: DebtRecord[] = rawDebts
      .filter((d) => d && typeof d.debtorName === 'string' && d.debtorName.trim())
      .map((d) => {
        const total = Math.max(0.01, roundMoney(Number(d.totalAmount) || 0.01));
        const paid = Math.min(total, Math.max(0, roundMoney(Number(d.paidAmount) || 0)));
        return {
          id: String(d.id || generateLocalId('debt')),
          ownerId: 'local',
          direction: (d.direction === 'payable' ? 'payable' : 'receivable') as DebtRecord['direction'],
          debtorName: String(d.debtorName || '').slice(0, FIELD_LIMITS.debtorNameMax),
          debtorPhone: String(d.debtorPhone || '').slice(0, FIELD_LIMITS.debtorPhoneMax),
          avatarId: String(d.avatarId || 'boy').slice(0, FIELD_LIMITS.avatarMax),
          title: String(d.title || 'مستحق مالي').slice(0, FIELD_LIMITS.titleMax),
          category: d.category || 'سلفة شخصية',
          totalAmount: total,
          paidAmount: paid,
          currency: normalizeCurrency(d.currency),
          givenDate: String(d.givenDate || new Date().toISOString().slice(0, 10)),
          dueDate: String(d.dueDate || new Date().toISOString().slice(0, 10)),
          installmentPlan: d.installmentPlan || 'دفعة واحدة',
          status: deriveDebtStatus(total, paid),
          notes: String(d.notes || '').slice(0, FIELD_LIMITS.notesMax),
          alertLevel: sanitizePersonAlertLevel(d.alertLevel),
          alertNote: String(d.alertNote || '').slice(0, FIELD_LIMITS.alertNoteMax),
        };
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const paymentsByDebt: Record<string, PaymentRecord[]> = {};
    if (data.paymentsByDebt && typeof data.paymentsByDebt === 'object') {
      for (const [debtId, list] of Object.entries(data.paymentsByDebt as Record<string, unknown>)) {
        if (!Array.isArray(list)) continue;
        paymentsByDebt[debtId] = (list as Partial<PaymentRecord>[])
          .map((p) => ({
            id: String(p.id || generateLocalId('pay')),
            ownerId: 'local',
            debtId,
            amount: Math.max(0.01, roundMoney(Number(p.amount) || 0.01)),
            paymentDate: String(p.paymentDate || new Date().toISOString().slice(0, 10)),
            method: p.method || 'نقدي',
            note: String(p.note || ''),
            createdAt: serializeTimestamp(p.createdAt),
          }))
          .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
      }
    }

    const chargesByDebt: Record<string, ChargeRecord[]> = {};
    if (data.chargesByDebt && typeof data.chargesByDebt === 'object') {
      for (const [debtId, list] of Object.entries(data.chargesByDebt as Record<string, unknown>)) {
        if (!Array.isArray(list)) continue;
        chargesByDebt[debtId] = (list as Partial<ChargeRecord>[])
          .map((c) => ({
            id: String(c.id || generateLocalId('chg')),
            ownerId: 'local',
            debtId,
            amount: Math.max(0.01, roundMoney(Number(c.amount) || 0.01)),
            chargeDate: String(c.chargeDate || new Date().toISOString().slice(0, 10)),
            note: String(c.note || ''),
            createdAt: serializeTimestamp(c.createdAt),
          }))
          .sort((a, b) => b.chargeDate.localeCompare(a.chargeDate));
      }
    }

    const rawWallets = Array.isArray(data.wallets) ? (data.wallets as Partial<WalletRecord>[]) : [];
    const parsedWallets: WalletRecord[] = rawWallets
      .filter((w) => w && typeof w.walletType === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(w.walletType))
      .map((w) => ({
        id: `wallet_${w.walletType}`,
        ownerId: 'local',
        walletType: w.walletType as WalletType,
        label: String(w.label || w.walletType).slice(0, 60),
        ...(!isBuiltinWalletType(String(w.walletType)) || w.iconId
          ? { iconId: sanitizeAnyWalletIconId(w.iconId, 'app_bank_card') }
          : {}),
        balance: Math.max(0, roundMoney(Number(w.balance) || 0)),
        currency: normalizeCurrency(w.currency),
        isHidden: Boolean(w.isHidden),
        recentNote: String(w.recentNote || '').slice(0, FIELD_LIMITS.walletNoteMax),
      }));
    const wallets = ensureAllDefaultWallets(parsedWallets, profile.defaultCurrency);

    const rawTxs = Array.isArray(data.walletTxs) ? (data.walletTxs as Partial<WalletTransaction>[]) : [];
    const walletTxs: WalletTransaction[] = rawTxs
      .filter((t) => t && typeof t.walletType === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(t.walletType))
      .map((t) => ({
        id: String(t.id || generateLocalId('wtx')),
        ownerId: 'local',
        walletId: `wallet_${t.walletType}`,
        walletType: t.walletType as WalletType,
        ...(typeof t.walletLabel === 'string' && t.walletLabel.trim()
          ? { walletLabel: t.walletLabel.trim().slice(0, 60) }
          : {}),
        type: (t.type === 'withdraw' ? 'withdraw' : 'add') as WalletTxType,
        amount: Math.max(0.01, roundMoney(Number(t.amount) || 0.01)),
        note: String(t.note || '').slice(0, FIELD_LIMITS.walletNoteMax),
        createdAt: serializeTimestamp(t.createdAt),
      }))
      .sort((a, b) => txMillis(b.createdAt) - txMillis(a.createdAt));

    return {
      hasCloudData: true,
      profile,
      debts,
      paymentsByDebt,
      chargesByDebt,
      wallets,
      walletTxs,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export type { ChargeInput, PaymentInput, WalletTxType };
