import React from "react";
import { Icons } from "@adtraction/ui-icons";
import Tippy from "@tippyjs/react";
import { i18n } from "@adtraction/shared-i18n";
import { Button } from "../../tokens/button/Button";
import styles from "./TableSelectionBar.compiled.module.css"; // portfolio edit: see file header
import "./TableSelectionBar.compiled.global.css"; // portfolio edit

export const TableSelectionBar = ({
  ariaLabel,
  metrics,
  shellStyle,
  renderExportButton,
  showSwitchToRows = false,
  onCopy,
  onSwitchToRows,
  onClear,
  loading = false,
  customActions = null,
  customActionsContext = null
}) => {
  const renderedCustomActions =
    typeof customActions === "function" ? customActions(customActionsContext) : customActions;
  const renderIconAction = ({ icon, onClick, ariaLabel, tooltipText }) => (
    <Tippy content={tooltipText} delay={[300, 0]}>
      <span>
        <Button
          text=""
          type="ghost"
          size="default"
          iconLeft={icon}
          className={styles.selection_icon_button}
          onClick={onClick}
          ariaLabel={ariaLabel}
          disabled={loading}
        />
      </span>
    </Tippy>
  );

  return (
    <div className={styles.selection_bar_shell} style={shellStyle}>
      <div className={styles.selection_bar} role="group" aria-label={ariaLabel}>
        <div className={styles.selection_bar_content}>
          <div className={styles.selection_metrics}>
            {metrics.map((metric) => (
              <div
                key={metric.key}
                className={styles.selection_metric}
                aria-label={metric.ariaLabel || `${metric.label}: ${metric.value}`}>
                <span className={styles.selection_metric_value}>{metric.value}</span>
                <span className={styles.selection_metric_label}>{metric.label}</span>
              </div>
            ))}
          </div>
          <div className={styles.selection_actions}>
            {renderedCustomActions}
            {renderExportButton?.(styles)}
            {renderIconAction({
              icon: <Icons.General.Copy01 />,
              onClick: onCopy,
              ariaLabel: i18n.t("ui.toolkit.table.copySelection"),
              tooltipText: i18n.t("ui.toolkit.table.copySelection")
            })}
            {showSwitchToRows && (
              renderIconAction({
                icon: <Icons.Layout.Rows01 />,
                onClick: onSwitchToRows,
                ariaLabel: i18n.t("ui.toolkit.table.selectAllCellsInRows"),
                tooltipText: i18n.t("ui.toolkit.table.selectAllCellsInRows")
              })
            )}
            {renderIconAction({
              icon: <Icons.General.XClose />,
              onClick: onClear,
              ariaLabel: i18n.t("ui.toolkit.table.clearSelection"),
              tooltipText: i18n.t("ui.toolkit.table.clearSelection")
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
