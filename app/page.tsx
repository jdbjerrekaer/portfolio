import Link from "next/link";
import { Button } from "@/components/ui";
import { getAllProjects } from "@/lib/content/projects";
import { ProjectCard } from "@/components/ProjectCard";
import { DesignCarousel } from "@/components/DesignCarousel";
import styles from "./page.module.scss";

export default async function HomePage() {
  const projects = await getAllProjects();
  const featuredProjects = projects.slice(0, 3);

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
              <Button variant="premium" size="lg">
                View Projects
              </Button>
            </Link>
            <Link href="/about/">
              <Button variant="secondary" size="lg">
                About Me
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Design Carousel Section */}
      <section className={styles.carousel}>
        <DesignCarousel
          items={[
            { kind: "desktop", label: "Desktop Design 1", tooltip: "Design System Components" },
            { kind: "iphone", label: "iPhone Design 1", tooltip: "Mobile App Interface" },
            { kind: "desktop", label: "Desktop Design 2", tooltip: "Dashboard Layout" },
            { kind: "iphone", label: "iPhone Design 2", tooltip: "User Profile Screen" },
            { kind: "desktop", label: "Desktop Design 3", tooltip: "Data Visualization" },
            { kind: "iphone", label: "iPhone Design 3", tooltip: "Onboarding Flow" },
            { kind: "desktop", label: "Desktop Design 4", tooltip: "Settings Panel" },
            { kind: "iphone", label: "iPhone Design 4", tooltip: "Navigation Design" },
            { kind: "desktop", label: "Desktop Design 5", tooltip: "Form Components" },
            { kind: "iphone", label: "iPhone Design 5", tooltip: "Detail View" },
          ]}
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
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
