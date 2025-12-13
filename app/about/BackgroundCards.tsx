"use client";

import { SFSymbol } from "@/components/ui/SFSymbol";
import styles from "./page.module.scss";

export function BackgroundCards() {
  return (
    <ul className={styles.approachList}>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="book" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <strong>Education</strong>
            <ul className={styles.approachSubList}>
              <li>BSc in Technical Interaction Design</li>
              <li>Aarhus University, graduated 2021</li>
              <li>HCI, UX, and interaction design</li>
            </ul>
          </div>
        </div>
      </li>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="sparkles" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <strong>What drives me</strong>
            <ul className={styles.approachSubList}>
              <li>Building coherent, scalable interfaces</li>
              <li>Balancing user needs with business goals</li>
              <li>Validating experiences through research</li>
            </ul>
          </div>
        </div>
      </li>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="heart" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <strong>Beyond work</strong>
            <ul className={styles.approachSubList}>
              <li>3D printing side projects</li>
              <li>Bareknuckle full contact karate</li>
              <li>Staying curious about tech trends</li>
            </ul>
          </div>
        </div>
      </li>
    </ul>
  );
}
