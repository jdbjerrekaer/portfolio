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
                <strong>Product Design Engineer, Adtraction</strong>
                <span className={styles.currentBadge}>
                  <span className={styles.currentDot} aria-hidden="true" />
                  Current
                </span>
              </div>
              <span className={styles.roleYears}>2026 - Present</span>
            </div>
            <ul className={styles.approachSubList}>
              <li>Own product design across platform features from research and concept to high-fidelity design, implementation partnership, and QA</li>
              <li>Maintain the design system, motion system, and shared UI Toolkit quality with developers</li>
              <li>Partner with Product Management on requirements, roadmap input, and product quality in production</li>
              <li>Translate customer feedback and product insight into prioritized UX improvements</li>
            </ul>
          </div>
        </div>
      </li>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="briefcase" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <div>
              <strong>UX Engineer, Adtraction</strong>
              <span className={styles.roleYears}>2022 - 2026</span>
            </div>
            <ul className={styles.approachSubList}>
              <li>Designed and improved internal staff, partner, and brand tools</li>
              <li>Worked closely with engineering on implementation details, QA, and design-to-code handoff</li>
              <li>Shipped YADL, a Figma plugin now used by 22+ teams to standardize design-system QA</li>
              <li>Contributed to LeadPlatform product work after Adservice merged into Adtraction</li>
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
