"use client";

// Renders the ORIGINAL Insights KeyMetric (./original, copied verbatim) with fake data.
import { useEffect, useRef, useState } from "react";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { DemoButton, DemoStage } from "../DemoStage";
import { KeyMetric } from "./original/KeyMetric";
import { MULTIPLIER_FORMAT } from "./original/formatMultiplier";

const LOAD_MS = 900; // fake network latency

const LABELS = { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days" };
const DATES = { "7d": ["Sep 17", "Sep 23"], "30d": ["Aug 2", "Aug 31"], "90d": ["Apr 4", "Jul 2"] };

// Made-up figures; [value, change %, previous period value].
const DATA = {
  "7d": { revenue: [18240, 6.2, 17175], conversions: [312, 3.8, 301], rate: [3.42, -0.4, 3.43], roas: [4.1, 1.9, 4.02] },
  "30d": { revenue: [84910, 12.4, 75542], conversions: [1468, 9.1, 1346], rate: [3.15, 1.2, 3.11], roas: [5.6, 4.7, 5.35] },
  "90d": { revenue: [241380, -3.1, 249102], conversions: [4120, -1.6, 4187], rate: [2.88, -2.2, 2.94], roas: [6.3, 0.8, 6.25] },
};

export function KeyMetricDemo() {
  const [range, setRange] = useState("30d");
  const [shown, setShown] = useState("30d"); // data on screen; lags until the fake fetch resolves
  const [loading, setLoading] = useState(true);
  const [cleared, setCleared] = useState(false);
  const timer = useRef(null);

  const load = (next) => {
    clearTimeout(timer.current);
    setRange(next);
    setCleared(false);
    setLoading(true);
    timer.current = setTimeout(() => {
      setShown(next);
      setLoading(false);
    }, LOAD_MS);
  };

  useEffect(() => {
    timer.current = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(timer.current);
  }, []);

  const data = DATA[shown];
  const [fromDate, toDate] = DATES[shown];
  const metric = (header, [value, change, compare], extra = {}) => (
    <KeyMetric
      header={header}
      value={cleared ? null : value}
      loading={loading}
      timeFrame={LABELS[shown]}
      href="#"
      statsBadge={{ value: change, compare, fromDate, toDate }}
      onChangeTimeframe={() => load(shown === "30d" ? "90d" : "30d")}
      {...extra}
    />
  );

  return (
    <DemoStage
      caption="The original component, live. Hover or right-click a metric, hover the change badge, then switch periods, reload or clear the data."
      controls={
        <>
          {Object.keys(DATA).map((r) => (
            <DemoButton key={r} pressed={range === r && !cleared} onClick={() => load(r)}>
              {r}
            </DemoButton>
          ))}
          <DemoButton onClick={() => load(range)}>Reload</DemoButton>
          <DemoButton onClick={() => setCleared(true)} disabled={loading}>
            Clear data
          </DemoButton>
        </>
      }>
      <div className="adtraction-demo" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px 24px" }}>
        {metric("Revenue", data.revenue, { currency: "SEK" })}
        {metric("Conversions", data.conversions, { hideDecimalsAboveThreshold: 0 })}
        {metric("Conversion rate", data.rate, { isPercentValue: true })}
        {metric("ROAS", data.roas, { valueFormat: MULTIPLIER_FORMAT })}
      </div>
    </DemoStage>
  );
}
