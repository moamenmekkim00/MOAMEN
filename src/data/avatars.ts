import boyImg from '../assets/images/avatar_pixar_boy_1794716908501.jpg';
import girlImg from '../assets/images/avatar_pixar_girl_1794716893019.jpg';
import youngManImg from '../assets/images/avatar_pixar_young_man_1794716893920.jpg';
import beardedManImg from '../assets/images/avatar_pixar_bearded_man_1794716908802.jpg';
import manGlassesImg from '../assets/images/avatar_pixar_man_glasses_1794716894174.jpg';
import womanHijabImg from '../assets/images/avatar_pixar_woman_hijab_1794716893529.jpg';
import womanImg from '../assets/images/avatar_pixar_woman_1794716894971.jpg';
import teenGirlImg from '../assets/images/avatar_pixar_teen_girl_1794716908724.jpg';
import elderManImg from '../assets/images/avatar_pixar_elder_man_1794716895382.jpg';
import elderWomanImg from '../assets/images/avatar_pixar_elder_woman_1794716895346.jpg';

export type AvatarCategory = 'men' | 'bald' | 'women' | 'kids' | 'elders' | 'sad' | 'expressions';
export type AvatarFilter = 'all' | AvatarCategory;

export interface PixarAvatar {
  id: string;
  labelAr: string;
  labelEn: string;
  category: AvatarCategory;
  src: string;
}

export const AVATAR_FILTER_TABS: { key: AvatarFilter; ar: string; en: string }[] = [
  { key: 'all', ar: 'الكل (132)', en: 'All (132)' },
  { key: 'sad', ar: 'حزين', en: 'Sad' },
  { key: 'expressions', ar: 'تعبيرات', en: 'Expressions' },
  { key: 'men', ar: 'رجال', en: 'Men' },
  { key: 'bald', ar: 'أصلع', en: 'Bald Men' },
  { key: 'women', ar: 'سيدات', en: 'Women' },
  { key: 'kids', ar: 'أطفال', en: 'Kids' },
  { key: 'elders', ar: 'كبار السن', en: 'Elders' },
];

const slicedGlob = import.meta.glob('../assets/images/avatars/*.jpg', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const MOOD_LABELS: [string, string][] = [
  ['ضاحك', 'Laughing'],
  ['غاضب أصلع', 'Angry Bald'],
  ['متفاجئة', 'Surprised'],
  ['غمزة', 'Winking'],
  ['يفكر', 'Thinking'],
  ['نظارة شمس', 'Cool Bald'],
  ['متحمسة', 'Excited'],
  ['خجولة', 'Blushing'],
  ['عابس', 'Grumpy'],
  ['سعيدة', 'Joyful'],
  ['مندهش', 'Amazed'],
  ['طفل غاضب', 'Pouting'],
  ['مبتسمة', 'Cheerful'],
  ['مصدوم', 'Shocked'],
  ['نعسانة', 'Sleepy'],
  ['واثق', 'Confident'],
];

const SAD_LABELS: [string, string][] = [
  ['رجل حزين', 'Sad Man'],
  ['أصلع حزين', 'Sad Bald'],
  ['محجبة باكية', 'Teary Hijab'],
  ['طفل يبكي', 'Crying Boy'],
  ['طفلة حزينة', 'Sad Girl'],
  ['جد قلق', 'Worried Elder'],
  ['جدة حزينة', 'Sad Elder'],
  ['شاب باكي', 'Teary Guy'],
  ['فتاة عابسة', 'Upset Girl'],
  ['أصلع قلق', 'Worried Bald'],
  ['فتاة حزينة', 'Teary Girl'],
  ['رجل مهموم', 'Gloomy Man'],
  ['ولد حزين', 'Sad Hoodie'],
  ['بنت تبكي', 'Crying Girl'],
  ['أصلع مهموم', 'Sad Beard'],
  ['سيدة باكية', 'Teary Woman'],
];

function buildSlicedGroup(
  prefix: string,
  count: number,
  category: AvatarCategory,
  labelArPrefix: string,
  labelEnPrefix: string,
  customLabels?: [string, string][]
): PixarAvatar[] {
  const result: PixarAvatar[] = [];
  for (let i = 1; i <= count; i++) {
    const num = String(i).padStart(2, '0');
    const id = `${prefix}_${num}`;
    const key = `../assets/images/avatars/${id}.jpg`;
    const src = slicedGlob[key];
    if (src) {
      const pair = customLabels?.[i - 1];
      result.push({
        id,
        labelAr: pair ? pair[0] : `${labelArPrefix} ${i}`,
        labelEn: pair ? pair[1] : `${labelEnPrefix} ${i}`,
        category,
        src,
      });
    }
  }
  return result;
}

const BASE_AVATARS: PixarAvatar[] = [
  { id: 'boy', labelAr: 'ولد', labelEn: 'Boy', category: 'kids', src: boyImg },
  { id: 'girl', labelAr: 'بنت', labelEn: 'Girl', category: 'kids', src: girlImg },
  { id: 'teen_girl', labelAr: 'فتاة بنظارة', labelEn: 'Teen Girl', category: 'kids', src: teenGirlImg },
  { id: 'young_man', labelAr: 'شاب', labelEn: 'Young Man', category: 'men', src: youngManImg },
  { id: 'bearded_man', labelAr: 'رجل بلحية', labelEn: 'Bearded Man', category: 'men', src: beardedManImg },
  { id: 'man_glasses', labelAr: 'رجل بنظارة', labelEn: 'Man Glasses', category: 'men', src: manGlassesImg },
  { id: 'woman_hijab', labelAr: 'سيدة محجبة', labelEn: 'Hijab Woman', category: 'women', src: womanHijabImg },
  { id: 'woman', labelAr: 'سيدة', labelEn: 'Woman', category: 'women', src: womanImg },
  { id: 'elder_man', labelAr: 'رجل كبير', labelEn: 'Elder Man', category: 'elders', src: elderManImg },
  { id: 'elder_woman', labelAr: 'سيدة كبيرة', labelEn: 'Elder Woman', category: 'elders', src: elderWomanImg },
];

export const PIXAR_AVATARS: PixarAvatar[] = [
  ...BASE_AVATARS,
  ...buildSlicedGroup('sad', 16, 'sad', 'حزين', 'Sad', SAD_LABELS),
  ...buildSlicedGroup('mood', 16, 'expressions', 'تعبير', 'Mood', MOOD_LABELS),
  ...buildSlicedGroup('men', 15, 'men', 'رجل', 'Man'),
  ...buildSlicedGroup('bald', 15, 'bald', 'رجل أصلع', 'Bald Man'),
  ...buildSlicedGroup('women', 15, 'women', 'سيدة', 'Woman'),
  ...buildSlicedGroup('boys', 15, 'kids', 'ولد', 'Boy'),
  ...buildSlicedGroup('girls', 15, 'kids', 'بنت', 'Girl'),
  ...buildSlicedGroup('elders', 15, 'elders', 'كبير سن', 'Elder'),
];

export function resolveAvatarSrc(avatarIdOrUrl?: string): string {
  if (!avatarIdOrUrl) return boyImg;
  if (avatarIdOrUrl.startsWith('data:image/') || avatarIdOrUrl.startsWith('http')) {
    return avatarIdOrUrl;
  }
  const found = PIXAR_AVATARS.find((a) => a.id === avatarIdOrUrl);
  return found ? found.src : manGlassesImg;
}

/**
 * Compresses a user-selected image file into a small square JPEG data URL
 * safely under Firestore size limits (~25-45 KB).
 */
export function compressImageFile(file: File, maxSize = 220): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة الصورة'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('تنسيق الصورة غير مدعوم'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('تعذر معالجة الصورة'));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxSize, maxSize);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
