import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Maximize, Minimize, Settings, Sparkles } from 'lucide-react';
import { useLottery } from '../context/LotteryContext';

interface HeaderProps {
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAdmin }) => {
  const { settings, toggleSound, getAvailableNumbers, getAllActiveWinnerNumbers } = useLottery();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  };

  const activeWinnerCount = getAllActiveWinnerNumbers().length;
  const availableCount = getAvailableNumbers().length;

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-amber-200/80 px-4 py-2.5 sm:px-6 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Organization & Festival Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-rose-500 flex items-center justify-center shadow-md border border-amber-200">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                2026 평생교육 어울림 축제
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                수원시장애인종합복지관
              </span>
            </div>
            <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-slate-900 flex items-center gap-2 mt-0.5">
              <span className="text-amber-600 font-display">‘이어가는 마음, 어우러지는 하루’</span>
              <span className="text-slate-700 text-sm sm:text-base font-semibold">경품 추첨기</span>
            </h1>
          </div>
        </div>

        {/* Center: Live Number Pool Status Badge */}
        <div className="hidden md:flex items-center gap-3 bg-amber-50/80 px-4 py-1.5 rounded-full border border-amber-200/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>추첨 번호 범위:</span>
            <strong className="text-amber-900 font-mono font-bold">
              {String(settings.startNumber).padStart(3, '0')} ~ {String(settings.endNumber).padStart(3, '0')}번
            </strong>
          </div>
          <span className="text-amber-300">|</span>
          <div className="text-slate-600 font-medium">
            당첨: <strong className="text-rose-600 font-bold">{activeWinnerCount}</strong> / 잔여:{' '}
            <strong className="text-emerald-700 font-bold">{availableCount}</strong>명
          </div>
        </div>

        {/* Right Controls: Sound, Fullscreen, Admin */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={settings.soundEnabled ? '효과음 켜짐' : '효과음 꺼짐'}
            className={`p-2 rounded-xl transition-all duration-200 border cursor-pointer ${
              settings.soundEnabled
                ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 shadow-xs'
                : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
          >
            {settings.soundEnabled ? <Volume2 className="w-5 h-5 text-amber-700" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            title={isFullscreen ? '전체화면 종료' : '16:9 무대 전체화면'}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          {/* Admin Mode Button */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-white" />
            <span>관리자 모드</span>
          </button>
        </div>
      </div>
    </header>
  );
};
