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

  const isUnavailable = comingSoon || !hasCaseStudy;
  const statusLabel = comingSoon ? "Coming soon" : !hasCaseStudy ? "Preview only" : "Case study available";

  const cardContent = (
    <Card className={styles.card}>
      <div className={`${styles.imageWrapper} ${isUnavailable ? styles.comingSoon : ''}`}>
        <Image
          src={imageSrc}
          alt={`${title} project cover`}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <span className={`${styles.statusBadge} ${isUnavailable ? styles.statusBadgeMuted : styles.statusBadgeActive}`}>
          {statusLabel}
        </span>
      </div>
      <div className={styles.content}>
        <div className={styles.headingRow}>
          <h3 className={styles.title}>{title}</h3>
          <span className={styles.role}>{role}</span>
        </div>
        <p className={styles.summary}>{summary}</p>
        <div className={styles.tags}>
          {tags.map((tag) => (
            <Chip key={tag} variant="default" size="sm">
              {tag}
            </Chip>
          ))}
        </div>
        <p className={styles.cardState}>
          {isUnavailable ? "Case study in progress" : "Read case study"}
        </p>
      </div>
    </Card>
  );

  if (isUnavailable) {
    return (
      <Tooltip
        content={comingSoon ? "Case study coming soon" : "Project preview only"}
        delay={300}
        className="tooltip-glass"
        placement="top"
        followCursor
      >
        <div className={styles.linkWrapper} aria-label={`${title}. ${statusLabel}.`}>
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

