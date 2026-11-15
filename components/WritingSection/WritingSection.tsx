import { writingPosts, type WritingPost } from "@/lib/content/writing";
import { resolveAssetSrc } from "@/lib/utils/paths";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Icon, Section, SectionHeader } from "@/components/ui";
import { Reveal, stagger } from "@/components/Reveal";
import styles from "./WritingSection.module.scss";

const sentenceCase = (text: string) => text.charAt(0) + text.slice(1).toLowerCase();

export function WritingSection() {
  const groups = writingPosts.reduce<Record<string, WritingPost[]>>((acc, post) => {
    (acc[post.category] ??= []).push(post);
    return acc;
  }, {});

  return (
    <Section className={styles.writing} innerClassName={styles.layout}>
      <div className={styles.intro}>
        <SectionHeader
          title="Technical guides I wrote for Adservice partners"
          description="Implementation guides for tracking, integrations and campaign tooling, written for partners wiring the platform up themselves."
        />
      </div>

      <div className={styles.groups}>
        {Object.entries(groups).map(([category, posts]) => (
          <Reveal key={category} className={styles.group}>
            <h3 className={`${styles.groupTitle} reveal-item`}>
              {sentenceCase(category)}
              <span className={styles.count}>{String(posts.length).padStart(2, "0")}</span>
            </h3>
            <ul className={styles.items}>
              {posts.map((post, index) => (
                <li key={post.url} className={`${styles.item} reveal-item`} style={stagger(index + 1)}>
                  <AnimateIcon animateOnHover asChild>
                    <a href={resolveAssetSrc(post.url)} className={styles.link}>
                      <span className={styles.itemTitle} lang={post.lang}>
                        {post.title}
                      </span>
                      <span className={styles.summary}>{post.summary}</span>
                      <span className={styles.itemMeta}>
                        {post.tags.join(" · ")}
                        {post.lang === "da" && <span className={styles.lang}>In Danish</span>}
                      </span>
                      <span className={styles.arrow} aria-hidden="true">
                        <Icon name="arrow-right" size={16} />
                      </span>
                    </a>
                  </AnimateIcon>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
