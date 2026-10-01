"use client";

// Renders the ORIGINAL platform PartnerGetStartedChecklist (./partnerGetStarted, real task list)
// on top of the ORIGINAL GetStartedChecklist (./original, verbatim).
// In production a task completes when the platform status API reports it; here it completes
// shortly after its CTA is pressed, standing in for "the partner did the step".
import { useRef, useState } from "react";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { DemoButton, DemoStage } from "../DemoStage";
import { PartnerGetStartedChecklist } from "./partnerGetStarted/PartnerGetStartedChecklist";

const STATUS_DELAY_MS = 700; // fake status refresh after the partner acts

export function GetStartedChecklistDemo() {
  const [run, setRun] = useState(0);
  const [completed, setCompleted] = useState([]);
  const timers = useRef([]);

  const reset = () => {
    timers.current.forEach(clearTimeout);
    setCompleted([]);
    setRun((n) => n + 1);
  };

  const onTaskAction = (id) => {
    timers.current.push(
      setTimeout(() => setCompleted((ids) => (ids.includes(id) ? ids : [...ids, id])), STATUS_DELAY_MS)
    );
  };

  return (
    <DemoStage
      caption="The original component, live. Open the checklist, work through the steps in order and watch the ring fill."
      controls={<DemoButton onClick={reset}>Reset</DemoButton>}>
      <div className="adtraction-demo" style={{ maxWidth: 400, minHeight: 440, margin: "0 auto" }}>
        <PartnerGetStartedChecklist
          key={run}
          initialCompletedIds={completed}
          onTaskAction={onTaskAction}
        />
      </div>
    </DemoStage>
  );
}
