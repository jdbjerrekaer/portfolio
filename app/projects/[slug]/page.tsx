import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProjectBySlug, getProjectSlugs } from "@/lib/content/projects";
import { MdxContent } from "@/components/MdxContent";
import { Chip } from "@/components/ui";
import styles from "./page.module.scss";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map((slug) => ({ slug }));
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

  const formattedDate = new Date(project.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <Link href="/projects/" className={styles.backLink}>
          ← Back to Projects
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
                {label} →
              </a>
            ))}
          </div>
        )}
      </header>

      {project.coverImage && (
        <div className={styles.coverImage}>
          <Image
            src={project.coverImage}
            alt={`${project.title} project cover`}
            fill
            priority
            className={styles.image}
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
        </div>
      )}

      <div className={styles.content}>
        <MdxContent source={project.content} />
      </div>
    </article>
  );
}

