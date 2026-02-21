import React from "react";
import Link from "next/link";
import { SFSymbol } from "@/components/ui/SFSymbol";
import { writingPosts } from "@/lib/content/writing";
import { Chip } from "@/components/ui/Chip";
import styles from "./WritingSection.module.scss";

export function WritingSection() {
  return (
    <section className={styles.writing}>
      <div className={styles.sectionHeader}>
        <h2>Writing & Thinking</h2>
        <p className={styles.subtitle}>
          How I approach complex technical problems and bridge the gap between design and engineering.
        </p>
      </div>

      <div className={styles.grid}>
        {writingPosts.map((post) => (
          <a
            key={post.url}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
          >
            <div className={styles.cardHeader}>
              <span className={styles.category}>{post.category}</span>
              <SFSymbol name="arrow.up.right" size={14} weight="medium" className={styles.icon} />
            </div>
            <h3 className={styles.title}>{post.title}</h3>
            <p className={styles.summary}>{post.summary}</p>
            <div className={styles.tags}>
              {post.tags.map((tag) => (
                <Chip key={tag}>{tag}</Chip>
              ))}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}