import type { Metadata } from "next";
import Image from "next/image";
import { AvailabilityCTA } from "@/components/AvailabilityCTA";
import { Testimonials } from "@/components/Testimonials";
import { Section, SectionHeader } from "@/components/ui";
import { ApproachList } from "./ApproachList";
import { BackgroundCards } from "./BackgroundCards";
import { RolesCards } from "./RolesCards";
import { SkillsCards } from "./SkillsCards";
import { resolveAssetSrc } from "@/lib/utils/paths";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about Jonatan Bjerrekær: Product Design Engineer bridging product strategy, UX, design systems, and engineering feasibility.",
};

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <Section variant="hero" className={styles.hero} innerClassName={styles.sectionInner}>
          <div className={styles.heroContent}>
            <div className={styles.heroImage}>
              <Image
                src={resolveAssetSrc("/images/about-profile.jpg")}
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
      </Section>

      <Section className={styles.contentSection} innerClassName={styles.sectionInner}>
          <div>
            <SectionHeader title="Background" />
            <BackgroundCards />
          </div>
      </Section>

      <Section variant="subtle" className={styles.contentSection} innerClassName={styles.sectionInner}>
          <div>
            <SectionHeader title="Approach" />
            <ApproachList />
          </div>
      </Section>

      <Section className={styles.contentSection} innerClassName={styles.sectionInner}>
          <div>
            <SectionHeader title="Skills" />
            <SkillsCards />
          </div>
      </Section>

      <Section variant="subtle" className={styles.contentSection} innerClassName={styles.sectionInner}>
          <div>
            <SectionHeader title="Recent roles" />
            <RolesCards />
          </div>
      </Section>

      <Testimonials />
      <AvailabilityCTA />
    </div>
  );
}
