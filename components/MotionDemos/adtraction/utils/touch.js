import { useEffect, useRef, useState } from "react";

const TOUCH_QUERY = "(hover: none) and (pointer: coarse)";
const STANDALONE_QUERY = "(display-mode: standalone)";
const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

const matchesQuery = (query) =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia(query).matches;

export const isStandalonePwa = () =>
  matchesQuery(STANDALONE_QUERY) ||
  (typeof navigator !== "undefined" && navigator.standalone === true);

// an installed PWA on a phone already matches TOUCH_QUERY; a desktop PWA keeps its mouse behaviour
export const isTouchDevice = () => matchesQuery(TOUCH_QUERY);

export const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(isTouchDevice);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const mediaQuery = window.matchMedia(TOUCH_QUERY);
    const update = () => setIsTouch(isTouchDevice());
    mediaQuery.addEventListener?.("change", update);
    return () => mediaQuery.removeEventListener?.("change", update);
  }, []);

  return isTouch;
};

const resolveUrl = (url) => {
  try {
    return new URL(url, window.location.href);
  } catch {
    return null;
  }
};

export const openLink = (url) => {
  if (!url) return;
  const target = resolveUrl(url);
  const isWebUrl = target && /^https?:$/.test(target.protocol);

  if (!isTouchDevice() || !isWebUrl) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  if (target.origin === window.location.origin) {
    // The host router (react-router v5) re-reads location on popstate, so this navigates in-app without a reload.
    // The { key } state matches the entries history v4 writes, so back/forward stay keyed.
    window.history.pushState(
      { key: Math.random().toString(36).slice(2, 8) },
      "",
      `${target.pathname}${target.search}${target.hash}`
    );
    window.dispatchEvent(new PopStateEvent("popstate"));
    return;
  }

  window.location.assign(target.href);
};

export const linkTargetProps = () =>
  isTouchDevice() ? {} : { target: "_blank", rel: "noopener noreferrer" };

export const useLongPress = (onLongPress, delay = LONG_PRESS_MS) => {
  const callbackRef = useRef(onLongPress);
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const firedRef = useRef(false);

  callbackRef.current = onLongPress;

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => clear, []);

  const handlers = {
    onTouchStart: (event) => {
      const touch = event.touches?.[0];
      firedRef.current = false;
      startRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
      clear();
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        callbackRef.current?.(event);
      }, delay);
    },
    onTouchMove: (event) => {
      const touch = event.touches?.[0];
      if (!startRef.current || !touch) return;
      const moved = Math.hypot(touch.clientX - startRef.current.x, touch.clientY - startRef.current.y);
      if (moved > LONG_PRESS_MOVE_TOLERANCE_PX) clear();
    },
    onTouchEnd: clear,
    onTouchCancel: clear
  };

  const consumeLongPress = () => {
    const fired = firedRef.current;
    firedRef.current = false;
    return fired;
  };

  return { handlers, consumeLongPress };
};
