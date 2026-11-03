/**
 * useCalmAnimation.js – should a looping animation be playing right now?
 *
 * PERF + ACCESSIBILITY: my Lottie animations (the heart on Home, the figure on
 * Coping) looped forever, even after you scrolled past them. This says "play" only
 * when the animation is actually on screen AND the person hasn't asked their system
 * to reduce motion.
 *
 * Usage:
 *   const { ref, shouldPlay, reduceMotion } = useCalmAnimation();
 *   <div ref={ref}> ...animation... </div>
 *   then play()/pause() the animation whenever shouldPlay changes
 */
import { useEffect, useRef, useState } from 'react';

export default function useCalmAnimation() {
  const ref = useRef(null);
  const [onScreen, setOnScreen] = useState(true);
  const [reduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, shouldPlay: onScreen && !reduceMotion, reduceMotion };
}
