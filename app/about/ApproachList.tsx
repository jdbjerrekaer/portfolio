import { InfoCard, InfoCardGrid } from "@/components/ui";
import { approachCards } from "./aboutData";

export function ApproachList() {
  return (
    <InfoCardGrid>
      {approachCards.map((card) => (
        <InfoCard key={card.title} title={card.title} icon={card.icon}>
          <ul>{card.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </InfoCard>
      ))}
    </InfoCardGrid>
  );
}
