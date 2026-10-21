import React, { useState } from 'react';
import { Participant, EventConfig, PartnerShop } from '../types';
import { NumberKeypad } from './NumberKeypad';
import { DuplicateSelectorModal } from './DuplicateSelectorModal';
import { maskPhone } from '../services/storage';
import { Gift, CheckCircle2, AlertCircle, Store, Award, Check, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PrizeShopViewProps {
  participants: Participant[];
  eventConfig: EventConfig;
  initialShopId?: string;
  onClaimPrize: (participantId: string, shopName: string, received: boolean) => Promise<void> | void;
}

export const PrizeShopView: React.FC<PrizeShopViewProps> = ({
  participants,
  eventConfig,
  initialShopId,
  onClaimPrize,
}) => {
  const [selectedShopId, setSelectedShopId] = useState<string>(
    initialShopId || (eventConfig.partnerShops[0]?.id || 'bb5')
  );
  const [digits, setDigits] = useState('');
  const [candidates, setCandidates] = useState<Participant[]>([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [matchedParticipant, setMatchedParticipant] = useState<Participant | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [idVerified, setIdVerified] = useState(false);

  const currentShop: PartnerShop | undefined = eventConfig.partnerShops.find(
    (s) => s.id === selectedShopId
  ) || eventConfig.partnerShops[0];

  // Keep reactive
  const currentParticipant = matchedParticipant
    ? participants.find((p) => p.id === matchedParticipant.id) || matchedParticipant
    : null;

  const handleLookup = (code: string) => {
    setErrorMsg(null);
    setMatchedParticipant(null);
    setIdVerified(false);

    if (code.length !== 4) return;

    // Filter by phone last 4
    const matched = participants.filter((p) => p.phoneLast4 === code);

    if (matched.length === 0) {
      setErrorMsg(`뒷자리 [${code}]에 해당하는 참가자 명단을 찾을 수 없습니다. 휴대폰 번호를 다시 확인해 주세요.`);
      return;
    }

    if (matched.length > 1) {
      setCandidates(matched);
      setIsDuplicateModalOpen(true);
      return;
    }

    checkWinnerStatus(matched[0]);
  };

  const checkWinnerStatus = (person: Participant) => {
    if (!person.isPrizeWinner) {
      setErrorMsg(`[${person.name}] 님은 이벤트 당첨 명단에 등록되어 있지 않습니다. 당첨 안내 문자를 확인해 주세요.`);
      return;
    }
    setMatchedParticipant(person);
  };

  const handleSelectCandidate = (person: Participant) => {
    setIsDuplicateModalOpen(false);
    checkWinnerStatus(person);
  };

  const handleStaffConfirmClaim = async () => {
    if (!currentParticipant) return;
    await onClaimPrize(currentParticipant.id, currentShop?.name || '매장', true);
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  const handleReset = () => {
    setDigits('');
    setCandidates([]);
    setIsDuplicateModalOpen(false);
    setMatchedParticipant(null);
    setErrorMsg(null);
    setIdVerified(false);
  };

  // Shop mismatch check
  const isShopMismatch =
    currentParticipant &&
    currentShop &&
    currentParticipant.prizeShop &&
    !currentParticipant.prizeShop.includes(currentShop.city) &&
    !currentParticipant.prizeShop.includes(currentShop.id);

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-500 text-white shadow-xl shadow-amber-200 dark:shadow-none mb-3">
          <Gift className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          이벤트 당첨 기념품 매장 수령
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          방문하신 제휴 매장에서 휴대폰 뒷자리를 누르고 <span className="text-amber-600 dark:text-amber-400 font-bold">신분증 확인</span> 후 기념품을 수령하세요.
        </p>
      </div>

      {/* Shop Selector Tab */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-sm mb-6 transition-colors">
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 px-3 py-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-amber-500" />
            현재 방문 매장 선택
          </span>
          <span className="text-slate-400 dark:text-slate-500">QR 스캔 시 매장 자동 지정</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {eventConfig.partnerShops.map((shop) => {
            const isSelected = selectedShopId === shop.id;
            return (
              <button
                key={shop.id}
                type="button"
                onClick={() => {
                  setSelectedShopId(shop.id);
                  if (matchedParticipant) handleReset();
                }}
                className={`py-3 px-3 rounded-xl text-left transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-500 dark:bg-amber-600 text-white border-amber-600 shadow-md font-extrabold'
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 font-medium'
                }`}
              >
                <div className="text-sm font-bold flex items-center justify-between">
                  <span>{shop.name}</span>
                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                </div>
                <div
                  className={`text-[11px] truncate mt-0.5 ${
                    isSelected ? 'text-amber-100' : 'text-slate-400 dark:text-slate-400'
                  }`}
                >
                  {shop.city} • {shop.phone}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Card */}
      {currentParticipant ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 animate-in zoom-in-95 duration-200">
          {/* Winner Banner */}
          <div className="text-center mb-5">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 mb-2">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              이벤트 당첨자 인증 완료
            </span>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {currentParticipant.name} 님
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {maskPhone(currentParticipant.phone)}
            </p>
          </div>

          {/* Prize Item Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/50 dark:from-slate-800 dark:via-amber-950/30 dark:to-slate-800 border-2 border-amber-200 dark:border-amber-800/80 text-center relative overflow-hidden mb-5">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
              축하합니다! 당첨 품목
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 mb-1">
              🎁 {currentParticipant.prizeItem || '모임 한정 스페셜 기념품'}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 dark:bg-slate-700/80 border border-amber-300 dark:border-amber-700 text-xs font-bold text-amber-900 dark:text-amber-300 mt-2">
              <Store className="w-3.5 h-3.5 text-amber-600" />
              수령 지정처: {currentParticipant.prizeShop || '지정 매장'}
            </div>
          </div>

          {/* Warning if shop mismatch */}
          {isShopMismatch && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs sm:text-sm flex items-start gap-2.5 mb-5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">수령 매장 안내 확인</p>
                <p className="mt-0.5 opacity-90">
                  당첨자님의 사전 지정 수령처는 <strong>[{currentParticipant.prizeShop}]</strong>입니다.
                  현재 매장(<strong>{currentShop?.name}</strong>)에서 수령 가능 여부를 직원에게 확인해 주세요.
                </p>
              </div>
            </div>
          )}

          {/* Status Display */}
          <div
            className={`p-5 rounded-2xl border-2 mb-6 ${
              currentParticipant.isPrizeReceived
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {currentParticipant.isPrizeReceived ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-base">
                    {currentParticipant.isPrizeReceived ? '기념품 수령 완료' : '신분증 확인 대기중'}
                  </h4>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      currentParticipant.isPrizeReceived
                        ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
                        : 'bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200'
                    }`}
                  >
                    {currentParticipant.isPrizeReceived ? '지급완료' : '수령대기'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm mt-1 leading-relaxed opacity-90">
                  {currentParticipant.isPrizeReceived
                    ? `수령 완료 일시: ${currentParticipant.prizeReceivedAt || '방금'}`
                    : '매장 직원에게 신분증(주민등록증·운전면허증 등)을 제시해 주시면 본인 대조 후 상품이 전달됩니다.'}
                </p>
              </div>
            </div>
          </div>

          {/* Staff Verification & Claim Button */}
          {!currentParticipant.isPrizeReceived ? (
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors">
                <input
                  type="checkbox"
                  checked={idVerified}
                  onChange={(e) => setIdVerified(e.target.checked)}
                  className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  [매장 직원 확인] 당첨자 신분증의 성명({currentParticipant.name})을 확인하였습니다.
                </span>
              </label>

              <button
                type="button"
                disabled={!idVerified}
                onClick={handleStaffConfirmClaim}
                className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-base shadow-xl shadow-amber-200 dark:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5" />
                기념품 지급 완료 처리 ({currentShop?.name})
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 py-2">
                🎉 본 기념품은 이미 매장에서 정상 지급 완료되었습니다.
              </div>
              <button
                type="button"
                onClick={() => onClaimPrize(currentParticipant.id, currentShop?.name || '', false)}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 font-semibold text-center transition-colors cursor-pointer"
              >
                (매장 관리자 전용) 잘못 지급 처리되었나요? 지급 취소하기
              </button>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              다른 당첨자 조회하기
            </button>
          </div>
        </div>
      ) : (
        /* Keypad input */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 transition-colors">
          <NumberKeypad
            value={digits}
            onChange={(val) => {
              setDigits(val);
              setErrorMsg(null);
            }}
            onSubmit={handleLookup}
          />

          {errorMsg && (
            <div className="mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1">
                <p className="font-semibold">{errorMsg}</p>
                <button
                  type="button"
                  onClick={() => setDigits('')}
                  className="mt-2 text-xs font-bold underline hover:text-red-900 cursor-pointer"
                >
                  다시 입력하기
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4">
            <p>💡 당첨자 명단에 등록된 경우에만 조회됩니다.</p>
            <p className="mt-1">수령 시 본인 신분증을 반드시 지참해 주세요.</p>
          </div>
        </div>
      )}

      {/* Duplicate selector */}
      <DuplicateSelectorModal
        isOpen={isDuplicateModalOpen}
        candidates={candidates}
        onSelect={handleSelectCandidate}
        onClose={() => setIsDuplicateModalOpen(false)}
        titleContext="기념품 당첨자 확인"
      />
    </div>
  );
};
