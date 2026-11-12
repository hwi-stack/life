import confetti from 'canvas-confetti';

export function fireCelebrationFireworks() {
  const duration = 4.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 35, spread: 360, ticks: 70, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  // Left and Right Cannon bursts
  confetti({
    ...defaults,
    particleCount: 80,
    origin: { x: 0.15, y: 0.7 },
    colors: ['#ff4b4b', '#ffd700', '#00e5ff', '#ff007f', '#50e3c2']
  });

  confetti({
    ...defaults,
    particleCount: 80,
    origin: { x: 0.85, y: 0.7 },
    colors: ['#ff4b4b', '#ffd700', '#00e5ff', '#ff007f', '#50e3c2']
  });

  const interval: ReturnType<typeof setInterval> = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 45 * (timeLeft / duration);

    // Fireworks style shooting up
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.2, 0.4), y: Math.random() - 0.2 },
      colors: ['#ffd700', '#ff6b6b', '#48dbfb', '#1dd1a1', '#f368e0']
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.6, 0.8), y: Math.random() - 0.2 },
      colors: ['#ffd700', '#ff9f43', '#54a0ff', '#5f27cd', '#ee5253']
    });
  }, 280);
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
    particleCount: 35,
    spread: 60,
    origin,
    zIndex: 9999,
    colors: ['#ffd700', '#ff9f43', '#10b981', '#3b82f6', '#ec4899']
  });
}
