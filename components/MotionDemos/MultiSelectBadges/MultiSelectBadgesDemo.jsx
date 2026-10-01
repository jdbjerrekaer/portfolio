"use client";

// Renders the ORIGINAL toolkit DropdownSelect (vendored unchanged in
// ../adtraction/components/tokens/dropdowns/dropdownSelect) in multiSelect mode. As options are
// ticked, the count badge's container slides open to the exact scrollWidth measured into
// --badge-target-width, the content unblurs in, and the badge pops (scale 0.6 -> 1.08 -> 1).
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { DropdownSelect } from "@adtraction/ui-components";
import { DemoStage } from "../DemoStage";

// Fake brand categories (the platform loads these from the API).
const CATEGORY_OPTIONS = [
  { label: "Fashion & clothing", value: "fashion" },
  { label: "Home & garden", value: "home" },
  { label: "Sports & outdoor", value: "sports" },
  { label: "Health & beauty", value: "beauty" },
  { label: "Electronics", value: "electronics" },
  { label: "Travel", value: "travel" },
  { label: "Food & drink", value: "food" },
  { label: "Finance & insurance", value: "finance" },
  { label: "Kids & toys", value: "kids" },
  { label: "Pets", value: "pets" },
];

const MARKET_OPTIONS = [
  { label: "Sweden", value: "SE" },
  { label: "Denmark", value: "DK" },
  { label: "Norway", value: "NO" },
  { label: "Finland", value: "FI" },
  { label: "Germany", value: "DE" },
  { label: "Netherlands", value: "NL" },
];

export function MultiSelectBadgesDemo() {
  return (
    <DemoStage caption="The original multi-select, live. Tick an option and the count badge slides open to its exact measured width, then pops in; clear the last one and it folds away again.">
      <div
        className="adtraction-demo"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--size-space-400)",
          alignItems: "flex-start",
          minHeight: "21rem", // fits the open option list
        }}>
        <DropdownSelect multiSelect search text="Categories" options={CATEGORY_OPTIONS} />
        <DropdownSelect multiSelect text="Markets" options={MARKET_OPTIONS} />
      </div>
    </DemoStage>
  );
}
