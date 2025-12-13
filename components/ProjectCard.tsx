"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardBody, Chip } from "@/components/ui";
import styles from "./ProjectCard.module.scss";

export interface ProjectCardProps {
  slug: string;
  title: string;
  summary: string;
  role: string;
  tags: string[];
  coverImage?: string;
}

export function ProjectCard({
  slug,
  title,
  summary,
  role,
  tags,
  coverImage,
}: ProjectCardProps) {
  return (
    <Link href={`/projects/${slug}/`} className={styles.link}>
      <Card isHoverable className={styles.card}>
        {coverImage && (
          <div className={styles.imageWrapper}>
            <Image
              src={coverImage}
              alt={`${title} project cover`}
              fill
              className={styles.image}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <CardBody className={styles.body}>
          <p className={styles.role}>{role}</p>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.summary}>{summary}</p>
          <div className={styles.tags}>
            {tags.slice(0, 3).map((tag) => (
              <Chip key={tag} variant="default">
                {tag}
              </Chip>
            ))}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

