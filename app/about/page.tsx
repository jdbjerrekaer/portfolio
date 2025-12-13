import type { Metadata } from "next";
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
          <p>
            BSc in Technical Interaction Design (HCI, UX, and interaction
            design). I’ve led design systems, collaborated tightly with
            developers, and validated experiences through research and usability
            testing. I’m energized by building coherent, scalable interfaces that
            balance user needs with business goals.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Approach</h2>
          <p>
            I start with the problem—observing behavior, mapping user journeys,
            and defining success metrics. From there, I prototype, test, and
            iterate quickly with cross-functional teams. I prefer data-informed
            decisions, accessible defaults, and close collaboration with
            engineering to ship high-quality experiences.
          </p>
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
          <ul className={styles.timeline}>
            <li>
              <strong>UX Engineer, Adtraction</strong> — Lead UX design across
              user groups, translate requirements into real-world use cases, and
              collaborate with devs and PMs to ship improvements.
            </li>
            <li>
              <strong>Lead UI/UX Designer, Adservice</strong> — Built and
              maintained design systems for 4 internal products; designed and
              coded Angular web experiences; improved email engagement (+22%)
              and client lead generation.
            </li>
            <li>
              <strong>UI/UX Associate, No Zebra</strong> — Benchmarks, UX
              reviews, and IT/system support; improved client UX through audits
              and recommendations.
            </li>
          </ul>
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

