"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, Chip, Tooltip } from "@/components/ui";
import { withBasePath } from "@/lib/utils/paths";
import styles from "./ProjectCard.module.scss";

export interface ProjectCardProps {
  slug: string;
  title: string;
  summary: string;
  role: string;
  tags: string[];
  coverImage?: string;
  hasCaseStudy?: boolean;
  comingSoon?: boolean;
}

export function ProjectCard({
  slug,
  title,
  summary,
  role,
  tags,
  coverImage,
  hasCaseStudy = false,
  comingSoon = false,
}: ProjectCardProps) {
  // Generate placeholder image if no coverImage provided
  // Prefix coverImage with base path if it's a regular path (not a data URI)
  const imageSrc = coverImage 
    ? (coverImage.startsWith("data:") || coverImage.startsWith("http") 
        ? coverImage 
        : withBasePath(coverImage))
    : `data:image/svg+xml,${encodeURIComponent(`
    <svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="500" fill="#f5f5f7"/>
      <text x="50%" y="50%" font-family="system-ui, -apple-system" font-size="24" fill="#86868b" text-anchor="middle" dominant-baseline="middle">${title}</text>
    </svg>
  `.trim())}`;

  const cardContent = (
    <Card isHoverable className={styles.card}>
      <div className={`${styles.imageWrapper} ${comingSoon ? styles.comingSoon : ''}`}>
        <Image
          src={imageSrc}
          alt={`${title} project cover`}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.tags}>
          {tags.map((tag) => (
            <Chip key={tag} variant="default" size="sm">
              {tag}
            </Chip>
          ))}
        </div>
      </div>
    </Card>
  );

  // Wrap with tooltip if coming soon or no case study yet
  if (comingSoon || !hasCaseStudy) {
    return (
      <Tooltip
        content="Coming soon"
        delay={300}
        className="tooltip-glass"
        placement="top"
        followCursor
      >
        <div className={styles.linkWrapper}>
          {cardContent}
        </div>
      </Tooltip>
    );
  }

  return (
    <Link href={`/projects/${slug}/`} className={styles.link}>
      {cardContent}
    </Link>
  );
}

