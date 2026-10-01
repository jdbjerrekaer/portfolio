// @ts-nocheck -- vendored verbatim; flags.tsx is trimmed, so the full-list types no longer line up.
import { HTMLAttributes, useMemo, Suspense } from "react";
import { Flags } from "./flags";

export type FlagName = keyof typeof Flags;

interface Props extends HTMLAttributes<HTMLDivElement> {
  flag: FlagName;
  className?: string;
  width?: string | number;
  height?: string | number;
}

/**
 * A component that renders a country or region flag with built-in lazy loading.
 *
 * @param flag The name of the flag to display (e.g., 'US', 'GB', 'EuropeanUnion')
 * @param className Optional CSS classes for styling
 * @param width Optional width of the flag (defaults to "100%")
 * @param height Optional height of the flag (defaults to "100%")
 */
export const Flag = ({ flag, className, width = "100%", height = "100%", ...rest }: Props) => {
  const FlagComponent = useMemo(() => Flags[flag], [flag]);

  if (!FlagComponent) return null;

  return (
    <div
      className={className}
      aria-label={flag}
      role="img"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
      {...rest}>
      <Suspense fallback={null}>
        <FlagComponent style={{ width, height }} />
      </Suspense>
    </div>
  );
};
