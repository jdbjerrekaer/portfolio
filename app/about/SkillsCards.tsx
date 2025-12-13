"use client";

import { SFSymbol } from "@/components/ui/SFSymbol";
import styles from "./page.module.scss";

export function SkillsCards() {
  return (
    <ul className={styles.approachList}>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="paintbrush" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <strong>Design</strong>
            <ul className={styles.approachSubList}>
              <li>UX/UI Design & Interaction Design</li>
              <li>Design Systems & Component Libraries</li>
              <li>Prototyping & Usability Testing</li>
              <li>User Research & Journey Mapping</li>
            </ul>
          </div>
        </div>
      </li>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="code" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <strong>Development</strong>
            <ul className={styles.approachSubList}>
              <li>React / Next.js, TypeScript</li>
              <li>SCSS, Tailwind, Design Tokens</li>
              <li>Accessibility (WCAG), QA with dev teams</li>
              <li>Storybook & component documentation</li>
            </ul>
          </div>
        </div>
      </li>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="wrench" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <strong>Tools</strong>
            <ul className={styles.approachSubList}>
              <li>Figma, FigJam</li>
              <li>Git & collaboration workflows</li>
              <li>Storybook</li>
              <li>Analytics & usability tooling</li>
            </ul>
          </div>
        </div>
      </li>
    </ul>
  );
}
