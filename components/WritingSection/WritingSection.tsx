import { writingPosts } from "@/lib/content/writing";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Card, Chip, Icon, Section, SectionHeader } from "@/components/ui";
import styles from "./WritingSection.module.scss";

export function WritingSection() {
  return (
    <Section className={styles.writing}>
      <SectionHeader
        title="Writing & Thinking"
        description="How I approach complex technical problems and bridge the gap between design and engineering."
      />

      <div className={styles.grid}>
        {writingPosts.map((post) => (
          <AnimateIcon key={post.url} animateOnHover asChild>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.cardLink}
            >
              <Card variant="interactive" className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.category}>{post.category}</span>
                  <Icon name="arrow-up-right" size={16} className={styles.icon} />
                </div>
                <h3 className={styles.title}>{post.title}</h3>
                <p className={styles.summary}>{post.summary}</p>
                <div className={styles.tags}>
                  {post.tags.map((tag) => <Chip key={tag}>{tag}</Chip>)}
                </div>
              </Card>
            </a>
          </AnimateIcon>
        ))}
      </div>
    </Section>
  );
}
