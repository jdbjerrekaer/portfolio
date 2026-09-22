import { Card, Section, SectionHeader } from "@/components/ui";
import styles from "./Testimonials.module.scss";

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

// Consent ledger (audited 2026-09-22, verbal consent relayed by Jonatan, per person, dated):
// - Oscar Ternevid (2026-09-22), Johannes Pedersen, Kristoffer Hvitfeldt, Simon Knudsen, Frej Korsgaard (all: 2026-09-21): named quotes cleared.
// - Christian Longberg (2026-09-21): named quote cleared, title publicly verifiable (adtraction.com/about).
// - Max Bågling (2026-09-21): named quote cleared. Full name confirmed by Jonatan 2026-09-22.
// - External partner quotes: attributed by role + country + year only, never by name or company, per the partner-feedback corpus rules (private feedback emails).
// Quotes are trimmed verbatim units (sentence bounds only). No salary or exit-dispute context anywhere near these. No screenshots published.
const sourcedTestimonials: Testimonial[] = [
  {
    quote:
      "Having joined us as a Designer and subsequently stepping into his role as Product Design Engineer, he has demonstrated exceptional professional growth, deep platform expertise, and an outstanding eye for detail.",
    author: "Max Bågling",
    role: "Tech Lead",
    company: "Adtraction",
  },
  {
    quote:
      "We've learned a lot from you, and we'll try to continue on the path you've helped create.",
    author: "Christian Longberg",
    role: "CTO & Co-Founder",
    company: "Adtraction",
  },
  {
    quote:
      "Jonatan's Figma files are the ones I don't have to ask questions about. The details and layering are already resolved when they reach me.",
    author: "Oscar Ternevid",
    role: "Senior Software Developer",
    company: "Adtraction",
  },
  {
    quote:
      "It will be almost impossible to replace someone like you with the amount of system knowledge you have.",
    author: "Oscar Ternevid",
    role: "Senior Software Developer",
    company: "Adtraction",
  },
  {
    quote:
      "I've been looking around, and honestly, your platform is undoubtedly the best on the market, by far. And I've studied several.",
    author: "Affiliate partner",
    role: "Spain",
    company: "2026",
  },
  {
    quote:
      "First of all, I think the rework was really well done and an actual upgrade.",
    author: "Affiliate partner",
    role: "Germany",
    company: "2026",
  },
  {
    quote:
      "A great thing about how he works is how his designs are structured. It is easy for me as a developer to follow his idea of how the UI should be built and which components to use.",
    author: "Johannes Pedersen",
    role: "Software Developer",
    company: "Adtraction / Adservice",
  },
  {
    quote:
      "He has helped me better understand what makes a great interface, which helped me finish tasks faster and with fewer corrections.",
    author: "Kristoffer Hvitfeldt",
    role: "Developer",
    company: "Adservice / Adtraction",
  },
  {
    quote:
      "Jonatan is kind, transparent, and a really good team player. He is very good at both taking and giving feedback, and he is key to my own performance.",
    author: "Simon Knudsen",
    role: "Product Designer",
    company: "Adservice",
  },
  {
    quote:
      "Jonatan adapted quickly and helped get a strong design team up and running. He has delivered good results and is already off to a strong start on the new platform.",
    author: "Frej Korsgaard",
    role: "Engineering Manager",
    company: "Adtraction / Adservice",
  },
];

export function Testimonials({ testimonials = sourcedTestimonials }: { testimonials?: Testimonial[] }) {
  return (
    <Section variant="subtle" className={styles.testimonials}>
      <SectionHeader
        title="What People Say"
        description="Feedback from developers, designers, collaborators, and partners using the platform."
        variant="centered"
      />

      <div className={styles.grid}>
        {testimonials.map((testimonial) => (
          <Card key={testimonial.quote} variant="surface" className={styles.card}>
            <span className={styles.quoteIcon} aria-hidden="true">“</span>
            <p className={styles.quoteText}>{testimonial.quote}</p>
            <div className={styles.authorInfo}>
              <p className={styles.authorName}>{testimonial.author}</p>
              <p className={styles.authorRole}>
                {testimonial.role} <span className={styles.separator}>•</span> {testimonial.company}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
