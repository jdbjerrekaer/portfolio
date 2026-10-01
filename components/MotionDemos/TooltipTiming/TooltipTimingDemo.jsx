"use client";

// Renders the ORIGINAL toolkit TableSelectionBar (vendored in ../adtraction, unchanged): a row of
// toolkit icon Buttons, each wrapped in a real Tippy tooltip. This bar sets its own delay={[300, 0]},
// which overrides the global smart delay in tippyDefaults (600 ms, then instant within 1.4 s); the
// table headers and sidebar use that global one. The entrance (scale up, lift, unblur) is the
// toolkit's tippy-motion mixin in adtraction-global.scss.
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { i18n } from "@adtraction/shared-i18n";
import { Button } from "@adtraction/ui-components";
import { Icons } from "@adtraction/ui-icons";
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
    <DemoStage caption="The original table selection bar that appears when you select cells, live. Hover the icons to see the tooltip entrance: scale up, lift and unblur.">
      <div
        className="adtraction-demo"
        style={{ display: "flex", justifyContent: "center", paddingBottom: "var(--size-space-1200)" }}>
        <TableSelectionBar
          ariaLabel="Selection"
          metrics={METRICS}
          shellStyle={SHELL_STYLE}
          // Same export button TableWrapper passes in (its export popover is left out here).
          renderExportButton={(s) => (
            <div className={s.export_button_container}>
              <Button
                text={i18n.t("ui.toolkit.table.exportSelection")}
                type="primary"
                iconRight={<Icons.Files.FileDownload03 width={16} height={16} />}
                onClick={() => {}}
                className={s.selection_export_button}
              />
            </div>
          )}
          showSwitchToRows={true}
          onCopy={() => {}}
          onSwitchToRows={() => {}}
          onClear={() => {}}
        />
      </div>
    </DemoStage>
  );
}
