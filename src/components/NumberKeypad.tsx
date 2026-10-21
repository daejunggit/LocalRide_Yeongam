import React from 'react';
import { Delete, RotateCcw } from 'lucide-react';

interface NumberKeypadProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit?: (val: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

export const NumberKeypad: React.FC<NumberKeypadProps> = ({
  value,
  onChange,
  onSubmit,
  maxLength = 4,
  disabled = false,
}) => {
  const handleDigit = (digit: string) => {
    if (disabled || value.length >= maxLength) return;
    const next = value + digit;
    onChange(next);
    if (next.length === maxLength && onSubmit) {
      onSubmit(next);
    }
  };

  const handleDelete = () => {
    if (disabled || value.length === 0) return;
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    onChange('');
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* 4-digit display boxes */}
      <div className="flex justify-center items-center gap-3 mb-6">
        {Array.from({ length: maxLength }).map((_, i) => {
          const char = value[i];
          const isCurrent = i === value.length && !disabled;
          return (
            <div
              key={i}
              className={`w-14 h-16 sm:w-16 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-extrabold tracking-wider transition-all duration-200 border-2 select-none shadow-sm ${
                char
                  ? 'bg-blue-600 text-white border-blue-600 scale-105 shadow-blue-200 dark:shadow-none'
                  : isCurrent
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/40 animate-pulse'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700'
              }`}
            >
              {char || '•'}
            </div>
          );
        })}
      </div>

      {/* Touch Numeric Keypad */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={disabled || value.length >= maxLength}
            onClick={() => handleDigit(digit)}
            className="h-14 sm:h-16 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-white text-2xl font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={handleClear}
          className="h-14 sm:h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          title="전체 지우기"
        >
          <RotateCcw className="w-4 h-4" />
          초기화
        </button>
        <button
          type="button"
          disabled={disabled || value.length >= maxLength}
          onClick={() => handleDigit('0')}
          className="h-14 sm:h-16 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-white text-2xl font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={handleDelete}
          className="h-14 sm:h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          title="한 글자 지우기"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
