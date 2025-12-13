import Link from "next/link";
import { Button } from "@/components/ui";
import { ProjectCard } from "@/components/ProjectCard";
import { DesignCarousel } from "@/components/DesignCarousel";
import { LogoStrip } from "@/components/LogoStrip";
import { LogoGrid } from "@/components/LogoGrid";
import { featuredProjects } from "@/lib/content/featuredProjects";
import { designCarouselItems } from "@/lib/content/designCarouselItems";
import { clientLogos } from "@/lib/content/clientLogos";
import styles from "./page.module.scss";

export default async function HomePage() {

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

      {/* Logo Strip Section */}
      <section className={styles.logoStrip}>
        <LogoStrip logos={clientLogos} title="Trusted by" />
      </section>

      {/* Design Carousel Section */}
      <section className={styles.carousel}>
        <DesignCarousel items={designCarouselItems} />
      </section>

      {/* Client Logos Grid Section */}
      <section className={styles.logos}>
        <LogoGrid
          logos={clientLogos}
          title="Selected Partners"
          description="I've had the privilege of working with innovative teams and brands across various industries."
          maxVisible={12}
        />
      </section>

      {/* Featured Projects Section */}
      {featuredProjects.length > 0 && (
        <section className={styles.featured}>
          <div className={styles.sectionHeader}>
            <h2>Featured Projects</h2>
            <Link href="/projects/" className={styles.viewAll}>
              View all projects →
            </Link>
          </div>
          <div className={styles.projectGrid}>
            {featuredProjects.map((project) => (
              <ProjectCard
                key={project.slug}
                slug={project.slug}
                title={project.title}
                summary={project.summary}
                role={project.role}
                tags={project.tags}
                coverImage={project.coverImage}
                hasCaseStudy={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
