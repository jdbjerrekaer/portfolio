import type { Metadata } from "next";
import { getAllProjects, hasCaseStudy } from "@/lib/content/projects";
import { DesignCarousel } from "@/components/DesignCarousel";
import { LogoGrid } from "@/components/LogoGrid";
import { designCarouselItems } from "@/lib/content/designCarouselItems";
import { clientLogos } from "@/lib/content/clientLogos";
import { ProjectCard } from "@/components/ProjectCard";
import { Badge, Section } from "@/components/ui";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Projects",
  description: "A collection of my design engineering and UX projects.",
};

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div className={styles.page}>
      <Section variant="hero" className={styles.hero} innerClassName={styles.sectionInner}>
          <h1>Projects</h1>
          <p className={styles.intro}>
            A collection of projects where design meets engineering. Each project
            represents a unique challenge and solution.
          </p>
      </Section>

      <section className={styles.carousel}>
        <DesignCarousel items={designCarouselItems} />
      </section>

      {projects.length > 0 ? (
        <Section className={styles.contentSection} innerClassName={styles.sectionInner}>
            <div className={styles.projects} aria-labelledby="projects-list-label">
              <Badge id="projects-list-label" tone="muted" className={styles.sectionLabel} label="Case studies & explorations" />
              <div className={styles.grid}>
                {projects.map((project) => (
                  <ProjectCard
                    key={project.slug}
                    slug={project.slug}
                    title={project.title}
                    role={project.role}
                    outcome={project.outcome}
                    tags={project.tags}
                    coverImage={project.coverImage}
                    hasCaseStudy={hasCaseStudy(project)}
                    comingSoon={project.comingSoon}
                    variant="catalog"
                  />
                ))}
              </div>
            </div>
        </Section>
      ) : (
        <Section className={styles.contentSection} innerClassName={styles.sectionInner}>
            <div className={styles.empty}>
              <p>No projects yet. Check back soon!</p>
            </div>
        </Section>
      )}

      <section className={styles.logos}>
        <LogoGrid
          logos={clientLogos}
          title="Clients & Collaborators"
          align="left"
          maxVisible={12}
        />
      </section>
    </div>
  );
}
