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
              <li>Product design, interaction design, and visual design</li>
              <li>Design systems, motion systems, and component quality</li>
              <li>Prototyping, accessibility, and usability testing</li>
              <li>Customer insight, journey mapping, and UX prioritization</li>
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
              <li>Design-to-code QA with engineering teams</li>
              <li>Storybook, UI Toolkit work, and component documentation</li>
            </ul>
          </div>
        </div>
      </li>
      <li>
        <div className={styles.approachItem}>
          <SFSymbol name="wrench" size={24} weight="medium" filled={false} className={styles.approachIcon} />
          <div className={styles.approachContent}>
            <strong>Product work</strong>
            <ul className={styles.approachSubList}>
              <li>Figma, FigJam, Git, and collaboration workflows</li>
              <li>Requirements, product feedback, and roadmap input</li>
              <li>Feature QA and production quality reviews</li>
              <li>Analytics, usability tooling, and design documentation</li>
            </ul>
          </div>
        </div>
      </li>
    </ul>
  );
}
