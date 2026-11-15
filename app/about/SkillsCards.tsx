import { Reveal, stagger } from "@/components/Reveal";
import { SectionHeader } from "@/components/ui";
import { skillCards } from "./aboutData";
import styles from "./page.module.scss";

/** Skills as a ledger: sticky heading on the left, one ruled row per discipline on the right. */
export function SkillsCards() {
  return (
    <div className={styles.split}>
      <div className={styles.splitIntro}>
        <SectionHeader title="Skills" />
      </div>
      <Reveal className={styles.ledger}>
        {skillCards.map((card, index) => (
          <div key={card.title} className={`${styles.ledgerRow} reveal-item`} style={stagger(index)}>
            <h3 className={styles.ledgerTerm}>{card.title}</h3>
            <ul className={styles.ledgerItems}>
              {card.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </Reveal>
    </div>
  );
}
