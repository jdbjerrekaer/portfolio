"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Badge, Card, Chip, Icon, Tooltip } from "@/components/ui";
import { resolveAssetSrc } from "@/lib/utils/paths";
import styles from "./ProjectCard.module.scss";

export interface ProjectCardProps {
  slug: string;
  title: string;
  role: string;
  outcome?: string;
  tags: string[];
  coverImage?: string;
  hasCaseStudy?: boolean;
  comingSoon?: boolean;
  variant?: "featured" | "catalog";
}

export function ProjectCard({
  slug,
  title,
  role,
  outcome,
  tags,
  coverImage,
  hasCaseStudy = false,
  comingSoon = false,
  variant = "catalog",
}: ProjectCardProps) {
  const imageSrc = coverImage
    ? resolveAssetSrc(coverImage)
    : `data:image/svg+xml,${encodeURIComponent(`
      <svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="500" fill="#f5f5f7"/>
        <text x="50%" y="50%" font-family="Open Runde, sans-serif" font-size="24" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">${title}</text>
      </svg>
    `.trim())}`;
  const isUnavailable = comingSoon || !hasCaseStudy;
  const statusLabel = comingSoon ? "Coming soon" : !hasCaseStudy ? "Preview only" : "Case study";

  const content = (
    <Card variant="interactive" className={`${styles.card} ${styles[variant]}`}>
      <div className={`${styles.imageWrapper} ${isUnavailable ? styles.comingSoon : ""}`}>
        <Image
          src={imageSrc}
          alt={`${title} project cover`}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {variant === "catalog" && (
          <Badge tone={isUnavailable ? "muted" : "neutral"} className={styles.statusBadge} label={statusLabel} />
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.headingRow}>
          <h3 className={styles.title}>{title}</h3>
          <span className={styles.role}>{role}</span>
        </div>
        {outcome && <p className={styles.proofLine}>{outcome}</p>}
        <div className={styles.tags}>
          {tags.map((tag) => (
            <Chip key={tag} variant="default" size="sm" className={styles.tag}>
              {tag}
            </Chip>
          ))}
        </div>
        <p className={styles.cardState}>
          {isUnavailable ? "Case study in progress" : "Read case study"}
          {!isUnavailable && <Icon name="arrow-right" size={16} />}
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
          {content}
        </div>
      </Tooltip>
    );
  }

  return (
    <AnimateIcon animateOnHover asChild>
      <Link href={`/projects/${slug}/`} className={styles.link}>
        {content}
      </Link>
    </AnimateIcon>
  );
}
