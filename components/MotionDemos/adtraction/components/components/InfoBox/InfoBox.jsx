import React, { useMemo, useId } from "react";
import clsx from "clsx";
import { Icons } from "@adtraction/ui-icons";

import { Button } from "../../tokens/button/Button";
import styles from "./InfoBox.module.scss";

const ICON_SIZES = {
  small: "var(--size-icon-small)",
  medium: "var(--size-icon-medium)"
};

export const INFOBOX_ICON_SIZE_OPTIONS = Object.freeze(["small", "medium"]);

export const INFOBOX_LAYOUT_OPTIONS = Object.freeze(["gridCards", "bulleted"]);

export const INFOBOX_TONE_OPTIONS = Object.freeze(["dune", "lilac", "banana", "sky"]);

export const INFOBOX_HEADING_TAG_OPTIONS = Object.freeze(["h2", "h3", "h4"]);

export const INFOBOX_ILLUSTRATION_POSITION_OPTIONS = Object.freeze(["start", "end"]);

const CLAMPED_COLUMNS = { min: 1, max: 2 };

const DEFAULT_SECTION_LAYOUT = INFOBOX_LAYOUT_OPTIONS[1];
const DEFAULT_TONE = INFOBOX_TONE_OPTIONS[0];

const DEFAULT_ICON = Icons?.General?.InfoCircle;

const isValidElement = (value) => React.isValidElement(value);

const normalizeBulletItem = (item) => {
  if (item == null) return null;

  if (typeof item === "string" || typeof item === "number") {
    return { content: item };
  }

  if (isValidElement(item)) {
    return { content: item };
  }

  if (typeof item === "object") {
    const { content, title, icon } = item;
    return {
      content: content ?? title ?? null,
      icon
    };
  }

  return null;
};

const normalizeCardItem = (item) => {
  if (item == null) return null;

  if (typeof item === "string" || typeof item === "number") {
    return { title: item };
  }

  if (isValidElement(item)) {
    return { title: item };
  }

  if (typeof item === "object") {
    const { title, description, icon } = item;
    return {
      title: title ?? null,
      description: description ?? null,
      icon
    };
  }

  return null;
};

const clampColumns = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return CLAMPED_COLUMNS.min;
  }

  return Math.min(CLAMPED_COLUMNS.max, Math.max(CLAMPED_COLUMNS.min, value));
};

const resolveIconSize = (layout, preferredSize) => {
  if (preferredSize && ICON_SIZES[preferredSize]) {
    return preferredSize;
  }

  return layout === "gridCards" ? "medium" : "small";
};

const renderDefaultIcon = (iconSize) => {
  if (!DEFAULT_ICON) return null;

  const IconComponent = DEFAULT_ICON;
  const dimension = ICON_SIZES[iconSize] ?? ICON_SIZES.small;
  const strokeWidth = iconSize === "small" ? "2.3" : "2.73";

  return (
    <IconComponent width={dimension} height={dimension} aria-hidden="true" strokeWidth={strokeWidth} />
  );
};

const renderIllustration = (illustrationNode) => {
  if (!isValidElement(illustrationNode)) {
    return illustrationNode;
  }

  return React.cloneElement(illustrationNode, {
    className: clsx(styles.illustrationMedia, illustrationNode.props.className),
    width: "100%",
    height: "100%",
    style: {
      ...illustrationNode.props.style,
      width: "100%",
      height: "100%",
      objectFit: "contain"
    },
    "aria-hidden": illustrationNode.props["aria-hidden"] ?? true
  });
};

const renderIcon = (itemIcon, iconSize) => {
  if (itemIcon === null) return null;
  if (isValidElement(itemIcon)) {
    return React.cloneElement(itemIcon, {
      width: itemIcon.props?.width ?? ICON_SIZES[iconSize] ?? ICON_SIZES.small,
      height: itemIcon.props?.height ?? ICON_SIZES[iconSize] ?? ICON_SIZES.small,
      "aria-hidden": itemIcon.props?.["aria-hidden"] ?? true
    });
  }

  return renderDefaultIcon(iconSize);
};

const renderList = (layout, items, iconSize) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  if (layout === "gridCards") {
    const normalizedItems = items
      .map(normalizeCardItem)
      .filter((item) => item && (item.title || item.description));

    if (normalizedItems.length === 0) {
      return null;
    }

    return (
      <ul className={clsx(styles.list, styles.cardList)}>
        {normalizedItems.map((item, index) => {
          const { title, description, icon } = item;
          const iconNode = renderIcon(icon, iconSize);

          return (
            <li key={index} className={styles.card}>
              <div className={styles.cardHeader}>
                {iconNode ? (
                  <span className={styles.icon} aria-hidden="true">
                    {iconNode}
                  </span>
                ) : null}
                {title && <p className={styles.cardTitle}>{title}</p>}
              </div>
              {description && <p className={styles.cardDescription}>{description}</p>}
            </li>
          );
        })}
      </ul>
    );
  }

  const normalizedItems = items.map(normalizeBulletItem).filter((item) => item && item.content);

  if (normalizedItems.length === 0) {
    return null;
  }

  return (
    <ul className={clsx(styles.list, styles.bulletList)}>
      {normalizedItems.map((item, index) => {
        const { content, icon } = item;
        const iconNode = renderIcon(icon, iconSize);

        return (
          <li key={index} className={styles.listItem}>
            <span className={styles.icon} aria-hidden="true">
              {iconNode}
            </span>
            <div className={styles.itemContent}>{content}</div>
          </li>
        );
      })}
    </ul>
  );
};

const Section = ({ section, layout, iconSize }) => {
  const sectionLayout = section.layout ?? layout ?? DEFAULT_SECTION_LAYOUT;
  const resolvedIconSize = resolveIconSize(sectionLayout, section.iconSize ?? iconSize);

  return (
    <div className={styles.section}>
      {section.title ? <p className={styles.sectionTitle}>{section.title}</p> : null}
      {renderList(sectionLayout, section.items ?? [], resolvedIconSize)}
    </div>
  );
};

Section.displayName = "InfoBoxSection";

/**
 * @typedef {"dune"|"lilac"|"banana"|"sky"} InfoBoxTone
 * @typedef {"gridCards"|"bulleted"} InfoBoxLayout
 */

/**
 * InfoBox renders titled informational content with optional sections, lists, and CTAs.
 * Layouts support bulleted lists or grid cards, and tones surface different background hues.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.title]
 * @param {React.ReactNode} [props.intro]
 * @param {InfoBoxTone} [props.tone="dune"]
 * @param {InfoBoxLayout} [props.layout="bulleted"]
 * @param {Array<*>} [props.items=[]]
 * @param {Array<Object>} [props.sections]
 * @param {number} [props.columns=1]
 * @param {"h2"|"h3"|"h4"} [props.titleAs="h3"]
 * @param {"small"|"medium"} [props.iconSize]
 * @param {{ text: string, onClick?: Function, href?: string, target?: string, rel?: string, iconLeft?: React.ReactElement, iconRight?: React.ReactElement, type?: string, size?: string, rounded?: boolean, fitContent?: boolean, buttonProps?: Object }} [props.cta]
 * @param {string} [props.className]
 * @param {string} [props.id]
 * @param {string} [props.ariaLabel]
 * @param {React.ReactNode} [props.illustration] - Optional decorative media beside the content. Renders in a fixed square slot (`--infobox-illustration-size`, default 5rem), vertically centered next to the text.
 * @param {"start"|"end"} [props.illustrationPosition="start"] - Horizontal placement of `illustration` relative to the text content.
 * @param {React.ReactNode} [props.children] - Rendered after intro, before sections. Use for custom content (e.g. input + button row).
 * @returns {JSX.Element|null}
 */
export const InfoBox = ({
  title,
  intro,
  tone = DEFAULT_TONE,
  layout = DEFAULT_SECTION_LAYOUT,
  items = [],
  sections,
  columns = 1,
  titleAs = "h3",
  iconSize,
  cta,
  className = "",
  id,
  ariaLabel,
  illustration,
  illustrationPosition = "start",
  children
}) => {
  const generatedHeadingId = useId();
  const headingId = title ? `${generatedHeadingId}-heading` : undefined;
  const regionProps = {
    role: "region",
    id,
    "aria-labelledby": title ? headingId : undefined,
    "aria-label": !title && ariaLabel ? ariaLabel : undefined
  };

  if (title && ariaLabel) {
    // Prevent duplicate labelling
    delete regionProps["aria-label"];
  }

  const hasCustomSections = Array.isArray(sections) && sections.length > 0;

  const normalizedSections = useMemo(() => {
    if (hasCustomSections) {
      return sections
        .filter((section) => section && Array.isArray(section.items))
        .map((section) => ({
          ...section,
          items: Array.isArray(section.items) ? section.items : []
        }));
    }

    return [
      {
        layout,
        items,
        title: null
      }
    ];
  }, [hasCustomSections, sections, layout, items]);

  const clampedColumns = hasCustomSections ? clampColumns(columns) : 1;
  const resolvedIconSize = resolveIconSize(layout, iconSize);

  const TitleTag = titleAs;

  const renderCTA = () => {
    if (!cta || !cta.text) return null;

    const {
      text,
      onClick,
      href,
      target,
      rel,
      iconLeft,
      iconRight,
      type = "ghost",
      size = "default",
      rounded = false,
      fitContent = true,
      buttonProps = {}
    } = cta;

    const mergedButtonProps = {
      text,
      iconLeft: iconLeft ?? null,
      iconRight: iconRight ?? null,
      type,
      size,
      rounded,
      fitContent,
      onClick,
      ...buttonProps
    };

    const buttonElement = <Button {...mergedButtonProps} />;

    if (href) {
      return (
        <a href={href} target={target} rel={rel} className={styles.ctaLinkWrapper}>
          {buttonElement}
        </a>
      );
    }

    return buttonElement;
  };

  if (!title && !intro && !items?.length && !hasCustomSections && !children && !illustration) {
    return null;
  }

  const hasIllustration = illustration != null && illustration !== false;

  const content = (
    <>
      {title ? (
        <TitleTag id={headingId} className={styles.header}>
          {title}
        </TitleTag>
      ) : null}
      {intro ? <p className={styles.intro}>{intro}</p> : null}
      {hasCustomSections ? (
        <div className={styles.sectionsGrid} data-columns={clampedColumns}>
          {normalizedSections.map((section, index) => (
            <Section
              key={section.title ? `${section.title}-${index}` : index}
              section={section}
              layout={layout}
              iconSize={resolvedIconSize}
            />
          ))}
        </div>
      ) : (
        <Section section={normalizedSections[0]} layout={layout} iconSize={resolvedIconSize} />
      )}
      {children ? <div className={styles.customContent}>{children}</div> : null}
      {cta ? <div className={styles.cta}>{renderCTA()}</div> : null}
    </>
  );

  return (
    <section
      className={clsx(styles.infobox, hasIllustration && styles.infoboxWithIllustration, className)}
      data-tone={tone}
      data-layout={layout}
      data-columns={clampedColumns}
      data-illustration-position={hasIllustration ? illustrationPosition : undefined}
      {...regionProps}>
      {hasIllustration && illustrationPosition === "start" ? (
        <div className={styles.illustration}>
          <div className={styles.illustrationInner}>{renderIllustration(illustration)}</div>
        </div>
      ) : null}
      {hasIllustration ? <div className={styles.body}>{content}</div> : content}
      {hasIllustration && illustrationPosition === "end" ? (
        <div className={styles.illustration}>
          <div className={styles.illustrationInner}>{renderIllustration(illustration)}</div>
        </div>
      ) : null}
    </section>
  );
};

InfoBox.displayName = "InfoBox";

export default InfoBox;
