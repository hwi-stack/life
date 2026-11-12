import confetti from 'canvas-confetti';
import { soundManager } from './sound';

export function fireCelebrationFireworks() {
  const duration = 6 * 1000;
  const animationEnd = Date.now() + duration;

  // Festival palette: Sparkling Golds, Warm Corals, Sky Blues, Emerald, Magenta
  const festivalColors = ['#f59e0b', '#fbbf24', '#ef4444', '#f43f5e', '#3b82f6', '#10b981', '#ec4899', '#ffffff'];

  // Initial Mega Triple Blast (Left, Center, Right)
  soundManager.playFireworkPop();

  // Left Cannon
  confetti({
    particleCount: 100,
    angle: 60,
    spread: 75,
    origin: { x: 0.05, y: 0.8 },
    colors: festivalColors,
    startVelocity: 55,
    scalar: 1.2,
    zIndex: 9999
  });

  // Right Cannon
  confetti({
    particleCount: 100,
    angle: 120,
    spread: 75,
    origin: { x: 0.95, y: 0.8 },
    colors: festivalColors,
    startVelocity: 55,
    scalar: 1.2,
    zIndex: 9999
  });

  // Center High Fountain
  confetti({
    particleCount: 120,
    angle: 90,
    spread: 100,
    origin: { x: 0.5, y: 0.9 },
    colors: ['#ffd700', '#ffa500', '#ff4500', '#00e5ff'],
    startVelocity: 60,
    scalar: 1.3,
    zIndex: 9999
  });

  // Continuous Fireworks & Falling Streamers across 6 seconds
  let tickCounter = 0;
  const interval: ReturnType<typeof setInterval> = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    tickCounter++;
    const progress = timeLeft / duration;

    // Fireworks explosions from random screen locations
    const randomX = 0.15 + Math.random() * 0.7;
    const randomY = 0.1 + Math.random() * 0.45;

    confetti({
      particleCount: Math.floor(40 * progress) + 20,
      startVelocity: 30,
      spread: 360,
      ticks: 75,
      origin: { x: randomX, y: randomY },
      colors: festivalColors,
      scalar: 1.1,
      zIndex: 9999
    });

    // Fire audio pop intermittently
    if (tickCounter % 3 === 0) {
      soundManager.playFireworkPop();
    }

    // Side cannons reinjections
    if (tickCounter % 4 === 0) {
      confetti({
        particleCount: 45,
        angle: 55,
        spread: 60,
        origin: { x: 0.08, y: 0.85 },
        colors: festivalColors,
        startVelocity: 45,
        zIndex: 9999
      });
      confetti({
        particleCount: 45,
        angle: 125,
        spread: 60,
        origin: { x: 0.92, y: 0.85 },
        colors: festivalColors,
        startVelocity: 45,
        zIndex: 9999
      });
    }
  }, 320);
}

export function fireSlotCelebration(rect?: DOMRect | null) {
  let origin = { x: 0.5, y: 0.5 };
  if (rect) {
    origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight
    };
  }

  confetti({
    particleCount: 40,
    spread: 70,
    origin,
    zIndex: 9999,
    colors: ['#ffd700', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'],
    scalar: 1.15
  });
}
