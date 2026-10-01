import React from "react";
import { Button } from "@adtraction/ui-components";
import { Icons } from "@adtraction/ui-icons";
import { i18n } from "@adtraction/shared-i18n";
import styles from "./ChecklistTaskDetail.module.scss";

export const ChecklistTaskDetail = ({ task, index, total, onBack, onSkip, onComplete }) => {
  const Icon = task.Icon;

  return (
    <div className={styles.detail}>
      <div className={styles.hero}>
        <div className={styles.heroBar}>
          <button
            type="button"
            className={styles.back}
            aria-label={i18n.t("platform.onboarding.checklist.backAria")}
            onClick={onBack}>
            <Icons.Arrow.ChevronLeft width="1rem" height="1rem" aria-hidden />
          </button>
          <span className={styles.progress}>
            {i18n.t("platform.onboarding.checklist.taskProgress", { current: index + 1, total })}
          </span>
        </div>
        <div className={styles.visual} aria-hidden>
          <Icon width="var(--size-icon-3x-large)" height="var(--size-icon-3x-large)" />
        </div>
      </div>
      <div className={styles.copy}>
        <h3 className={styles.title}>{task.title}</h3>
        <p className={styles.description}>{task.description}</p>
      </div>
      <div className={styles.actions}>
        {onSkip ? (
          <div className={styles.skip}>
            <Button
              type="secondary"
              text={i18n.t("platform.onboarding.checklist.skip")}
              fitContent={false}
              onClick={onSkip}
            />
          </div>
        ) : null}
        <div className={styles.cta}>
          <Button
            type="primary"
            text={task.ctaLabel}
            iconRight={task.ctaIcon === false ? undefined : <Icons.Arrow.ChevronRight />}
            fitContent={false}
            onClick={onComplete}
          />
        </div>
      </div>
    </div>
  );
};
