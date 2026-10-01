import React from "react";
import { Icons } from "@adtraction/ui-icons";
import styles from "./ManagerCard.module.scss";

const ManagerCard = ({
  size = "large",
  title,
  name,
  profileImage,
  children,
  className = "",
  onNameClick,
  nameAriaLabel
}) => {
  const handleNameKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onNameClick?.();
    }
  };

  if (size === "small") {
    return (
      <div className={`${styles.manager_card_small} ${className}`}>
        <div
          className={styles.profile_image}
          style={{
            backgroundImage: profileImage ? `url(${profileImage})` : undefined
          }}
        />
        {name ? (
          <div className={styles.info_container_small}>
            {onNameClick ? (
              <div
                className={styles.name_copy}
                role="button"
                tabIndex={0}
                onClick={onNameClick}
                onKeyDown={handleNameKeyDown}
                aria-label={nameAriaLabel}>
                <span className={styles.name_small}>{name}</span>
                <Icons.General.Copy01 className={styles.copy_icon} width={16} height={16} aria-hidden />
              </div>
            ) : (
              <span className={styles.name_small}>{name}</span>
            )}
            <div className={styles.icons_container_small}>{children}</div>
          </div>
        ) : (
          <div className={styles.icons_container_small}>{children}</div>
        )}
      </div>
    );
  }

  if (size === "small-vertical") {
    return (
      <div className={`${styles.manager_card_small_vertical} ${className}`}>
        <div
          className={styles.profile_image}
          style={{
            backgroundImage: profileImage ? `url(${profileImage})` : undefined
          }}
        />
        <div className={styles.icons_container_small_vertical}>{children}</div>
      </div>
    );
  }

  return (
    <div className={`${styles.manager_card_large} ${className}`}>
      <div
        className={styles.profile_image}
        style={{
          backgroundImage: profileImage ? `url(${profileImage})` : undefined
        }}
      />
      <div className={styles.info_container}>
        <span className={styles.title}>{title}</span>
        {onNameClick ? (
          <div
            className={styles.name_copy}
            role="button"
            tabIndex={0}
            onClick={onNameClick}
            onKeyDown={handleNameKeyDown}
            aria-label={nameAriaLabel}>
            <span className={styles.name}>{name}</span>
            <Icons.General.Copy01 className={styles.copy_icon} width={16} height={16} aria-hidden />
          </div>
        ) : (
          <span className={styles.name}>{name}</span>
        )}
      </div>
      <div className={styles.icons_container}>{children}</div>
    </div>
  );
};

export default ManagerCard;
