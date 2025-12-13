"use client";

import React, { useCallback, useMemo, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    placement,
    middleware: [offset(10), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    open,
    onOpenChange: setOpen,
  });

  const clientPoint = useClientPoint(context, { enabled: followCursor });
  const hover = useHover(context, { delay: { open: delay, close: 0 } });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
    clientPoint,
  ]);

  const mergedClassName = useMemo(
    () => `${className}`.trim(),
    [className]
  );

  // Wrap ref setters to avoid ESLint false positive about accessing refs during render
  const setReferenceRef = useCallback(
    (node: HTMLDivElement | null) => {
      refs.setReference(node);
    },
    [refs]
  );

  const setFloatingRef = useCallback(
    (node: HTMLDivElement | null) => {
      refs.setFloating(node);
    },
    [refs]
  );

  const floatingContent = (
    <div
      ref={setFloatingRef}
      style={{
        ...floatingStyles,
        pointerEvents: followCursor ? "none" : "auto",
        zIndex: 1000,
      }}
      {...getFloatingProps({
        className: mergedClassName,
      })}
    >
      {content}
    </div>
  );

  return (
    <>
      <div 
        ref={setReferenceRef}
        {...getReferenceProps()}
        style={{ display: "block", width: "100%", height: "100%" }}
      >
        {children}
      </div>
      {open && (portal ? <FloatingPortal>{floatingContent}</FloatingPortal> : floatingContent)}
    </>
  );
}

