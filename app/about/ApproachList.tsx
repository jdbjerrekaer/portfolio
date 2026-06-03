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
              <li>Synthesize customer feedback and product context</li>
              <li>Map workflows, constraints, and decision points</li>
              <li>Define clear UX and product success criteria</li>
            </ul>
          </div>
        </div>
      </li>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="chart.bar" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <strong>Design close to implementation</strong>
            <ul className={styles.approachSubList}>
              <li>Prototype the flow before committing to detail</li>
              <li>Design with accessibility and technical feasibility in mind</li>
              <li>Work with developers while features are being built</li>
            </ul>
          </div>
        </div>
      </li>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="person.2" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <strong>Protect product quality</strong>
            <ul className={styles.approachSubList}>
              <li>Maintain design system and UI Toolkit standards</li>
              <li>QA shipped behavior against intended design</li>
              <li>Balance user clarity, business goals, and delivery constraints</li>
            </ul>
          </div>
        </div>
      </li>
    </ul>
  );
}
