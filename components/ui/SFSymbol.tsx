"use client";

import { forwardRef } from "react";

export interface SFSymbolProps {
  name: string;
  size?: number;
  weight?: "regular" | "medium" | "semibold" | "bold";
  className?: string;
  filled?: boolean;
}

// SF Symbols-inspired SVG icons (using SF Symbols-style paths)
const symbolPaths: Record<string, { outline: string; filled: string }> = {
  "folder": {
    outline: "M4 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7l-2-2H4z",
    filled: "M4 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7l-2-2H4z",
  },
  "person": {
    outline: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
    filled: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  },
  "arrow.right": {
    outline: "M13 7l5 5-5 5M6 12h12",
    filled: "M13 7l5 5-5 5M6 12h12",
  },
  "house": {
    outline: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    filled: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  },
};

const strokeWidths: Record<string, number> = {
  regular: 1.5,
  medium: 1.75,
  semibold: 2,
  bold: 2.25,
};

export const SFSymbol = forwardRef<SVGSVGElement, SFSymbolProps>(
  ({ name, size = 20, weight = "regular", className = "", filled = false }, ref) => {
    const symbol = symbolPaths[name];
    const strokeWidth = strokeWidths[weight];

    if (!symbol) {
      console.warn(`SF Symbol "${name}" not found`);
      return null;
    }

    const path = filled ? symbol.filled : symbol.outline;

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
        strokeWidth={filled ? 0 : strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={{
          display: "inline-block",
          verticalAlign: "middle",
        }}
      >
        <path d={path} />
      </svg>
    );
  }
);

SFSymbol.displayName = "SFSymbol";
