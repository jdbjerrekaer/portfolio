import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui";
import { SFSymbol } from "@/components/ui/SFSymbol";
import { ProjectCard } from "@/components/ProjectCard";
import { DesignCarousel } from "@/components/DesignCarousel";
import { LogoGrid } from "@/components/LogoGrid";
import { getFeaturedProjectsList } from "@/lib/content/featuredProjects";
import { designCarouselItems } from "@/lib/content/designCarouselItems";
import { clientLogos } from "@/lib/content/clientLogos";
import { hasCaseStudy, getProjectBySlug } from "@/lib/content/projects";
import { withBasePath } from "@/lib/utils/paths";
import { AvailabilityCTA } from "@/components/AvailabilityCTA";
import { Testimonials } from "@/components/Testimonials";
import { WritingSection } from "@/components/WritingSection";
import styles from "./page.module.scss";

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
      };
    })
  );

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroKicker}>Jonatan Bjerrekær</p>
          <h1 className={styles.heroTitle}>
            Design engineer portfolio
          </h1>
          <p className={styles.heroSubtitle}>
            I design interfaces that developers actually want to build, then shape the systems, QA loops, and implementation details that help them ship cleanly.
          </p>
          <div className={styles.heroCta}>
            <Link href="/projects/">
              <Button variant="premium" size="lg" icon="folder" iconPosition="right">
                View Projects
              </Button>
            </Link>
            <Link href="/about/">
              <Button variant="secondary" size="lg" icon="person" iconPosition="right">
                About Me
              </Button>
            </Link>
            <a href="https://github.com/jdbjerrekaer" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="lg" hoverIcon="arrow.up.right">
                GitHub
              </Button>
            </a>
          </div>
          <div className={styles.heroShowcase} aria-label="Selected design engineering work preview">
            <div className={styles.heroWindow}>
              <div className={styles.windowChrome} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <Image
                src={withBasePath("/projects/openclaw-ai-assistant/openclaw-website-hero.png")}
                alt="OpenClaw assistant website interface preview"
                width={960}
                height={600}
                priority
                className={styles.heroImage}
              />
            </div>
            <div className={styles.heroProof}>
              <span>Design systems</span>
              <span>UX engineering</span>
              <span>AI-assisted QA</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      {featuredProjects.length > 0 && (
        <section className={styles.featured}>
          <div className={styles.sectionHeader}>
            <h2>Featured Projects</h2>
            <Link href="/projects/" className={styles.viewAll}>
              View all projects <SFSymbol name="folder" size={18} weight="medium" className={styles.folderIcon} />
            </Link>
          </div>
          <div className={styles.projectGrid}>
            {featuredProjectsWithCaseStudy.map((project) => (
              <ProjectCard
                key={project.slug}
                slug={project.slug}
                title={project.title}
                summary={project.summary}
                role={project.role}
                tags={project.tags}
                coverImage={project.coverImage}
                hasCaseStudy={project.hasCaseStudy}
                comingSoon={project.comingSoon}
                showStatusBadge={false}
                compactOnMobile
              />
            ))}
          </div>
        </section>
      )}

      {/* Design Carousel Section */}
      <section className={styles.carousel} aria-labelledby="visual-highlights-title">
        <h2 id="visual-highlights-title" className="sr-only">Visual highlights from selected projects</h2>
        <DesignCarousel items={designCarouselItems} />
      </section>

      {/* Writing Section */}
      <WritingSection />

      {/* Testimonials Section */}
      <Testimonials />

      {/* Client Logos Grid Section */}
      <section className={styles.logos}>
        <LogoGrid
          logos={clientLogos}
          title="Who I’ve worked with"
          description="From large international brands to local Danish, Swedish, Norwegian, and Finnish companies, collaborating with innovative teams across the Nordic region and beyond."
          maxVisible={12}
        />
      </section>

      {/* Availability CTA Section */}
      <AvailabilityCTA />
    </div>
  );
}
