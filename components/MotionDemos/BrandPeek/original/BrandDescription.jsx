// portfolio edit: the brands app's "../../../../i18n/initialize" import is dropped; the portfolio's
// @adtraction/shared-i18n shim already carries the brands.brandDescription.* strings.
import React, { useState, useEffect, useRef } from "react";
import styles from "./BrandDescription.module.scss";
import { Button, Modal, Chip, ScrollShadow, Badge } from "@adtraction/ui-components";
import { i18n } from "@adtraction/shared-i18n";

const HOVER_DELAY_MS = 400;
const COLLAPSE_DELAY_MS = 500;

export const BrandDescription = ({
  description = "",
  snippets = [],
  externalOpenSignal = 0,
  /** Partner Brand page vs brand-platform My Brand (ownership wording). */
  audience = "partner"
}) => {
  const isBrandAudience = audience === "brand";
  const promotionalRulesKey = isBrandAudience
    ? "brands.brandDescription.brand.promotionalRules"
    : "brands.brandDescription.promotionalRulesToReview";
  const promotionalRuleKey = isBrandAudience
    ? "brands.brandDescription.brand.promotionalRule"
    : "brands.brandDescription.promotionalRuleToReview";
  const dividerRulesKey = isBrandAudience
    ? "brands.brandDescription.brand.dividerPromotionalRules"
    : "brands.brandDescription.dividerPromotionalRules";
  const dividerRuleKey = isBrandAudience
    ? "brands.brandDescription.brand.dividerPromotionalRule"
    : "brands.brandDescription.dividerPromotionalRule";
  const scrollHintRulesKey = isBrandAudience
    ? "brands.brandDescription.brand.scrollHintRules"
    : "brands.brandDescription.scrollHintRules";
  const scrollHintRuleKey = isBrandAudience
    ? "brands.brandDescription.brand.scrollHintRule"
    : "brands.brandDescription.scrollHintRule";
  const [isOpen, setIsOpen] = useState(false);
  const [isChipVisible, setIsChipVisible] = useState(true);
  const [descriptionState, setDescriptionState] = useState("");
  const containerRef = useRef(null);
  const previewRef = useRef(null);
  const hoverDelayTimerRef = useRef(null);
  const hoverCooldownTimerRef = useRef(null);
  const isHoverCooldownRef = useRef(false);
  const expandTimerRef = useRef(null);
  const collapseTimerRef = useRef(null);
  const [initialMaxHeightPx, setInitialMaxHeightPx] = useState(null);
  const [maxHeightPx, setMaxHeightPx] = useState(null);
  const [isPreviewHovered, setIsPreviewHovered] = useState(false);
  const modalScrollRef = useRef(null);
  const snippetsModalRef = useRef(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const dismissChip = () => {
    setIsChipVisible(false);
    setDescriptionState("");
  };

  const modalClose = () => {
    clearHoverDelayTimer();
    clearHoverCooldownTimer();
    isHoverCooldownRef.current = false;
    setIsPreviewHovered(false);
    setIsOpen(false);
    setIsChipVisible(true);
    // If cursor is outside the container on close, resume collapse logic
    const isHoveringContainer = containerRef.current?.matches(":hover");
    if (!isHoveringContainer) {
      // schedule same delayed collapse as mouse leave
      if (initialMaxHeightPx != null) {
        clearExpandTimer();
        clearCollapseTimer();
        collapseTimerRef.current = window.setTimeout(() => {
          setMaxHeightPx(initialMaxHeightPx);
        }, COLLAPSE_DELAY_MS);
      }
    }
  };

  // Open programmatically when external signal changes
  useEffect(() => {
    if (externalOpenSignal > 0) {
      setIsOpen(true);
    }
  }, [externalOpenSignal]);

  // Measure initial max-height from computed styles so transitions still apply
  useEffect(() => {
    const measure = () => {
      if (!previewRef.current) return;
      const computed = window.getComputedStyle(previewRef.current);
      const maxH = parseFloat(computed.maxHeight);
      if (!Number.isNaN(maxH)) {
        setInitialMaxHeightPx((prev) => (prev == null ? maxH : prev));
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [description]);

  const clearExpandTimer = () => {
    if (expandTimerRef.current) {
      window.clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }
  };

  const clearHoverDelayTimer = () => {
    if (hoverDelayTimerRef.current) {
      window.clearTimeout(hoverDelayTimerRef.current);
      hoverDelayTimerRef.current = null;
    }
  };

  const clearHoverCooldownTimer = () => {
    if (hoverCooldownTimerRef.current) {
      window.clearTimeout(hoverCooldownTimerRef.current);
      hoverCooldownTimerRef.current = null;
    }
  };

  const clearCollapseTimer = () => {
    if (collapseTimerRef.current) {
      window.clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  };

  const startHoverCooldown = () => {
    clearHoverCooldownTimer();
    isHoverCooldownRef.current = true;
    hoverCooldownTimerRef.current = window.setTimeout(() => {
      isHoverCooldownRef.current = false;
      hoverCooldownTimerRef.current = null;
    }, HOVER_DELAY_MS);
  };

  const openModal = () => {
    clearHoverDelayTimer();
    clearHoverCooldownTimer();
    isHoverCooldownRef.current = false;
    setIsPreviewHovered(false);
    clearExpandTimer();
    clearCollapseTimer();
    setIsOpen(true);
  };

  const scheduleExpandStep = () => {
    if (expandTimerRef.current) return;
    expandTimerRef.current = window.setTimeout(() => {
      expandTimerRef.current = null;
      if (!previewRef.current) return;
      const el = previewRef.current;
      const scrollHeight = el.scrollHeight;
      // Use the current rendered height as baseline to avoid shrinking below CSS :hover state
      const rendered = el.getBoundingClientRect().height;
      const logicalCurrent = maxHeightPx ?? initialMaxHeightPx ?? 0;
      const current = Math.max(logicalCurrent, rendered);
      if (scrollHeight > current) {
        const STEP_PX = 56; // ~3.5rem at 16px
        const next = Math.min(scrollHeight, current + STEP_PX);
        setMaxHeightPx(next);
      }
    }, 600);
  };

  const handleMouseMove = (e) => {
    if (isOpen || !isPreviewHovered) return;
    if (!previewRef.current) return;
    const el = previewRef.current;
    const rect = el.getBoundingClientRect();
    const cursorY = e.clientY - rect.top;
    const height = rect.height;
    const distanceFromBottom = height - cursorY;
    const NEAR_BOTTOM_THRESHOLD = Math.min(40, Math.max(16, height * 0.2));

    const hasOverflow = el.scrollHeight > (maxHeightPx ?? initialMaxHeightPx ?? height);

    if (distanceFromBottom <= NEAR_BOTTOM_THRESHOLD && hasOverflow) {
      scheduleExpandStep();
    } else {
      clearExpandTimer();
    }
  };

  const handleMouseLeave = () => {
    const didExpand = isPreviewHovered;
    clearHoverDelayTimer();
    clearExpandTimer();
    setIsPreviewHovered(false);
    if (didExpand) {
      startHoverCooldown();
    }
  };

  const handleMouseEnter = () => {
    clearCollapseTimer();
    if (isOpen || isHoverCooldownRef.current || isPreviewHovered) return;
    clearHoverDelayTimer();
    hoverDelayTimerRef.current = window.setTimeout(() => {
      hoverDelayTimerRef.current = null;
      if (!containerRef.current?.matches(":hover")) return;
      setIsPreviewHovered(true);
    }, HOVER_DELAY_MS);
  };

  const handleContainerMouseEnter = () => {
    clearCollapseTimer();
    if (isOpen) return;
    if (
      maxHeightPx != null &&
      initialMaxHeightPx != null &&
      Math.abs(maxHeightPx - initialMaxHeightPx) < 0.5
    ) {
      setMaxHeightPx(null);
    }
  };

  const handleContainerMouseLeave = () => {
    clearHoverDelayTimer();
    clearExpandTimer();
    clearCollapseTimer();
    setIsPreviewHovered(false);
    if (isOpen) return;
    collapseTimerRef.current = window.setTimeout(() => {
      setMaxHeightPx(initialMaxHeightPx);
    }, COLLAPSE_DELAY_MS);
  };

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      clearHoverDelayTimer();
      clearHoverCooldownTimer();
      clearExpandTimer();
      clearCollapseTimer();
    };
  }, []);

  // IntersectionObserver to show/hide scroll hint badge when snippets are in/out of view
  useEffect(() => {
    if (!isOpen || !(snippets?.length > 0)) {
      setShowScrollHint(false);
      return;
    }
    const root = modalScrollRef.current;
    const target = snippetsModalRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowScrollHint(!entry.isIntersecting);
      },
      {
        root: root,
        threshold: 0.1,
        rootMargin: "320px 0px 0px 0px"
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isOpen, snippets?.length]);

  const scrollToSnippets = () => {
    if (!snippetsModalRef.current || !modalScrollRef.current) return;
    const target = snippetsModalRef.current;
    const scrollContainer = modalScrollRef.current;

    const targetRect = target.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    const scrollTop = scrollContainer.scrollTop;
    const targetTop = scrollTop + targetRect.top - containerRect.top;
    const bufferPx = 32;

    scrollContainer.scrollTo({
      top: targetTop - bufferPx,
      behavior: "smooth"
    });
  };

  const renderDescription = () => {
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: description }} />
        {Array.isArray(snippets) && snippets.length > 0 && (
          <>
            <div className={styles.description_snippets_divider}>
              <hr className={styles.divider_line} />
              <div className={styles.divider_text_container}>
                <div className={styles.divider_badge_circle}>{snippets.length}</div>
                <span className={styles.divider_text}>
                  {snippets.length > 1 ? i18n.t(dividerRulesKey) : i18n.t(dividerRuleKey)}
                </span>
              </div>
              <hr className={styles.divider_line} />
            </div>
            <div className={styles.snippets_outer_container}>
              {snippets.map((snippet, index) => (
                <div className={styles.snippet_container} key={snippet.snippetId}>
                  {snippets.length > 1 && (
                    <div className={styles.snippet_badge_circle}>{index + 1}</div>
                  )}
                  <div
                    className={styles.snippet_name}
                    dangerouslySetInnerHTML={{ __html: snippet.snippetName }}
                  />
                  <div
                    className={styles.snippet_text}
                    dangerouslySetInnerHTML={{ __html: snippet.snippet }}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <>
      <div
        ref={containerRef}
        className={styles.brandDescription_container}
        onMouseEnter={handleContainerMouseEnter}
        onMouseLeave={handleContainerMouseLeave}>
        <div
          ref={previewRef}
          className={`${styles.brandDescription_text} ${
            isOpen ? styles.brandDescription_text_active : ""
          } ${isPreviewHovered ? styles.brandDescription_text_hovered : ""}`}
          style={{ maxHeight: maxHeightPx != null ? `${maxHeightPx}px` : undefined }}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={openModal}>
          <div
            className={styles.brandDescription_overlay}
            style={
              initialMaxHeightPx != null && maxHeightPx != null && maxHeightPx > initialMaxHeightPx
                ? { height: "2rem", opacity: 0.85 }
                : undefined
            }
            onClick={openModal}
          />
          {renderDescription()}
        </div>
        <div className={styles.brandDescription_button_container}>
          <div className={styles.button_wrapper}>
            <Button
              onClick={openModal}
              size="small"
              type="secondary"
              text={i18n.t("brands.brandDescription.viewFullDescription")}
              fitContent={true}
              className={isOpen ? "active" : undefined}
            />
            {snippets.length > 0 && (
              <>
                <div className={styles.badge_circle}>{snippets.length}</div>
              </>
            )}
          </div>
          {snippets.length > 0 && (
            <>
              <div className={styles.extra_info_container}>
                {snippets.length > 1 ? i18n.t(promotionalRulesKey) : i18n.t(promotionalRuleKey)}
              </div>
            </>
          )}
        </div>
      </div>
      <Modal
        isOpen={isOpen}
        onClose={modalClose}
        onOutsideClick={modalClose}
        maxHeight="92vh"
        variant="sidePanel"
        title={i18n.t("brands.brandDescription.modalTitle")}>
        <>
          <div className={styles.brandDescription_modal_container}>
            {isChipVisible && descriptionState !== "" && (
              <Chip
                size="default"
                text={i18n.t("brands.brandDescription.autoTranslatedChip")}
                hyperLinkSpan={i18n.t("brands.brandDescription.viewOriginalLink")}
                interactable={true}
                closeIconEnabled={false}
                onClose={dismissChip}
              />
            )}
            <div id="desc_wrapper" className={styles.brandDescription_modal_wrapper}>
              <div
                className={styles.brandDescription_modal_text}
                id="desc_scrollable"
                ref={modalScrollRef}>
                <div
                  dangerouslySetInnerHTML={{
                    __html: descriptionState !== "" ? descriptionState : description
                  }}
                />
                {Array.isArray(snippets) && snippets.length > 0 && (
                  <>
                    <div className={styles.description_snippets_divider}>
                      <hr className={styles.divider_line} />
                      <div className={styles.divider_text_container}>
                        <div className={styles.divider_badge_circle}>{snippets.length}</div>
                        <span className={styles.divider_text}>
                          {snippets.length > 1 ? i18n.t(dividerRulesKey) : i18n.t(dividerRuleKey)}
                        </span>
                      </div>
                      <hr className={styles.divider_line} />
                    </div>
                    <div className={styles.snippets_outer_container} ref={snippetsModalRef}>
                      {snippets.map((snippet, index) => (
                        <div className={styles.snippet_container} key={snippet.snippetId}>
                          {snippets.length > 1 && (
                            <div className={styles.snippet_badge_circle}>{index + 1}</div>
                          )}
                          <div
                            className={styles.snippet_name}
                            dangerouslySetInnerHTML={{ __html: snippet.snippetName }}
                          />
                          <div
                            className={styles.snippet_text}
                            dangerouslySetInnerHTML={{ __html: snippet.snippet }}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <ScrollShadow
                wrapper="desc_wrapper"
                scrollContainer="desc_scrollable"
                dark={false}
                strength={15}
                blur="0.125rem"
              />
              {snippets.length > 0 && (
                <div
                  className={`${styles.scroll_hint_badge} ${
                    showScrollHint
                      ? styles.scroll_hint_badge_visible
                      : styles.scroll_hint_badge_hidden
                  }`}>
                  <Badge
                    text={
                      snippets.length > 1
                        ? i18n.t(scrollHintRulesKey)
                        : i18n.t(scrollHintRuleKey)
                    }
                    onClick={scrollToSnippets}
                    className={styles.scroll_hint_badge_content}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      </Modal>
    </>
  );
};
