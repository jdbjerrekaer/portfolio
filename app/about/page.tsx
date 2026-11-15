import { Fragment, type CSSProperties } from "react";
import type { Metadata } from "next";
import { AvailabilityCTA } from "@/components/AvailabilityCTA";
import { PlayfulProfile } from "@/components/PlayfulProfile/PlayfulProfile";
import { Testimonials } from "@/components/Testimonials";
import { Reveal, stagger } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/ui";
import { ApproachList } from "./ApproachList";
import { BackgroundCards } from "./BackgroundCards";
import { KarateClips } from "./KarateClips";
import { RolesCards } from "./RolesCards";
import { SkillsCards } from "./SkillsCards";
import { resolveAssetSrc } from "@/lib/utils/paths";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about Jonatan Bjerrekær: Product Design Engineer bridging product strategy, UX, design systems, and engineering feasibility.",
};

const STATEMENT = "I turn messy B2B workflows into clear product experiences.";

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <Section variant="hero" className={styles.hero}>
        <Reveal className={styles.heroContent}>
          <div className={styles.heroText}>
            <p className={`${styles.eyebrow} reveal-item`}>About</p>
            <h1 className={styles.statement}>
              {STATEMENT.split(" ").map((word, index) => (
                <Fragment key={index}>
                  <span className={styles.word} style={{ "--w": index } as CSSProperties}>{word}</span>{" "}
                </Fragment>
              ))}
            </h1>
            <p className={`${styles.intro} reveal-item`} style={stagger(4)}>
              Hi, I&apos;m Jonatan Bjerrekær, a Product Design Engineer working across product strategy, UX, design
              systems and front-end implementation. I stay close through build, QA and production quality, and make
              design decisions practical enough for developers to ship without losing the user clarity behind them.
            </p>
          </div>
          <div className={`${styles.heroImage} reveal-item`} style={stagger(2)}>
            <PlayfulProfile
              src={resolveAssetSrc("/images/about-profile.jpg")}
              alt="Jonatan Bjerrekær"
              width={400}
              height={400}
              className={styles.profileImage}
              priority
            />
          </div>
        </Reveal>
      </Section>

      <Section className={styles.contentSection}>
        <SectionHeader title="Background" description="Where I come from, and what I do when I am not designing." />
        <BackgroundCards />
        <KarateClips />
      </Section>

      <Section variant="subtle" className={styles.contentSection}>
        <SectionHeader title="How I work" description="How I take a feature from a messy problem to something shipped." />
        <ApproachList />
      </Section>

      <Section className={styles.contentSection}>
        <SkillsCards />
      </Section>

      <Section variant="subtle" className={styles.contentSection}>
        <RolesCards />
      </Section>

      <Testimonials />
      <AvailabilityCTA />
    </div>
  );
}
