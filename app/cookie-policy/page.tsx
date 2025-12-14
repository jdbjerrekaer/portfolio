import type { Metadata } from "next";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Learn about how we use cookies on this website and manage your cookie preferences.",
};

export default function CookiePolicyPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1>Cookie Policy</h1>
        <p className={styles.intro}>
          This Cookie Policy explains how we use cookies and similar tracking
          technologies on our website. By using our website, you consent to the
          use of cookies as described in this policy.
        </p>
      </section>

      <section className={styles.content}>
        <div className={styles.section}>
          <h2>What Are Cookies?</h2>
          <p>
            Cookies are small text files that are placed on your device when you
            visit a website. They are widely used to make websites work more
            efficiently and provide information to website owners.
          </p>
        </div>

        <div className={styles.section}>
          <h2>How We Use Cookies</h2>
          <p>
            We use cookies to enhance your browsing experience, analyze site
            traffic, and understand how visitors interact with our website. We
            use the following types of cookies:
          </p>

          <div className={styles.cookieTypes}>
            <div className={styles.cookieType}>
              <h3>Necessary Cookies</h3>
              <p>
                These cookies are essential for the website to function properly.
                They enable core functionality such as security, network
                management, and accessibility. These cookies cannot be switched
                off in our systems.
              </p>
              <ul>
                <li>Session management</li>
                <li>Security features</li>
                <li>Cookie consent preferences</li>
              </ul>
            </div>

            <div className={styles.cookieType}>
              <h3>Analytics Cookies</h3>
              <p>
                These cookies help us understand how visitors interact with our
                website by collecting and reporting information anonymously. This
                helps us improve the website's functionality and user
                experience.
              </p>
              <ul>
                <li>Page views and navigation patterns</li>
                <li>Time spent on pages</li>
                <li>Traffic sources</li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Third-Party Cookies</h2>
          <p>
            We may use third-party services that set their own cookies. These
            services help us analyze website usage and improve our services:
          </p>
          <ul>
            <li>
              <strong>Microsoft Clarity:</strong> Used for website analytics
              and user behavior analysis
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>Managing Your Cookie Preferences</h2>
          <p>
            You can manage your cookie preferences at any time by clicking on
            the cookie icon in the bottom-right corner of the website. You can
            choose to accept or reject non-essential cookies.
          </p>
          <p>
            You can also control cookies through your browser settings. Most
            browsers allow you to refuse or accept cookies, and to delete
            cookies that have already been set. However, please note that
            blocking or deleting cookies may impact your experience on our
            website.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time to reflect
            changes in our practices or for other operational, legal, or
            regulatory reasons. Please revisit this page periodically to stay
            informed about our use of cookies.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Contact Us</h2>
          <p>
            If you have any questions about our use of cookies, please contact
            us at{" "}
            <a href="mailto:jonatanbjerrekaer@gmail.com">
              jonatanbjerrekaer@gmail.com
            </a>
            .
          </p>
        </div>

        <div className={styles.section}>
          <p className={styles.lastUpdated}>
            Last updated: {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </section>
    </div>
  );
}
