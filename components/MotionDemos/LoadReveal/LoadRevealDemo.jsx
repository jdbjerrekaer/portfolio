"use client";

// Renders the ORIGINAL brands LoadReveal (./original, verbatim) with the original
// ProfilePageSkeleton and the brand-profile section styles from brandDescription.module.scss.
import { useEffect, useRef, useState } from "react";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { PlaceholderSkeleton, Tag } from "@adtraction/ui-components";
import { Icons } from "@adtraction/ui-icons";
import { i18n } from "@adtraction/shared-i18n";
import { DemoButton, DemoStage } from "../DemoStage";
import { LoadReveal } from "./original/LoadReveal";
import loadRevealStyles from "./original/LoadReveal.module.scss";
import styles from "./original/brandDescription.module.scss";

const LOAD_MS = 1100; // fake network latency

// Verbatim from brandDescription.jsx.
const ProfilePageSkeleton = () => (
  <div className={loadRevealStyles.page_skeleton} data-testid="profile-page-skeleton">
    <div className={loadRevealStyles.page_skeleton_block}>
      <PlaceholderSkeleton isLoading width="30%" initialHeight="1.5rem" />
      <PlaceholderSkeleton isLoading width="55%" initialHeight="2rem" />
      <PlaceholderSkeleton isLoading width="40%" initialHeight="2.25rem" />
    </div>
    <div className={loadRevealStyles.page_skeleton_block}>
      <PlaceholderSkeleton isLoading width="100%" initialHeight="6rem" />
      <PlaceholderSkeleton isLoading width="90%" initialHeight="1rem" />
      <PlaceholderSkeleton isLoading width="80%" initialHeight="1rem" />
    </div>
    <div className={loadRevealStyles.page_skeleton_block}>
      <PlaceholderSkeleton isLoading width="100%" initialHeight="3.5rem" />
      <PlaceholderSkeleton isLoading width="100%" initialHeight="3.5rem" />
      <PlaceholderSkeleton isLoading width="100%" initialHeight="3.5rem" />
    </div>
    <div className={loadRevealStyles.page_skeleton_block}>
      <PlaceholderSkeleton isLoading width="100%" initialHeight="5rem" />
    </div>
  </div>
);

// Made-up brand copy.
const SHORT = ["Nordic outdoor gear, designed in Stockholm and built to last a lifetime of trips."];
const LONG = [
  ...SHORT,
  "Partners promote the full range: jackets, packs and sleeping systems, with seasonal campaigns twice a year and a dedicated content kit for each launch.",
  "Commission is paid on every completed order, including orders placed within 30 days of the click. Promo codes are available on request for partners with an engaged audience.",
];

export function LoadRevealDemo() {
  const [variant, setVariant] = useState("long");
  const [loading, setLoading] = useState(true);
  const timer = useRef(null);

  const load = (next) => {
    clearTimeout(timer.current);
    setVariant(next);
    setLoading(true);
    timer.current = setTimeout(() => setLoading(false), LOAD_MS);
  };

  useEffect(() => {
    timer.current = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(timer.current);
  }, []);

  const paragraphs = variant === "short" ? SHORT : LONG;

  return (
    <DemoStage
      caption="The original component, live. The page skeleton blurs out while the profile blurs in, and the shell animates from the skeleton's height to the real content's height."
      controls={
        <>
          <DemoButton onClick={() => load(variant)}>Reload</DemoButton>
          <DemoButton pressed={variant === "short"} onClick={() => load("short")}>
            Short description
          </DemoButton>
          <DemoButton pressed={variant === "long"} onClick={() => load("long")}>
            Long description
          </DemoButton>
          <DemoButton pressed={variant === "empty"} onClick={() => load("empty")}>
            No description
          </DemoButton>
        </>
      }>
      <div className="adtraction-demo">
        <LoadReveal
          isLoading={loading}
          initialHeight="28rem"
          skeleton={<ProfilePageSkeleton />}
          data-testid="profile-page-loading">
          <div className={styles.profile_sections}>
            <div className={styles.identity_section}>
              <div className={styles.highlights_row}>
                <Tag text="Outdoor" />
                <Tag text="Sweden" />
              </div>
              <h3 style={{ margin: 0, fontSize: "var(--font-size-2X-large)", fontWeight: "var(--font-weight-semibold)" }}>
                Fjord Outdoor
              </h3>
            </div>
            {variant === "empty" ? (
              <div className={styles.description_section}>
                <div className={styles.empty_state} role="status">
                  <Icons.Files.File05 width="2rem" height="2rem" color="var(--text-commentary-description)" />
                  <p className={styles.empty_state_title}>
                    {i18n.t("brands.myBrand.description.emptyDescriptionTitle")}
                  </p>
                  <p className={styles.empty_state_body}>
                    {i18n.t("brands.myBrand.description.emptyDescriptionBodyEditable")}
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.description_section}>
                {paragraphs.map((p) => (
                  <p key={p} style={{ color: "var(--text-body-default)", lineHeight: "var(--line-height-paragraph-regular, 1.5)" }}>
                    {p}
                  </p>
                ))}
              </div>
            )}
          </div>
        </LoadReveal>
      </div>
    </DemoStage>
  );
}
