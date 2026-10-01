import React from "react";
import { Button } from "@adtraction/ui-components";
import { Icons } from "@adtraction/ui-icons";
import { i18n } from "@adtraction/shared-i18n";
import styles from "./ChecklistCompleted.module.scss";

export const ChecklistCompleted = ({ onContinue, testId }) => {
  return (
    <div className={styles.completed} data-testid={`${testId}-celebration`}>
      <button
        type="button"
        className={styles.close}
        aria-label={i18n.t("platform.onboarding.checklist.closeAria")}
        onClick={onContinue}>
        <Icons.General.XClose width="1rem" height="1rem" aria-hidden />
      </button>
      <div className={styles.medallion} aria-hidden>
        <Icons.General.Check width="1.375rem" height="1.375rem" />
      </div>
      <div className={styles.copy}>
        <h3 className={styles.title}>{i18n.t("platform.onboarding.checklist.celebration.title")}</h3>
        <p className={styles.description}>
          {i18n.t("platform.onboarding.checklist.celebration.description")}
        </p>
      </div>
      <div className={styles.action}>
        <Button
          type="primary"
          text={i18n.t("platform.onboarding.checklist.celebration.continue")}
          iconRight={<Icons.Arrow.ChevronRight />}
          fitContent={false}
          onClick={onContinue}
        />
      </div>
    </div>
  );
};
