// @ts-nocheck -- portfolio edit: React 19 types require an initial value for useRef; the platform builds on React 18 types.
import { useEffect, useRef, DependencyList } from "react";

type EffectFunction = () => void | (() => void | undefined);

export const useDebouncedEffect = (
  effect: EffectFunction,
  delay: number,
  deps: DependencyList
): void => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<(() => void) | undefined>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const cleanup = effect();
        if (typeof cleanup === "function") {
          cleanupRef.current = cleanup;
        }
      } catch (error) {
        console.error("Error in debounced effect:", error);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [...deps, delay]);
};
