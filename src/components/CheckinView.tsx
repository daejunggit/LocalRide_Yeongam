import React, { useState } from 'react';
import { Participant, EventConfig } from '../types';
import { NumberKeypad } from './NumberKeypad';
import { DuplicateSelectorModal } from './DuplicateSelectorModal';
import { Bus, CheckCircle2, AlertCircle, Clock, Shirt, ArrowRight, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckinViewProps {
  participants: Participant[];
  eventConfig: EventConfig;
  onCheckin: (participantId: string) => Promise<void> | void;
}

export const CheckinView: React.FC<CheckinViewProps> = ({
  participants,
  eventConfig,
  onCheckin,
}) => {
  const [digits, setDigits] = useState('');
  const [candidates, setCandidates] = useState<Participant[]>([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [matchedParticipant, setMatchedParticipant] = useState<Participant | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const handleLookup = (code: string) => {
    setErrorMsg(null);
    setMatchedParticipant(null);
    setJustCheckedIn(false);

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

    // Exact single match
    executeCheckin(matched[0]);
  };

  const handleSelectCandidate = (person: Participant) => {
    setIsDuplicateModalOpen(false);
    executeCheckin(person);
  };

  const executeCheckin = (person: Participant) => {
    setMatchedParticipant(person);
    if (!person.isAttended) {
      onCheckin(person.id);
      setJustCheckedIn(true);
      // Trigger festive celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore if not supported
      }
    }
  };

  const handleReset = () => {
    setDigits('');
    setCandidates([]);
    setIsDuplicateModalOpen(false);
    setMatchedParticipant(null);
    setErrorMsg(null);
    setJustCheckedIn(false);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">
      {/* View Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-200 dark:shadow-none mb-3">
          <Bus className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          모임 탑승 & 출석 체크
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          본인 휴대폰 번호 <span className="text-blue-600 dark:text-blue-400 font-bold">뒷자리 4개</span>를 입력하시면 즉시 출석 및 탑승 확인됩니다.
        </p>
      </div>

      {/* Result Card: If a participant is matched */}
      {matchedParticipant ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 animate-in zoom-in-95 duration-200">
          {justCheckedIn || !matchedParticipant.isAttended ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mb-4 animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 mb-2">
                탑승 확인 완료!
              </span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                {matchedParticipant.name} 님
              </h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium text-sm mt-1">
                환영합니다! 버스 탑승 및 출석 확인이 완료되었습니다. 🎉
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 mt-6 border border-slate-100 dark:border-slate-700/80 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" /> 출석 일시
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {matchedParticipant.attendedAt || new Date().toLocaleTimeString('ko-KR')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Shirt className="w-4 h-4 text-indigo-500" /> 신청 티셔츠
                  </span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg">
                    {matchedParticipant.tshirtSize} 사이즈
                  </span>
                </div>
                {matchedParticipant.notes && (
                  <div className="flex items-center justify-between text-xs sm:text-sm pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400">좌석/메모</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{matchedParticipant.notes}</span>
                  </div>
                )}
              </div>

              {/* T-shirt receipt alert */}
              <div className={`mt-4 p-3.5 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 text-left ${
                matchedParticipant.isTshirtDistributed
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
              }`}>
                <Shirt className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-bold block">
                    {matchedParticipant.isTshirtDistributed
                      ? '티셔츠 수령 완료됨'
                      : '티셔츠 미수령 상태입니다!'}
                  </span>
                  <span className="text-xs opacity-90">
                    {matchedParticipant.isTshirtDistributed
                      ? '기념 티셔츠가 이미 지급되었습니다.'
                      : '티셔츠 분출처에서 신청하신 사이즈를 수령해 가세요.'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="mt-6 w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                다음 참가자 확인하기
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            /* Already attended case */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mb-3">
                <Clock className="w-8 h-8" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 mb-2">
                이미 탑승 확인됨
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {matchedParticipant.name} 님
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                이미 출석 및 탑승 처리가 완료된 참가자입니다.
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 my-5 border border-slate-100 dark:border-slate-700 text-left text-xs sm:text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">기존 탑승 확인 시간</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{matchedParticipant.attendedAt || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">신청 티셔츠 사이즈</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{matchedParticipant.tshirtSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">티셔츠 수령 여부</span>
                  <span className={`font-bold ${matchedParticipant.isTshirtDistributed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {matchedParticipant.isTshirtDistributed ? '수령 완료' : '미수령 (분출소 방문 필요)'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                다른 번호 조회하기
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Keypad input mode */
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
                  번호 지우고 다시 입력
                </button>
              </div>
            </div>
          )}

          {/* Helper hint */}
          <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4">
            <p>💡 같은 뒷자리가 있는 경우 이름 선택창이 표시됩니다.</p>
            <p className="mt-1">등록 문의: 현장 운영진에게 말씀해 주세요.</p>
          </div>
        </div>
      )}

      {/* Duplicate selector modal */}
      <DuplicateSelectorModal
        isOpen={isDuplicateModalOpen}
        candidates={candidates}
        onSelect={handleSelectCandidate}
        onClose={() => setIsDuplicateModalOpen(false)}
        titleContext="탑승 출석 체크"
      />
    </div>
  );
};
