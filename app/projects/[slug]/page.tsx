import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectBySlug, getProjectSlugs } from "@/lib/content/projects";
import { MdxContent } from "@/components/MdxContent";
import { ProjectCoverImage } from "@/components/ProjectCoverImage";
import { ProjectImageGrid } from "@/components/ProjectImageGrid";
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

      {project.coverImage && (
        <ProjectCoverImage
          src={project.coverImage}
          alt={`${project.title} project cover`}
          title={project.title}
        />
      )}

      <div className={styles.content}>
        <MdxContent source={project.content} />
      </div>

      {project.gallery && project.gallery.length > 0 && (
        <ProjectImageGrid images={project.gallery} />
      )}
    </article>
  );
}

