"use client";

// The ORIGINAL brands price-page segment list: useFlipList + pricePage.module.scss +
// SegmentCard/SegmentBudgetTooltip (verbatim, import lines only). Markup mirrors
// pricePage.jsx (segmentListContainer > segmentPanel > segmentList > flipItem > SegmentCard).
import { useState } from "react";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { UserRoleContext } from "@adtraction/util-providers";
import { CLIENT_PRIVILEGES } from "@adtraction/util-constants";
import { DemoButton, DemoStage } from "../DemoStage";
import { useFlipList } from "./original/useFlipList";
import SegmentCard from "./original/components/SegmentCard";
import styles from "./original/pricePage.module.scss";

// Segment shapes from SegmentCard.stories.jsx.
const POOL = [
  { segment_id: 1, name: "Standard", cookieTime: 30, activeCompensationCount: 1, totalCompensationCount: 2 },
  { segment_id: 2, name: "Content partners", cookieTime: 45, activeCompensationCount: 3, totalCompensationCount: 3 },
  { segment_id: "influencers", name: "Influencers", cookieTime: 30, activeCompensationCount: 2, totalCompensationCount: 4, budgetShared: true },
  { segment_id: "cashback", name: "Cashback", cookieTime: 14, activeCompensationCount: 1, totalCompensationCount: 1, budgetShared: false },
  { segment_id: 5, name: "Paused tier", cookieTime: 30, activeCompensationCount: 0, totalCompensationCount: 2 },
  { segment_id: 6, name: "Voucher sites", cookieTime: 7, activeCompensationCount: 2, totalCompensationCount: 2 },
  { segment_id: 7, name: "Newsletters", cookieTime: 30, activeCompensationCount: 1, totalCompensationCount: 3 }
];

const ROLE = { privileges: [CLIENT_PRIVILEGES.SHOW_COMMISSION] };
const noop = () => {};

export function FlipListDemo() {
  const [segments, setSegments] = useState(POOL.slice(0, 4));
  const [selectedId, setSelectedId] = useState(2);
  const segmentListFlipRef = useFlipList(segments.map((s) => s.segment_id).join("|"));

  const add = () => {
    const next = POOL.find((p) => !segments.some((s) => s.segment_id === p.segment_id));
    if (next) setSegments([...segments, next]);
  };
  const shuffle = () => setSegments([...segments].sort(() => Math.random() - 0.5));
  const sortByActive = () =>
    setSegments([...segments].sort((a, b) => b.activeCompensationCount - a.activeCompensationCount));
  const removeLast = () => setSegments(segments.slice(0, -1));

  return (
    <DemoStage
      caption="The original price-page segment list, live. Moved cards slide to their new slot; new cards ease in with a capped stagger. Hover a card or its budget badge."
      controls={
        <>
          <DemoButton onClick={add} disabled={segments.length >= POOL.length}>Add segment</DemoButton>
          <DemoButton onClick={shuffle}>Shuffle</DemoButton>
          <DemoButton onClick={sortByActive}>Sort by active</DemoButton>
          <DemoButton onClick={removeLast} disabled={segments.length === 0}>Remove last</DemoButton>
        </>
      }>
      <UserRoleContext.Provider value={ROLE}>
        <div className="adtraction-demo" style={{ maxWidth: 360, marginInline: "auto" }}>
          <div className={styles.segmentListContainer} style={{ height: "auto" }}>
            <div className={styles.segmentPanel} id="segment-panel-wrapper">
              <div className={styles.segmentList} id="segment-list-scroll" ref={segmentListFlipRef}>
                {segments.map((segment) => (
                  <div key={segment.segment_id} className={styles.flipItem} data-flip-id={String(segment.segment_id)}>
                    <SegmentCard
                      segment={segment}
                      isSelected={selectedId === segment.segment_id}
                      scheduledCount={0}
                      onSelect={(s) => setSelectedId(s.segment_id)}
                      onViewChannels={noop}
                      onTrackingPeriod={noop}
                      onRenameSegment={noop}
                      onDuplicateSegment={noop}
                      onDeleteSegment={noop}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </UserRoleContext.Provider>
    </DemoStage>
  );
}
