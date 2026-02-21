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
    quote: "Jonatan is that rare breed of designer who actually understands how things are built. His Figma files are structured like codebases, making the handoff process seamless.",
    author: "Developer Colleague",
    role: "Senior Frontend Engineer",
    company: "Current Company",
  },
  {
    quote: "YADL has completely transformed our design system maintenance. It's the exact tool we needed to keep our sprawling component libraries in check.",
    author: "Figma Community User",
    role: "Product Designer",
    company: "Global Financial Institution",
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