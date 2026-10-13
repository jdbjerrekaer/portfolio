import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArchivedArticleFrame } from "@/components/ArchivedArticleFrame";
import { ActionLink } from "@/components/ui";
import archive from "@/lib/content/adservice-archive.json";
import styles from "../../../projects/[slug]/page.module.scss";

type Slug = keyof typeof archive;

interface ArchivedArticlePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(archive).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ArchivedArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = archive[slug as Slug];
  return post ? { title: post.title, description: `Archived Adservice blog post, ${post.date}.` } : {};
}

export default async function ArchivedArticlePage({ params }: ArchivedArticlePageProps) {
  const { slug } = await params;
  const post = archive[slug as Slug];
  if (!post) notFound();

  const date = new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/" className={styles.breadcrumbLink}>Home</Link>
          <span className={styles.breadcrumbDivider}>/</span>
          <span className={styles.breadcrumbCurrent}>Adservice blog</span>
        </nav>

        <ActionLink href="/" variant="back" className={styles.backLink}>Back to Home</ActionLink>

        <div className={styles.meta}>
          <span className={styles.role}>{post.category}</span>
          <span className={styles.date}>{date}</span>
        </div>

        <h1 className={styles.title} lang={post.lang}>{post.title}</h1>
        <p className={styles.summary}>
          Written by me for the Adservice blog. Adservice has since merged into Adtraction and
          adservice.com is gone, so this is rebuilt from the{" "}
          <a href={post.wayback} target="_blank" rel="noreferrer">Internet Archive snapshot</a> and
          the original site&apos;s code.
          {post.imagesLost && " Some images from the original couldn't be recovered and are left out."}
        </p>
      </header>

      <ArchivedArticleFrame src={`../../../adservice-archive/${slug}/`} title={post.title} />
    </article>
  );
}
