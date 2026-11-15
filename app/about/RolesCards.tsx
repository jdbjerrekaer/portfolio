import { Reveal, stagger } from "@/components/Reveal";
import { SectionHeader } from "@/components/ui";
import { roleCards } from "./aboutData";
import styles from "./page.module.scss";

/** Recent roles as a CV ledger: years on the left, role and what I did on the right. */
export function RolesCards() {
  return (
    <div className={styles.split}>
      <div className={styles.splitIntro}>
        <SectionHeader title="Recent roles" />
      </div>
      <Reveal as="ol" className={styles.roles}>
        {roleCards.map((card, index) => {
          const [role, company] = card.title.split(", ");
          return (
            <li key={card.title} className={`${styles.role} reveal-item`} style={stagger(index)}>
              <span className={styles.roleYears}>{card.years.replace(" - ", "–")}</span>
              <div>
                <h3 className={styles.roleTitle}>{role}</h3>
                <p className={styles.roleCompany}>
                  {company}
                  {card.badge === "current" && (
                    <span className={styles.current}>
                      <span className={styles.currentDot} aria-hidden="true" />
                      Current
                    </span>
                  )}
                  {card.badge === "merged" && <span className={styles.merged}>Merged into Adtraction</span>}
                </p>
                <ul className={styles.roleItems}>
                  {card.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </li>
          );
        })}
      </Reveal>
    </div>
  );
}
