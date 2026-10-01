import React from "react";
import clsx from "clsx";
import { Icons } from "@adtraction/ui-icons";
import { ListItem } from "../listItem/ListItem";
import styles from "./FeedItem.module.scss";

const ICON_SIZE = {
  small: "0.6667rem",
  default: "1rem",
  large: "1rem"
};

/**
 * FeedItem — timeline row for activity / history feeds (Figma FeedItem).
 * Composes the shared ListItem with a vertical rail marker.
 *
 * @param {("small"|"default"|"large")} [size="default"]
 * @param {string} [text=""]
 * @param {string} [description=""]
 * @param {React.ReactNode|string} [caption=""]
 * @param {React.ReactElement|null} [icon=null] - Icon inside the rail marker; defaults to Shapes.Circle
 * @param {boolean} [isLast=false] - Hides the connector line under the last item
 * @param {string} [className=""]
 */
export const FeedItem = ({
  size = "default",
  text = "",
  description = "",
  caption = "",
  icon = null,
  isLast = false,
  className = "",
  ...rest
}) => {
  const resolvedSize = ["small", "default", "large"].includes(size) ? size : "default";
  const iconSize = ICON_SIZE[resolvedSize];
  const markerIcon = icon || (
    <Icons.Shape.Circle
      width={iconSize}
      height={iconSize}
      color="var(--text-body-default)"
      aria-hidden
    />
  );

  const sizedIcon = React.isValidElement(markerIcon)
    ? React.cloneElement(markerIcon, {
        width: markerIcon.props.width || iconSize,
        height: markerIcon.props.height || iconSize,
        color: markerIcon.props.color || "var(--text-body-default)",
        "aria-hidden": true
      })
    : markerIcon;

  return (
    <div
      className={clsx(styles.feedItem, className)}
      data-size={resolvedSize}
      data-last={isLast || undefined}
      {...rest}>
      <div className={styles.rail} aria-hidden>
        <div className={styles.line} />
        <div className={styles.marker}>{sizedIcon}</div>
      </div>
      <div className={styles.content}>
        <ListItem
          size={resolvedSize}
          text={text}
          description={description}
          caption={caption}
          hoverable={false}
        />
      </div>
    </div>
  );
};

export default FeedItem;
