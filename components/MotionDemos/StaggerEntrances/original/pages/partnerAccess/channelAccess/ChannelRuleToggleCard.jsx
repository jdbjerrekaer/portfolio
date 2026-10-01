import React from "react";
import { i18n } from "@adtraction/shared-i18n";
import { PromoCodeStatusPill } from "../../../components/brand/promoCodeStatusPill/PromoCodeStatusPill";
import {
  KEY_PREFIX,
  channelTypeDescription,
  channelTypeLabel
} from "./channelAccessLabels";
import OverflowTippyText from "./OverflowTippyText";
import styles from "./ChannelRuleCard.module.scss";

const ChannelRuleToggleCard = ({ channelType, active, onToggle }) => {
  const title = channelTypeLabel(channelType);
  const description = channelTypeDescription(channelType);

  return (
    <button
      type="button"
      className={styles.card}
      data-interactive="true"
      data-active={active}
      aria-pressed={active}
      aria-label={`${title}, ${
        active
          ? i18n.t(`${KEY_PREFIX}.badge.active`)
          : i18n.t(`${KEY_PREFIX}.badge.notActive`)
      }`}
      onClick={() => onToggle(channelType.id)}>
      <div className={styles.cardText}>
        <div className={styles.cardTitleRow}>
          <div className={styles.cardTitleGroup}>
            <OverflowTippyText as="span" className={styles.cardTitle} text={title} />
          </div>
          <div className={styles.cardBadge}>
            {active ? (
              <PromoCodeStatusPill
                type="Active"
                label={i18n.t(`${KEY_PREFIX}.badge.active`)}
              />
            ) : (
              <PromoCodeStatusPill
                type="Inactive"
                label={i18n.t(`${KEY_PREFIX}.badge.notActive`)}
              />
            )}
          </div>
        </div>
        <OverflowTippyText
          as="p"
          className={styles.cardDescription}
          text={description}
        />
      </div>
    </button>
  );
};

export default ChannelRuleToggleCard;
