import Link from "next/link";
import styles from "./SiteFooter.module.scss";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.copyright}>
          © {currentYear} Jonatan Daugbjerg Bjerrekær. All rights reserved.
        </p>
        <nav className={styles.links} aria-label="Footer links">
          <Link href="/projects" className={styles.link}>
            Projects
          </Link>
          <Link href="/about" className={styles.link}>
            About
          </Link>
          <Link href="/cookie-policy" className={styles.link}>
            Cookie Policy
          </Link>
          <a
            href="mailto:jonatanbjerrekaer@gmail.com"
            className={styles.link}
          >
            Email
          </a>
          <a
            href="https://www.linkedin.com/in/jonatandbjerrek%C3%A6r"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            LinkedIn
          </a>
          <a
            href="https://github.com/jdbjerrekaer"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}

