import { Participant, EventConfig, GoogleSheetsConfig, PartnerShop } from '../types';

const STORAGE_KEY_PARTICIPANTS = 'meetup_qr_participants_v1';
const STORAGE_KEY_EVENT = 'meetup_qr_event_v1';
const STORAGE_KEY_SHEETS = 'meetup_qr_sheets_v1';

export const DEFAULT_PARTNER_SHOPS: PartnerShop[] = [
  {
    id: 'bb5',
    name: '서울 bb5',
    city: '서울',
    address: '서울특별시 강동구 천호대로 1056 (천호역 6번 출구)',
    phone: '02-475-8855',
    description: '브롬톤 & 미니벨로 전문 공식 대리점 bb5',
  },
  {
    id: 'occ',
    name: '부산 occ',
    city: '부산',
    address: '부산광역시 수영구 민락수변로 29 1층 (광안리 인근)',
    phone: '051-752-9988',
    description: '사이클링 복합문화공간 occ 515 (On Cycle Culture)',
  },
];

export const DEFAULT_EVENT: EventConfig = {
  title: '2026 어텀 라이더스 전국 모임 (가평-춘천 가을 투어)',
  subtitle: '함께 달리는 가을 낭만 라이딩 & 축제',
  date: '2026-10-25',
  location: '잠실종합운동장 제1주차장 대형버스 탑승처',
  adminPin: '1234',
  partnerShops: DEFAULT_PARTNER_SHOPS,
};

export const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'p-1',
    name: '김민수',
    phone: '010-3849-5678',
    phoneLast4: '5678',
    tshirtSize: 'L',
    isAttended: true,
    attendedAt: '2026-10-25 07:12:30',
    isTshirtDistributed: true,
    tshirtDistributedAt: '2026-10-25 07:15:20',
    isPrizeWinner: true,
    prizeItem: '한정판 프리미엄 사이클 져지 (L)',
    prizeShop: '서울 bb5',
    isPrizeReceived: false,
    prizeReceivedAt: null,
    notes: '버스 1호차 12번 좌석',
  },
  {
    id: 'p-2',
    name: '이민수',
    phone: '010-9123-5678',
    phoneLast4: '5678', // Same last 4 digits for testing duplicate picker!
    tshirtSize: 'XL',
    isAttended: false,
    attendedAt: null,
    isTshirtDistributed: false,
    tshirtDistributedAt: null,
    isPrizeWinner: false,
    prizeItem: null,
    prizeShop: null,
    isPrizeReceived: false,
    prizeReceivedAt: null,
    notes: '동일 뒷번호 테스트 케이스',
  },
  {
    id: 'p-3',
    name: '박지훈',
    phone: '010-5542-1234',
    phoneLast4: '1234',
    tshirtSize: 'M',
    isAttended: true,
    attendedAt: '2026-10-25 07:18:45',
    isTshirtDistributed: false,
    tshirtDistributedAt: null,
    isPrizeWinner: true,
    prizeItem: '초경량 카본 헬멧',
    prizeShop: '부산 occ',
    isPrizeReceived: false,
    prizeReceivedAt: null,
    notes: '부산 거주자',
  },
  {
    id: 'p-4',
    name: '최지훈',
    phone: '010-8877-1234',
    phoneLast4: '1234', // Another duplicate pair!
    tshirtSize: 'L',
    isAttended: false,
    attendedAt: null,
    isTshirtDistributed: false,
    tshirtDistributedAt: null,
    isPrizeWinner: false,
    prizeItem: null,
    prizeShop: null,
    isPrizeReceived: false,
    prizeReceivedAt: null,
    notes: '',
  },
  {
    id: 'p-5',
    name: '정수연',
    phone: '010-4491-7788',
    phoneLast4: '7788',
    tshirtSize: 'S',
    isAttended: true,
    attendedAt: '2026-10-25 07:05:10',
    isTshirtDistributed: true,
    tshirtDistributedAt: '2026-10-25 07:08:22',
    isPrizeWinner: false,
    prizeItem: null,
    prizeShop: null,
    isPrizeReceived: false,
    prizeReceivedAt: null,
  },
  {
    id: 'p-6',
    name: '강태우',
    phone: '010-6321-9901',
    phoneLast4: '9901',
    tshirtSize: '2XL',
    isAttended: false,
    attendedAt: null,
    isTshirtDistributed: false,
    tshirtDistributedAt: null,
    isPrizeWinner: true,
    prizeItem: '브롬톤 워터프루프 프론트 백',
    prizeShop: '서울 bb5',
    isPrizeReceived: true,
    prizeReceivedAt: '2026-10-26 15:30:12',
    notes: '서울 bb5 매장 수령 완료자 테스트',
  },
  {
    id: 'p-7',
    name: '조은영',
    phone: '010-7712-3344',
    phoneLast4: '3344',
    tshirtSize: 'M',
    isAttended: true,
    attendedAt: '2026-10-25 07:22:15',
    isTshirtDistributed: false,
    tshirtDistributedAt: null,
    isPrizeWinner: true,
    prizeItem: 'occ 시그니처 텀블러 & 커피 바우처',
    prizeShop: '부산 occ',
    isPrizeReceived: false,
    prizeReceivedAt: null,
  },
  {
    id: 'p-8',
    name: '윤동현',
    phone: '010-2234-8822',
    phoneLast4: '8822',
    tshirtSize: 'L',
    isAttended: false,
    attendedAt: null,
    isTshirtDistributed: false,
    tshirtDistributedAt: null,
    isPrizeWinner: false,
    prizeItem: null,
    prizeShop: null,
    isPrizeReceived: false,
    prizeReceivedAt: null,
  },
  {
    id: 'p-9',
    name: '임소미',
    phone: '010-9988-4411',
    phoneLast4: '4411',
    tshirtSize: 'S',
    isAttended: true,
    attendedAt: '2026-10-25 07:10:00',
    isTshirtDistributed: true,
    tshirtDistributedAt: '2026-10-25 07:11:45',
    isPrizeWinner: false,
    prizeItem: null,
    prizeShop: null,
    isPrizeReceived: false,
    prizeReceivedAt: null,
  },
  {
    id: 'p-10',
    name: '한상우',
    phone: '010-3321-6655',
    phoneLast4: '6655',
    tshirtSize: 'XL',
    isAttended: false,
    attendedAt: null,
    isTshirtDistributed: false,
    tshirtDistributedAt: null,
    isPrizeWinner: true,
    prizeItem: '고급 멀티툴 & 미니 휴대용 펌프 세트',
    prizeShop: '서울 bb5',
    isPrizeReceived: false,
    prizeReceivedAt: null,
  },
  {
    id: 'p-11',
    name: '오세훈',
    phone: '010-5511-2468',
    phoneLast4: '2468',
    tshirtSize: 'L',
    isAttended: true,
    attendedAt: '2026-10-25 07:25:01',
    isTshirtDistributed: false,
    tshirtDistributedAt: null,
    isPrizeWinner: false,
    prizeItem: null,
    prizeShop: null,
    isPrizeReceived: false,
    prizeReceivedAt: null,
  },
  {
    id: 'p-12',
    name: '서유진',
    phone: '010-8833-1357',
    phoneLast4: '1357',
    tshirtSize: 'M',
    isAttended: false,
    attendedAt: null,
    isTshirtDistributed: false,
    tshirtDistributedAt: null,
    isPrizeWinner: false,
    prizeItem: null,
    prizeShop: null,
    isPrizeReceived: false,
    prizeReceivedAt: null,
  },
  {
    id: 'p-13',
    name: '배준혁',
    phone: '010-6644-8080',
    phoneLast4: '8080',
    tshirtSize: '2XL',
    isAttended: true,
    attendedAt: '2026-10-25 07:14:10',
    isTshirtDistributed: true,
    tshirtDistributedAt: '2026-10-25 07:16:30',
    isPrizeWinner: false,
    prizeItem: null,
    prizeShop: null,
    isPrizeReceived: false,
    prizeReceivedAt: null,
  },
  {
    id: 'p-14',
    name: '류하은',
    phone: '010-1122-9090',
    phoneLast4: '9090',
    tshirtSize: 'S',
    isAttended: false,
    attendedAt: null,
    isTshirtDistributed: false,
    tshirtDistributedAt: null,
    isPrizeWinner: true,
    prizeItem: '라이딩 전용 편광 선글라스',
    prizeShop: '부산 occ',
    isPrizeReceived: true,
    prizeReceivedAt: '2026-10-26 14:10:00',
  },
  {
    id: 'p-15',
    name: '송민호',
    phone: '010-4455-7070',
    phoneLast4: '7070',
    tshirtSize: 'XL',
    isAttended: true,
    attendedAt: '2026-10-25 07:20:50',
    isTshirtDistributed: true,
    tshirtDistributedAt: '2026-10-25 07:23:10',
    isPrizeWinner: false,
    prizeItem: null,
    prizeShop: null,
    isPrizeReceived: false,
    prizeReceivedAt: null,
  },
];

export const loadParticipants = (): Participant[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PARTICIPANTS);
    let list: Participant[] = raw ? JSON.parse(raw) : INITIAL_PARTICIPANTS;
    
    // Ensure every participant has a region assigned (서울 or 부산)
    let hasChanges = false;
    list = list.map((p, idx) => {
      if (!p.region) {
        hasChanges = true;
        let reg: '서울' | '부산' = '서울';
        if (p.prizeShop?.includes('occ') || p.prizeShop?.includes('부산') || p.notes?.includes('부산') || idx % 2 === 1) {
          reg = '부산';
        }
        return { ...p, region: reg };
      }
      return p;
    });

    if (!raw || hasChanges) {
      saveParticipants(list);
    }
    return list;
  } catch (e) {
    console.error('Failed to load participants from localStorage', e);
    return INITIAL_PARTICIPANTS;
  }
};

export const saveParticipants = (data: Participant[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_PARTICIPANTS, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save participants to localStorage', e);
  }
};

export const loadEventConfig = (): EventConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENT);
    if (!raw) {
      saveEventConfig(DEFAULT_EVENT);
      return DEFAULT_EVENT;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_EVENT, ...parsed };
  } catch (e) {
    console.error('Failed to load event config', e);
    return DEFAULT_EVENT;
  }
};

export const saveEventConfig = (data: EventConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY_EVENT, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save event config', e);
  }
};

export const loadSheetsConfig = (): GoogleSheetsConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHEETS);
    if (!raw) {
      const def: GoogleSheetsConfig = {
        webAppUrl: '',
        autoSync: false,
        lastSyncedAt: null,
      };
      return def;
    }
    return JSON.parse(raw);
  } catch (e) {
    return { webAppUrl: '', autoSync: false, lastSyncedAt: null };
  }
};

export const saveSheetsConfig = (data: GoogleSheetsConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY_SHEETS, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save sheets config', e);
  }
};

export const STORAGE_KEY_THEME = 'meetup_qr_theme_v1';

export const loadTheme = (): 'light' | 'dark' => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_THEME);
    if (raw === 'dark' || raw === 'light') return raw;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch (e) {
    return 'light';
  }
};

export const saveTheme = (theme: 'light' | 'dark'): void => {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  } catch (e) {
    console.error('Failed to save theme', e);
  }
};

export const extractLast4Digits = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-4);
};

export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

export const maskPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const prefix = digits.slice(0, 3);
    const last4 = digits.slice(-4);
    return `${prefix}-****-${last4}`;
  }
  return phone;
};

export const maskName = (name: string): string => {
  if (name.length <= 2) {
    return name.slice(0, 1) + '*';
  }
  return name.slice(0, 1) + '*'.repeat(name.length - 2) + name.slice(-1);
};
