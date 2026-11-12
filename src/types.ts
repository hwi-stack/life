export type PrizeId = 'general' | 'hairdryer' | 'ricecooker';

export interface PrizeConfig {
  id: PrizeId;
  name: string;
  count: number;
  subtitle: string;
  iconName: 'gift' | 'wind' | 'cooking-pot';
  tagColor: string;
  accentColor: string;
}

export type SlotStatus = 'empty' | 'spinning' | 'revealed' | 'absent';

export interface WinnerSlot {
  slotIndex: number;
  number: number | null;
  drawnAt: string | null;
  status: SlotStatus;
  revealedDigits: number; // 0: spinning, 1: 1st digit revealed, 2: 2nd digit revealed, 3: all 3 revealed
  isRedrawn?: boolean;
}

export interface DrawHistoryRecord {
  id: string;
  prizeId: PrizeId;
  prizeName: string;
  slotIndex: number;
  number: number;
  drawnAt: string;
  isAbsent?: boolean;
  status: 'active' | 'absent_replaced';
  reason?: string;
}

export interface AdminSettings {
  startNumber: number;
  endNumber: number;
  excludedNumbers: number[];
  soundEnabled: boolean;
}

export const INITIAL_PRIZES: PrizeConfig[] = [
  {
    id: 'general',
    name: '경품',
    count: 8,
    subtitle: '8명 추첨',
    iconName: 'gift',
    tagColor: 'from-amber-500 to-amber-600',
    accentColor: '#f59e0b'
  },
  {
    id: 'hairdryer',
    name: '헤어드라이기',
    count: 1,
    subtitle: '1명 추첨',
    iconName: 'wind',
    tagColor: 'from-sky-500 to-blue-600',
    accentColor: '#0284c7'
  },
  {
    id: 'ricecooker',
    name: '밥솥',
    count: 1,
    subtitle: '1명 추첨',
    iconName: 'cooking-pot',
    tagColor: 'from-rose-500 to-red-600',
    accentColor: '#e11d48'
  }
];
