import React from 'react';
import { Participant } from '../types';
import { maskPhone } from '../services/storage';
import { Users, CheckCircle2, X } from 'lucide-react';

interface DuplicateSelectorModalProps {
  candidates: Participant[];
  isOpen: boolean;
  onSelect: (participant: Participant) => void;
  onClose: () => void;
  titleContext?: string; // e.g. "탑승 확인", "티셔츠 수령", "기념품 수령"
}

export const DuplicateSelectorModal: React.FC<DuplicateSelectorModalProps> = ({
  candidates,
  isOpen,
  onSelect,
  onClose,
  titleContext = '본인 확인',
}) => {
  if (!isOpen || candidates.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">동일 뒷번호 참가자 확인</h3>
              <p className="text-xs text-slate-400">
                뒷자리 [{candidates[0]?.phoneLast4}] 번호가 일치하는 참가자가 {candidates.length}명 있습니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 text-center">
            {titleContext}을(를) 위해 <span className="text-blue-600 dark:text-blue-400 font-bold">본인의 이름을 터치하여 선택</span>해 주세요.
          </p>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {candidates.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => onSelect(person)}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800/80 active:scale-[0.98] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-600 group-hover:text-white text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-lg transition-colors">
                    {person.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {person.name}
                      </span>
                      {person.tshirtSize && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {person.tshirtSize}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {maskPhone(person.phone)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-sm font-semibold">
                  선택
                  <CheckCircle2 className="w-5 h-5 transition-transform group-hover:scale-110" />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium cursor-pointer"
            >
              다시 다른 번호로 입력하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
