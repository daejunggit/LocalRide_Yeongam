import React, { useState } from 'react';
import { Participant, EventConfig } from '../types';
import { NumberKeypad } from './NumberKeypad';
import { DuplicateSelectorModal } from './DuplicateSelectorModal';
import { maskPhone } from '../services/storage';
import { Shirt, CheckCircle2, AlertCircle, Clock, Check, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TShirtDispenseViewProps {
  participants: Participant[];
  eventConfig: EventConfig;
  onDispenseTshirt: (participantId: string, distributed: boolean) => Promise<void> | void;
}

export const TShirtDispenseView: React.FC<TShirtDispenseViewProps> = ({
  participants,
  eventConfig,
  onDispenseTshirt,
}) => {
  const [digits, setDigits] = useState('');
  const [candidates, setCandidates] = useState<Participant[]>([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [matchedParticipant, setMatchedParticipant] = useState<Participant | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Keep matchedParticipant reactive to participants array changes
  const currentParticipant = matchedParticipant
    ? participants.find((p) => p.id === matchedParticipant.id) || matchedParticipant
    : null;

  const handleLookup = (code: string) => {
    setErrorMsg(null);
    setMatchedParticipant(null);

    if (code.length !== 4) return;

    const matched = participants.filter((p) => p.phoneLast4 === code);

    if (matched.length === 0) {
      setErrorMsg(`뒷자리 [${code}]에 해당하는 참가자 명단을 찾을 수 없습니다. 운영진에게 문의해 주세요.`);
      return;
    }

    if (matched.length > 1) {
      setCandidates(matched);
      setIsDuplicateModalOpen(true);
      return;
    }

    setMatchedParticipant(matched[0]);
  };

  const handleSelectCandidate = (person: Participant) => {
    setIsDuplicateModalOpen(false);
    setMatchedParticipant(person);
  };

  const handleStaffDispense = async (person: Participant) => {
    await onDispenseTshirt(person.id, true);
    try {
      confetti({
        particleCount: 50,
        spread: 50,
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
  };

  // Helper for size badge styling
  const getSizeBadgeClass = (size: string) => {
    switch (size.toUpperCase()) {
      case 'S':
        return 'bg-emerald-500 text-white';
      case 'M':
        return 'bg-sky-500 text-white';
      case 'L':
        return 'bg-indigo-600 text-white';
      case 'XL':
        return 'bg-violet-600 text-white';
      case '2XL':
        return 'bg-amber-600 text-white';
      default:
        return 'bg-slate-700 text-white';
    }
  };

  // Size summary stats
  const sizeCounts: { [key: string]: { total: number; done: number } } = {};
  ['S', 'M', 'L', 'XL', '2XL'].forEach((s) => {
    const total = participants.filter((p) => p.tshirtSize.toUpperCase() === s).length;
    const done = participants.filter((p) => p.tshirtSize.toUpperCase() === s && p.isTshirtDistributed).length;
    sizeCounts[s] = { total, done };
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none mb-3">
          <Shirt className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          티셔츠 분출소 & 사이즈 확인
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          휴대폰 뒷자리 4자리를 입력하면 <span className="text-indigo-600 dark:text-indigo-400 font-bold">신청 사이즈 및 수령 여부</span>가 표시됩니다.
        </p>
      </div>

      {/* Mini Size Inventory Strip */}
      <div className="bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl p-3 mb-6 border border-slate-200 dark:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 px-1">
          <span>사이즈별 분출 현황 (수령 / 총수량)</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
            전체 {participants.filter((p) => p.isTshirtDistributed).length} / {participants.length}벌 분출 완료
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 text-center">
          {Object.entries(sizeCounts).map(([sz, stat]) => (
            <div key={sz} className="bg-white dark:bg-slate-900 rounded-xl p-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">{sz}</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {stat.done} <span className="text-slate-400 font-normal">/ {stat.total}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Result Card: Matched Participant */}
      {currentParticipant ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 animate-in zoom-in-95 duration-200">
          {/* Participant Info Banner */}
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-2">
              참가자 본인 확인
            </span>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {currentParticipant.name} 님
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {maskPhone(currentParticipant.phone)}
            </p>
          </div>

          {/* Huge T-Shirt Size Display */}
          <div className="my-6 p-6 rounded-3xl bg-gradient-to-b from-slate-50 to-indigo-50/50 dark:from-slate-800 dark:to-indigo-950/40 border-2 border-indigo-100 dark:border-indigo-900/60 text-center relative overflow-hidden">
            <div className="absolute top-2 right-3 text-indigo-200 dark:text-indigo-800/40">
              <Shirt className="w-20 h-20 opacity-30 -rotate-12" />
            </div>

            <span className="text-xs font-bold tracking-wider text-indigo-700 dark:text-indigo-300 uppercase">
              신청하신 티셔츠 사이즈
            </span>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span
                className={`text-5xl sm:text-6xl font-black px-6 py-2 rounded-2xl shadow-lg tracking-tight ${getSizeBadgeClass(
                  currentParticipant.tshirtSize
                )}`}
              >
                {currentParticipant.tshirtSize}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              주최측에 사전 신청된 사이즈입니다. 교환은 잔여 수량에 한해 가능합니다.
            </p>
          </div>

          {/* Receipt Status */}
          <div
            className={`p-5 rounded-2xl border-2 mb-6 ${
              currentParticipant.isTshirtDistributed
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {currentParticipant.isTshirtDistributed ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-base">
                    {currentParticipant.isTshirtDistributed ? '티셔츠 수령 완료' : '티셔츠 미수령'}
                  </h4>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      currentParticipant.isTshirtDistributed
                        ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
                        : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    {currentParticipant.isTshirtDistributed ? '지급완료' : '지급대기'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm mt-1 leading-relaxed opacity-90">
                  {currentParticipant.isTshirtDistributed
                    ? `수령 완료 시간: ${currentParticipant.tshirtDistributedAt || '방금'}`
                    : '이 화면을 분출처 운영진에게 보여주시면 해당 사이즈 티셔츠를 지급해 드립니다.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Button: Staff Dispense or Toggle */}
          {!currentParticipant.isTshirtDistributed ? (
            <button
              type="button"
              onClick={() => handleStaffDispense(currentParticipant)}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-extrabold text-base shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              [운영진 확인] 사이즈 {currentParticipant.tshirtSize} 분출 완료 처리
            </button>
          ) : (
            <div className="space-y-2">
              <div className="text-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5 py-1">
                <Sparkles className="w-4 h-4" />
                정상적으로 분출 처리가 완료되었습니다. 즐거운 라이딩 되세요!
              </div>
              <button
                type="button"
                onClick={() => onDispenseTshirt(currentParticipant.id, false)}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 font-semibold text-center transition-colors cursor-pointer"
              >
                (운영진 전용) 잘못 체크되었나요? 분출 취소하기
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
              다른 참가자 조회하기
            </button>
          </div>
        </div>
      ) : (
        /* Keypad Mode */
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
                  번호 다시 입력
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4">
            <p>💡 같은 뒷번호 참가자가 여러 명인 경우 본인 이름 선택 팝업이 뜹니다.</p>
          </div>
        </div>
      )}

      {/* Duplicate selector modal */}
      <DuplicateSelectorModal
        isOpen={isDuplicateModalOpen}
        candidates={candidates}
        onSelect={handleSelectCandidate}
        onClose={() => setIsDuplicateModalOpen(false)}
        titleContext="티셔츠 수령 확인"
      />
    </div>
  );
};
