import { ActionLink, Button, Section, SectionHeader } from "@/components/ui";
import { ProjectCard } from "@/components/ProjectCard";
import { DesignCarousel } from "@/components/DesignCarousel";
import { LogoGrid } from "@/components/LogoGrid";
import { getFeaturedProjectsList } from "@/lib/content/featuredProjects";
import { designCarouselItems } from "@/lib/content/designCarouselItems";
import { clientLogos } from "@/lib/content/clientLogos";
import { hasCaseStudy, getProjectBySlug } from "@/lib/content/projects";
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
      <Section variant="hero" className={styles.hero} innerClassName={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            I design interfaces that developers actually want to build.
          </h1>
          <p className={styles.heroSubtitle}>
            10+ years of full-contact discipline applied to product design, bridging the gap between Figma and the codebase.
          </p>
          <div className={styles.heroCta}>
            <Button href="/projects/" variant="primary" size="lg" icon="folder" iconPosition="right">
              View Projects
            </Button>
            <Button href="/about/" variant="secondary" size="lg" icon="user" iconPosition="right">
              About Me
            </Button>
            <Button
              href="https://github.com/jdbjerrekaer"
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="lg"
              icon="arrow-up-right"
            >
              GitHub
            </Button>
          </div>
      </Section>

      {/* Featured Projects Section */}
      {featuredProjects.length > 0 && (
        <Section variant="subtle" className={styles.featured}>
          <SectionHeader
            title="Featured Projects"
            description="Selected work showing how I connect UX, design systems, implementation, and product quality."
            variant="split"
            action={<ActionLink href="/projects/" icon="folder">View all projects</ActionLink>}
          />
          <div className={styles.projectGrid}>
            {featuredProjectsWithCaseStudy.map((project) => (
              <ProjectCard
                key={project.slug}
                slug={project.slug}
                title={project.title}
                role={project.role}
                outcome={project.outcome}
                tags={project.tags}
                coverImage={project.coverImage}
                hasCaseStudy={project.hasCaseStudy}
                comingSoon={project.comingSoon}
                variant="featured"
              />
            ))}
          </div>
        </Section>
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
