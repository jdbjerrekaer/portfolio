"use client";

import { SFSymbol } from "@/components/ui/SFSymbol";
import styles from "./page.module.scss";

export function RolesCards() {
  return (
    <ul className={styles.approachList}>
<li>
  <div className={`${styles.approachItem} ${styles.current}`}>
    <SFSymbol name="briefcase" size={24} weight="medium" filled={false} className={styles.approachIcon} />
    <div className={styles.approachContent}>
      <div>
        <div className={styles.roleHeader}>
          <strong>UX/UI Engineer, Adtraction</strong>
          <span className={styles.currentBadge}>
            <span className={styles.currentDot} aria-hidden="true" />
            Current
          </span>
        </div>
        <span className={styles.roleYears}>2022 - Present</span>
      </div>
      <ul className={styles.approachSubList}>
        <li>Own the design and direction of internal platforms — staff, partner, and brand tools</li>
        <li>Lead LeadPlatform development — gamified lead generation product (quizzes, contests, calendars) used by brands to capture marketing leads</li>
        <li>Shipped YADL, a Figma plugin now used by 22+ teams to standardize design handoffs</li>
        <li>Collaborate with another designer who handles external-facing products</li>
      </ul>
    </div>
  </div>
</li>
      <li>
        <div className={`${styles.approachItem} ${styles.acquiredCompany}`}>
          <SFSymbol name="briefcase" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <div>
              <div className={styles.roleHeader}>
                <strong>Lead UI/UX Designer, Adservice</strong>
                <span className={styles.acquisitionBadge}>
                  <SFSymbol name="arrow.right" size={14} weight="medium" filled={false} />
                  Merged into Adtraction
                </span>
              </div>
              <span className={styles.roleYears}>2020 - 2022</span>
            </div>
            <ul className={styles.approachSubList}>
              <li>Built and maintained design systems for 4 products</li>
              <li>Designed and coded Angular web experiences</li>
              <li>Led LeadPlatform — gamified lead generation product (quizzes, contests, calendars) used by brands to capture marketing leads</li>
              <li>Wrote technical guides that help partners integrate with our platform</li>
              <li>Improved email engagement (+22%) and lead generation</li>
            </ul>
          </div>
        </div>
      </li>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="briefcase" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <div>
              <strong>UI/UX Associate, No Zebra</strong>
              <span className={styles.roleYears}>2019 - 2020</span>
            </div>
            <ul className={styles.approachSubList}>
              <li>Conducted benchmarks and UX reviews</li>
              <li>Provided IT/system support</li>
              <li>Improved client UX through audits and recommendations</li>
            </ul>
          </div>
        </div>
      </li>
    </ul>
  );
}
