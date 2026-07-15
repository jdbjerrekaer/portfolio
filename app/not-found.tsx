import { NotFoundContent } from "@/components/NotFoundContent";
import { Metadata } from "next";
import { Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <Section width="content">
      <NotFoundContent />
    </Section>
  );
}
