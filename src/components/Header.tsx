import React from 'react';
import { EventConfig, GoogleSheetsConfig, AppMode, ThemeMode } from '../types';
import { Bus, Shirt, Gift, Shield, CloudCheck, Calendar, MapPin, Sparkles, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  eventConfig: EventConfig;
  sheetsConfig: GoogleSheetsConfig;
  activeMode: AppMode;
  theme: ThemeMode;
  onSelectMode: (mode: AppMode) => void;
  onToggleTheme: () => void;
  onOpenSyncSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  eventConfig,
  sheetsConfig,
  activeMode,
  theme,
  onSelectMode,
  onToggleTheme,
  onOpenSyncSettings,
}) => {
  const navItems: { mode: AppMode; label: string; icon: React.ReactNode; badge?: string }[] = [
    { mode: 'checkin', label: '탑승·출석 체크', icon: <Bus className="w-4 h-4" /> },
    { mode: 'tshirt', label: '티셔츠 분출처', icon: <Shirt className="w-4 h-4" /> },
    { mode: 'prize', label: '매장 기념품 수령', icon: <Gift className="w-4 h-4" /> },
    { mode: 'lottery', label: '랜덤 추첨 이벤트', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
    { mode: 'admin', label: '운영진 관리자', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-lg border-b border-slate-800">
      {/* Top Banner with Event Info & Theme Switcher */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-xl shadow-md text-white select-none">
            QR
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white line-clamp-1">
                {eventConfig.title}
              </h1>
              {sheetsConfig.webAppUrl ? (
                <button
                  type="button"
                  onClick={onOpenSyncSettings}
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                  title="구글 스프레드시트와 실시간 연동 중"
                >
                  <CloudCheck className="w-3 h-3" />
                  스프레드시트 연동됨
                </button>
              ) : (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  로컬 DB 가동중
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                {eventConfig.date}
              </span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="flex items-center gap-1 line-clamp-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {eventConfig.location}
              </span>
            </div>
          </div>
        </div>

        {/* Right controls: Theme Switcher & Status */}
        <div className="flex items-center justify-between md:justify-end gap-3 text-xs">
          {sheetsConfig.webAppUrl && (
            <span className="text-slate-400 text-[11px] hidden lg:inline">
              최근 동기화: {sheetsConfig.lastSyncedAt ? new Date(sheetsConfig.lastSyncedAt).toLocaleTimeString('ko-KR') : '대기중'}
            </span>
          )}

          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-xs"
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-200">라이트 모드</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-300" />
                <span className="text-xs font-bold text-slate-300">다크 모드</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-slate-950/80 backdrop-blur border-t border-slate-800/80 px-2 sm:px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between overflow-x-auto py-1 scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const isActive = activeMode === item.mode;
              return (
                <button
                  key={item.mode}
                  type="button"
                  onClick={() => onSelectMode(item.mode)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? item.mode === 'lottery'
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-900/50 scale-[1.02]'
                        : 'bg-blue-600 text-white shadow-md shadow-blue-900/50 scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            실시간 QR 상태 감지 중
          </div>
        </div>
      </div>
    </header>
  );
};
