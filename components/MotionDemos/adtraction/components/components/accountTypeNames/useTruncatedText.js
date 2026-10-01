import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export const isElementTruncated = (el) => {
  if (!el) return false;
  // Sub-pixel rounding can make equal widths report as 1px apart.
  return el.scrollWidth - el.clientWidth > 1;
};

export const useTruncatedText = (value) => {
  const [el, setEl] = useState(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkTruncation = useCallback(() => {
    setIsTruncated(isElementTruncated(el));
  }, [el]);

  useLayoutEffect(() => {
    checkTruncation();
  }, [value, checkTruncation]);

  useEffect(() => {
    if (!el || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(() => checkTruncation());
    observer.observe(el);
    return () => observer.disconnect();
  }, [checkTruncation, el]);

  return [isTruncated, setEl];
};
