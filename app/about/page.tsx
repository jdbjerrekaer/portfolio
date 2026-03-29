import type { Metadata } from "next";
import Image from "next/image";
import { AvailabilityCTA } from "@/components/AvailabilityCTA";
import { Testimonials } from "@/components/Testimonials";
import { ApproachList } from "./ApproachList";
import { BackgroundCards } from "./BackgroundCards";
import { RolesCards } from "./RolesCards";
import { SkillsCards } from "./SkillsCards";
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
        <div className={styles.sectionInner}>
          <div className={styles.heroContent}>
            <div className={styles.heroImage}>
              <Image
                src="/images/about-profile.jpg"
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
                Hi, I&apos;m Jonatan Bjerrekær 👋 a design engineer applying 10+ years of full-contact discipline to product design.
                I map messy workflows into clear journeys, sketch prototypes, and build the actual product.
                Today, I bring that iterative depth to B2B tools: making the complex feel calm and clear.
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
