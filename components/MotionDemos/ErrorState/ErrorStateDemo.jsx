"use client";

// Renders the ORIGINAL main-app ErrorState (./original, copied verbatim) with a fake retry.
import { useRef, useState } from "react";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { DemoButton, DemoStage } from "../DemoStage";
import ErrorState from "./original/ErrorState";

const RETRY_MS = 1200; // fake retry; the failed tree "fails again"

// Same slot styling as ErrorState.stories.jsx (half-width panel).
const slot = {
  height: 360,
  overflow: "auto",
  background: "var(--surface-card)",
  borderRadius: "var(--size-radius-400)"
};

export function ErrorStateDemo() {
  const [kind, setKind] = useState("render");
  const [retrying, setRetrying] = useState(false);
  const [mount, setMount] = useState(0);
  const timer = useRef(null);

  const retry = () => {
    clearTimeout(timer.current);
    setRetrying(true);
    timer.current = setTimeout(() => setRetrying(false), RETRY_MS);
  };
  const show = (next) => {
    clearTimeout(timer.current);
    setRetrying(false);
    setKind(next);
    setMount((m) => m + 1);
  };

  return (
    <DemoStage
      caption="The original component, live. Hover the illustration, then click it three times. The load error refuses to shake loose and points at Reload."
      controls={
        <>
          <DemoButton pressed={kind === "render"} onClick={() => show("render")}>
            Render error
          </DemoButton>
          <DemoButton pressed={kind === "load"} onClick={() => show("load")}>
            Load error
          </DemoButton>
          <DemoButton onClick={() => show(kind)}>Replay entrance</DemoButton>
        </>
      }>
      <div className="adtraction-demo" style={slot}>
        <ErrorState
          key={mount}
          scope="section"
          retrying={retrying}
          reloadOnly={kind === "load"}
          onRetry={retry}
          onReload={() => show(kind)}
        />
      </div>
    </DemoStage>
  );
}
