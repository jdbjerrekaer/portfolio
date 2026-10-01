import React from "react";
// import { Icons } from "@adtraction/ui-icons";
import { Illustrations } from "@adtraction/ui-illustrations";
import { i18n } from "@adtraction/shared-i18n";

export default (props) => {
  // More friendly and contextual messaging
  const getFriendlyMessage = () => {
    if (props.noDataText) {
      return props.noDataText;
    }

    // Professional, contextual messages for no data state
    const noDataMessages = [
      i18n.t("ui.toolkit.noRowsOverlay.noInsightsAvailable"),
      i18n.t("ui.toolkit.noRowsOverlay.noInsightsFound"),
      i18n.t("ui.toolkit.noRowsOverlay.noInsightsToDisplay"),
      i18n.t("ui.toolkit.noRowsOverlay.insightsNotAvailable"),
      i18n.t("ui.toolkit.noRowsOverlay.noInsightsMatch")
    ];

    // Use a simple hash of the current time to get consistent but varied messages
    const messageIndex = Math.floor(Date.now() / (1000 * 60 * 60)) % noDataMessages.length;
    return noDataMessages[messageIndex];
  };

  const getSubMessage = () => {
    if (props.subText) {
      return props.subText;
    }

    // Clear, actionable sub-messages that guide user action
    const subMessages = [
      i18n.t("ui.toolkit.noRowsOverlay.checkData"),
      i18n.t("ui.toolkit.noRowsOverlay.verifyFilters"),
      i18n.t("ui.toolkit.noRowsOverlay.modifySettings")
    ];

    // Use the same index as the main message for consistency
    const messageIndex = Math.floor(Date.now() / (1000 * 60 * 60)) % subMessages.length;
    return subMessages[messageIndex];
  };

  const renderIllustration = () => {
    if (props.illustration) {
      return props.illustration;
    }
    return <Illustrations.SearchNotFound width={200} height={200} alt={i18n.t("ui.toolkit.noRowsOverlay.noResults")} />;
  };

  return (
    <div
      role="presentation"
      className="ag-overlay-loading-center"
      style={{ width: "100%", minHeight: 500, userSelect: "none" }}>
      <div className="loading-icon" style={{ marginBottom: "var(--size-space-400)" }}>
        {renderIllustration()}
      </div>
      <div className="loading-text-top" aria-live="polite" aria-atomic="true">
        {getFriendlyMessage()}
      </div>
      <div className="loading-text-bottom">{getSubMessage()}</div>
    </div>
  );
};
