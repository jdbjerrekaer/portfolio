import React, { useLayoutEffect, useRef, useState } from "react";
import Tippy from "@tippyjs/react";
import clsx from "clsx";
import styles from "./ChannelRuleCard.module.scss";

/**
 * Renders truncated text with Tippy + cursor:help only when content overflows.
 */
const OverflowTippyText = ({ as: Tag = "p", className, text, tippyMaxWidth = 280 }) => {
  const ref = useRef(null);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !text) {
      setOverflows(false);
      return undefined;
    }
    const measure = () => {
      setOverflows(
        el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  if (!text) return null;

  return (
    <Tippy
      content={text}
      disabled={!overflows}
      placement="bottom"
      appendTo={() => document.body}
      delay={[300, 0]}
      maxWidth={tippyMaxWidth}>
      <Tag
        ref={ref}
        className={clsx(className, overflows && styles.overflowHelp)}>
        {text}
      </Tag>
    </Tippy>
  );
};

export default OverflowTippyText;
