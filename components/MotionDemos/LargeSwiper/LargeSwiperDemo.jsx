"use client";

// Renders the ORIGINAL toolkit LargeSwiper (vendored unchanged) driven like its Storybook
// "AutoTransition" story, plus the copy-link state from "AllStates". Only the data is fake.
import { useState } from "react";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { LargeSwiper, LargeSwiperStates, ToasterContainer } from "@adtraction/ui-components";
import { DemoButton, DemoStage } from "../DemoStage";

export function LargeSwiperDemo() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const reset = () => {
    setIsUnlocked(false);
    setResetKey((k) => k + 1);
  };

  return (
    <DemoStage
      caption="The original component, live. Drag the thumb past halfway or click it; hover the sent and pending states for their tooltips. Below: the copy-link state once a partner is approved."
      controls={<DemoButton onClick={reset}>Reset</DemoButton>}>
      <div className="adtraction-demo" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <ToasterContainer />
        <LargeSwiper
          key={resetKey}
          text="Apply to promote brand"
          initialState={LargeSwiperStates.APPLY}
          unlockedState={LargeSwiperStates.APPLICATION_SENT}
          isUnlocked={isUnlocked}
          autoTransition={true}
          reviewerType="manager"
          onUnlock={() => setIsUnlocked(true)}
        />
        <LargeSwiper
          text="https://track.adtraction.com/t/t?a=123&t=1"
          initialState={LargeSwiperStates.APPLY}
          unlockedState={LargeSwiperStates.COPY_LINK}
          isUnlocked={true}
          onClick={() => {}}
        />
      </div>
    </DemoStage>
  );
}
