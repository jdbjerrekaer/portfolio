import type { Metadata } from "next";
import Link from "next/link";
import { getAllProjects, hasCaseStudy, type Project } from "@/lib/content/projects";
import { getFeaturedProjectsList } from "@/lib/content/featuredProjects";
import { DesignCarousel } from "@/components/DesignCarousel";
import { LogoGrid } from "@/components/LogoGrid";
import { designCarouselItems } from "@/lib/content/designCarouselItems";
import { clientLogos } from "@/lib/content/clientLogos";
import { ProjectCard } from "@/components/ProjectCard";
import { Icon, Section } from "@/components/ui";
import { resolveAssetSrc } from "@/lib/utils/paths";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Projects",
  description: "A collection of my design engineering and UX projects.",
};

const GROUPS = [
  {
    key: "product",
    title: "Product and client work",
    description: "Product design at Adtraction, from design systems and motion to AI interfaces, plus a UX redesign for a client.",
  },
  {
    key: "ai",
    title: "AI and automation",
    description: "Personal systems: agents that work inside the tools I already use.",
  },
] as const;

function Card({ project }: { project: Project }) {
  return (
    <ProjectCard
      slug={project.slug}
      title={project.title}
      role={project.role}
      // The role is "Design Engineer" almost everywhere; only show it when it says something new.
      showRole={project.role !== "Design Engineer"}
      outcome={project.outcome}
      tags={project.tags}
      maxTags={2}
      coverImage={project.coverImage}
      hasCaseStudy={hasCaseStudy(project)}
      comingSoon={project.comingSoon}
      liveDemo={project.liveDemo}
      variant="catalog"
    />
  );
}

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  // Same three as the homepage, so the two pages always agree on where to start.
  const startSlugs = (await getFeaturedProjectsList()).slice(0, 3).map((p) => p.slug);
  const start = startSlugs
    .map((slug) => projects.find((p) => p.slug === slug))
    .filter((p): p is Project => Boolean(p));
  const rest = projects.filter((p) => !startSlugs.includes(p.slug));
  const earlier = rest.filter((p) => p.section === "earlier");

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

      {start.length > 0 && (
        <Section variant="subtle" className={styles.contentSection} innerClassName={styles.sectionInner}>
          <div className={styles.group} aria-labelledby="group-start">
            <header className={styles.groupHeader}>
              <h2 id="group-start">Start here</h2>
              <p>Three shipped products to start with: a Figma plugin and two mobile apps.</p>
            </header>
            <div className={styles.grid}>
              {start.map((project) => (
                <Card key={project.slug} project={project} />
              ))}
            </div>
          </div>
        </Section>
      )}

      <Section className={styles.contentSection} innerClassName={styles.sectionInner}>
        {GROUPS.map((group) => {
          const items = rest.filter((p) => p.section === group.key);
          if (items.length === 0) return null;
          return (
            <div key={group.key} className={styles.group} aria-labelledby={`group-${group.key}`}>
              <header className={styles.groupHeader}>
                <h2 id={`group-${group.key}`}>{group.title}</h2>
                <p>{group.description}</p>
              </header>
              <div className={styles.grid}>
                {items.map((project) => (
                  <Card key={project.slug} project={project} />
                ))}
              </div>
            </div>
          );
        })}

        {earlier.length > 0 && (
          <div className={styles.group} aria-labelledby="group-earlier">
            <header className={styles.groupHeader}>
              <h2 id="group-earlier">Earlier work</h2>
              <p>University projects, kept for context.</p>
            </header>
            <ul className={styles.earlierList}>
              {earlier.map((project) => (
                <li key={project.slug}>
                  <Link href={`/projects/${project.slug}/`} className={styles.earlierRow}>
                    {project.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveAssetSrc(project.coverImage)} alt="" className={styles.earlierThumb} loading="lazy" />
                    )}
                    <span className={styles.earlierText}>
                      <span className={styles.earlierTitle}>{project.title}</span>
                      <span className={styles.earlierSummary}>{project.outcome ?? project.summary}</span>
                    </span>
                    <span className={styles.earlierYear}>{project.date.slice(0, 4)}</span>
                    <Icon name="arrow-right" size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <section className={styles.logos}>
        <LogoGrid logos={clientLogos} title="Clients & Collaborators" align="left" maxVisible={12} />
      </section>
    </div>
  );
}
