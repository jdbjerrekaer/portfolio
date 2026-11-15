import type { Metadata } from "next";
import Image from "next/image";
import { getAllProjects, hasCaseStudy, type Project } from "@/lib/content/projects";
import { getFeaturedProjectsList } from "@/lib/content/featuredProjects";
import { DesignCarousel } from "@/components/DesignCarousel";
import { LogoMarquee } from "@/components/LogoMarquee";
import { ProjectRowList } from "@/components/FeaturedWork";
import { Reveal, stagger } from "@/components/Reveal";
import { AnimatedLink } from "@/components/AnimatedLink";
import { designCarouselItems } from "@/lib/content/designCarouselItems";
import { clientLogos } from "@/lib/content/clientLogos";
import { Icon, Section, SectionHeader } from "@/components/ui";
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
    description: "Personal AI agents I built and run for myself.",
  },
  {
    key: "earlier",
    title: "Earlier work",
    description: "University projects, kept for context.",
  },
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

function IndexRow({ project, index }: { project: Project; index: number }) {
  return (
    <li className={`${styles.item} reveal-item`} style={stagger(index + 1)}>
      <AnimatedLink href={`/projects/${project.slug}/`} className={styles.link}>
          <span className={styles.thumb}>
            {project.coverImage && (
              <Image src={resolveAssetSrc(project.coverImage)} alt="" fill sizes="(max-width: 640px) 96px, 160px" className={styles.thumbImage} />
            )}
          </span>
          <span className={styles.itemText}>
            <span className={styles.itemTitle}>{project.title}</span>
            <span className={styles.itemSummary}>{project.outcome ?? project.summary}</span>
            <span className={styles.itemMeta}>
              {project.date.slice(0, 4)}
              <span aria-hidden="true">·</span>
              {project.tags.slice(0, 2).join(", ")}
              {project.liveDemo && <span className={styles.live}>Live demo</span>}
            </span>
          </span>
          <span className={styles.arrow} aria-hidden="true">
            <Icon name="arrow-right" size={16} />
          </span>
        </AnimatedLink>
    </li>
  );
}

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  // Same three as the homepage, so the two pages always agree on where to start.
  const startSlugs = (await getFeaturedProjectsList()).slice(0, 3).map((p) => p.slug);
  const start = startSlugs
    .map((slug) => projects.find((p) => p.slug === slug))
    .filter((p): p is Project => Boolean(p))
    .map((p) => ({ ...p, hasCaseStudy: hasCaseStudy(p) }));
  const rest = projects.filter((p) => !startSlugs.includes(p.slug));

  return (
    <div className={styles.page}>
      <Section variant="hero" className={styles.hero}>
        <Reveal className={styles.heroInner}>
          <h1 className={`${styles.heroTitle} reveal-item`}>Projects</h1>
          <p className={`${styles.stat} reveal-item`} style={stagger(1)}>
            <span className={styles.statNumber}>{pad(projects.length)}</span>
            projects
          </p>
          <p className={`${styles.intro} reveal-item`} style={stagger(2)}>
            Design engineering and UX work: Figma plugins and design systems at Adtraction, mobile apps,
            client redesigns and the AI agents I run for myself.
          </p>
        </Reveal>
      </Section>

      <section className={styles.carousel} aria-label="Visual highlights from selected projects">
        <DesignCarousel items={designCarouselItems} />
      </section>

      {start.length > 0 && (
        <Section variant="subtle" className={styles.start}>
          <SectionHeader
            title="Start here"
            description="The quickest way in: a design-system plugin for Figma and two mobile apps."
          />
          <ProjectRowList projects={start} />
        </Section>
      )}

      <Section className={styles.index} innerClassName={styles.groups}>
        {GROUPS.map((group) => {
          const items = rest.filter((p) => p.section === group.key);
          if (items.length === 0) return null;
          return (
            <Reveal key={group.key} className={styles.group}>
              <header className={styles.groupIntro}>
                <h2 id={`group-${group.key}`} className="reveal-item">
                  {group.title}
                  <span className={styles.count}>{pad(items.length)}</span>
                </h2>
                <p className="reveal-item" style={stagger(1)}>{group.description}</p>
              </header>
              <ul className={styles.items} aria-labelledby={`group-${group.key}`}>
                {items.map((project, index) => (
                  <IndexRow key={project.slug} project={project} index={index} />
                ))}
              </ul>
            </Reveal>
          );
        })}
      </Section>

      <LogoMarquee
        logos={clientLogos}
        title="Clients and collaborators"
        description="From large international brands to local Danish, Swedish, Norwegian and Finnish companies, across the Nordic region and beyond."
      />
    </div>
  );
}
