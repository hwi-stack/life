import React from 'react';
import { Gift, Wind, Flame, CheckCircle2 } from 'lucide-react';
import { useLottery } from '../context/LotteryContext';
import { PrizeId } from '../types';

export const PrizeNavigation: React.FC = () => {
  const { prizes, selectedPrizeId, setSelectedPrizeId, slots, isDrawing } = useLottery();

  const getPrizeIcon = (id: PrizeId) => {
    switch (id) {
      case 'general':
        return <Gift className="w-5 h-5 text-amber-600" />;
      case 'hairdryer':
        return <Wind className="w-5 h-5 text-sky-600" />;
      case 'ricecooker':
        return <Flame className="w-5 h-5 text-rose-600" />;
    }
  };

  return (
    <div className="w-full flex justify-center py-2 px-4 z-20">
      <div className="flex items-center gap-2 sm:gap-3 bg-white p-1.5 rounded-2xl border-2 border-amber-200 shadow-md">
        {prizes.map((prize) => {
          const isSelected = selectedPrizeId === prize.id;
          const prizeSlots = slots[prize.id] || [];
          const drawnCount = prizeSlots.filter((s) => s.number !== null && s.status !== 'absent').length;
          const isCompleted = drawnCount === prize.count;

          return (
            <button
              key={prize.id}
              disabled={isDrawing}
              onClick={() => setSelectedPrizeId(prize.id)}
              className={`relative flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium transition-all duration-300 text-sm sm:text-base ${
                isSelected
                  ? 'bg-amber-100/90 text-slate-900 border-2 border-amber-500 shadow-md scale-105'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              } ${isDrawing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
            >
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                {getPrizeIcon(prize.id)}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className={`font-black ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                    {prize.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white text-amber-800 border border-amber-300 font-bold">
                    {prize.count}명
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                  {isCompleted ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 완료 ({drawnCount}/{prize.count})
                    </span>
                  ) : drawnCount > 0 ? (
                    <span className="text-amber-700 font-bold">진행 중 ({drawnCount}/{prize.count})</span>
                  ) : (
                    <span>추첨 대기</span>
                  )}
                </div>
              </div>

              {isSelected && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-amber-500 shadow-xs"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
