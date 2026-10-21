/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Participant, EventConfig, GoogleSheetsConfig, AppMode, ThemeMode } from './types';
import {
  loadParticipants,
  saveParticipants,
  loadEventConfig,
  saveEventConfig,
  loadSheetsConfig,
  saveSheetsConfig,
  loadTheme,
  saveTheme,
} from './services/storage';
import { postToGAS, fetchParticipantsFromGAS } from './services/googleSheets';
import { Header } from './components/Header';
import { CheckinView } from './components/CheckinView';
import { TShirtDispenseView } from './components/TShirtDispenseView';
import { PrizeShopView } from './components/PrizeShopView';
import { LotteryView } from './components/LotteryView';
import { AdminDashboard } from './components/AdminDashboard';
import { Check, Info, Sparkles } from 'lucide-react';

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [eventConfig, setEventConfig] = useState<EventConfig>(loadEventConfig());
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(loadSheetsConfig());
  const [activeMode, setActiveMode] = useState<AppMode>('checkin');
  const [activeShopId, setActiveShopId] = useState<string>('bb5');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(loadTheme());

  // Initialize theme on document root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    saveTheme(nextTheme);
  };

  // Initialize data and read URL query parameters for QR code scanning routing
  useEffect(() => {
    const loaded = loadParticipants();
    setParticipants(loaded);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode') as AppMode;
      const shopParam = params.get('shop');

      if (
        modeParam &&
        ['checkin', 'tshirt', 'prize', 'lottery', 'admin'].includes(modeParam)
      ) {
        setActiveMode(modeParam);
      }
      if (shopParam) {
        setActiveShopId(shopParam);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 1. Check-in Action
  const handleCheckin = async (participantId: string) => {
    const nowStr = new Date().toLocaleString('ko-KR');
    const updated = participants.map((p) =>
      p.id === participantId
        ? { ...p, isAttended: true, attendedAt: nowStr }
        : p
    );
    setParticipants(updated);
    saveParticipants(updated);
    showToast('탑승 및 출석 확인이 저장되었습니다.');

    // Asynchronously push to Google Apps Script if configured
    if (sheetsConfig.webAppUrl) {
      postToGAS(sheetsConfig.webAppUrl, 'checkin', {
        participantId,
        attended: true,
      });
    }
  };

  // Toggle Checkin (Admin)
  const handleToggleCheckin = (participantId: string, attended: boolean) => {
    const nowStr = attended ? new Date().toLocaleString('ko-KR') : null;
    const updated = participants.map((p) =>
      p.id === participantId
        ? { ...p, isAttended: attended, attendedAt: nowStr }
        : p
    );
    setParticipants(updated);
    saveParticipants(updated);

    if (sheetsConfig.webAppUrl) {
      postToGAS(sheetsConfig.webAppUrl, 'checkin', {
        participantId,
        attended,
      });
    }
  };

  // 2. T-Shirt Dispense Action
  const handleDispenseTshirt = async (participantId: string, distributed: boolean) => {
    const nowStr = distributed ? new Date().toLocaleString('ko-KR') : null;
    const updated = participants.map((p) =>
      p.id === participantId
        ? { ...p, isTshirtDistributed: distributed, tshirtDistributedAt: nowStr }
        : p
    );
    setParticipants(updated);
    saveParticipants(updated);
    showToast(distributed ? '티셔츠 분출 처리가 완료되었습니다.' : '분출 상태가 취소되었습니다.');

    if (sheetsConfig.webAppUrl) {
      postToGAS(sheetsConfig.webAppUrl, 'dispense_tshirt', {
        participantId,
        distributed,
      });
    }
  };

  // 3. Prize Claim Action
  const handleClaimPrize = async (participantId: string, shopName: string, received: boolean) => {
    const nowStr = received ? new Date().toLocaleString('ko-KR') : null;
    const updated = participants.map((p) =>
      p.id === participantId
        ? { ...p, isPrizeReceived: received, prizeReceivedAt: nowStr }
        : p
    );
    setParticipants(updated);
    saveParticipants(updated);
    showToast(received ? `[${shopName}] 기념품 수령이 완료되었습니다.` : '수령 상태가 취소되었습니다.');

    if (sheetsConfig.webAppUrl) {
      postToGAS(sheetsConfig.webAppUrl, 'claim_prize', {
        participantId,
        shop: shopName,
        received,
      });
    }
  };

  // 4. Register Lottery Winners from Random Draw
  const handleRegisterWinners = (
    winnerIds: string[],
    prizeItem: string,
    prizeShop: string
  ) => {
    const updated = participants.map((p) =>
      winnerIds.includes(p.id)
        ? {
            ...p,
            isPrizeWinner: true,
            prizeItem,
            prizeShop,
            isPrizeReceived: false,
            prizeReceivedAt: null,
          }
        : p
    );
    setParticipants(updated);
    saveParticipants(updated);
    showToast(`총 ${winnerIds.length}명이 [${prizeShop}] 당첨 명단에 등록되었습니다!`);

    // Sync full list with Google Apps Script if connected
    if (sheetsConfig.webAppUrl) {
      postToGAS(sheetsConfig.webAppUrl, 'sync_all', {
        participants: updated,
      });
    }
  };

  // Handlers for Admin changes
  const handleUpdateParticipants = (newData: Participant[]) => {
    setParticipants(newData);
    saveParticipants(newData);
    showToast('참가자 명단이 업데이트되었습니다.');
  };

  const handleUpdateEventConfig = (newCfg: EventConfig) => {
    setEventConfig(newCfg);
    saveEventConfig(newCfg);
    showToast('모임 정보가 변경되었습니다.');
  };

  const handleUpdateSheetsConfig = (newSheetsCfg: GoogleSheetsConfig) => {
    setSheetsConfig(newSheetsCfg);
    saveSheetsConfig(newSheetsCfg);
  };

  // Google Apps Script Sync actions
  const handleSyncWithGAS = async () => {
    if (!sheetsConfig.webAppUrl) return;
    try {
      showToast('구글 스프레드시트로 동기화 중...');
      const res = await postToGAS(sheetsConfig.webAppUrl, 'sync_all', {
        participants,
      });
      if (res && res.status === 'success') {
        const nextCfg = { ...sheetsConfig, lastSyncedAt: new Date().toISOString() };
        setSheetsConfig(nextCfg);
        saveSheetsConfig(nextCfg);
        showToast('구글 시트 동기화 완료!');
      } else {
        alert('동기화 실패: Google Apps Script 응답 오류');
      }
    } catch (e: any) {
      alert(`동기화 오류: ${e.message}`);
    }
  };

  const handleFetchFromGAS = async () => {
    if (!sheetsConfig.webAppUrl) return;
    try {
      showToast('구글 시트에서 명단 불러오는 중...');
      const remote = await fetchParticipantsFromGAS(sheetsConfig.webAppUrl);
      if (Array.isArray(remote) && remote.length > 0) {
        setParticipants(remote);
        saveParticipants(remote);
        const nextCfg = { ...sheetsConfig, lastSyncedAt: new Date().toISOString() };
        setSheetsConfig(nextCfg);
        saveSheetsConfig(nextCfg);
        showToast(`${remote.length}명의 데이터를 시트에서 불러왔습니다.`);
      } else {
        showToast('시트에 저장된 참가자 데이터가 없습니다.');
      }
    } catch (e: any) {
      alert(`시트 조회 실패: ${e.message}`);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-slate-100/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200`}>
      {/* Top Header */}
      <Header
        eventConfig={eventConfig}
        sheetsConfig={sheetsConfig}
        activeMode={activeMode}
        theme={theme}
        onSelectMode={(m) => setActiveMode(m)}
        onToggleTheme={handleToggleTheme}
      />

      {/* Quick Test Bar (Helper for testing and demonstration) */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 py-2 px-4 shadow-2xs transition-colors">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>
              <strong>빠른 테스트 안내:</strong> 뒷자리 <strong>5678</strong> (중복자 테스트), <strong>1234</strong> (중복자 테스트), <strong>7788</strong> (즉시 출석), <strong>9901</strong> (bb5 당첨자)
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 hidden sm:inline">화면 전환:</span>
            <button
              onClick={() => setActiveMode('checkin')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                activeMode === 'checkin'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              탑승체크
            </button>
            <button
              onClick={() => setActiveMode('tshirt')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                activeMode === 'tshirt'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              티셔츠분출
            </button>
            <button
              onClick={() => setActiveMode('prize')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                activeMode === 'prize'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              매장기념품
            </button>
            <button
              onClick={() => setActiveMode('lottery')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all flex items-center gap-1 ${
                activeMode === 'lottery'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              랜덤추첨
            </button>
            <button
              onClick={() => setActiveMode('admin')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                activeMode === 'admin'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              관리자대시보드
            </button>
          </div>
        </div>
      </div>

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {activeMode === 'checkin' && (
          <CheckinView
            participants={participants}
            eventConfig={eventConfig}
            onCheckin={handleCheckin}
          />
        )}

        {activeMode === 'tshirt' && (
          <TShirtDispenseView
            participants={participants}
            eventConfig={eventConfig}
            onDispenseTshirt={handleDispenseTshirt}
          />
        )}

        {activeMode === 'prize' && (
          <PrizeShopView
            participants={participants}
            eventConfig={eventConfig}
            initialShopId={activeShopId}
            onClaimPrize={handleClaimPrize}
          />
        )}

        {activeMode === 'lottery' && (
          <LotteryView
            participants={participants}
            eventConfig={eventConfig}
            onRegisterWinners={handleRegisterWinners}
          />
        )}

        {activeMode === 'admin' && (
          <AdminDashboard
            participants={participants}
            eventConfig={eventConfig}
            sheetsConfig={sheetsConfig}
            onUpdateParticipants={handleUpdateParticipants}
            onUpdateEventConfig={handleUpdateEventConfig}
            onUpdateSheetsConfig={handleUpdateSheetsConfig}
            onToggleCheckin={handleToggleCheckin}
            onToggleTshirt={handleDispenseTshirt}
            onTogglePrize={handleClaimPrize}
            onSyncWithGAS={handleSyncWithGAS}
            onFetchFromGAS={handleFetchFromGAS}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-500 print:hidden transition-colors">
        <p className="font-semibold text-slate-600 dark:text-slate-300">
          {eventConfig.title} • 모임 출석 & 티셔츠 분출 관리 시스템
        </p>
        <p className="mt-1">
          QR 스캔 출석부 • 휴대폰 뒷자리 4자리 인증 • 서울/부산 랜덤 추첨 • Google 스프레드시트 & Apps Script DB 연동
        </p>
      </footer>
    </div>
  );
}
