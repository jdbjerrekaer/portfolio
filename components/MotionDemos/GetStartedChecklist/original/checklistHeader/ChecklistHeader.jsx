import React from "react";
import { Icons } from "@adtraction/ui-icons";
import { i18n } from "@adtraction/shared-i18n";
import { RING_CIRCUMFERENCE } from "../ring";
import styles from "./ChecklistHeader.module.scss";

export const ChecklistHeader = ({ done, total, expanded, allDone, onToggle }) => {
  const offset = RING_CIRCUMFERENCE - (done / total) * RING_CIRCUMFERENCE;

  return (
    <button
      type="button"
      className={styles.header}
      aria-expanded={expanded}
      onClick={onToggle}>
      <svg className={styles.ring} width="29" height="29" viewBox="0 0 29 29" aria-hidden>
        <circle className={styles.track} cx="14.5" cy="14.5" r="11" />
        <circle
          className={styles.progress}
          cx="14.5"
          cy="14.5"
          r="11"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={styles.title}>
        {allDone
          ? i18n.t("platform.onboarding.checklist.titleDone")
          : i18n.t("platform.onboarding.checklist.title")}
      </span>
      <span className={styles.meta}>
        <span className={styles.count}>
          {i18n.t("platform.onboarding.checklist.completedCount", { done, total })}
        </span>
        <Icons.Arrow.ChevronRight
          className={styles.chevron}
          color="currentColor"
          width="1rem"
          height="1rem"
          aria-hidden
        />
      </span>
    </button>
  );
};
