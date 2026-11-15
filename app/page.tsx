import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon, Section, Tooltip } from "@/components/ui";
import { AnimatedLink } from "@/components/AnimatedLink";
import { FeaturedWork } from "@/components/FeaturedWork";
import { DesignCarousel } from "@/components/DesignCarousel";
import { LogoMarquee } from "@/components/LogoMarquee";
import { getFeaturedProjectsList } from "@/lib/content/featuredProjects";
import { designCarouselItems } from "@/lib/content/designCarouselItems";
import { clientLogos } from "@/lib/content/clientLogos";
import { hasCaseStudy, getProjectBySlug } from "@/lib/content/projects";
import { AvailabilityCTA } from "@/components/AvailabilityCTA";
import { Testimonials } from "@/components/Testimonials";
import { WritingSection } from "@/components/WritingSection";
import { PointerParallax } from "@/components/PointerParallax";
import { HeroGrid } from "@/components/HeroGrid";
import { withBasePath } from "@/lib/utils/paths";
import styles from "./page.module.scss";

const HEADLINE = "I design interfaces that developers actually want to build.".split(" ");

export default async function HomePage() {
  // Get featured projects from actual project files
  const featuredProjects = (await getFeaturedProjectsList()).slice(0, 3);
  
  // Fetch actual project data for featured projects to check if they have case studies
  const featuredProjectsWithCaseStudy = await Promise.all(
    featuredProjects.map(async (project) => {
      const fullProject = await getProjectBySlug(project.slug);
      return {
        ...project,
        hasCaseStudy: fullProject ? hasCaseStudy(fullProject) : false,
        comingSoon: fullProject?.comingSoon || false,
        liveDemo: fullProject?.liveDemo || false,
      };
    })
  );

  return (
    <div className={styles.page}>
      <Section variant="hero" className={styles.hero} innerClassName={styles.heroContent} prepend={<HeroGrid />}>
          <h1 className={styles.heroTitle}>
            {HEADLINE.map((word, index) => (
              <span key={index}>
                <span className={styles.heroWord} style={{ "--w": index } as CSSProperties}>{word}</span>{" "}
              </span>
            ))}
          </h1>
          <div className={styles.heroMeta}>
          <p className={styles.heroSubtitle}>
            10+ years of{" "}
            <Tooltip
              inline
              placement="top"
              className="tooltip-glass tooltip-glass--solid"
              content="Bareknuckle full-contact karate. I've taught it since 2013, and the same discipline goes into my design work."
            >
              <Link href="/about/#karate" className={styles.fullContact}>full-contact</Link>
            </Tooltip>{" "}
            discipline applied to product design, bridging the gap between Figma and the codebase.
          </p>
          <AnimatedLink href="/projects/" className={styles.heroCta}>
            View projects
            <span className={styles.heroArrow} aria-hidden="true">
              <Icon name="arrow-right" size={18} />
            </span>
          </AnimatedLink>
          </div>
          <PointerParallax className={styles.heroStage}>
            <a
              className={`${styles.heroLink} ${styles.heroPanel}`}
              href={withBasePath("/projects/yadl/")}
              aria-label="YADL case study: design-system variable collections"
            >
              <img src={withBasePath("/projects/yadl/ready-to-analyze.jpg")} alt="YADL plugin, ready to analyze" loading="lazy" decoding="async" />
            </a>
            <a
              className={`${styles.heroLink} ${styles.heroShipped}`}
              href={withBasePath("/projects/adtraction-brands/")}
              aria-label="Adtraction brands platform case study"
            >
              <img
                src={withBasePath("/projects/adtraction-brands/new-brands.jpg")}
                alt="Adtraction brands platform"
                loading="lazy"
                decoding="async"
              />
            </a>
            <img className={styles.heroKeyboard} src={withBasePath("/images/hero/apple-keyboard.webp")} alt="" loading="lazy" decoding="async" />
            <img
              className={styles.heroHand}
              src={withBasePath("/images/hero/ipad-hand-cramer-1640.webp")}
              srcSet={`${withBasePath("/images/hero/ipad-hand-cramer-960.webp")} 960w, ${withBasePath("/images/hero/ipad-hand-cramer-1640.webp")} 1640w`}
              sizes="(max-width: 767px) 124vw, 820px"
              alt=""
              fetchPriority="high"
            />
          </PointerParallax>
      </Section>

      {featuredProjectsWithCaseStudy.length > 0 && <FeaturedWork projects={featuredProjectsWithCaseStudy} />}

      {/* Design Carousel Section */}
      <section className={styles.carousel} aria-labelledby="visual-highlights-title">
        <h2 id="visual-highlights-title" className="sr-only">Visual highlights from selected projects</h2>
        <DesignCarousel items={designCarouselItems} />
      </section>

      {/* Writing Section */}
      <WritingSection />

      {/* Testimonials Section */}
      <Testimonials />

      <LogoMarquee
        logos={clientLogos}
        title="Who I’ve worked with"
      />

      {/* Availability CTA Section */}
      <AvailabilityCTA />
    </div>
  );
}
