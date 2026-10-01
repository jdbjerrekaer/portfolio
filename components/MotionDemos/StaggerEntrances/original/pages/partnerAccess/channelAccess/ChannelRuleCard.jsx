import React from "react";
import Tippy from "@tippyjs/react";
import { i18n } from "@adtraction/shared-i18n";
import { Icons } from "@adtraction/ui-icons";
import { PromoCodeStatusPill } from "../../../components/brand/promoCodeStatusPill/PromoCodeStatusPill";
import {
  KEY_PREFIX,
  channelTypeDescription,
  channelTypeLabel
} from "./channelAccessLabels";
import styles from "./ChannelRuleCard.module.scss";

const tippyShared = {
  trigger: "mouseenter focus click",
  delay: [250, 0],
  placement: "bottom",
  // Keep bottom — flip was pushing these above the card header
  popperOptions: {
    modifiers: [{ name: "flip", enabled: false }]
  },
  appendTo: () => document.body,
  maxWidth: 220,
  touch: true,
  onTrigger(instance, event) {
    if (event.type !== "click") return;
    clearTimeout(instance._clickHideTimer);
    instance._clickHideTimer = setTimeout(() => instance.hide(), 2000);
  },
  onHidden(instance) {
    clearTimeout(instance._clickHideTimer);
  }
};

const ChannelRuleCard = ({ channelType, active, editable = false }) => {
  const locked = Boolean(channelType.locked);
  // Essential lock tippy only when the user can edit and the type is locked
  const showEssential = editable && locked;
  const isReadOnly = !editable;
  const title = channelTypeLabel(channelType);
  const description = channelTypeDescription(channelType);
  const showActive = locked || active;
  const lockedTippy = i18n.t(`${KEY_PREFIX}.lockedTooltip`);
  const readOnlyTippy = i18n.t(`${KEY_PREFIX}.privilegeReadOnlyTooltip`);
  const tippyContent = showEssential ? lockedTippy : readOnlyTippy;
  const showLock = showEssential || isReadOnly;

  const badge = showActive ? (
    <PromoCodeStatusPill
      type="Active"
      label={i18n.t(`${KEY_PREFIX}.badge.active`)}
    />
  ) : (
    <PromoCodeStatusPill
      type="Inactive"
      label={i18n.t(`${KEY_PREFIX}.badge.notActive`)}
    />
  );

  const titleRow = (
    <div
      className={styles.cardTitleRow}
      tabIndex={showEssential ? 0 : undefined}
      aria-label={showEssential ? `${title}. ${lockedTippy}` : undefined}>
      <div className={styles.cardTitleGroup}>
        {showLock && (
          <span className={styles.lockIcon} aria-hidden>
            <Icons.Security.Lock03
              width="var(--size-icon-small)"
              height="var(--size-icon-small)"
              color="currentColor"
            />
          </span>
        )}
        <span className={styles.cardTitle}>{title}</span>
      </div>
      <div className={styles.cardBadge}>{badge}</div>
    </div>
  );

  const card = (
    <div
      className={styles.card}
      data-locked={showEssential ? "true" : undefined}
      data-readonly={isReadOnly ? "true" : undefined}
      data-active={showActive}
      tabIndex={isReadOnly ? 0 : undefined}
      aria-label={isReadOnly ? `${title}. ${readOnlyTippy}` : undefined}>
      <div className={styles.cardText}>
        {showEssential ? (
          <Tippy content={lockedTippy} {...tippyShared}>
            {titleRow}
          </Tippy>
        ) : (
          titleRow
        )}
        {description && <p className={styles.cardDescription}>{description}</p>}
      </div>
    </div>
  );

  if (showEssential) return card;

  return (
    <Tippy content={tippyContent} {...tippyShared}>
      {card}
    </Tippy>
  );
};

export default ChannelRuleCard;
