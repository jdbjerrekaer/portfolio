import React from "react";
import { Link } from "react-router-dom";
import { linkTargetProps } from "@adtraction/ui-components";
import styles from "../PartnerSidemenu.module.scss";

const SubItem = ({
  url = "",
  externalUrl = "",
  extraUrls = [],
  name = "",
  disabled = false,
  isActive,
  onItemClick
}) => {
  const isActiveUrl = (url) => isActive(url);
  const finalActive =
    !disabled && url && (isActiveUrl(url) || (extraUrls && extraUrls.some(isActiveUrl)));

  if (disabled) {
    return (
      <div className={`${styles.sub_item} ${styles.disabled}`}>
        <span>{name}</span>
      </div>
    );
  }

  if (externalUrl) {
    return (
      <a
        href={externalUrl}
        {...linkTargetProps()}
        className={styles.sub_item}
        onClick={onItemClick}>
        <span>{name}</span>
      </a>
    );
  }

  return (
    <Link
      to={url}
      className={`${styles.sub_item} ${finalActive ? styles.active : ""}`}
      onClick={onItemClick}>
      <span>{name}</span>
    </Link>
  );
};

export default SubItem;
