import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAllProjects, getProjectBySlug, getProjectSlugs, hasCaseStudy } from "@/lib/content/projects";
import { MdxContent } from "@/components/MdxContent";
import { ProjectGallery } from "@/components/ProjectGallery";
import { CramerDemoFrame } from "@/components/CramerDemoFrame";
import { Reveal, stagger } from "@/components/Reveal";
import { AnimatedLink } from "@/components/AnimatedLink";
import { ActionLink, Icon } from "@/components/ui";
import { resolveAssetSrc } from "@/lib/utils/paths";
import { CaseStudyToc } from "./CaseStudyToc";
import styles from "./page.module.scss";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  const params = [];

  for (const slug of slugs) {
    const project = await getProjectBySlug(slug);
    // Only generate static params for projects that are not coming soon
    if (project && !project.comingSoon) {
      params.push({ slug });
    }
  }

  return params;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: project.title,
    description: project.summary,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  const sectionMatches = project?.content.match(/^##\s+(.+)$/gm) ?? [];
  const detectedSections = sectionMatches.map((heading) => {
    const title = heading.replace(/^##\s+/, "").trim();
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    return { title, id };
  });
  const sections = project?.sectionNav ?? detectedSections;

  if (!project) {
    notFound();
  }

  // Redirect coming soon projects
  if (project.comingSoon) {
    notFound();
  }

  // Next case study in the same order as the projects page, wrapping round; earlier work is left out.
  const readable = (await getAllProjects()).filter(
    (p) => hasCaseStudy(p) && !p.comingSoon && p.section !== "earlier",
  );
  const position = readable.findIndex((p) => p.slug === project.slug);
  const next = readable.length > 1 ? readable[(position + 1) % readable.length] : undefined;

  const year = project.date.slice(0, 4);
  const facts = [
    { label: "Role", value: project.role },
    { label: "Year", value: year },
    { label: "Focus", value: project.tags.join(", ") },
    { label: "Outcome", value: project.outcome },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));
  const hasLinks = project.liveDemo || (project.links && Object.keys(project.links).length > 0);

  return (
    <article className={styles.page}>
      <Reveal as="div" className={styles.header}>
        <div className="reveal-item">
          <ActionLink href="/projects/" variant="back" className={styles.backLink}>All projects</ActionLink>
        </div>

        <p className={`${styles.eyebrow} reveal-item`} style={stagger(1)}>
          Case study <span aria-hidden="true">·</span> {year}
        </p>
        <h1 className={`${styles.title} reveal-item`} style={stagger(2)}>{project.title}</h1>
        <p className={`${styles.summary} reveal-item`} style={stagger(3)}>{project.summary}</p>

        <dl className={`${styles.facts} reveal-item`} style={stagger(4)}>
          {facts.map((fact) => (
            <div key={fact.label} className={styles.fact}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        {hasLinks && (
          <div className={`${styles.links} reveal-item`} style={stagger(5)}>
            {project.liveDemo && (
              <ActionLink href={`#${project.demoAnchor}`} variant="external" icon="arrow-right" className={`${styles.link} ${styles.demoLink}`}>
                Live demo
              </ActionLink>
            )}
            {Object.entries(project.links ?? {}).map(([label, url]) => (
              <ActionLink key={label} href={url} variant="external" className={styles.link}>
                {label}
              </ActionLink>
            ))}
          </div>
        )}
      </Reveal>

      <div className={styles.media}>
        {project.heroDemo && (
          <CramerDemoFrame
            src={project.heroDemo.src}
            title={project.heroDemo.title}
            height={project.heroDemo.height}
            note={project.heroDemo.note}
          />
        )}

        {project.demoVideo && (
          <figure className={styles.demo}>
            <video
              src={resolveAssetSrc(project.demoVideo.src)}
              poster={project.demoVideo.poster ? resolveAssetSrc(project.demoVideo.poster) : undefined}
              className={styles.demoVideo}
              controls
              playsInline
              preload="metadata"
            />
            {project.demoVideo.label && (
              <figcaption className={styles.demoCaption}>{project.demoVideo.label}</figcaption>
            )}
          </figure>
        )}

        <ProjectGallery
          cover={
            project.coverImage
              ? {
                  src: project.coverImage,
                  alt: `${project.title} project cover`,
                  title: project.title,
                }
              : undefined
          }
          images={project.gallery}
          layout={project.galleryLayout}
        />
      </div>

      <div className={`${styles.body} ${sections.length > 0 ? styles.withToc : ""}`}>
        {sections.length > 0 && (
          <aside className={styles.tocColumn}>
            <CaseStudyToc sections={sections} />
          </aside>
        )}
        <div className={styles.content}>
          <MdxContent source={project.content} />
        </div>
      </div>

      {next && (
        <Reveal as="div" className={styles.next}>
          <AnimatedLink href={`/projects/${next.slug}/`} className={styles.nextLink}>
              <span className={`${styles.nextLabel} reveal-item`}>Next case study</span>
              <span className={`${styles.nextTitle} reveal-item`} style={stagger(1)}>
                {next.title}
                <span className={styles.nextArrow} aria-hidden="true">
                  <Icon name="arrow-right" size={20} />
                </span>
              </span>
              {next.outcome && (
                <span className={`${styles.nextOutcome} reveal-item`} style={stagger(2)}>{next.outcome}</span>
              )}
              {next.coverImage && (
                <span className={styles.nextMedia} aria-hidden="true">
                  <Image src={resolveAssetSrc(next.coverImage)} alt="" fill sizes="(max-width: 800px) 100vw, 40vw" className={styles.nextImage} />
                </span>
              )}
            </AnimatedLink>
        </Reveal>
      )}
    </article>
  );
}
