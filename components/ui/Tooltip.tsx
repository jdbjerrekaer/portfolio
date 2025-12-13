"use client";

import React, { useMemo, useState } from "react";
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
}: TooltipProps): JSX.Element {
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
      <span ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </span>
      {open &&
        (portal ? (
          <FloatingPortal>
            <div
              ref={refs.setFloating}
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
            ref={refs.setFloating}
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

