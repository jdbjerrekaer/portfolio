"use client";

import { SFSymbol } from "@/components/ui/SFSymbol";
import styles from "./page.module.scss";

export function RolesCards() {
  return (
    <ul className={styles.approachList}>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="briefcase" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <strong>UX Engineer, Adtraction</strong>
            <ul className={styles.approachSubList}>
              <li>Lead UX design across user groups</li>
              <li>Translate requirements into real-world use cases</li>
              <li>Collaborate with devs and PMs to ship improvements</li>
            </ul>
          </div>
        </div>
      </li>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="briefcase" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <strong>Lead UI/UX Designer, Adservice</strong>
            <ul className={styles.approachSubList}>
              <li>Built and maintained design systems for 4 products</li>
              <li>Designed and coded Angular web experiences</li>
              <li>Improved email engagement (+22%) and lead generation</li>
            </ul>
          </div>
        </div>
      </li>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="briefcase" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <strong>UI/UX Associate, No Zebra</strong>
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
