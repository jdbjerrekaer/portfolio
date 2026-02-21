"use client";

import { forwardRef } from "react";

export interface SFSymbolProps {
  name: string;
  size?: number;
  weight?: "regular" | "medium" | "semibold" | "bold";
  className?: string;
  filled?: boolean;
  /** Accessible label for the icon. If not provided, icon is treated as decorative. */
  "aria-label"?: string;
  /** Explicitly hide from screen readers. Defaults to true when no aria-label is provided. */
  "aria-hidden"?: boolean;
}

// SF Symbols-inspired SVG icons (using SF Symbols-style paths)
// For icons with multiple paths, use an array of path strings
const symbolPaths: Record<string, { outline: string | string[]; filled: string | string[] }> = {
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
  "arrow.left": {
    outline: "M11 17l-5-5 5-5M18 12H6",
    filled: "M11 17l-5-5 5-5M18 12H6",
  },
  "house": {
    outline: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    filled: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  },
  "magnifyingglass": {
    outline: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
    filled: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  },
  "chart.bar": {
    outline: "M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z",
    filled: "M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z",
  },
  "person.2": {
    outline: "M12 4.354a4 4 0 1 1 0 5.292M15 21H3v-1a6 6 0 0 1 12 0v1zm0 0h6v-1a6 6 0 0 0-9-5.197M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
    filled: "M12 4.354a4 4 0 1 1 0 5.292M15 21H3v-1a6 6 0 0 1 12 0v1zm0 0h6v-1a6 6 0 0 0-9-5.197M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
  },
  "book": {
    outline: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    filled: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  "heart": {
    outline: "M4.318 6.318a4.5 4.5 0 0 0 0 6.364L12 20.364l7.682-7.682a4.5 4.5 0 0 0-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 0 0-6.364 0z",
    filled: "M4.318 6.318a4.5 4.5 0 0 0 0 6.364L12 20.364l7.682-7.682a4.5 4.5 0 0 0-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 0 0-6.364 0z",
  },
  "sparkles": {
    outline: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    filled: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  },
  "briefcase": {
    outline: "M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m4 6h.01M5 20h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z",
    filled: "M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m4 6h.01M5 20h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z",
  },
  "paintbrush": {
    outline: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 1 1 3.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
    filled: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 1 1 3.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  },
  "code": {
    outline: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    filled: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  },
  "wrench": {
    outline: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    filled: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  },
  "arrow.up.right": {
    outline: "M5.75 18.23C6.07 18.55 6.52 18.57 6.85 18.23L15.78 9.32L17.57 7.39C17.87 7.09 17.87 6.69 17.58 6.41C17.29 6.12 16.88 6.11 16.59 6.41L14.66 8.20L5.75 17.13C5.41 17.46 5.42 17.91 5.75 18.23ZM16.89 11.99V15.24C16.89 15.66 17.26 16.04 17.69 16.04C18.11 16.04 18.49 15.68 18.48 15.20L18.48 6.37C18.48 5.86 18.15 5.52 17.63 5.52H8.79C8.30 5.52 7.96 5.88 7.96 6.31C7.96 6.73 8.34 7.09 8.75 7.09H11.81L17.10 6.91L16.89 11.99Z",
    filled: "M5.75 18.23C6.07 18.55 6.52 18.57 6.85 18.23L15.78 9.32L17.57 7.39C17.87 7.09 17.87 6.69 17.58 6.41C17.29 6.12 16.88 6.11 16.59 6.41L14.66 8.20L5.75 17.13C5.41 17.46 5.42 17.91 5.75 18.23ZM16.89 11.99V15.24C16.89 15.66 17.26 16.04 17.69 16.04C18.11 16.04 18.49 15.68 18.48 15.20L18.48 6.37C18.48 5.86 18.15 5.52 17.63 5.52H8.79C8.30 5.52 7.96 5.88 7.96 6.31C7.96 6.73 8.34 7.09 8.75 7.09H11.81L17.10 6.91L16.89 11.99Z",
  },
  "chevron.down": {
    outline: "M6 9l6 6 6-6",
    filled: "M6 9l6 6 6-6",
  },
  "chevron.up": {
    outline: "M18 15l-6-6-6 6",
    filled: "M18 15l-6-6-6 6",
  },
  "eye": {
    outline: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    filled: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
  },
  "eye.slash": {
    outline: [
      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
      "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
      "M3 3l18 18"
    ],
    filled: [
      "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
      "M3 3l18 18"
    ],
  },
  "document.on.document": {
    outline: ["M19 9v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2z", "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"],
    filled: ["M19 9v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2z", "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"],
  },
  "checkmark.circle": {
    outline: ["M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z", "M9 12l2 2 4-4"],
    filled: ["M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z", "M9 12l2 2 4-4"],
  },
};

const strokeWidths: Record<string, number> = {
  regular: 1.5,
  medium: 1.75,
  semibold: 2,
  bold: 2.25,
};

export const SFSymbol = forwardRef<SVGSVGElement, SFSymbolProps>(
  ({ name, size = 20, weight = "regular", className = "", filled = false, "aria-label": ariaLabel, "aria-hidden": ariaHidden }, ref) => {
    const symbol = symbolPaths[name];
    const strokeWidth = strokeWidths[weight];

    if (!symbol) {
      console.warn(`SF Symbol "${name}" not found`);
      return null;
    }

    const path = filled ? symbol.filled : symbol.outline;
    const paths = Array.isArray(path) ? path : [path];
    const isEyeSlash = name === "eye.slash";

    // If no aria-label provided, treat as decorative (aria-hidden=true)
    // If aria-label provided, use role="img" for proper semantics
    const isDecorative = ariaHidden ?? !ariaLabel;

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-label={ariaLabel}
        aria-hidden={isDecorative}
        role={ariaLabel ? "img" : undefined}
        style={{
          display: "inline-block",
          verticalAlign: "middle",
        }}
      >
        {paths.map((p, index) => {
          // For eye.slash, the slash line (last path) should always be a stroke
          // The eye shape should be filled when filled=true, stroke when filled=false
          const isSlashLine = isEyeSlash && index === paths.length - 1;
          const shouldFill = filled && !isSlashLine;
          
          return (
            <path
              key={index}
              d={p}
              fill={shouldFill ? "currentColor" : "none"}
              stroke={isSlashLine || !filled ? "currentColor" : "none"}
              strokeWidth={isSlashLine || !filled ? strokeWidth : 0}
            />
          );
        })}
      </svg>
    );
  }
);

SFSymbol.displayName = "SFSymbol";
