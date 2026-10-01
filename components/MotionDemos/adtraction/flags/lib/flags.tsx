// @ts-nocheck -- portfolio edit: trimmed to the flags the demo data uses (DK, SE, NO, FI).
import { lazy as _lazy } from "react";

type ImportFunction = () => Promise<{
  ReactComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}>;

function lazy(importFn: ImportFunction) {
  return _lazy(async () => {
    const m = await importFn();
    return { default: m.ReactComponent };
  });
}

// Country flags
export const Flags = {
  DK: lazy(() => import("./media/dk.svg")),
  FI: lazy(() => import("./media/fi.svg")),
  NO: lazy(() => import("./media/no.svg")),
  SE: lazy(() => import("./media/se.svg")),

  // Special regions and organizations

  // 2-letter ISO aliases for Special regions and organizations
};
