import type { Metadata } from "next";
import Image from "next/image";
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
        <div className={styles.heroContent}>
          <div className={styles.heroImage}>
            <Image
              src="https://media.licdn.com/dms/image/v2/D4E03AQH4M0-aldjjIQ/profile-displayphoto-crop_800_800/B4EZsdztZbJQAI-/0/1765731654118?e=1770249600&v=beta&t=HWv-zOmu3hXC1utVgJgak6oDIhGNT2CSZ_Rhu_4v7M4"
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
              Hi, I&apos;m Jonatan Bjerrekær 👋 a curious design engineer who likes to
              sit with real users, map messy workflows into clearer journeys,
              sketch scrappy prototypes, and then build the thing so it actually
              works. I grew up tinkering with side projects, and today I bring
              that same energy to B2B products: making complex tools feel as
              calm and clear as possible.
            </p>
          </div>
        </div>
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
          <SkillsCards />
        </div>

        <div className={styles.section}>
          <h2>Recent roles</h2>
          <RolesCards />
        </div>

        <div className={styles.section}>
          <h2>Let's connect</h2>
          <p>
            I'm open to new opportunities and collaborations. Feel free to reach
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
