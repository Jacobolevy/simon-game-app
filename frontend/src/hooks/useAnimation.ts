/**
 * useAnimation Hook
 * 
 * Utilities for triggering and managing animations.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

type AnimationState = 'idle' | 'entering' | 'entered' | 'exiting' | 'exited';

interface UseAnimationOptions {
  /** Duration of enter animation in ms */
  enterDuration?: number;
  /** Duration of exit animation in ms */
  exitDuration?: number;
  /** Callback when enter animation completes */
  onEntered?: () => void;
  /** Callback when exit animation completes */
  onExited?: () => void;
}

export function useAnimation(
  isVisible: boolean,
  options: UseAnimationOptions = {}
) {
  const {
    enterDuration = 300,
    exitDuration = 200,
    onEntered,
    onExited,
  } = options;

  const [state, setState] = useState<AnimationState>(isVisible ? 'entered' : 'exited');
  const [shouldRender, setShouldRender] = useState(isVisible);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isVisible) {
      setShouldRender(true);
      setState('entering');
      
      timeoutRef.current = setTimeout(() => {
        setState('entered');
        onEntered?.();
      }, enterDuration);
    } else {
      setState('exiting');
      
      timeoutRef.current = setTimeout(() => {
        setState('exited');
        setShouldRender(false);
        onExited?.();
      }, exitDuration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, enterDuration, exitDuration, onEntered, onExited]);

  return {
    state,
    shouldRender,
    isEntering: state === 'entering',
    isEntered: state === 'entered',
    isExiting: state === 'exiting',
    isExited: state === 'exited',
  };
}

/**
 * Hook for triggering one-shot animations
 */
export function useTriggerAnimation(duration: number = 300) {
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsAnimating(true);

    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, duration);
  }, [duration]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { isAnimating, trigger };
}
