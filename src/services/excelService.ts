import * as XLSX from 'xlsx';
import { Participant } from '../types';
import { extractLast4Digits, formatPhone } from './storage';

export function exportParticipantsToExcel(participants: Participant[], filename = '모임_출석_티셔츠_명단.xlsx') {
  const data = participants.map((p, idx) => ({
    순번: idx + 1,
    이름: p.name,
    휴대폰번호: p.phone,
    휴대폰뒷자리: p.phoneLast4,
    티셔츠사이즈: p.tshirtSize,
    탑승출석여부: p.isAttended ? '탑승완료' : '미탑승',
    출석체크시간: p.attendedAt || '',
    티셔츠수령여부: p.isTshirtDistributed ? '수령완료' : '미수령',
    티셔츠수령시간: p.tshirtDistributedAt || '',
    이벤트당첨여부: p.isPrizeWinner ? '당첨' : '해당없음',
    당첨기념품: p.prizeItem || '',
    기념품수령매장: p.prizeShop || '',
    기념품수령여부: p.isPrizeReceived ? '수령완료' : (p.isPrizeWinner ? '미수령' : ''),
    기념품수령시간: p.prizeReceivedAt || '',
    비고: p.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '참가자명단');
  XLSX.writeFile(workbook, filename);
}

export function downloadSampleExcelTemplate() {
  const sample = [
    {
      이름: '홍길동',
      전화번호: '010-1234-5678',
      티셔츠사이즈: 'L',
      이벤트당첨여부: '당첨',
      당첨기념품: '프리미엄 사이클 져지',
      기념품수령매장: '서울 bb5',
      비고: '1호차',
    },
    {
      이름: '김철수',
      전화번호: '010-9876-5432',
      티셔츠사이즈: 'XL',
      이벤트당첨여부: '미당첨',
      당첨기념품: '',
      기념품수령매장: '',
      비고: '',
    },
    {
      이름: '이영희',
      전화번호: '010-5555-1234',
      티셔츠사이즈: 'M',
      이벤트당첨여부: '당첨',
      당첨기념품: '초경량 헬멧',
      기념품수령매장: '부산 occ',
      비고: '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sample);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '양식샘플');
  XLSX.writeFile(workbook, '모임참가자_명단양식_샘플.xlsx');
}

export async function parseExcelFile(file: File): Promise<Partial<Participant>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const parsed: Partial<Participant>[] = rows.map((row, idx) => {
    // Check multiple possible key names for flexibility
    const name = row['이름'] || row['성명'] || row['name'] || row['참가자'] || `참가자_${idx + 1}`;
    const rawPhone = String(row['전화번호'] || row['휴대폰'] || row['연락처'] || row['phone'] || '');
    const phone = formatPhone(rawPhone);
    const phoneLast4 = extractLast4Digits(rawPhone);
    const tshirtSize = String(row['티셔츠사이즈'] || row['사이즈'] || row['size'] || 'L').toUpperCase();
    
    const isPrizeRaw = String(row['이벤트당첨여부'] || row['당첨여부'] || row['당첨'] || '');
    const isPrizeWinner = isPrizeRaw.includes('당첨') || isPrizeRaw.toLowerCase() === 'true' || isPrizeRaw === 'y';
    const prizeItem = row['당첨기념품'] || row['기념품'] || row['당첨품목'] || (isPrizeWinner ? '기념품' : '');
    const prizeShop = row['기념품수령매장'] || row['수령매장'] || row['수령처'] || '';

    return {
      id: `imported-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: String(name).trim(),
      phone,
      phoneLast4,
      tshirtSize,
      isAttended: false,
      attendedAt: null,
      isTshirtDistributed: false,
      tshirtDistributedAt: null,
      isPrizeWinner,
      prizeItem: prizeItem ? String(prizeItem).trim() : null,
      prizeShop: prizeShop ? String(prizeShop).trim() : null,
      isPrizeReceived: false,
      prizeReceivedAt: null,
      notes: row['비고'] || row['메모'] || '',
    };
  });

  return parsed;
}
