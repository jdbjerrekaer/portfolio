import styles from "./SiteFooter.module.scss";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.copyright}>
          © {currentYear} Portfolio. All rights reserved.
        </p>
        <nav className={styles.links} aria-label="Footer links">
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
          <a
            href="mailto:jonatanbjerrekaer@gmail.com"
            className={styles.link}
          >
            Email
          </a>
        </nav>
      </div>
    </footer>
  );
}

