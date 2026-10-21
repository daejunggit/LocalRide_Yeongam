import React, { useState, useEffect } from 'react';
import { Participant, EventConfig } from '../types';
import { maskPhone } from '../services/storage';
import {
  Sparkles,
  Trophy,
  Dices,
  RotateCcw,
  Check,
  Users,
  Store,
  CheckCircle2,
  AlertCircle,
  Copy,
  Shuffle,
  ShieldCheck,
  Gift,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LotteryViewProps {
  participants: Participant[];
  eventConfig: EventConfig;
  onRegisterWinners: (
    winnerIds: string[],
    prizeItem: string,
    prizeShop: string
  ) => void;
}

export const LotteryView: React.FC<LotteryViewProps> = ({
  participants,
  eventConfig,
  onRegisterWinners,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<'서울' | '부산' | '전체'>('서울');
  const [winnerCount, setWinnerCount] = useState<number>(3);
  const [prizeTitle, setPrizeTitle] = useState<string>('모임 스페셜 한정판 기념품');
  const [onlyAttended, setOnlyAttended] = useState<boolean>(true);
  const [excludePreviousWinners, setExcludePreviousWinners] = useState<boolean>(true);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [shufflingNames, setShufflingNames] = useState<string[]>([]);
  const [winners, setWinners] = useState<Participant[]>([]);
  const [savedToDb, setSavedToDb] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Eligible pool calculation
  const getEligiblePool = () => {
    return participants.filter((p) => {
      // Region filter
      if (selectedRegion !== '전체') {
        const matchesRegion =
          p.region === selectedRegion ||
          (selectedRegion === '서울' && p.prizeShop?.includes('bb5')) ||
          (selectedRegion === '부산' && p.prizeShop?.includes('occ'));
        if (!matchesRegion) return false;
      }

      // Attended filter
      if (onlyAttended && !p.isAttended) return false;

      // Exclude previous winners
      if (excludePreviousWinners && p.isPrizeWinner) return false;

      return true;
    });
  };

  const eligiblePool = getEligiblePool();

  // Ensure winner count doesn't exceed pool size
  useEffect(() => {
    if (winnerCount > eligiblePool.length && eligiblePool.length > 0) {
      setWinnerCount(eligiblePool.length);
    } else if (eligiblePool.length === 0) {
      setWinnerCount(0);
    } else if (winnerCount === 0 && eligiblePool.length > 0) {
      setWinnerCount(1);
    }
  }, [eligiblePool.length, selectedRegion, onlyAttended, excludePreviousWinners]);

  // Shuffling animation during draw
  const handleStartDraw = () => {
    if (eligiblePool.length === 0) {
      alert('추첨 가능한 대상자가 없습니다. 필터 조건을 확인해 주세요.');
      return;
    }
    if (winnerCount <= 0) {
      alert('당첨자 수를 1명 이상 입력해 주세요.');
      return;
    }

    setIsDrawing(true);
    setWinners([]);
    setSavedToDb(false);

    // Shuffle name reel effect
    const sampleNames = eligiblePool.map((p) => p.name);
    let counter = 0;
    const interval = setInterval(() => {
      const shuffled = [...sampleNames].sort(() => 0.5 - Math.random()).slice(0, 5);
      setShufflingNames(shuffled);
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        finalizeDraw();
      }
    }, 90);
  };

  const finalizeDraw = () => {
    // Pick randomly without replacement
    const poolCopy = [...eligiblePool];
    const picked: Participant[] = [];
    const countToPick = Math.min(winnerCount, poolCopy.length);

    for (let i = 0; i < countToPick; i++) {
      const randomIndex = Math.floor(Math.random() * poolCopy.length);
      picked.push(poolCopy[randomIndex]);
      poolCopy.splice(randomIndex, 1);
    }

    setWinners(picked);
    setIsDrawing(false);

    // Trigger grand fireworks
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 250);
    } catch (e) {
      // ignore
    }
  };

  // Re-draw single winner if absent
  const handleRedrawSingle = (targetId: string) => {
    const currentWinnerIds = winners.map((w) => w.id);
    const availablePool = eligiblePool.filter((p) => !currentWinnerIds.includes(p.id));

    if (availablePool.length === 0) {
      alert('추가로 교체 추첨할 수 있는 후보 참가자가 없습니다.');
      return;
    }

    const newPick = availablePool[Math.floor(Math.random() * availablePool.length)];
    setWinners((prev) => prev.map((w) => (w.id === targetId ? newPick : w)));
    setSavedToDb(false);
  };

  // Register winners into main Database
  const handleApplyToDatabase = () => {
    if (winners.length === 0) return;
    const designatedShop =
      selectedRegion === '부산' ? '부산 occ' : '서울 bb5';
    onRegisterWinners(
      winners.map((w) => w.id),
      prizeTitle || '이벤트 당첨 기념품',
      designatedShop
    );
    setSavedToDb(true);
  };

  // Copy winners list to clipboard
  const handleCopyWinners = () => {
    const text = winners
      .map(
        (w, i) =>
          `[${i + 1}등] ${w.name} (${maskPhone(w.phone)}) - ${w.region || selectedRegion} / ${prizeTitle}`
      )
      .join('\n');
    navigator.clipboard.writeText(
      `🎉 [${selectedRegion} 지역 럭키드로우 당첨자 명단]\n경품: ${prizeTitle}\n\n${text}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-xl shadow-amber-200 dark:shadow-none mb-3">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          🎉 참가자 랜덤 추첨 (럭키 드로우)
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 max-w-lg mx-auto">
          서울과 부산 지역별로 원하는 당첨자 수를 지정하여 공정하고 재미있게 현장 당첨자를 뽑아보세요!
        </p>
      </div>

      {/* Control Setup Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 mb-8 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Region & Filters */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                1. 추첨 대상 지역 선택
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '서울', label: '서울 (bb5)', sub: '수령지 서울' },
                  { id: '부산', label: '부산 (occ)', sub: '수령지 부산' },
                  { id: '전체', label: '전체 지역', sub: '통합 추첨' },
                ].map((item) => {
                  const isSelected = selectedRegion === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedRegion(item.id as any);
                        setWinners([]);
                        setSavedToDb(false);
                      }}
                      className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 dark:bg-amber-600 text-white border-amber-600 shadow-md font-black scale-105'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 font-bold'
                      }`}
                    >
                      <div className="text-sm">{item.label}</div>
                      <div
                        className={`text-[11px] font-normal mt-0.5 ${
                          isSelected ? 'text-amber-100' : 'text-slate-400'
                        }`}
                      >
                        {item.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                후보자 필터 옵션
              </span>
              <label className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAttended}
                  onChange={(e) => setOnlyAttended(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <span>🚌 현장 탑승 & 출석 완료자만 추첨 대상에 포함</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludePreviousWinners}
                  onChange={(e) => setExcludePreviousWinners(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <span>🎁 기존 이벤트 당첨자는 중복 당첨에서 제외</span>
              </label>
            </div>

            {/* Eligible Count Badge */}
            <div className="flex items-center justify-between text-xs px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-900">
              <span className="font-bold">현재 추첨 대상 후보 인원:</span>
              <span className="font-black text-sm">총 {eligiblePool.length}명</span>
            </div>
          </div>

          {/* Right Column: Winners count & Prize name */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                2. 당첨자 수 설정
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={Math.max(eligiblePool.length, 1)}
                  value={winnerCount}
                  onChange={(e) =>
                    setWinnerCount(
                      Math.max(1, Math.min(eligiblePool.length, Number(e.target.value) || 1))
                    )
                  }
                  className="flex-1 px-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xl font-black text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex items-center gap-1">
                  {[1, 3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setWinnerCount(Math.min(num, eligiblePool.length || 1))}
                      className="px-2.5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition-colors"
                    >
                      {num}명
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                최대 {eligiblePool.length}명까지 지정 가능합니다.
              </p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                3. 당첨 경품 / 상품명
              </label>
              <input
                type="text"
                value={prizeTitle}
                placeholder="예: 브롬톤 프론트 백, 프리미엄 헬멧 등"
                onChange={(e) => setPrizeTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                당첨자 등록 시 해당 명칭으로 기념품 수령 QR 화면에 노출됩니다.
              </p>
            </div>

            {/* Launch Draw Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isDrawing || eligiblePool.length === 0}
                onClick={handleStartDraw}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base shadow-xl shadow-amber-300 dark:shadow-none active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDrawing ? (
                  <>
                    <Dices className="w-6 h-6 animate-spin" />
                    두구두구... 추첨 진행 중!
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    {selectedRegion} 지역 당첨자 {winnerCount}명 랜덤 추첨 시작!
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drawing Animation Reel */}
      {isDrawing && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-8 mb-8 text-center shadow-2xl animate-pulse">
          <span className="text-amber-400 font-bold text-xs uppercase tracking-widest block mb-2">
            행운의 주인공을 찾는 중입니다...
          </span>
          <div className="text-3xl sm:text-4xl font-black text-white h-12 flex items-center justify-center">
            {shufflingNames[0] || '추첨 중...'}
          </div>
          <div className="flex justify-center gap-2 mt-4 opacity-60 text-xs">
            {shufflingNames.slice(1).map((name, i) => (
              <span key={i} className="px-2 py-1 bg-white/10 rounded-lg">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Result Section: Drawn Winners */}
      {winners.length > 0 && !isDrawing && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-300 dark:border-amber-700 shadow-2xl overflow-hidden p-6 sm:p-8 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 mb-2">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                추첨 완료: 총 {winners.length}명 당첨
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                축하합니다! {selectedRegion} 지역 당첨자 명단
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                경품: <strong className="text-amber-600 dark:text-amber-400">{prizeTitle}</strong> (지정 수령 매장: {selectedRegion === '부산' ? '부산 occ' : '서울 bb5'})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyWinners}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '명단 복사됨!' : '명단 텍스트 복사'}
              </button>
              <button
                type="button"
                onClick={handleStartDraw}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                다시 추첨
              </button>
            </div>
          </div>

          {/* Winner Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mb-6">
            {winners.map((winner, idx) => (
              <div
                key={winner.id}
                className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-orange-50/40 dark:from-slate-800/90 dark:to-slate-800/40 border-2 border-amber-200 dark:border-amber-800/80 relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-full bg-amber-500 text-white font-black text-xs inline-flex items-center justify-center shadow-sm">
                      {idx + 1}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                      사이즈 {winner.tshirtSize}
                    </span>
                  </div>

                  <div className="font-black text-lg text-slate-900 dark:text-white">
                    {winner.name} 님
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {maskPhone(winner.phone)} (뒷자리 {winner.phoneLast4})
                  </div>
                  <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-2 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" />
                    수령처: {selectedRegion === '부산' ? '부산 occ' : '서울 bb5'}
                  </div>
                </div>

                {/* Individual re-draw button */}
                <div className="mt-3 pt-2 border-t border-amber-200/60 dark:border-slate-700 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRedrawSingle(winner.id)}
                    className="text-[11px] font-bold text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                    title="해당 참가자가 부재 중일 때 1명만 다시 뽑기"
                  >
                    <Shuffle className="w-3 h-3" />
                    불참시 재추첨
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Database Sync CTA */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-500" />
                이 당첨자들을 매장 수령 DB에 즉시 등록할까요?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                등록 시 당첨자들이 매장(서울 bb5 / 부산 occ)에 방문하여 본인 휴대폰 뒷자리 4자리로 기념품을 바로 수령할 수 있습니다.
              </p>
            </div>

            <button
              type="button"
              disabled={savedToDb}
              onClick={handleApplyToDatabase}
              className={`px-5 py-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                savedToDb
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 dark:shadow-none'
              }`}
            >
              {savedToDb ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  당첨자 DB 등록 완료!
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  당첨자 명단 DB에 등록하기
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
