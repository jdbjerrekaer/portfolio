"use client";
import React, { useEffect, useState } from "react";
import { i18n } from "@adtraction/shared-i18n";
import { Badge, Loader, ListItem } from "@adtraction/ui-components";
import { Icons } from "@adtraction/ui-icons";
import { formatNumber } from "@adtraction/util-number";
import brandsAgent from "../../brandsAgent";
import styles from "./SegmentBudgetTooltip.module.scss";

const ICON_SIZE = 16;

const SegmentBudgetTooltip = ({ segmentId, fetchEnabled }) => {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!segmentId || !fetchEnabled) return;
    let cancelled = false;
    setLoading(true);
    setError(false);

    brandsAgent
      .getSegmentBudget(segmentId)
      .then((data) => {
        if (!cancelled) setBudget(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [segmentId, fetchEnabled]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Loader dotSpin size="small"/>
      </div>
    );
  }

  if (error || !budget) {
    return null;
  }

  const isShared = budget.shared;
  const unitLabel = budget.unit || "";
  const isCost = unitLabel === "Cost";

  const periodLabel = budget.period
    ? i18n.t("brands.myBrand.price.segmentBudget.resetsPeriod", {
        period: budget.period.toLowerCase()
      })
    : null;

  const thresholdFormatted = formatNumber(budget.threshold, { decimalPlaces: 2 });
  const remainingFormatted = formatNumber(budget.remainingValue, { decimalPlaces: 2 });

  const remainingLabel =
    unitLabel === "Cost"
      ? i18n.t("brands.myBrand.price.segmentBudget.remainingCost")
      : unitLabel === "CPC clicks"
        ? i18n.t("brands.myBrand.price.segmentBudget.remainingUniqueVisitors")
        : unitLabel === "Sales"
          ? i18n.t("brands.myBrand.price.segmentBudget.remainingSales")
          : unitLabel === "Leads"
            ? i18n.t("brands.myBrand.price.segmentBudget.remainingLeads")
            : unitLabel === "Sales + Leads"
              ? i18n.t("brands.myBrand.price.segmentBudget.remainingConversions")
              : i18n.t("brands.myBrand.price.segmentBudget.remainingGeneric");

  const fallback =
    budget.fallbackSegmentName ||
    i18n.t("brands.myBrand.price.segmentBudget.fallbackStandard");
  const fallbackDescription = isShared
    ? i18n.t("brands.myBrand.price.segmentBudget.fallbackWhenBudgetRunsOut")
    : i18n.t("brands.myBrand.price.segmentBudget.fallbackWhenChannelLimit");

  return (
    <div className={styles.popover}>
      <div className={styles.title}>
        <span className={styles.titleText}>
          {isShared
            ? i18n.t("brands.myBrand.price.segmentBudget.titleShared")
            : i18n.t("brands.myBrand.price.segmentBudget.titleIndividual")}
        </span>
        <span className={styles.titleSub}>
          {isShared
            ? i18n.t("brands.myBrand.price.segmentBudget.subtitleShared")
            : i18n.t("brands.myBrand.price.segmentBudget.subtitleIndividual")}
        </span>
      </div>

      <div className={styles.budgetBox}>
        {isShared ? (
          <>
            <span className={styles.budgetBoxLabel}>{remainingLabel}</span>
            <div className={styles.budgetBoxRow}>
              <span className={styles.budgetAmount}>{remainingFormatted}</span>
              <span className={styles.budgetSeparator}>/</span>
              <div className={styles.budgetMax}>
                <span className={styles.budgetMaxAmount}>{thresholdFormatted}</span>
                {isCost && budget.currency && (
                  <Badge size="small" text={budget.currency} />
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <span className={styles.budgetBoxLabel}>
              {i18n.t("brands.myBrand.price.segmentBudget.limitPerChannel")}
            </span>
            <div className={styles.budgetBoxRow}>
              <span className={styles.budgetAmount}>{thresholdFormatted}</span>
              {isCost && budget.currency ? (
                <Badge size="small" text={budget.currency} />
              ) : unitLabel ? (
                <Badge size="small" text={unitLabel} />
              ) : null}
            </div>
          </>
        )}
        {periodLabel && <span className={styles.budgetBoxPeriod}>{periodLabel}</span>}
      </div>

      <div className={styles.fallbackItem}>
        <ListItem
          size="small"
          hoverable={false}
          text={fallback}
          description={fallbackDescription}
          iconLeft={
            <Icons.Finance.CoinsStacked01
              width={ICON_SIZE}
              height={ICON_SIZE}
              aria-hidden
            />
          }
        />
      </div>

      {!isShared && (
        <span className={styles.footer}>
          {i18n.t("brands.myBrand.price.segmentBudget.footerIndividual")}
        </span>
      )}
    </div>
  );
};

export default SegmentBudgetTooltip;
