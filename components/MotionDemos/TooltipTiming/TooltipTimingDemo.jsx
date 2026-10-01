"use client";

// Renders the ORIGINAL toolkit TableSelectionBar (vendored in ../adtraction, unchanged): a row of
// toolkit icon Buttons, each wrapped in a real Tippy tooltip. Timing comes from the toolkit's global
// tippyDefaults (../adtraction/tippyDefaults, loaded once in clientDemos): the first tooltip waits
// 600 ms, any tooltip that opens within 1.4 s of the last one opening shows instantly. The entrance
// (scale up, lift, unblur) is the toolkit's tippy-motion mixin in adtraction-global.scss.
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { i18n } from "@adtraction/shared-i18n";
import { DemoStage } from "../DemoStage";
import { TableSelectionBar } from "../adtraction/components/components/table/TableSelectionBar";

// The bar is position: fixed at the bottom of the viewport in the platform; the shellStyle prop
// (part of the component's API) pins it inside the stage instead.
const SHELL_STYLE = {
  position: "relative",
  left: "auto",
  right: "auto",
  bottom: "auto",
  zIndex: "auto",
  padding: 0,
};

// Fake cell-range selection, labelled the way TableWrapper builds its metrics.
const cells = i18n.t("ui.toolkit.table.cell_plural");
const METRICS = [
  { key: "count", value: "12", label: `${cells.charAt(0).toUpperCase()}${cells.slice(1)}` },
  { key: "average", value: "1 284.5", label: i18n.t("ui.toolkit.table.avg") },
  { key: "sum", value: "15 414", label: i18n.t("ui.toolkit.table.sum") },
];

export function TooltipTimingDemo() {
  return (
    <DemoStage caption="The original table selection bar, live. Rest on one icon and its tooltip waits 600 ms; slide across to the next within 1.4 s and it opens instantly. Each one scales up, lifts and unblurs as it opens.">
      <div
        className="adtraction-demo"
        style={{ display: "flex", justifyContent: "center", paddingBottom: "var(--size-space-1200)" }}>
        <TableSelectionBar
          ariaLabel="Selection"
          metrics={METRICS}
          shellStyle={SHELL_STYLE}
          showSwitchToRows={true}
          onCopy={() => {}}
          onSwitchToRows={() => {}}
          onClear={() => {}}
        />
      </div>
    </DemoStage>
  );
}
