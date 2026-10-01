"use client";

// Renders the ORIGINAL toolkit Modal (variant="sidePanel") through the ORIGINAL brands
// PriceHistoryModal (./original, verbatim apart from import lines). The panel opens over the
// page exactly as it does in the platform: drag the left-edge pill to resize (rubber-bands past
// 320px / 80vw and settles back on release), double-click it to reset to 512px, or focus it and
// use the arrow keys, Home and End. The brands API is a fake agent with a short delay.
import { useState } from "react";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { ListItem } from "@adtraction/ui-components";
import { Icons } from "@adtraction/ui-icons";
import { i18n } from "@adtraction/shared-i18n";
import { DemoButton, DemoStage } from "../DemoStage";
import PriceHistoryModal from "./original/pages/brandPlatform/myBrand/pages/price/components/PriceHistoryModal";
import styles from "./SidePanelResizeDemo.module.scss";

const ICON_SIZE = 16;

export function SidePanelResizeDemo() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [panelKey, setPanelKey] = useState(0);

  const open = () => setHistoryOpen(true);
  // Remounting drops the stored width, so the panel reopens at its 512px default.
  const reset = () => {
    setHistoryOpen(false);
    setPanelKey((k) => k + 1);
  };

  return (
    <div className="adtraction-demo">
      <DemoStage
        controls={
          <>
            <DemoButton onClick={open} pressed={historyOpen}>
              Open side panel
            </DemoButton>
            <DemoButton onClick={reset}>Reset width</DemoButton>
          </>
        }>
        <div className={styles.menu}>
          {/* Same trigger as PriceCard's row menu. */}
          <ListItem
            text={i18n.t("brands.myBrand.price.priceCard.menuHistory")}
            iconRight={
              <Icons.Time.ClockRewind
                width={ICON_SIZE}
                height={ICON_SIZE}
                color="var(--primary-blue-500---primary)"
                aria-hidden
              />
            }
            onClick={open}
          />
        </div>
      </DemoStage>
      <PriceHistoryModal
        key={panelKey}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        compensationSegmentId={101}
        liveValue={10}
        isPercentage
      />
    </div>
  );
}
