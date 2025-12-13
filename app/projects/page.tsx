import type { Metadata } from "next";
import { getAllProjects } from "@/lib/content/projects";
import { ProjectCard } from "@/components/ProjectCard";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Projects",
  description: "A collection of my design engineering and UX projects.",
};

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1>Projects</h1>
        <p className={styles.intro}>
          A collection of projects where design meets engineering. Each project
          represents a unique challenge and solution.
        </p>
      </section>

      {projects.length > 0 ? (
        <section className={styles.projects}>
          <div className={styles.grid}>
            {projects.map((project) => (
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
      ) : (
        <section className={styles.empty}>
          <p>No projects yet. Check back soon!</p>
        </section>
      )}
    </div>
  );
}

