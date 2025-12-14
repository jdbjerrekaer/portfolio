import Link from "next/link";
import { Button } from "@/components/ui";
import { SFSymbol } from "@/components/ui/SFSymbol";
import { ProjectCard } from "@/components/ProjectCard";
import { DesignCarousel } from "@/components/DesignCarousel";
import { LogoStrip } from "@/components/LogoStrip";
import { LogoGrid } from "@/components/LogoGrid";
import { getFeaturedProjectsList } from "@/lib/content/featuredProjects";
import { designCarouselItems } from "@/lib/content/designCarouselItems";
import { clientLogos } from "@/lib/content/clientLogos";
import { hasCaseStudy, getProjectBySlug } from "@/lib/content/projects";
import styles from "./page.module.scss";

export default async function HomePage() {
  // Get featured projects from actual project files
  const featuredProjects = await getFeaturedProjectsList();
  
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
          <h1 className={styles.heroTitle}>
            Design Engineer &<br />
            Technical UX Designer
          </h1>
          <p className={styles.heroSubtitle}>
            Turning complex problems into intuitive products.
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
          </div>
        </div>
      </section>

      {/* Design Carousel Section */}
      <section className={styles.carousel}>
        <DesignCarousel items={designCarouselItems} />
      </section>

      {/* Logo Strip Section */}
      <section className={styles.logoStrip}>
        <LogoStrip logos={clientLogos} title="Clients & Collaborators" />
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
              />
            ))}
          </div>
        </section>
      )}

      {/* Client Logos Grid Section */}
      <section className={styles.logos}>
        <LogoGrid
          logos={clientLogos}
          title="Clients & Collaborators"
          description="From large international brands to local Danish, Swedish, Norwegian, and Finnish companies, collaborating with innovative teams across the Nordic region and beyond."
          maxVisible={12}
        />
      </section>
    </div>
  );
}
