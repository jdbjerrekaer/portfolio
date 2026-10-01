"use client";

// Renders the ORIGINAL brands files (./original, verbatim apart from one import path):
// the channel-access card list with its capped stagger, the promo-code limit indicators,
// and the promo-codes modal limit notice with its enter/exit.
import { useEffect, useRef, useState } from "react";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { InfoBox } from "@adtraction/ui-components";
import { i18n } from "@adtraction/shared-i18n";
import { DemoButton, DemoStage } from "../DemoStage";
import ChannelRuleCard from "./original/pages/partnerAccess/channelAccess/ChannelRuleCard";
import ChannelRuleToggleCard from "./original/pages/partnerAccess/channelAccess/ChannelRuleToggleCard";
import styles from "./original/pages/partnerAccess/channelAccess/ChannelAccessPage.module.scss";
import { PromoCodeLimitIndicators } from "./original/pages/brand/pageItems/promoCodes/PromoCodeLimitIndicators";
import { limitMessageForSelection } from "./original/pages/brand/pageItems/promoCodes/promoCodeLimits";
import modalStyles from "./original/components/brand/promoCodesModal/PromoCodesModal.module.scss";

// Fake channel-types payload (real slugs, so labels and descriptions come from the real copy).
const CHANNEL_TYPES = [
  { id: 1, slug: "content", locked: true },
  { id: 2, slug: "comparison" },
  { id: 3, slug: "cashback" },
  { id: 4, slug: "searchEngineAds" },
  { id: 5, slug: "email" },
  { id: 6, slug: "tiktok" },
  { id: 7, slug: "youtube" },
  { id: 8, slug: "promoCodes" },
];

// Fake limits: 2 shared slots left, exclusive pool full (3 of 3 live).
const LIMITS = {
  nonExclusive: { limit: 10, liveCount: 8 },
  exclusive: { limit: 3, liveCount: 3 },
};

export function StaggerDemo() {
  const [cardsEnterKey, setCardsEnterKey] = useState(0);
  const [workingDisallowed, setWorkingDisallowed] = useState(() => new Set([4, 6]));
  const [exclusiveSelected, setExclusiveSelected] = useState(false);

  const handleToggle = (id) =>
    setWorkingDisallowed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Verbatim from PromoCodesModal.jsx: keep the notice mounted through its exit.
  const blockedSelection = exclusiveSelected ? limitMessageForSelection(LIMITS, true) : null;
  const [limitNotice, setLimitNotice] = useState(null);
  const [limitNoticeExiting, setLimitNoticeExiting] = useState(false);
  const limitNoticeRef = useRef(null);
  limitNoticeRef.current = limitNotice;

  useEffect(() => {
    if (blockedSelection) {
      setLimitNoticeExiting(false);
      setLimitNotice(blockedSelection);
      return;
    }
    if (limitNoticeRef.current) {
      setLimitNoticeExiting(true);
    }
  }, [exclusiveSelected]); // eslint-disable-line react-hooks/exhaustive-deps -- original deps on a memoised value

  const handleLimitNoticeAnimationEnd = (event) => {
    if (event.target !== event.currentTarget) return;
    if (!limitNoticeExiting) return;
    setLimitNotice(null);
    setLimitNoticeExiting(false);
  };

  const editable = true;

  return (
    <DemoStage
      caption="The original components, live. Channel cards enter 32 ms apart, capped at 128 ms so long lists never feel slow; the two limit chips follow 45 ms apart; the limit notice settles in and eases out instead of popping."
      controls={
        <>
          <DemoButton onClick={() => setCardsEnterKey((k) => k + 1)}>Replay</DemoButton>
          <DemoButton pressed={exclusiveSelected} onClick={() => setExclusiveSelected((v) => !v)}>
            Pick an exclusive channel
          </DemoButton>
        </>
      }>
      <div className="adtraction-demo" style={{ display: "flex", flexDirection: "column", gap: "var(--size-space-600)" }}>
        <div key={cardsEnterKey} className={`${styles.cardList} ${styles.cardListEnter}`}>
          {CHANNEL_TYPES.map((channelType) => {
            const isActive = !workingDisallowed.has(channelType.id);
            return (
              <div key={channelType.id} className={styles.flipItem}>
                {editable && !channelType.locked ? (
                  <ChannelRuleToggleCard channelType={channelType} active={isActive} onToggle={handleToggle} />
                ) : (
                  <ChannelRuleCard
                    channelType={channelType}
                    active={channelType.locked ? true : isActive}
                    editable={editable}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className={modalStyles.modal_inner_container}>
          <PromoCodeLimitIndicators key={cardsEnterKey} limits={LIMITS} />
          {limitNotice && (
            <div
              className={`${modalStyles.limit_notice}${limitNoticeExiting ? ` ${modalStyles.limit_notice_exit}` : ""}`}
              onAnimationEnd={handleLimitNoticeAnimationEnd}>
              <InfoBox
                tone="banana"
                items={[
                  {
                    title: i18n.t(limitNotice.key, { limit: limitNotice.limit }),
                  },
                ]}
              />
            </div>
          )}
        </div>
      </div>
    </DemoStage>
  );
}
