import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  PrizeId,
  PrizeConfig,
  WinnerSlot,
  DrawHistoryRecord,
  AdminSettings,
  INITIAL_PRIZES
} from '../types';
import { soundManager } from '../utils/sound';
import { fireCelebrationFireworks, fireSlotCelebration } from '../utils/confetti';
import { saveLotteryStateToFirestore, subscribeLotteryState } from '../lib/firebase';

interface LotteryContextType {
  prizes: PrizeConfig[];
  selectedPrizeId: PrizeId;
  setSelectedPrizeId: (id: PrizeId) => void;
  slots: Record<PrizeId, WinnerSlot[]>;
  history: DrawHistoryRecord[];
  settings: AdminSettings;
  updateSettings: (newSettings: Partial<AdminSettings>) => void;
  isDrawing: boolean;
  drawingSlotIndex: number | null;
  activeRedrawingSlots: number[];
  selectedSlotIndices: number[];
  toggleSlotSelection: (slotIndex: number) => void;
  clearSlotSelection: () => void;
  selectAllDrawnSlots: (prizeId: PrizeId) => void;
  activeRevealedDigitStep: number;
  startFullDraw: (prizeId: PrizeId) => Promise<void>;
  redrawSingleSlot: (prizeId: PrizeId, slotIndex: number) => Promise<void>;
  redrawMultipleSlots: (prizeId: PrizeId, slotIndices: number[]) => Promise<void>;
  resetPrize: (prizeId: PrizeId) => void;
  resetAll: () => void;
  getAvailableNumbers: () => number[];
  getAllActiveWinnerNumbers: () => number[];
  toggleSound: () => void;
  formatNumber: (num: number | null | undefined) => string;
}

const STORAGE_KEYS = {
  SLOTS: 'suwon_lottery_slots_2026_v3',
  HISTORY: 'suwon_lottery_history_2026_v3',
  SETTINGS: 'suwon_lottery_settings_2026_v3',
  SELECTED_PRIZE: 'suwon_lottery_selected_prize_2026_v3'
};

const DEFAULT_SETTINGS: AdminSettings = {
  startNumber: 1,
  endNumber: 125,
  excludedNumbers: [],
  soundEnabled: true
};

function createInitialSlots(): Record<PrizeId, WinnerSlot[]> {
  const result: Record<PrizeId, WinnerSlot[]> = {
    general: [],
    hairdryer: [],
    ricecooker: []
  };

  INITIAL_PRIZES.forEach((p) => {
    result[p.id] = Array.from({ length: p.count }, (_, idx) => ({
      slotIndex: idx,
      number: null,
      drawnAt: null,
      status: 'empty',
      revealedDigits: 0
    }));
  });

  return result;
}

const LotteryContext = createContext<LotteryContextType | null>(null);

export const LotteryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prizes] = useState<PrizeConfig[]>(INITIAL_PRIZES);
  const [selectedPrizeId, setSelectedPrizeId] = useState<PrizeId>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_PRIZE);
    return (saved as PrizeId) || 'general';
  });

  const [slots, setSlots] = useState<Record<PrizeId, WinnerSlot[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SLOTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load slots from localStorage', e);
    }
    return createInitialSlots();
  });

  const [history, setHistory] = useState<DrawHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load history from localStorage', e);
    }
    return [];
  });

  const [settings, setSettings] = useState<AdminSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingSlotIndex, setDrawingSlotIndex] = useState<number | null>(null);
  const [activeRedrawingSlots, setActiveRedrawingSlots] = useState<number[]>([]);
  const [selectedSlotIndices, setSelectedSlotIndices] = useState<number[]>([]);
  const [activeRevealedDigitStep, setActiveRevealedDigitStep] = useState<number>(0);

  // Sync sound manager with settings
  useEffect(() => {
    soundManager.setMuted(!settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Real-time Firestore Subscription
  useEffect(() => {
    const unsubscribe = subscribeLotteryState((cloudData) => {
      if (cloudData) {
        if (cloudData.slots) {
          setSlots(cloudData.slots);
          localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(cloudData.slots));
        }
        if (cloudData.history) {
          setHistory(cloudData.history);
          localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(cloudData.history));
        }
        if (cloudData.settings) {
          setSettings((prev) => ({ ...prev, ...cloudData.settings }));
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cloudData.settings));
        }
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Save to LocalStorage & Firestore on local changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      localStorage.setItem(STORAGE_KEYS.SELECTED_PRIZE, selectedPrizeId);

      // Cloud Firestore sync (non-blocking)
      saveLotteryStateToFirestore({
        slots,
        settings,
        selectedPrizeId,
        history
      });
    } catch (e) {
      console.error('Failed to persist state', e);
    }
  }, [slots, history, settings, selectedPrizeId]);

  // Clear selections when switching prizes
  useEffect(() => {
    setSelectedSlotIndices([]);
  }, [selectedPrizeId]);

  const toggleSlotSelection = useCallback((slotIndex: number) => {
    setSelectedSlotIndices((prev) =>
      prev.includes(slotIndex) ? prev.filter((i) => i !== slotIndex) : [...prev, slotIndex].sort((a, b) => a - b)
    );
  }, []);

  const clearSlotSelection = useCallback(() => {
    setSelectedSlotIndices([]);
  }, []);

  const selectAllDrawnSlots = useCallback(
    (prizeId: PrizeId) => {
      const drawnIndices = (slots[prizeId] || [])
        .filter((s) => s.number !== null)
        .map((s) => s.slotIndex);
      setSelectedSlotIndices(drawnIndices);
    },
    [slots]
  );

  const formatNumber = useCallback((num: number | null | undefined): string => {
    if (num === null || num === undefined) return '---';
    return String(num).padStart(3, '0');
  }, []);

  const getAllActiveWinnerNumbers = useCallback((): number[] => {
    const numbers: number[] = [];
    Object.values(slots).forEach((prizeSlots) => {
      prizeSlots.forEach((s) => {
        if (s.number !== null) {
          numbers.push(s.number);
        }
      });
    });
    return numbers;
  }, [slots]);

  const getAvailableNumbers = useCallback((): number[] => {
    const activeWinners = new Set(getAllActiveWinnerNumbers());
    const excluded = new Set(settings.excludedNumbers);

    const pool: number[] = [];
    for (let i = settings.startNumber; i <= settings.endNumber; i++) {
      if (!activeWinners.has(i) && !excluded.has(i)) {
        pool.push(i);
      }
    }
    return pool;
  }, [getAllActiveWinnerNumbers, settings]);

  const updateSettings = useCallback((newSettings: Partial<AdminSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const toggleSound = useCallback(() => {
    setSettings((prev) => {
      const next = !prev.soundEnabled;
      soundManager.setMuted(!next);
      return { ...prev, soundEnabled: next };
    });
  }, []);

  /**
   * Full Draw: all slots of this prize spin simultaneously
   * 1st digit -> 2s -> 2nd digit -> 2s -> 3rd digit (locks in without popup!)
   */
  const startFullDraw = useCallback(async (prizeId: PrizeId) => {
    if (isDrawing) return;

    const available = getAvailableNumbers();
    const prizeConfig = prizes.find((p) => p.id === prizeId);
    if (!prizeConfig) return;

    if (available.length < prizeConfig.count) {
      return;
    }

    setIsDrawing(true);
    setDrawingSlotIndex(null);
    setActiveRedrawingSlots([]);
    setActiveRevealedDigitStep(0);
    soundManager.playClick();

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const chosenNumbers = shuffled.slice(0, prizeConfig.count);

    setSlots((prev) => {
      const prizeSlots = prev[prizeId].map((s, idx) => ({
        ...s,
        status: 'spinning' as const,
        number: chosenNumbers[idx],
        revealedDigits: 0
      }));
      return { ...prev, [prizeId]: prizeSlots };
    });

    const tickInterval = setInterval(() => {
      soundManager.playTick();
    }, 85);

    // Initial suspense roll: 2.0 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // STEP 1: First digit (백의 자리) appears!
    setActiveRevealedDigitStep(1);
    soundManager.playLockIn();
    fireSlotCelebration();

    setSlots((prev) => {
      const copy = prev[prizeId].map((s) => ({
        ...s,
        revealedDigits: 1
      }));
      return { ...prev, [prizeId]: copy };
    });

    // 2초 후 두 번째 번호 (십의 자리)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // STEP 2: Second digit (십의 자리) appears!
    setActiveRevealedDigitStep(2);
    soundManager.playLockIn();
    fireSlotCelebration();

    setSlots((prev) => {
      const copy = prev[prizeId].map((s) => ({
        ...s,
        revealedDigits: 2
      }));
      return { ...prev, [prizeId]: copy };
    });

    // 그리고 2초 후 세 번째 번호 (일의 자리)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // STEP 3: Third digit locks in!
    clearInterval(tickInterval);
    setActiveRevealedDigitStep(3);
    soundManager.playLockIn();

    const drawTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setSlots((prev) => {
      const copy = prev[prizeId].map((s) => ({
        ...s,
        drawnAt: drawTime,
        status: 'revealed' as const,
        revealedDigits: 3
      }));
      return { ...prev, [prizeId]: copy };
    });

    const newlyDrawnRecords: DrawHistoryRecord[] = chosenNumbers.map((num, idx) => ({
      id: `${prizeId}-${idx}-${Date.now()}`,
      prizeId,
      prizeName: prizeConfig.name,
      slotIndex: idx,
      number: num,
      drawnAt: drawTime,
      status: 'active'
    }));

    setHistory((prev) => [...newlyDrawnRecords.reverse(), ...prev]);

    // Grand fanfare & fireworks directly on the stage (No modal popup!)
    await new Promise((resolve) => setTimeout(resolve, 500));
    soundManager.playFanfare();
    fireCelebrationFireworks();

    setIsDrawing(false);
  }, [isDrawing, getAvailableNumbers, prizes]);

  /**
   * Batch / Multi-Slot Re-draw:
   * Supports 1, 2, 4, 5, or ANY number of selected slots simultaneously!
   * Follows the exact 3-digit reveal sequence (1st digit -> 2s -> 2nd digit -> 2s -> 3rd digit)
   * Completes in ~6 seconds total for all chosen slots together!
   */
  const redrawMultipleSlots = useCallback(
    async (prizeId: PrizeId, slotIndices: number[]) => {
      if (isDrawing || slotIndices.length === 0) return;

      const available = getAvailableNumbers();
      const prizeConfig = prizes.find((p) => p.id === prizeId);
      if (!prizeConfig) return;

      if (available.length < slotIndices.length) {
        return;
      }

      setIsDrawing(true);
      setActiveRedrawingSlots(slotIndices);
      setActiveRevealedDigitStep(0);
      soundManager.playClick();

      // Pick N new unique numbers from the pool
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      const newNumbers = shuffled.slice(0, slotIndices.length);

      // Set target slots to spinning
      setSlots((prev) => {
        const copy = [...prev[prizeId]];
        slotIndices.forEach((sIdx, i) => {
          copy[sIdx] = {
            ...copy[sIdx],
            status: 'spinning',
            number: newNumbers[i],
            revealedDigits: 0
          };
        });
        return { ...prev, [prizeId]: copy };
      });

      const tickInterval = setInterval(() => {
        soundManager.playTick();
      }, 85);

      // Initial roll: 2.0 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 1: 1st digit for all selected slots
      setActiveRevealedDigitStep(1);
      soundManager.playLockIn();
      fireSlotCelebration();

      setSlots((prev) => {
        const copy = [...prev[prizeId]];
        slotIndices.forEach((sIdx) => {
          copy[sIdx] = { ...copy[sIdx], revealedDigits: 1 };
        });
        return { ...prev, [prizeId]: copy };
      });

      // 2초 후 2번째 번호
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 2: 2nd digit for all selected slots
      setActiveRevealedDigitStep(2);
      soundManager.playLockIn();
      fireSlotCelebration();

      setSlots((prev) => {
        const copy = [...prev[prizeId]];
        slotIndices.forEach((sIdx) => {
          copy[sIdx] = { ...copy[sIdx], revealedDigits: 2 };
        });
        return { ...prev, [prizeId]: copy };
      });

      // 그리고 2초 후 3번째 번호
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 3: Final 3rd digit lock
      clearInterval(tickInterval);
      setActiveRevealedDigitStep(3);
      soundManager.playLockIn();

      const drawTime = new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      setSlots((prev) => {
        const copy = [...prev[prizeId]];
        slotIndices.forEach((sIdx, i) => {
          copy[sIdx] = {
            slotIndex: sIdx,
            number: newNumbers[i],
            drawnAt: drawTime,
            status: 'revealed',
            revealedDigits: 3,
            isRedrawn: true
          };
        });
        return { ...prev, [prizeId]: copy };
      });

      const newRecords: DrawHistoryRecord[] = slotIndices.map((sIdx, i) => ({
        id: `${prizeId}-${sIdx}-redraw-${Date.now()}-${i}`,
        prizeId,
        prizeName: prizeConfig.name,
        slotIndex: sIdx,
        number: newNumbers[i],
        drawnAt: drawTime,
        status: 'active',
        reason: `슬롯 ${sIdx + 1}번 재추첨`
      }));

      setHistory((prev) => [...newRecords.reverse(), ...prev]);

      await new Promise((resolve) => setTimeout(resolve, 500));
      soundManager.playFanfare();
      fireCelebrationFireworks();

      setSelectedSlotIndices([]);
      setActiveRedrawingSlots([]);
      setIsDrawing(false);
    },
    [isDrawing, getAvailableNumbers, prizes]
  );

  const redrawSingleSlot = useCallback(
    async (prizeId: PrizeId, slotIndex: number) => {
      await redrawMultipleSlots(prizeId, [slotIndex]);
    },
    [redrawMultipleSlots]
  );

  /**
   * Reset functions (reliable, in-app handled)
   */
  const resetPrize = useCallback((prizeId: PrizeId) => {
    setSlots((prev) => {
      const prizeConfig = INITIAL_PRIZES.find((p) => p.id === prizeId);
      const count = prizeConfig ? prizeConfig.count : 1;
      return {
        ...prev,
        [prizeId]: Array.from({ length: count }, (_, idx) => ({
          slotIndex: idx,
          number: null,
          drawnAt: null,
          status: 'empty',
          revealedDigits: 0
        }))
      };
    });

    setHistory((prev) =>
      prev.map((item) =>
        item.prizeId === prizeId ? { ...item, status: 'absent_replaced', reason: '경품 초기화됨' } : item
      )
    );

    setSelectedSlotIndices([]);
  }, []);

  const resetAll = useCallback(() => {
    setSlots(createInitialSlots());
    setHistory([]);
    setSelectedSlotIndices([]);
  }, []);

  const value = useMemo(
    () => ({
      prizes,
      selectedPrizeId,
      setSelectedPrizeId,
      slots,
      history,
      settings,
      updateSettings,
      isDrawing,
      drawingSlotIndex,
      activeRedrawingSlots,
      selectedSlotIndices,
      toggleSlotSelection,
      clearSlotSelection,
      selectAllDrawnSlots,
      activeRevealedDigitStep,
      startFullDraw,
      redrawSingleSlot,
      redrawMultipleSlots,
      resetPrize,
      resetAll,
      getAvailableNumbers,
      getAllActiveWinnerNumbers,
      toggleSound,
      formatNumber
    }),
    [
      prizes,
      selectedPrizeId,
      slots,
      history,
      settings,
      updateSettings,
      isDrawing,
      drawingSlotIndex,
      activeRedrawingSlots,
      selectedSlotIndices,
      toggleSlotSelection,
      clearSlotSelection,
      selectAllDrawnSlots,
      activeRevealedDigitStep,
      startFullDraw,
      redrawSingleSlot,
      redrawMultipleSlots,
      resetPrize,
      resetAll,
      getAvailableNumbers,
      getAllActiveWinnerNumbers,
      toggleSound,
      formatNumber
    ]
  );

  return <LotteryContext.Provider value={value}>{children}</LotteryContext.Provider>;
};

export const useLottery = () => {
  const ctx = useContext(LotteryContext);
  if (!ctx) throw new Error('useLottery must be used within LotteryProvider');
  return ctx;
};
