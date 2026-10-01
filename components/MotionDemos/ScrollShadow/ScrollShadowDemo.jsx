"use client";

// Renders the ORIGINAL toolkit ScrollShadow exactly as its "Idle Hint With Tooltip"
// story does (ScrollShadow.stories.jsx: ScrollExample + IdleHintWithTooltip args).
import { useId } from "react";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { ScrollShadow } from "@adtraction/ui-components";
import { DemoStage } from "../DemoStage";

// Story args, verbatim.
const ARGS = {
  dark: true, // product default: light surface, dark edge shadows (the story pairs dark false with a dark box)
  hideScrollBar: false,
  size: "standard",
  strength: 5,
  blur: "0.1875rem",
  direction: "vertical",
  showIdleHint: true,
  showTooltip: true,
  tooltipText: "",
  idleHintDelay: 4000
};

export function ScrollShadowDemo() {
  const uid = useId().replace(/:/g, "");
  const wrapperId = `wrapper-idle-hint-${uid}`;
  const contentId = `content-idle-hint-${uid}`;
  const items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
  const isDark = ARGS.dark === false;

  return (
    <DemoStage caption="The original component, live. Leave the list alone for four seconds and a hint nudges toward the hidden rows; hover it for the tooltip.">
      <div className="adtraction-demo" style={{ maxWidth: "400px", margin: "0 auto" }}>
        <div
          id={wrapperId}
          style={{
            position: "relative",
            backgroundColor: isDark ? "#333" : "white",
            padding: "4px",
            overflow: "hidden"
          }}>
          <div
            id={contentId}
            style={{
              height: "250px",
              overflow: "auto",
              color: isDark ? "white" : "inherit"
            }}>
            {items.map((item) => (
              <div
                key={item}
                style={{
                  padding: "16px",
                  margin: "8px",
                  backgroundColor: isDark ? "#444" : "#f5f5f5",
                  borderRadius: "4px"
                }}>
                {item}
              </div>
            ))}
          </div>
          <ScrollShadow wrapper={wrapperId} scrollContainer={contentId} {...ARGS} />
        </div>
      </div>
    </DemoStage>
  );
}
