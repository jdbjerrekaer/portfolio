"use client";

import Image from "next/image";
import Link from "next/link";
import type { PointerEvent } from "react";
import { motion, useMotionTemplate, useSpring } from "motion/react";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { ActionLink, Icon, Section, SectionHeader } from "@/components/ui";
import { Reveal, stagger } from "@/components/Reveal";
import { resolveAssetSrc } from "@/lib/utils/paths";
import styles from "./FeaturedWork.module.scss";

export interface FeaturedWorkItem {
  slug: string;
  title: string;
  role: string;
  outcome?: string;
  tags: string[];
  coverImage?: string;
  date: string;
  hasCaseStudy: boolean;
  comingSoon: boolean;
  liveDemo: boolean;
}

// Decorative cursor chip: a spring gives it a little weight instead of sticking to the pointer.
const CHIP_SPRING = { stiffness: 500, damping: 40, mass: 0.5 };

function ProjectRow({ project, index }: { project: FeaturedWorkItem; index: number }) {
  const x = useSpring(0, CHIP_SPRING);
  const y = useSpring(0, CHIP_SPRING);
  const chipTransform = useMotionTemplate`translate3d(${x}px, ${y}px, 0)`;
  const isAvailable = project.hasCaseStudy && !project.comingSoon;

  const follow = (event: PointerEvent<HTMLElement>, jump = false) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const nextX = event.clientX - rect.left;
    const nextY = event.clientY - rect.top;
    if (jump) {
      x.jump(nextX);
      y.jump(nextY);
    } else {
      x.set(nextX);
      y.set(nextY);
    }
  };

  const body = (
    <>
      <div className={styles.text}>
        <span className={`${styles.index} reveal-item`} style={stagger(0)}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className={`${styles.title} reveal-item`} style={stagger(1)}>
          {project.title}
        </h3>
        {project.outcome && (
          <p className={`${styles.outcome} reveal-item`} style={stagger(2)}>
            {project.outcome}
          </p>
        )}
        <dl className={`${styles.meta} reveal-item`} style={stagger(3)}>
          <dt>Role</dt>
          <dd>{project.role}</dd>
          <dt>Year</dt>
          <dd>{project.date.slice(0, 4)}</dd>
          <dt>Focus</dt>
          <dd>{project.tags.join(", ")}</dd>
        </dl>
        <div className="reveal-item" style={stagger(4)}>
          <span className={styles.cta}>
            {isAvailable ? "Read case study" : "Case study in progress"}
            {isAvailable && <Icon name="arrow-right" size={16} />}
          </span>
        </div>
      </div>

      <div
        className={styles.media}
        onPointerEnter={(event) => follow(event, true)}
        onPointerMove={follow}
      >
        <div className={styles.mediaInner}>
          {project.coverImage && (
            <Image
              src={resolveAssetSrc(project.coverImage)}
              alt={`${project.title} project cover`}
              fill
              className={styles.image}
              sizes="(max-width: 800px) 100vw, 58vw"
            />
          )}
        </div>
        {project.liveDemo && isAvailable && (
          <span className={styles.live}>
            <span className={styles.liveDot} aria-hidden="true" />
            Live demo
          </span>
        )}
        {isAvailable && (
          <motion.span className={styles.chip} style={{ transform: chipTransform }} aria-hidden="true">
            <span className={styles.chipInner}>
              View case study
              <Icon name="arrow-right" size={14} />
            </span>
          </motion.span>
        )}
      </div>
    </>
  );

  return (
    <Reveal as="li" className={styles.row}>
      {isAvailable ? (
        <AnimateIcon animateOnHover asChild>
          <Link href={`/projects/${project.slug}/`} className={styles.rowLink}>
            {body}
          </Link>
        </AnimateIcon>
      ) : (
        <div className={styles.rowLink}>{body}</div>
      )}
    </Reveal>
  );
}

/** The editorial project rows on their own, for pages that bring their own header. */
export function ProjectRowList({ projects }: { projects: FeaturedWorkItem[] }) {
  return (
    <ol className={styles.list}>
      {projects.map((project, index) => (
        <ProjectRow key={project.slug} project={project} index={index} />
      ))}
    </ol>
  );
}

export function FeaturedWork({ projects }: { projects: FeaturedWorkItem[] }) {
  return (
    <Section variant="subtle" className={styles.featured}>
      <SectionHeader
        title="Featured projects"
        variant="split"
        action={<ActionLink href="/projects/" icon="folder">View all projects</ActionLink>}
      />
      <ProjectRowList projects={projects} />
    </Section>
  );
}
