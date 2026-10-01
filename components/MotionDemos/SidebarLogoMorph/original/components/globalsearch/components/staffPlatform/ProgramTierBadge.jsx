import "../../../../i18n/initialize";
import React from "react";
import { i18n } from "@adtraction/shared-i18n";
import clsx from "clsx";
import styles from "./ProgramTierBadge.module.scss";
import { Badge } from "@adtraction/ui-components";
import { Icons } from "@adtraction/ui-icons";

/**
 * ProgramTierBadge
 * A tier badge for staff search results (program/brand tiers).
 * Accepts prop `ttype`: basic | growth | premium
 */
export const ProgramTierBadge = ({ ttype = "basic", size = "small", className = "", ...rest }) => {
  const map = {
    basic: { text: i18n.t("platform.staffSearch.tierBasic") },
    growth: { text: i18n.t("platform.staffSearch.tierGrowth") },
    premium: { text: i18n.t("platform.staffSearch.tierPremium") }
  };

  const current = map[ttype] || map.basic;

  const iconMap = {
    basic: { comp: Icons.Custom.Seedling, colorVar: "--text-default---body" },
    growth: { comp: Icons.Custom.Flower, colorVar: "--text-default---body" },
    premium: { comp: Icons.Custom.Tree, colorVar: "--text-alt---body" }
  };
  const selected = iconMap[ttype] || iconMap.basic;
  const iconLeft = (
    <selected.comp
      color={`var(${selected.colorVar}, ${ttype === "premium" ? "#ffffff" : "#1B2940"})`}
      strokeWidth={1.73}
    />
  );

  return (
    <Badge
      size={size}
      text={current.text}
      iconLeft={iconLeft}
      className={clsx(styles.tier_badge, styles[ttype], className)}
      {...rest}
    />
  );
};

export default ProgramTierBadge;
