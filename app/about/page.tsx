import type { Metadata } from "next";
import { ApproachList } from "./ApproachList";
import { BackgroundCards } from "./BackgroundCards";
import { RolesCards } from "./RolesCards";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about Jonatan Bjerrekær: Design Engineer & Technical UX Designer blending research, interaction design, and development.",
};

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1>About Me</h1>
        <p className={styles.intro}>
          I’m Jonatan Bjerrekær, a UX/UI designer with 3+ years crafting B2B
          software. I blend user research, interaction design, and systems
          thinking to simplify complex problems and deliver intuitive
          experiences.
        </p>
      </section>

      <section className={styles.content}>
        <div className={styles.section}>
          <h2>Background</h2>
          <BackgroundCards />
        </div>

        <div className={styles.section}>
          <h2>Approach</h2>
          <ApproachList />
        </div>

        <div className={styles.section}>
          <h2>Skills</h2>
          <div className={styles.skills}>
            <div className={styles.skillGroup}>
              <h3>Design</h3>
              <ul>
                <li>UX/UI Design & Interaction Design</li>
                <li>Design Systems & Component Libraries</li>
                <li>Prototyping & Usability Testing</li>
                <li>User Research & Journey Mapping</li>
              </ul>
            </div>
            <div className={styles.skillGroup}>
              <h3>Development</h3>
              <ul>
                <li>React / Next.js, TypeScript</li>
                <li>SCSS, Tailwind, Design Tokens</li>
                <li>Accessibility (WCAG), QA with dev teams</li>
                <li>Storybook & component documentation</li>
              </ul>
            </div>
            <div className={styles.skillGroup}>
              <h3>Tools</h3>
              <ul>
                <li>Figma, FigJam</li>
                <li>Git & collaboration workflows</li>
                <li>Storybook</li>
                <li>Analytics & usability tooling</li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Recent roles</h2>
          <RolesCards />
        </div>

        <div className={styles.section}>
          <h2>Let’s connect</h2>
          <p>
            I’m open to new opportunities and collaborations. Feel free to reach
            out to talk about design systems, product UX, or tough interaction
            challenges.
          </p>
          <div className={styles.contact}>
            <a href="mailto:jonatanbjerrekaer@gmail.com">jonatanbjerrekaer@gmail.com</a>
            <a
              href="https://www.linkedin.com/in/jonatandbjerrek%C3%A6r"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

