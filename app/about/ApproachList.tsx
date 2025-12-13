"use client";

import { SFSymbol } from "@/components/ui/SFSymbol";
import styles from "./page.module.scss";

export function ApproachList() {
  return (
    <ul className={styles.approachList}>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="magnifyingglass" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <strong>Understand the problem</strong>
            <ul className={styles.approachSubList}>
              <li>Observe user behavior</li>
              <li>Map user journeys</li>
              <li>Define clear success metrics</li>
            </ul>
          </div>
        </div>
      </li>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="chart.bar" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <strong>Prototype, test, and iterate</strong>
            <ul className={styles.approachSubList}>
              <li>Build quickly with cross-functional teams</li>
              <li>Make data-informed decisions</li>
              <li>Ship experiences that users love</li>
            </ul>
          </div>
        </div>
      </li>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="person.2" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <strong>Collaborate closely</strong>
            <ul className={styles.approachSubList}>
              <li>Work tightly with engineering</li>
              <li>Design accessible by default</li>
              <li>Balance user needs with business goals</li>
            </ul>
          </div>
        </div>
      </li>
    </ul>
  );
}
