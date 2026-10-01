"use client";
import React, { useEffect, useReducer, useRef, useState } from "react";
import { Button, Loader } from "@adtraction/ui-components";
import { i18n } from "@adtraction/shared-i18n";
import ErrorStateIllustration from "./ErrorStateIllustration";
import styles from "./ErrorState.module.scss";

// The root boundary can catch before i18n has finished initialising.
const useI18nReady = () => {
  const [, rerender] = useReducer((n) => n + 1, 0);
  const readyAtFirstRender = useRef(i18n.isInitialized);
  useEffect(() => {
    if (i18n.isInitialized) {
      if (!readyAtFirstRender.current) rerender();
      return undefined;
    }
    i18n.on("initialized", rerender);
    return () => i18n.off("initialized", rerender);
  }, []);
};

const goToDashboard = () => window.location.assign("/dashboard");

/**
 * Error view rendered by ErrorBoundary. Lays itself out from the width of the
 * slot it lands in (container query), so one component serves a small widget,
 * a card and a full page.
 *
 * @param {("section"|"page")} [scope="section"] - What failed; picks the copy and page-only actions.
 * @param {boolean} [retrying=false] - Show the automatic-retry state.
 * @param {boolean} [reloadOnly=false] - A failed remote load: only a reload can recover it.
 * @param {function} [onRetry] - Re-render the failed tree.
 * @param {function} [onReload] - Reload the page.
 */
const ErrorState = ({
  scope = "section",
  retrying = false,
  reloadOnly = false,
  onRetry = () => {},
  onReload = () => {}
}) => {
  useI18nReady();
  const [shakeHint, setShakeHint] = useState(false);

  const kind = reloadOnly ? "load" : "render";
  const t = (key) => i18n.t(`platform.errorState.${key}`);
  const retryText = t("retry");
  const reloadText = t("reload");
  const dashboardText = t("dashboard");

  return (
    <div
      className={styles.errorState}
      data-scope={scope}
      data-retrying={retrying}
      data-scroll-shadow-target="true">
      <div className={styles.content} role={retrying ? "status" : "alert"} aria-live={retrying ? "polite" : undefined}>
        <ErrorStateIllustration
          kind={kind}
          retrying={retrying}
          onShakeLoose={reloadOnly ? () => setShakeHint(true) : onRetry}
        />
        <div className={styles.text}>
          <h2 className={styles.title}>{retrying ? t("retrying") : t(`${scope}.${kind}.title`)}</h2>
          {!retrying && <p className={styles.description}>{t(`${kind}.description`)}</p>}
          {shakeHint && (
            <p className={styles.shakeHint} role="status">
              {t("load.shakeHint")}
            </p>
          )}
          <div className={styles.actions} data-nudge={shakeHint}>
            {retrying ? (
              <Loader loadingBar />
            ) : reloadOnly ? (
              <Button text={reloadText} ariaLabel={reloadText} onClick={onReload} />
            ) : (
              <>
                <Button text={retryText} ariaLabel={retryText} onClick={onRetry} />
                <Button text={reloadText} ariaLabel={reloadText} type="ghost" onClick={onReload} />
              </>
            )}
          </div>
          {!retrying && scope === "page" && window.location.pathname !== "/dashboard" && (
            <div className={styles.escape}>
              <Button text={dashboardText} ariaLabel={dashboardText} type="secondary" size="small" onClick={goToDashboard} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
