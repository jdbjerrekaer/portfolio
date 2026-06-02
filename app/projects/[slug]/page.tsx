import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectBySlug, getProjectSlugs } from "@/lib/content/projects";
import { MdxContent } from "@/components/MdxContent";
import { ProjectGallery } from "@/components/ProjectGallery";
import { Chip } from "@/components/ui";
import { SFSymbol } from "@/components/ui/SFSymbol";
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

  const formattedDate = new Date(project.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/projects/" className={styles.breadcrumbLink}>Projects</Link>
          <span className={styles.breadcrumbDivider}>/</span>
          <span className={styles.breadcrumbCurrent}>{project.title}</span>
        </nav>

        <Link href="/projects/" className={styles.backLink}>
          <SFSymbol name="arrow.left" size={16} weight="medium" className={styles.backIcon} />
          <span>Back to Projects</span>
        </Link>

        <div className={styles.meta}>
          <span className={styles.role}>{project.role}</span>
          <span className={styles.date}>{formattedDate}</span>
        </div>

        <h1 className={styles.title}>{project.title}</h1>
        <p className={styles.summary}>{project.summary}</p>

        <aside className={styles.quickFacts} aria-label="Project quick facts">
          <div className={styles.quickFact}>
            <span className={styles.quickFactLabel}>Role</span>
            <span className={styles.quickFactValue}>{project.role}</span>
          </div>
          <div className={styles.quickFact}>
            <span className={styles.quickFactLabel}>Date</span>
            <span className={styles.quickFactValue}>{formattedDate}</span>
          </div>
          <div className={styles.quickFact}>
            <span className={styles.quickFactLabel}>Outcome</span>
            <span className={styles.quickFactValue}>AI workflow system with guardrails, memory, and review loops</span>
          </div>
        </aside>

        {sections.length > 0 && (
          <nav className={styles.sectionNav} aria-label="Jump to section">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className={styles.sectionLink}>
                {section.title}
              </a>
            ))}
          </nav>
        )}

        <div className={styles.tags}>
          {project.tags.map((tag) => (
            <Chip key={tag} variant="default">
              {tag}
            </Chip>
          ))}
        </div>

        {project.links && Object.keys(project.links).length > 0 && (
          <div className={styles.links}>
            {Object.entries(project.links).map(([label, url]) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {label}
                <SFSymbol name="arrow.up.right" size={14} weight="medium" className={styles.externalIcon} />
              </a>
            ))}
          </div>
        )}
      </header>

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
      />

      <div className={styles.content}>
        <MdxContent source={project.content} />
      </div>
    </article>
  );
}
