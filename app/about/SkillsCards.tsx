import { InfoCard, InfoCardGrid } from "@/components/ui";
import { skillCards } from "./aboutData";

export function SkillsCards() {
  return (
    <InfoCardGrid>
      {skillCards.map((card) => (
        <InfoCard key={card.title} title={card.title} icon={card.icon}>
          <ul>{card.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </InfoCard>
      ))}
    </InfoCardGrid>
  );
}
