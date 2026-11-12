import React, { useState, useEffect } from 'react';
import { useLottery } from '../context/LotteryContext';
import { SlotNumberCard } from './SlotNumberCard';
import { Sparkles, RotateCw, Wind, Flame, Gift, CheckCircle2, CheckSquare, X, AlertTriangle, PartyPopper } from 'lucide-react';
import { fireCelebrationFireworks } from '../utils/confetti';
import { soundManager } from '../utils/sound';

export const LotteryStage: React.FC = () => {
  const {
    prizes,
    selectedPrizeId,
    slots,
    isDrawing,
    activeRedrawingSlots,
    selectedSlotIndices,
    toggleSlotSelection,
    clearSlotSelection,
    activeRevealedDigitStep,
    startFullDraw,
    redrawSingleSlot,
    redrawMultipleSlots,
    resetPrize,
    formatNumber,
    getAvailableNumbers
  } = useLottery();

  const currentPrize = prizes.find((p) => p.id === selectedPrizeId) || prizes[0];
  const currentSlots = slots[selectedPrizeId] || [];
  const drawnCount = currentSlots.filter((s) => s.number !== null).length;
  const isCompleted = drawnCount === currentPrize.count;
  const availablePool = getAvailableNumbers();

  // In-app confirmation dialog state (replaces window.confirm which gets blocked in iframes!)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Single prize rolling digits for positions 0, 1, 2
  const [singleRandomDigits, setSingleRandomDigits] = useState<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    if (isDrawing && currentPrize.count === 1) {
      const interval = setInterval(() => {
        setSingleRandomDigits([
          Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 10)
        ]);
      }, 70);
      return () => clearInterval(interval);
    }
  }, [isDrawing, currentPrize.count]);

  const targetFormatted = formatNumber(currentSlots[0]?.number);
  const targetDigits = [targetFormatted[0] || '0', targetFormatted[1] || '0', targetFormatted[2] || '0'];

  const getSingleDigitDisplay = (index: number) => {
    if (!currentSlots[0] || (currentSlots[0].status === 'empty' && currentSlots[0].number === null)) {
      return '-';
    }
    if (currentSlots[0].status === 'revealed') {
      return targetDigits[index];
    }
    if (currentSlots[0].revealedDigits > index) {
      return targetDigits[index];
    }
    return String(singleRandomDigits[index]);
  };

  const isSingleDigitLocked = (index: number) => {
    if (!currentSlots[0]) return false;
    return currentSlots[0].status === 'revealed' || currentSlots[0].revealedDigits > index;
  };

  const getSuspenseBannerText = () => {
    if (!isDrawing) return null;
    if (activeRevealedDigitStep === 0) {
      return activeRedrawingSlots.length > 0
        ? `선택된 ${activeRedrawingSlots.length}개 번호가 동시에 회전하고 있습니다...`
        : '동시에 힘차게 추첨 번호가 돌아가고 있습니다...';
    }
    if (activeRevealedDigitStep === 1) {
      return '첫 번째 번호 공개! (2초 후 두 번째 번호가 공개됩니다)';
    }
    if (activeRevealedDigitStep === 2) {
      return '두 번째 번호 공개! (2초 후 마지막 번호가 공개됩니다!)';
    }
    return '세 번째 번호 공개! 당첨 확정!';
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 flex-1 flex flex-col justify-center items-center my-2">
      {/* 16:9 Presentation Frame Container */}
      <div className="w-full relative rounded-3xl bg-white/95 festive-bg-pattern border-2 border-amber-300/80 p-4 sm:p-6 lg:p-7 shadow-[0_10px_40px_rgba(245,158,11,0.12)] flex flex-col justify-between overflow-hidden min-h-[580px] lg:min-h-[640px]">
        {/* Soft warm corner glows */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-amber-200/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-rose-200/30 rounded-full blur-3xl pointer-events-none"></div>

        {/* Stage Header Info inside 16:9 screen */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-amber-200">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md border border-white text-white"
              style={{ backgroundColor: currentPrize.accentColor }}
            >
              {currentPrize.id === 'general' && <Gift className="w-7 h-7" />}
              {currentPrize.id === 'hairdryer' && <Wind className="w-7 h-7" />}
              {currentPrize.id === 'ricecooker' && <Flame className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 font-dohyeon tracking-wide">
                  {currentPrize.name} 추첨
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs sm:text-sm">
                  {currentPrize.count}명
                </span>
              </div>
            </div>
          </div>

          {/* Draw Status Tracker */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs sm:text-sm">
            <span className="text-slate-500">진행률:</span>
            <strong className="text-amber-600 font-bold font-mono">
              {drawnCount} / {currentPrize.count}
            </strong>
            {isCompleted ? (
              <span className="text-emerald-700 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 추첨 완료
              </span>
            ) : (
              <span className="text-slate-400">추첨 대기</span>
            )}
          </div>
        </div>

        {/* Multi-Select Simultaneous Re-draw Banner for 8 Prizes */}
        {currentPrize.id === 'general' && selectedSlotIndices.length > 0 && !isDrawing && (
          <div className="w-full my-2 p-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-fade-in border-2 border-amber-300">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckSquare className="w-5 h-5 text-slate-950" />
              <span>
                재추첨 대상 <strong className="underline text-base">{selectedSlotIndices.length}명</strong> 선택됨:
              </span>
              <span className="bg-white/80 px-2 py-0.5 rounded-lg text-xs font-mono font-black">
                {selectedSlotIndices.map((i) => `#${i + 1}`).join(', ')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearSlotSelection}
                className="px-3 py-1.5 rounded-xl bg-white/60 hover:bg-white text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                선택 취소
              </button>

              <button
                type="button"
                onClick={() => redrawMultipleSlots('general', selectedSlotIndices)}
                className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-300 font-black text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer animate-bounce"
              >
                <RotateCw className="w-4 h-4 text-amber-300 animate-spin" />
                <span>선택한 {selectedSlotIndices.length}명 동시 재추첨 시작! (2초 간격 3자리)</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Suspense Notification Banner */}
        {isDrawing && (
          <div className="w-full my-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-100 via-rose-100 to-amber-100 border-2 border-amber-400 shadow-md flex items-center justify-center gap-3 animate-pulse">
            <Sparkles className="w-5 h-5 text-amber-600 animate-spin" />
            <span className="text-sm sm:text-base font-black text-slate-800 font-dohyeon tracking-wider">
              {getSuspenseBannerText()}
            </span>
            <Sparkles className="w-5 h-5 text-amber-600 animate-spin" />
          </div>
        )}

        {/* Main Lottery Body: 8 Prizes Grid vs 1 VIP Prize Showcase */}
        <div className="w-full flex-1 flex flex-col justify-center my-3">
          {currentPrize.id === 'general' ? (
            /* 8 Prizes: 8 slots drawing simultaneously */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {currentSlots.map((slot) => {
                const isSpinningThis =
                  isDrawing &&
                  (activeRedrawingSlots.length === 0 || activeRedrawingSlots.includes(slot.slotIndex));
                const isSelected = selectedSlotIndices.includes(slot.slotIndex);

                return (
                  <SlotNumberCard
                    key={slot.slotIndex}
                    prizeId="general"
                    slot={slot}
                    isDrawing={isDrawing}
                    isSpinningThisSlot={isSpinningThis}
                    isSelectedForRedraw={isSelected}
                    onToggleSelect={toggleSlotSelection}
                    onRedrawSingle={(idx) => redrawSingleSlot('general', idx)}
                    formatNumber={formatNumber}
                  />
                );
              })}
            </div>
          ) : (
            /* 1 Prize (헤어드라이기 or 밥솥): Clean VIP Showcase */
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative p-6 sm:p-8 rounded-3xl bg-white border-2 border-amber-300 shadow-xl flex flex-col items-center max-w-lg w-full text-center overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    축제 특별 경품 (1명)
                  </span>
                </div>

                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 font-dohyeon mb-4">
                  {currentPrize.name}
                </h3>

                {/* Big 3 Digits Display */}
                <div className="w-full py-6 px-6 sm:px-8 rounded-2xl bg-amber-50/60 border-2 border-amber-300 shadow-inner flex flex-col items-center justify-center my-2">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {[0, 1, 2].map((idx) => {
                      const locked = isSingleDigitLocked(idx);
                      const val = getSingleDigitDisplay(idx);

                      return (
                        <div
                          key={idx}
                          className={`w-20 h-28 sm:w-24 sm:h-32 flex items-center justify-center rounded-2xl font-mono text-6xl sm:text-7xl font-black shadow-md transition-all ${
                            locked && currentSlots[0]?.status === 'revealed'
                              ? 'bg-gradient-to-b from-amber-100 to-amber-200 border-2 border-amber-500 text-amber-950 shadow-lg'
                              : locked && isDrawing
                              ? 'bg-amber-300 border-2 border-amber-600 text-amber-950 scale-105 shadow-xl animate-digit-pop'
                              : isDrawing
                              ? 'bg-white border-2 border-amber-300 text-amber-700 animate-pulse'
                              : 'bg-white border-2 border-slate-200 text-slate-300'
                          }`}
                        >
                          {val}
                        </div>
                      );
                    })}
                  </div>

                  {currentSlots[0]?.drawnAt && currentSlots[0].status === 'revealed' && (
                    <div className="text-xs text-slate-500 font-mono mt-4 font-semibold">
                      추첨 시각: {currentSlots[0]?.drawnAt}
                    </div>
                  )}
                </div>

                {/* Re-draw Button */}
                {currentSlots[0]?.number !== null && !isDrawing && (
                  <div className="w-full flex items-center justify-center mt-4">
                    <button
                      type="button"
                      onClick={() => redrawSingleSlot(currentPrize.id, 0)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-sm font-bold transition-all active:scale-95 shadow-md shadow-amber-500/25 cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4 text-white" />
                      <span>재추첨 하기</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Stage Action Panel */}
        <div className="w-full pt-3 border-t border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span>추첨 가능 후보: </span>
            <strong className="text-amber-800 font-bold">{availablePool.length}명</strong>
            <span className="text-slate-300 mx-2">|</span>
            <span className="text-slate-600">중복 당첨 방지 적용 중</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Draw Button (when not fully drawn) */}
            {drawnCount === 0 && (
              <button
                type="button"
                disabled={isDrawing || availablePool.length < currentPrize.count}
                onClick={() => startFullDraw(currentPrize.id)}
                className={`relative px-8 py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg tracking-wider text-slate-950 font-dohyeon transition-all duration-300 shadow-xl flex items-center gap-3 ${
                  isDrawing
                    ? 'bg-amber-300/60 cursor-not-allowed opacity-75'
                    : 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-95 animate-festive-glow cursor-pointer'
                }`}
              >
                <Sparkles className="w-5 h-5 text-slate-950 animate-spin" />
                <span>
                  {currentPrize.id === 'general'
                    ? '🎉 8명 동시 추첨 시작! 🎉'
                    : `✨ ${currentPrize.name} 추첨 시작! ✨`}
                </span>
              </button>
            )}

            {/* Always-accessible '전체 다시 추첨' and '축하 폭죽 팡팡' buttons when any slots are drawn */}
            {drawnCount > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isDrawing}
                  onClick={() => {
                    soundManager.playFanfare();
                    fireCelebrationFireworks();
                  }}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs sm:text-sm font-black shadow-md shadow-amber-500/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  title="축하 팡파르와 폭죽을 팡팡 터뜨립니다!"
                >
                  <PartyPopper className="w-4 h-4 text-slate-950" />
                  <span>축하 폭죽 팡팡!</span>
                </button>

                <button
                  type="button"
                  disabled={isDrawing}
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: `'${currentPrize.name}' 전체 다시 추첨`,
                      message: `'${currentPrize.name}'의 기존 당첨 결과를 모두 초기화하고 처음부터 다시 추첨하시겠습니까?`,
                      onConfirm: () => resetPrize(currentPrize.id)
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-400 text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <RotateCw className="w-4 h-4 text-amber-700" />
                  <span>전체 다시 추첨 (리셋)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-App Confirmation Modal (Replaces blocked window.confirm) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white border-2 border-amber-400 rounded-3xl p-6 shadow-2xl text-slate-800">
            <button
              onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900 font-dohyeon">{confirmDialog.title}</h3>
            </div>

            <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
              {confirmDialog.message}
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                취소
              </button>

              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                확인, 실행하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
