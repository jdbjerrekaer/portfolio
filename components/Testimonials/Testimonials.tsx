import React from "react";
import styles from "./Testimonials.module.scss";
import { SFSymbol } from "@/components/ui/SFSymbol";

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

const placeholderTestimonials: Testimonial[] = [
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

export function Testimonials({ testimonials = placeholderTestimonials }: { testimonials?: Testimonial[] }) {
  return (
    <section className={styles.testimonials}>
      <div className={styles.sectionHeader}>
        <h2>What People Say</h2>
        <p className={styles.subtitle}>Feedback from developers, designers, and collaborators.</p>
      </div>

      <div className={styles.grid}>
        {testimonials.map((testimonial, index) => (
          <div key={index} className={styles.card}>
            <SFSymbol name="quote.opening" size={24} className={styles.quoteIcon} />
            <p className={styles.quoteText}>"{testimonial.quote}"</p>
            <div className={styles.authorInfo}>
              <p className={styles.authorName}>{testimonial.author}</p>
              <p className={styles.authorRole}>
                {testimonial.role} <span className={styles.separator}>•</span> {testimonial.company}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}