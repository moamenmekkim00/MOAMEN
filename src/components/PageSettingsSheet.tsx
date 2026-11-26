import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Image, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import {
  APP_PAGE_META,
  AppPageKey,
  AVATAR_SIZE_OPTIONS,
  ICON_SIZE_OPTIONS,
  ICON_STYLE_OPTIONS,
  IconSize,
  IconStyleId,
  PAGE_SCALE_OPTIONS,
  PageCustomSettings,
  PageScaleChoice,
  PageSizeChoice,
  playNavigationSound,
  SectionIconStyleChoice,
} from '../data/customization';
import {
  getWallpaperBaseStyle,
  getWallpaperById,
  getWallpaperPatternStyle,
  PageWallpaperChoice,
  WALLPAPER_CATEGORIES,
  WALLPAPER_OPTIONS,
  WallpaperCategory,
  WallpaperId,
} from '../data/wallpapers';
import { AppLanguage, ThemeConfig } from '../data/themes';
import { AppIcon } from './AppIcon';
import { useSwipeBack } from '../hooks/useSwipeBack';

interface PageSettingsSheetProps {
  page: AppPageKey | null;
  current: PageCustomSettings;
  globalIconSize: IconSize;
  globalAvatarSize: IconSize;
  fallbackIconStyle: IconStyleId;
  globalWallpaperId?: WallpaperId;
  navSoundEnabled: boolean;
  theme: ThemeConfig;
  lang: AppLanguage;
  onClose: () => void;
  onChange: (page: AppPageKey, next: PageCustomSettings) => void;
}

export function PageSettingsSheet({
  page,
  current,
  globalIconSize,
  globalAvatarSize,
  fallbackIconStyle,
  globalWallpaperId = 'none',
  navSoundEnabled,
  theme,
  lang,
  onClose,
  onChange,
}: PageSettingsSheetProps) {
  const [wallpaperCat, setWallpaperCat] = useState<WallpaperCategory>('all');
  const { swipeHandlers, cardStyle } = useSwipeBack(Boolean(page), onClose);
  if (!page) return null;
  const isAr = lang === 'ar';
  const meta = APP_PAGE_META.find((m) => m.key === page) || APP_PAGE_META[0];

  const pageScale: PageScaleChoice = current.pageScale || 'inherit';
  const iconSize: PageSizeChoice = current.iconSize || 'inherit';
  const avatarSize: PageSizeChoice = current.avatarSize || 'inherit';
  const iconStyle: SectionIconStyleChoice = current.iconStyle || 'inherit';
  const wallpaperChoice: PageWallpaperChoice = current.wallpaperId || 'inherit';
  const globalWpMeta = getWallpaperById(globalWallpaperId);

  const effectiveIconSize: IconSize = iconSize === 'inherit' ? globalIconSize : iconSize;
  const effectiveAvatarSize: IconSize = avatarSize === 'inherit' ? globalAvatarSize : avatarSize;
  const effectiveIconStyle: IconStyleId = iconStyle === 'inherit' ? fallbackIconStyle : iconStyle;
  const filteredWallpapers = WALLPAPER_OPTIONS.filter(
    (wp) => wp.id !== 'none' && (wallpaperCat === 'all' || wp.category === wallpaperCat)
  );

  function update(patch: Partial<PageCustomSettings>) {
    onChange(page!, { ...current, ...patch });
    if (navSoundEnabled) playNavigationSound('tap');
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="page-settings-title"
      onClick={onClose}
    >
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        {...swipeHandlers}
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md max-h-[86vh] flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-9 h-9 rounded-2xl ${theme.accentSoftBg} dark:bg-slate-800 ${theme.accentText} flex items-center justify-center shrink-0`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h2
                id="page-settings-title"
                className="text-sm font-bold text-slate-900 dark:text-white truncate"
              >
                {isAr ? `إعدادات صفحة: ${meta.labelAr}` : `${meta.labelEn} Settings`}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {isAr ? meta.descAr : meta.descEn}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* 1. Overall Page Layout & Card Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'حجم الصفحة والبطاقات' : 'Page & Card Size'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {pageScale === 'inherit' ? (isAr ? 'افتراضي' : 'Default') : pageScale}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => update({ pageScale: 'inherit' })}
                className={`h-9 rounded-xl text-[11px] font-semibold cursor-pointer transition-all ${
                  pageScale === 'inherit'
                    ? `${theme.accentBg} text-white shadow-xs`
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {isAr ? 'افتراضي' : 'Auto'}
              </button>
              {PAGE_SCALE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => update({ pageScale: opt.id })}
                  className={`h-9 rounded-xl text-[11px] font-semibold cursor-pointer transition-all ${
                    pageScale === opt.id
                      ? `${theme.accentBg} text-white shadow-xs`
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isAr ? opt.labelAr : opt.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Page Icon Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'حجم الأيقونات في هذه الصفحة' : 'Icon Size on This Page'}
              </span>
              <button
                type="button"
                onClick={() => update({ iconSize: 'inherit' })}
                className={`text-[11px] font-semibold cursor-pointer ${
                  iconSize === 'inherit' ? theme.accentText : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {iconSize === 'inherit'
                  ? isAr
                    ? 'نفس الإعداد العام ✓'
                    : 'Using General ✓'
                  : isAr
                  ? 'استخدام العام'
                  : 'Use General'}
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {ICON_SIZE_OPTIONS.map((opt) => {
                const active = iconSize !== 'inherit' && effectiveIconSize === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => update({ iconSize: opt.id })}
                    className={`h-8 rounded-lg text-[10px] font-semibold cursor-pointer transition-all ${
                      active
                        ? `${theme.accentBg} text-white shadow-xs`
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isAr ? opt.labelAr : opt.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Page Images / Avatars Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isAr
                  ? page === 'wallets'
                    ? 'حجم شعارات المحافظ في هذه الصفحة'
                    : 'حجم الصور والشخصيات في هذه الصفحة'
                  : page === 'wallets'
                  ? 'Wallet Logos Size on This Page'
                  : 'Avatars Size on This Page'}
              </span>
              <button
                type="button"
                onClick={() => update({ avatarSize: 'inherit' })}
                className={`text-[11px] font-semibold cursor-pointer ${
                  avatarSize === 'inherit' ? theme.accentText : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {avatarSize === 'inherit'
                  ? isAr
                    ? 'نفس الإعداد العام ✓'
                    : 'Using General ✓'
                  : isAr
                  ? 'استخدام العام'
                  : 'Use General'}
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {AVATAR_SIZE_OPTIONS.map((opt) => {
                const active = avatarSize !== 'inherit' && effectiveAvatarSize === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => update({ avatarSize: opt.id })}
                    className={`h-8 rounded-lg text-[10px] font-semibold cursor-pointer transition-all ${
                      active
                        ? `${theme.accentBg} text-white shadow-xs`
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isAr ? opt.labelAr : opt.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Page Icon Style */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'مظهر الأيقونات في هذه الصفحة' : 'Icon Style on This Page'}
              </span>
              <button
                type="button"
                onClick={() => update({ iconStyle: 'inherit' })}
                className={`text-[11px] font-semibold cursor-pointer ${
                  iconStyle === 'inherit' ? theme.accentText : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {iconStyle === 'inherit'
                  ? isAr
                    ? 'نفس العام ✓'
                    : 'General ✓'
                  : isAr
                  ? 'استخدام العام'
                  : 'Use General'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ICON_STYLE_OPTIONS.map((st) => {
                const active = iconStyle !== 'inherit' && effectiveIconStyle === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => update({ iconStyle: st.id })}
                    className={`p-2 rounded-2xl border-2 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      active
                        ? `${theme.accentBorder} bg-slate-50 dark:bg-slate-800 shadow-xs`
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 h-7">
                      <AppIcon
                        kind="ui"
                        name={page === 'wallets' ? 'trash' : 'plus'}
                        styleId={st.id}
                        sizePx={18}
                        theme={theme}
                        active
                      />
                      <AppIcon
                        kind="ui"
                        name="search"
                        styleId={st.id}
                        sizePx={16}
                        theme={theme}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100 leading-tight text-center">
                      {isAr ? st.labelAr : st.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Page Wallpaper (WhatsApp & Telegram style) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5">
                <Image className={`w-3.5 h-3.5 ${theme.accentText}`} />
                <span>{isAr ? 'خلفية هذه الصفحة (واتساب وتليجرام)' : 'Page Wallpaper'}</span>
              </span>
              <button
                type="button"
                onClick={() => update({ wallpaperId: 'inherit' })}
                className={`text-[11px] font-semibold cursor-pointer ${
                  wallpaperChoice === 'inherit' ? theme.accentText : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {wallpaperChoice === 'inherit'
                  ? isAr
                    ? `نفس العام (${globalWpMeta.labelAr}) ✓`
                    : `Global (${globalWpMeta.labelEn}) ✓`
                  : isAr
                  ? 'استخدام العام'
                  : 'Use Global'}
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {WALLPAPER_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setWallpaperCat(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    wallpaperCat === cat.id
                      ? `${theme.accentBg} text-white`
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isAr ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto p-0.5">
              {/* None option (explicitly plain theme on this page even if global wallpaper is set) */}
              <button
                type="button"
                onClick={() => update({ wallpaperId: 'none' })}
                className={`relative h-16 rounded-2xl border-2 overflow-hidden flex items-end justify-center p-1.5 cursor-pointer transition-all bg-slate-100 dark:bg-slate-800 ${
                  wallpaperChoice === 'none'
                    ? `${theme.accentBorder} ring-2 ring-emerald-400/30`
                    : 'border-slate-200/80 dark:border-slate-700'
                }`}
              >
                {wallpaperChoice === 'none' && (
                  <span className={`absolute top-1 end-1 w-4 h-4 rounded-full ${theme.accentBg} text-white flex items-center justify-center`}>
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">
                  {isAr ? 'بدون خلفية' : 'No Wallpaper'}
                </span>
              </button>

              {filteredWallpapers.map((wp) => {
                const selected = wallpaperChoice === wp.id;
                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => update({ wallpaperId: wp.id })}
                    style={getWallpaperBaseStyle(wp)}
                    className={`relative h-16 rounded-2xl border-2 overflow-hidden flex items-end justify-center p-1.5 cursor-pointer transition-all ${
                      selected
                        ? `${theme.accentBorder} ring-2 ring-emerald-400/35 scale-[1.02]`
                        : 'border-black/10 dark:border-white/10'
                    }`}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        ...getWallpaperPatternStyle(wp),
                        backgroundSize: `${Math.round(wp.patternSize * 0.55)}px ${Math.round(wp.patternSize * 0.55)}px`,
                        opacity: Math.min(0.45, wp.patternOpacity * 2.1),
                      }}
                    />
                    {selected && (
                      <span className={`absolute top-1 end-1 z-10 w-4 h-4 rounded-full ${theme.accentBg} text-white flex items-center justify-center shadow-xs`}>
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <span
                      className={`relative z-10 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold leading-tight truncate max-w-full ${
                        wp.isDark
                          ? 'bg-black/55 text-white'
                          : 'bg-white/80 text-slate-900'
                      }`}
                    >
                      {isAr ? wp.labelAr : wp.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset Page */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() =>
                onChange(page, {
                  pageScale: 'inherit',
                  iconSize: 'inherit',
                  avatarSize: 'inherit',
                  iconStyle: 'inherit',
                  wallpaperId: 'inherit',
                })
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة هذه الصفحة للافتراضي' : 'Reset Page to Default'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`h-9 px-4 rounded-xl text-xs font-semibold text-white ${theme.accentBg} ${theme.accentBgHover} cursor-pointer`}
            >
              {isAr ? 'تم' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
