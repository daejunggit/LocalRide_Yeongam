import { Participant, EventConfig } from '../types';

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * =========================================================================
 * [모임 QR 출석부 & 티셔츠 분출·기념품 수령 관리 시스템]
 * Google Apps Script 백엔드 코드 (Code.gs)
 * =========================================================================
 * 
 * [설치 및 배포 방법]
 * 1. 구글 스프레드시트 새 문서를 생성합니다.
 * 2. 상단 메뉴에서 [확장 프로그램] -> [Apps Script] 클릭
 * 3. 기존 코드를 모두 지우고 이 스크립트 전체를 복사하여 붙여넣습니다.
 * 4. [저장(디스크 아이콘)]을 누른 후, 상단 실행 함수에서 'setupSheets'를 선택하고 [실행]을 누릅니다.
 *    (처음 실행 시 구글 권한 승인 팝업이 뜨면 '고급' -> '이동' -> '허용' 클릭)
 * 5. 우측 상단 파란색 [배포] -> [새 배포] 클릭
 * 6. 유형 선택(톱니바퀴)에서 [웹 앱] 선택
 *    - 설명: 모임 QR 관리 백엔드 v1
 *    - 다음 사용자로 실행: '나 (본인 계정)'
 *    - 액세스 권한이 있는 사용자: '모든 사용자 (Anyone)'  <-- 중요!
 * 7. [배포] 클릭 후 생성된 [웹 앱 URL]을 복사하여 우리 웹 앱의 관리자 설정에 등록하세요!
 */

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. 참가자 명단 시트
  let sheet = ss.getSheetByName('참가자명단');
  if (!sheet) {
    sheet = ss.insertSheet('참가자명단');
  }
  
  const headers = [
    '고유ID', '이름', '전화번호', '뒷자리4개', '티셔츠사이즈', 
    '출석탑승여부', '출석시간', '티셔츠수령여부', '티셔츠수령시간',
    '이벤트당첨여부', '당첨품목', '수령지정샵', '기념품수령여부', '기념품수령시간', '비고'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#1e293b')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  // 2. 활동 로그 시트
  let logSheet = ss.getSheetByName('활동로그');
  if (!logSheet) {
    logSheet = ss.insertSheet('활동로그');
    const logHeaders = ['일시', '구분', '이름', '전화번호뒷자리', '상세내용'];
    logSheet.getRange(1, 1, 1, logHeaders.length).setValues([logHeaders]);
    logSheet.getRange(1, 1, 1, logHeaders.length)
      .setBackground('#334155')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    logSheet.setFrozenRows(1);
  }

  // 3. 모임 정보 시트
  let infoSheet = ss.getSheetByName('모임정보');
  if (!infoSheet) {
    infoSheet = ss.insertSheet('모임정보');
    infoSheet.getRange(1, 1, 4, 2).setValues([
      ['모임명', '2026 어텀 라이더스 전국 모임 (가평-춘천 가을 투어)'],
      ['부제목', '함께 달리는 가을 낭만 라이딩 & 축제'],
      ['일시', '2026-10-25'],
      ['장소', '잠실종합운동장 제1주차장 대형버스 탑승처']
    ]);
    infoSheet.getRange(1, 1, 4, 1).setFontWeight('bold').setBackground('#f1f5f9');
  }

  SpreadsheetApp.flush();
  Logger.log('모임 관리 시트 초기화 완료!');
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('참가자명단');
  
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: '참가자명단 시트가 없습니다. setupSheets를 먼저 실행하세요.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', data: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const participants = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[1]) continue; // 이름 없으면 스킵
    participants.push({
      id: String(r[0] || ('p-' + i)),
      name: String(r[1]),
      phone: String(r[2]),
      phoneLast4: String(r[3]),
      tshirtSize: String(r[4] || 'L'),
      isAttended: r[5] === true || r[5] === 'TRUE' || r[5] === 'Y',
      attendedAt: r[6] ? String(r[6]) : null,
      isTshirtDistributed: r[7] === true || r[7] === 'TRUE' || r[7] === 'Y',
      tshirtDistributedAt: r[8] ? String(r[8]) : null,
      isPrizeWinner: r[9] === true || r[9] === 'TRUE' || r[9] === 'Y',
      prizeItem: r[10] ? String(r[10]) : null,
      prizeShop: r[11] ? String(r[11]) : null,
      isPrizeReceived: r[12] === true || r[12] === 'TRUE' || r[12] === 'Y',
      prizeReceivedAt: r[13] ? String(r[13]) : null,
      notes: r[14] ? String(r[14]) : ''
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', data: participants }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const payload = postData.payload;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('참가자명단');
    const logSheet = ss.getSheetByName('활동로그');

    const nowStr = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');

    if (action === 'checkin') {
      // payload: { participantId, attended }
      const rows = sheet.getDataRange().getValues();
      let found = false;
      let targetName = '';
      let targetLast4 = '';

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(payload.participantId)) {
          sheet.getRange(i + 1, 6).setValue(payload.attended);
          sheet.getRange(i + 1, 7).setValue(payload.attended ? nowStr : '');
          targetName = rows[i][1];
          targetLast4 = rows[i][3];
          found = true;
          break;
        }
      }

      if (logSheet && found) {
        logSheet.appendRow([nowStr, '탑승/출석체크', targetName, targetLast4, payload.attended ? '탑승 확인 완료' : '탑승 취소']);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', time: nowStr, found: found })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'dispense_tshirt') {
      // payload: { participantId, distributed }
      const rows = sheet.getDataRange().getValues();
      let found = false;
      let targetName = '';
      let targetLast4 = '';
      let targetSize = '';

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(payload.participantId)) {
          sheet.getRange(i + 1, 8).setValue(payload.distributed);
          sheet.getRange(i + 1, 9).setValue(payload.distributed ? nowStr : '');
          targetName = rows[i][1];
          targetLast4 = rows[i][3];
          targetSize = rows[i][4];
          found = true;
          break;
        }
      }

      if (logSheet && found) {
        logSheet.appendRow([nowStr, '티셔츠분출', targetName, targetLast4, payload.distributed ? '사이즈(' + targetSize + ') 분출 완료' : '분출 취소']);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', time: nowStr, found: found })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'claim_prize') {
      // payload: { participantId, received, shop }
      const rows = sheet.getDataRange().getValues();
      let found = false;
      let targetName = '';
      let targetLast4 = '';
      let prizeItem = '';

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(payload.participantId)) {
          sheet.getRange(i + 1, 13).setValue(payload.received);
          sheet.getRange(i + 1, 14).setValue(payload.received ? nowStr : '');
          targetName = rows[i][1];
          targetLast4 = rows[i][3];
          prizeItem = rows[i][10];
          found = true;
          break;
        }
      }

      if (logSheet && found) {
        logSheet.appendRow([nowStr, '매장기념품수령', targetName, targetLast4, payload.shop + ' 매장에서 [' + prizeItem + '] 수령 완료']);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', time: nowStr, found: found })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'sync_all') {
      // 전체 명단 동기화
      const list = payload.participants || [];
      sheet.clearContents();
      
      const headers = [
        '고유ID', '이름', '전화번호', '뒷자리4개', '티셔츠사이즈', 
        '출석탑승여부', '출석시간', '티셔츠수령여부', '티셔츠수령시간',
        '이벤트당첨여부', '당첨품목', '수령지정샵', '기념품수령여부', '기념품수령시간', '비고'
      ];
      
      const dataRows = [headers];
      list.forEach(p => {
        dataRows.push([
          p.id,
          p.name,
          p.phone,
          p.phoneLast4,
          p.tshirtSize,
          p.isAttended ? 'TRUE' : 'FALSE',
          p.attendedAt || '',
          p.isTshirtDistributed ? 'TRUE' : 'FALSE',
          p.tshirtDistributedAt || '',
          p.isPrizeWinner ? 'TRUE' : 'FALSE',
          p.prizeItem || '',
          p.prizeShop || '',
          p.isPrizeReceived ? 'TRUE' : 'FALSE',
          p.prizeReceivedAt || '',
          p.notes || ''
        ]);
      });

      sheet.getRange(1, 1, dataRows.length, headers.length).setValues(dataRows);
      sheet.getRange(1, 1, 1, headers.length).setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', count: list.length, time: nowStr })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: '알 수 없는 액션' })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

export async function testGASConnection(webAppUrl: string): Promise<{ ok: boolean; message: string; count?: number }> {
  if (!webAppUrl || !webAppUrl.startsWith('https://script.google.com/')) {
    return { ok: false, message: '올바른 Google Apps Script 웹 앱 URL 형식이 아닙니다.' };
  }

  try {
    const res = await fetch(webAppUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
    });

    if (!res.ok) {
      return { ok: false, message: `서버 응답 오류 (HTTP ${res.status})` };
    }

    const json = await res.json();
    if (json.status === 'success') {
      return {
        ok: true,
        message: 'Google Apps Script 연결 성공! 정상적으로 데이터를 불러왔습니다.',
        count: Array.isArray(json.data) ? json.data.length : 0,
      };
    } else {
      return { ok: false, message: json.message || '알 수 없는 응답 형식' };
    }
  } catch (e: any) {
    return { ok: false, message: `연결 실패: ${e.message || '네트워크 요청 실패 (CORS 또는 배포 권한 확인 필요)'}` };
  }
}

export async function fetchParticipantsFromGAS(webAppUrl: string): Promise<Participant[]> {
  const res = await fetch(webAppUrl, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    mode: 'cors',
  });
  const json = await res.json();
  if (json.status === 'success' && Array.isArray(json.data)) {
    return json.data;
  }
  throw new Error(json.message || '데이터를 가져오지 못했습니다.');
}

export async function postToGAS(webAppUrl: string, action: string, payload: any): Promise<any> {
  if (!webAppUrl) return null;
  try {
    const res = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps script CORS friendly
      },
      body: JSON.stringify({ action, payload }),
    });
    return await res.json();
  } catch (e) {
    console.warn('Failed to post to Google Apps Script', e);
    return null;
  }
}
