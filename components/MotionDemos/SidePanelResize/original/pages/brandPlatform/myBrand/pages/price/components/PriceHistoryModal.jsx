import "../../../../../../i18n/initialize";
import React, { useEffect, useState } from "react";
import { i18n } from "@adtraction/shared-i18n";
import { FeedItem, Loader, Modal, PlaceholderSkeleton } from "@adtraction/ui-components";
import { Icons } from "@adtraction/ui-icons";
import brandsAgent from "../../../../../../superagent/brandsAgent";
import { buildPriceHistoryFeedItems } from "./priceHistoryFeedUtils";
import styles from "./PriceHistoryModal.module.scss";

/** Delay the progress bar so sub-second loads don't flash a loader (loading fatigue). */
const LOADER_BAR_DELAY_MS = 400;
/** After this, show a calm status line — history can be very slow on the backend. */
const SLOW_HINT_DELAY_MS = 2500;
const SKELETON_ROW_COUNT = 6;

/**
 * Side-panel history for a compensation segment.
 * Merges pending FutureCompensationSegment rows (upcoming) with Envers revisions (applied).
 */
const PriceHistoryModal = ({
  isOpen,
  onClose,
  compensationSegmentId,
  liveValue,
  isPercentage = true,
  currencyName = ""
}) => {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showLoaderBar, setShowLoaderBar] = useState(false);
  const [showSlowHint, setShowSlowHint] = useState(false);

  useEffect(() => {
    if (!isOpen || compensationSegmentId == null) {
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    setFeedItems([]);
    setShowLoaderBar(false);
    setShowSlowHint(false);

    Promise.all([
      brandsAgent.getCompensationSegmentHistory(compensationSegmentId),
      brandsAgent.getFutureCompensationSegments()
    ])
      .then(([historyRes, futureRes]) => {
        if (cancelled) return;
        setFeedItems(
          buildPriceHistoryFeedItems({
            compensationSegmentId,
            historyEntries: Array.isArray(historyRes) ? historyRes : [],
            futureSegments: Array.isArray(futureRes) ? futureRes : [],
            liveValue,
            isPercentage,
            currencyName,
            t: i18n.t.bind(i18n)
          })
        );
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, compensationSegmentId, liveValue, isPercentage, currencyName]);

  useEffect(() => {
    if (!loading) {
      setShowLoaderBar(false);
      setShowSlowHint(false);
      return undefined;
    }

    const barTimer = window.setTimeout(() => setShowLoaderBar(true), LOADER_BAR_DELAY_MS);
    const hintTimer = window.setTimeout(() => setShowSlowHint(true), SLOW_HINT_DELAY_MS);

    return () => {
      window.clearTimeout(barTimer);
      window.clearTimeout(hintTimer);
    };
  }, [loading]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onOutsideClick={onClose}
      variant="sidePanel"
      maxHeight="92vh"
      title={i18n.t("brands.myBrand.price.priceCard.historyModalTitle")}>
      {loading && (
        <div className={styles.loading} aria-busy="true" aria-live="polite">
          <div className={styles.loadingBarSlot}>
            {showLoaderBar && (
              <div className={styles.loadingChromeEnter}>
                <Loader loadingBar size="default" />
              </div>
            )}
          </div>
          {showSlowHint && (
            <p className={`${styles.slowHint} ${styles.loadingChromeEnter}`}>
              {i18n.t("brands.myBrand.price.priceCard.historyLoadingSlow")}
            </p>
          )}
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
            <div key={i} className={styles.loadingRow}>
              <PlaceholderSkeleton isLoading width="1.5rem" initialHeight="1.5rem" />
              <div className={styles.loadingText}>
                <PlaceholderSkeleton isLoading width="60%" initialHeight="0.875rem" />
                <PlaceholderSkeleton isLoading width="40%" initialHeight="0.75rem" />
              </div>
              <PlaceholderSkeleton isLoading width="3rem" initialHeight="0.875rem" />
            </div>
          ))}
        </div>
      )}
      {!loading && error && (
        <p className={styles.error}>{i18n.t("brands.myBrand.price.priceCard.historyLoadError")}</p>
      )}
      {!loading && !error && feedItems.length === 0 && (
        <p className={styles.empty}>{i18n.t("brands.myBrand.price.priceCard.historyEmpty")}</p>
      )}
      {!loading && !error && feedItems.length > 0 && (
        <div className={styles.feed} role="list">
          {feedItems.map((item, index) => {
            const isScheduled = item.kind === "scheduled";
            return (
              <FeedItem
                key={item.id}
                size="default"
                text={item.text}
                description={item.description}
                caption={item.caption}
                role="listitem"
                icon={
                  isScheduled ? (
                    <Icons.Time.Calendar
                      width={16}
                      height={16}
                      color="var(--peach-color-500, #e38b78)"
                      aria-hidden
                    />
                  ) : (
                    <Icons.Time.Clock
                      width={16}
                      height={16}
                      color="var(--text-body-default)"
                      aria-hidden
                    />
                  )
                }
                isLast={index === feedItems.length - 1}
              />
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default PriceHistoryModal;
