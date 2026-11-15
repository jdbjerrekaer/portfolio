import { Reveal, stagger } from "@/components/Reveal";
import { approachCards } from "./aboutData";
import styles from "./page.module.scss";

export function ApproachList() {
  return (
    <Reveal as="ol" className={styles.steps}>
      {approachCards.map((card, index) => (
        <li key={card.title} className={`${styles.step} reveal-item`} style={stagger(index)}>
          <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
          <h3>{card.title}</h3>
          <ul className={styles.plainList}>
            {card.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </li>
      ))}
    </Reveal>
  );
}
