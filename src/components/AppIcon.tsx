import type { ComponentType } from 'react';
import {
  ArrowDownCircle,
  ArrowDownLeft,
  ArrowUpCircle,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Bell,
  Bookmark,
  Briefcase,
  Calculator,
  Calendar,
  CalendarCheck,
  Clock,
  CloudDownload,
  CloudUpload,
  Coins,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  Gem,
  HandCoins,
  Heart,
  Home,
  Inbox,
  Landmark,
  Layers,
  Palette,
  Pencil,
  Phone,
  PieChart,
  PiggyBank,
  Plus,
  Receipt,
  Repeat,
  Scaling,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Vault,
  Volume2,
  VolumeX,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  getNavIconMeta,
  IconStyleId,
  NavIconKey,
  normalizeIconStyle,
  UiIconKey,
} from '../data/customization';
import { ThemeConfig } from '../data/themes';

type LucideComp = ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;

const NAV_LUCIDE_MAP: Record<NavIconKey, LucideComp> = {
  arrow_down_left: ArrowDownLeft,
  arrow_up_right: ArrowUpRight,
  arrow_down_line: Inbox,
  arrow_up_line: Send,
  inbox: Inbox,
  send: Send,
  wallet: Wallet,
  credit_card: CreditCard,
  banknote: Banknote,
  coins: Coins,
  hand_coins: HandCoins,
  piggy_bank: PiggyBank,
  landmark: Landmark,
  receipt: Receipt,
  dollar: DollarSign,
  briefcase: Briefcase,
  trending_up: TrendingUp,
  trending_down: TrendingDown,
  arrow_down_circle: ArrowDownCircle,
  arrow_up_circle: ArrowUpCircle,
  repeat: Repeat,
  users: Users,
  user_check: UserCheck,
  user_plus: UserPlus,
  user_minus: UserMinus,
  home: Home,
  shopping_bag: ShoppingBag,
  shopping_cart: ShoppingCart,
  gem: Gem,
  vault: Vault,
  shield_check: ShieldCheck,
  pie_chart: PieChart,
  bar_chart: BarChart3,
  calculator: Calculator,
  calendar_check: CalendarCheck,
  clock: Clock,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  bell: Bell,
  layers: Layers,
  sparkles: Sparkles,
};

const UI_LUCIDE_META: Record<
  UiIconKey,
  {
    Icon: LucideComp;
    colorClass: string;
    tintClass: string;
    gradientFrom: string;
    gradientTo: string;
  }
> = {
  settings: { Icon: Settings, colorClass: 'text-slate-600 dark:text-slate-300', tintClass: 'bg-slate-100 dark:bg-slate-800', gradientFrom: '#64748B', gradientTo: '#334155' },
  plus: { Icon: Plus, colorClass: 'text-emerald-600 dark:text-emerald-400', tintClass: 'bg-emerald-50 dark:bg-emerald-950/50', gradientFrom: '#34D399', gradientTo: '#059669' },
  search: { Icon: Search, colorClass: 'text-sky-600 dark:text-sky-400', tintClass: 'bg-sky-50 dark:bg-sky-950/50', gradientFrom: '#38BDF8', gradientTo: '#0284C7' },
  sound_on: { Icon: Volume2, colorClass: 'text-teal-600 dark:text-teal-400', tintClass: 'bg-teal-50 dark:bg-teal-950/50', gradientFrom: '#2DD4BF', gradientTo: '#0D9488' },
  sound_off: { Icon: VolumeX, colorClass: 'text-slate-500 dark:text-slate-400', tintClass: 'bg-slate-100 dark:bg-slate-800', gradientFrom: '#94A3B8', gradientTo: '#475569' },
  cloud_backup: { Icon: CloudUpload, colorClass: 'text-blue-600 dark:text-blue-400', tintClass: 'bg-blue-50 dark:bg-blue-950/50', gradientFrom: '#60A5FA', gradientTo: '#2563EB' },
  cloud_restore: { Icon: CloudDownload, colorClass: 'text-indigo-600 dark:text-indigo-400', tintClass: 'bg-indigo-50 dark:bg-indigo-950/50', gradientFrom: '#818CF8', gradientTo: '#4F46E5' },
  export_json: { Icon: Download, colorClass: 'text-amber-600 dark:text-amber-400', tintClass: 'bg-amber-50 dark:bg-amber-950/50', gradientFrom: '#FBBF24', gradientTo: '#D97706' },
  import_json: { Icon: Upload, colorClass: 'text-violet-600 dark:text-violet-400', tintClass: 'bg-violet-50 dark:bg-violet-950/50', gradientFrom: '#A78BFA', gradientTo: '#7C3AED' },
  excel: { Icon: FileSpreadsheet, colorClass: 'text-green-600 dark:text-green-400', tintClass: 'bg-green-50 dark:bg-green-950/50', gradientFrom: '#4ADE80', gradientTo: '#16A34A' },
  palette: { Icon: Palette, colorClass: 'text-pink-600 dark:text-pink-400', tintClass: 'bg-pink-50 dark:bg-pink-950/50', gradientFrom: '#F472B6', gradientTo: '#DB2777' },
  trash: { Icon: Trash2, colorClass: 'text-red-600 dark:text-red-400', tintClass: 'bg-red-50 dark:bg-red-950/50', gradientFrom: '#F87171', gradientTo: '#DC2626' },
  edit: { Icon: Pencil, colorClass: 'text-amber-600 dark:text-amber-400', tintClass: 'bg-amber-50 dark:bg-amber-950/50', gradientFrom: '#FBBF24', gradientTo: '#D97706' },
  calendar: { Icon: Calendar, colorClass: 'text-cyan-600 dark:text-cyan-400', tintClass: 'bg-cyan-50 dark:bg-cyan-950/50', gradientFrom: '#22D3EE', gradientTo: '#0891B2' },
  phone: { Icon: Phone, colorClass: 'text-emerald-600 dark:text-emerald-400', tintClass: 'bg-emerald-50 dark:bg-emerald-950/50', gradientFrom: '#34D399', gradientTo: '#059669' },
  size: { Icon: Scaling, colorClass: 'text-violet-600 dark:text-violet-400', tintClass: 'bg-violet-50 dark:bg-violet-950/50', gradientFrom: '#A78BFA', gradientTo: '#7C3AED' },
  bell: { Icon: Bell, colorClass: 'text-amber-600 dark:text-amber-400', tintClass: 'bg-amber-50 dark:bg-amber-950/50', gradientFrom: '#FBBF24', gradientTo: '#D97706' },
  zap: { Icon: Zap, colorClass: 'text-emerald-600 dark:text-emerald-400', tintClass: 'bg-emerald-50 dark:bg-emerald-950/50', gradientFrom: '#34D399', gradientTo: '#059669' },
};

interface NavIconProps {
  kind: 'nav';
  name: NavIconKey;
  styleId: IconStyleId;
  sizePx: number;
  theme: ThemeConfig;
  active?: boolean;
  className?: string;
}

interface UiIconProps {
  kind: 'ui';
  name: UiIconKey;
  styleId: IconStyleId;
  sizePx: number;
  theme: ThemeConfig;
  active?: boolean;
  className?: string;
}

export type AppIconProps = NavIconProps | UiIconProps;

/**
 * Unified adaptive icon renderer supporting Samsung One UI squircle icons,
 * soft colorful badges, colorful line icons, uncolored outline/solid icons,
 * and phone-theme adaptive icons (zero Pixar icons).
 */
export function AppIcon(props: AppIconProps) {
  const { sizePx, theme, active = false, className = '' } = props;
  const styleId = normalizeIconStyle(props.styleId);

  const isNav = props.kind === 'nav';
  const navMeta = isNav ? getNavIconMeta(props.name) : null;
  const uiMeta = !isNav ? UI_LUCIDE_META[props.name] : null;
  const IconComp = isNav ? NAV_LUCIDE_MAP[props.name] || Wallet : uiMeta!.Icon;

  const colorClass = isNav ? navMeta!.colorClass : uiMeta!.colorClass;
  const tintClass = isNav ? navMeta!.tintClass : uiMeta!.tintClass;
  const gradientFrom = isNav ? navMeta!.gradientFrom : uiMeta!.gradientFrom;
  const gradientTo = isNav ? navMeta!.gradientTo : uiMeta!.gradientTo;

  // 1. Samsung One UI Squircle Style (clean vibrant gradient squircle + crisp white glyph)
  if (styleId === 'samsung') {
    const boxPx = Math.round(sizePx * 1.18);
    const innerPx = Math.max(10, Math.round(sizePx * 0.66));
    return (
      <span
        aria-hidden="true"
        style={{
          width: boxPx,
          height: boxPx,
          borderRadius: '30%',
          backgroundImage: `linear-gradient(155deg, ${gradientFrom}, ${gradientTo})`,
          boxShadow: '0 2px 6px rgba(15,23,42,0.14), inset 0 1px 0.5px rgba(255,255,255,0.35)',
        }}
        className={`inline-flex items-center justify-center text-white shrink-0 transition-all ${className}`}
      >
        <IconComp size={innerPx} strokeWidth={2.25} />
      </span>
    );
  }

  // 2. Soft Colored Badge
  if (styleId === 'colored_badge') {
    const badgePx = Math.round(sizePx * 1.15);
    const innerPx = Math.max(10, Math.round(sizePx * 0.66));
    return (
      <span
        aria-hidden="true"
        style={{ width: badgePx, height: badgePx }}
        className={`inline-flex items-center justify-center rounded-xl shrink-0 transition-all ${tintClass} ${colorClass} ${className}`}
      >
        <IconComp size={innerPx} strokeWidth={2.2} />
      </span>
    );
  }

  // 3. Colored Line (sleek colorful strokes, no background box)
  if (styleId === 'colored_line') {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex items-center justify-center shrink-0 transition-all ${colorClass} ${className}`}
      >
        <IconComp size={sizePx} strokeWidth={2.1} />
      </span>
    );
  }

  // 4. Uncolored Outline (monochrome minimalist adapting to dark/light mode & active theme)
  if (styleId === 'mono_outline') {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex items-center justify-center shrink-0 transition-all ${
          active ? theme.accentText : 'text-slate-700 dark:text-slate-200'
        } ${className}`}
      >
        <IconComp size={sizePx} strokeWidth={1.9} />
      </span>
    );
  }

  // 5. Uncolored Filled / Solid Chip (monochrome dark/light adaptive chip)
  if (styleId === 'mono_filled') {
    const badgePx = Math.round(sizePx * 1.15);
    const innerPx = Math.max(10, Math.round(sizePx * 0.64));
    return (
      <span
        aria-hidden="true"
        style={{ width: badgePx, height: badgePx }}
        className={`inline-flex items-center justify-center rounded-xl shrink-0 transition-all ${
          active
            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
            : 'bg-slate-200/80 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
        } ${className}`}
      >
        <IconComp size={innerPx} strokeWidth={2.25} />
      </span>
    );
  }

  // 6. Theme Adaptive (auto-matches the app & phone appearance color palette)
  const badgePx = Math.round(sizePx * 1.15);
  const innerPx = Math.max(10, Math.round(sizePx * 0.66));
  return (
    <span
      aria-hidden="true"
      style={{ width: badgePx, height: badgePx }}
      className={`inline-flex items-center justify-center rounded-xl shrink-0 transition-all ${
        active
          ? `${theme.accentBg} text-white shadow-xs`
          : `${theme.accentSoftBg} ${theme.accentText}`
      } ${className}`}
    >
      <IconComp size={innerPx} strokeWidth={2.2} />
    </span>
  );
}
