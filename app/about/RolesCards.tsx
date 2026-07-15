import { Badge, InfoCard, InfoCardGrid } from "@/components/ui";
import { roleCards } from "./aboutData";

export function RolesCards() {
  return (
    <InfoCardGrid>
      {roleCards.map((card) => {
        const badge = card.badge === "current"
          ? <Badge tone="success" dot label="Current" />
          : card.badge === "merged"
            ? <Badge tone="muted" icon="arrow-right" label="Merged into Adtraction" />
            : undefined;

        return (
          <InfoCard
            key={card.title}
            title={card.title}
            icon={card.icon}
            metadata={card.years}
            badge={badge}
            variant={card.badge === "current" ? "highlighted" : "default"}
          >
            <ul>{card.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </InfoCard>
        );
      })}
    </InfoCardGrid>
  );
}
