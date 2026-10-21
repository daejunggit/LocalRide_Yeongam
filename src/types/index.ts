export type TshirtSize = 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';

export interface Participant {
  id: string;
  name: string;
  phone: string;
  phoneLast4: string;
  tshirtSize: TshirtSize | string;
  isAttended: boolean;
  attendedAt: string | null;
  isTshirtDistributed: boolean;
  tshirtDistributedAt: string | null;
  isPrizeWinner: boolean;
  prizeItem: string | null;
  prizeShop: string | null; // e.g. "서울 bb5", "부산 occ"
  isPrizeReceived: boolean;
  prizeReceivedAt: string | null;
  region?: '서울' | '부산' | string;
  notes?: string;
}

export interface PartnerShop {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  description?: string;
}

export interface EventConfig {
  title: string;
  subtitle: string;
  date: string;
  location: string;
  adminPin: string;
  partnerShops: PartnerShop[];
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  sheetId?: string;
  autoSync: boolean;
  lastSyncedAt: string | null;
}

export type AppMode = 'checkin' | 'tshirt' | 'prize' | 'lottery' | 'admin';
export type ThemeMode = 'light' | 'dark';
