// @ts-nocheck -- vendored verbatim; flags.tsx is trimmed, so the full-list types no longer line up.
import React from "react";
import { Flag } from "./Flag";
import { Flags } from "./flags";

interface FlagPreloaderProps {
  /** If true, only preload active/supported countries instead of all flags */
  activeCountriesOnly?: boolean;
  /** Custom list of country codes to preload. Takes precedence over activeCountriesOnly */
  customCountries?: string[];
  /** Optional additional flags to preload beyond the selected set */
  additionalFlags?: string[];
  /** Height for preloaded flags */
  height?: string;
  /** Width for preloaded flags */
  width?: string;
}

// Type for valid flag codes
type FlagCode = keyof typeof Flags;

// Active/supported countries list
const ACTIVE_COUNTRIES: FlagCode[] = [
  "SE",
  "AT",
  "BE",
  "HR",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "IT",
  "LV",
  "LT",
  "NL",
  "NO",
  "PL",
  "PT",
  "ES",
  "CH",
  "GB",
  "MX",
  "EuropeanUnion"
];

/**
 * FlagPreloader component that preloads flags by rendering them off-screen.
 * This helps prevent loading delays when flags are first displayed in the UI.
 */
export const FlagPreloader: React.FC<FlagPreloaderProps> = ({
  activeCountriesOnly = false,
  customCountries = [],
  additionalFlags = [],
  height = "16",
  width = "16"
}) => {
  // Determine which flags to preload based on parameters
  let baseFlagCodes: FlagCode[];

  if (customCountries.length > 0) {
    // Use custom countries list, filter to valid flag codes
    baseFlagCodes = customCountries.filter((flag): flag is FlagCode => flag in Flags);
  } else if (activeCountriesOnly) {
    // Use predefined active countries
    baseFlagCodes = ACTIVE_COUNTRIES;
  } else {
    // Use all available flags (default behavior)
    baseFlagCodes = Object.keys(Flags) as FlagCode[];
  }

  // Combine base flags with any additional ones provided, filtering to valid flag codes
  const flagsToPreload = [
    ...new Set([
      ...baseFlagCodes,
      ...additionalFlags.filter((flag): flag is FlagCode => flag in Flags)
    ])
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        opacity: 0,
        pointerEvents: "none"
      }}
      aria-hidden="true">
      {flagsToPreload.map((flagCode) => (
        <Flag key={flagCode} flag={flagCode} height={height} width={width} />
      ))}
    </div>
  );
};
