import type { Metadata } from "next";
import Image from "next/image";
import { AvailabilityCTA } from "@/components/AvailabilityCTA";
import { Testimonials } from "@/components/Testimonials";
import { ApproachList } from "./ApproachList";
import { BackgroundCards } from "./BackgroundCards";
import { RolesCards } from "./RolesCards";
import { SkillsCards } from "./SkillsCards";
import { withBasePath } from "@/lib/utils/paths";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about Jonatan Bjerrekær: Product Design Engineer bridging product strategy, UX, design systems, and engineering feasibility.",
};

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.sectionInner}>
          <div className={styles.heroContent}>
            <div className={styles.heroImage}>
              <Image
                src={withBasePath("/images/about-profile.jpg")}
                alt="Jonatan Bjerrekær"
                width={400}
                height={400}
                className={styles.profileImage}
                priority
              />
            </div>
            <div className={styles.heroText}>
              <h1>About Me</h1>
              <p className={styles.intro}>
                Hi, I&apos;m Jonatan Bjerrekær, a Product Design Engineer working across product strategy, UX, design systems, and front-end implementation.
                I turn messy B2B workflows into clear product experiences, then stay close through build, QA, and production quality.
                My strength is making design decisions practical enough for developers to ship without losing the user clarity behind them.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.sectionInner}>
          <div className={styles.section}>
            <h2>Background</h2>
            <BackgroundCards />
          </div>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.sectionInner}>
          <div className={styles.section}>
            <h2>Approach</h2>
            <ApproachList />
          </div>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.sectionInner}>
          <div className={styles.section}>
            <h2>Skills</h2>
            <SkillsCards />
          </div>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.sectionInner}>
          <div className={styles.section}>
            <h2>Recent roles</h2>
            <RolesCards />
          </div>
        </div>
      </section>

      <Testimonials />
      <AvailabilityCTA />
    </div>
  );
}
