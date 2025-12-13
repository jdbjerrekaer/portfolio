"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  autoUpdate,
  FloatingPortal,
  flip,
  offset,
  shift,
  useClientPoint,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  type Placement as FloatingPlacement,
} from "@floating-ui/react";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: FloatingPlacement;
  delay?: number;
  className?: string;
  followCursor?: boolean;
  portal?: boolean;
}

export function Tooltip({
  content,
  children,
  placement = "bottom",
  delay = 500,
  className = "",
  followCursor = true,
  portal = true,
}: TooltipProps): React.ReactElement | null {
  const referenceRef = useRef<HTMLSpanElement | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    placement,
    middleware: [offset(10), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    open,
    onOpenChange: (next) => {
      setOpen(next);
    },
  });

  // Avoid accessing refs during render; bind DOM nodes after mount.
  useEffect(() => {
    refs.setReference(referenceRef.current);
    refs.setFloating(floatingRef.current);
  }, [refs]);

  useClientPoint(context, { enabled: followCursor });

  const hover = useHover(context, { delay: { open: delay, close: 0 } });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  const mergedClassName = useMemo(
    () => `${className}`.trim(),
    [className]
  );

  return (
    <>
      <span ref={referenceRef} {...getReferenceProps()}>
        {children}
      </span>
      {open &&
        (portal ? (
          <FloatingPortal>
            <div
              ref={floatingRef}
              style={floatingStyles}
              {...getFloatingProps({
                className: mergedClassName,
              })}
            >
              {content}
            </div>
          </FloatingPortal>
        ) : (
          <div
            ref={floatingRef}
            style={floatingStyles}
            {...getFloatingProps({
              className: mergedClassName,
            })}
          >
            {content}
          </div>
        ))}
    </>
  );
}

