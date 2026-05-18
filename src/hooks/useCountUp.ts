import { useState, useEffect } from 'react';

export function useCountUp(target: number, duration = 1.5): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.floor(target);
    if (start === end) {
      setCount(end);
      return;
    }

    const totalMiliseconds = duration * 1000;
    const startTime = performance.now();

    let animationFrameId: number;

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      if (elapsed >= totalMiliseconds) {
        setCount(end);
        return;
      }

      const progress = elapsed / totalMiliseconds;
      // Ease out quad
      const easeOutProgress = progress * (2 - progress);
      const currentCount = Math.floor(easeOutProgress * (end - start) + start);

      setCount(currentCount);
      animationFrameId = requestAnimationFrame(updateCount);
    };

    animationFrameId = requestAnimationFrame(updateCount);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [target, duration]);

  return count;
}
