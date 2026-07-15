import type { IconName } from "@/components/ui/Icon";

export interface AboutCardData {
  title: string;
  icon: IconName;
  items: string[];
}

export interface RoleCardData extends AboutCardData {
  years: string;
  badge?: "current" | "merged";
}

export const backgroundCards: AboutCardData[] = [
  {
    title: "Education",
    icon: "book",
    items: [
      "BSc in Technical Interaction Design",
      "Aarhus University, graduated 2021",
      "HCI, UX, and interaction design",
    ],
  },
  {
    title: "What drives me",
    icon: "sparkles",
    items: [
      "Building coherent, scalable interfaces",
      "Balancing user needs with business goals",
      "Validating experiences through research",
    ],
  },
  {
    title: "Beyond work",
    icon: "heart",
    items: [
      "3D printing side projects",
      "Bareknuckle full contact karate",
      "Staying curious about tech trends",
      "Hanging out with friends (movies, eating out)",
      "Playing paddle tennis",
      "Date nights with my girlfriend",
    ],
  },
];

export const approachCards: AboutCardData[] = [
  {
    title: "Understand the problem",
    icon: "search",
    items: [
      "Synthesize customer feedback and product context",
      "Map workflows, constraints, and decision points",
      "Define clear UX and product success criteria",
    ],
  },
  {
    title: "Design close to implementation",
    icon: "chart",
    items: [
      "Prototype the flow before committing to detail",
      "Design with accessibility and technical feasibility in mind",
      "Work with developers while features are being built",
    ],
  },
  {
    title: "Protect product quality",
    icon: "users",
    items: [
      "Maintain design system and UI Toolkit standards",
      "QA shipped behavior against intended design",
      "Balance user clarity, business goals, and delivery constraints",
    ],
  },
];

export const skillCards: AboutCardData[] = [
  {
    title: "Design",
    icon: "brush",
    items: [
      "Product design, interaction design, and visual design",
      "Design systems, motion systems, and component quality",
      "Prototyping, accessibility, and usability testing",
      "Customer insight, journey mapping, and UX prioritization",
    ],
  },
  {
    title: "Development",
    icon: "code",
    items: [
      "React / Next.js, TypeScript",
      "SCSS, Tailwind, Design Tokens",
      "Design-to-code QA with engineering teams",
      "Storybook, UI Toolkit work, and component documentation",
    ],
  },
  {
    title: "Product work",
    icon: "wrench",
    items: [
      "Figma, FigJam, Git, and collaboration workflows",
      "Requirements, product feedback, and roadmap input",
      "Feature QA and production quality reviews",
      "Analytics, usability tooling, and design documentation",
    ],
  },
];

export const roleCards: RoleCardData[] = [
  {
    title: "Product Design Engineer, Adtraction",
    years: "2026 - Present",
    icon: "briefcase",
    badge: "current",
    items: [
      "Own product design across platform features from research and concept to high-fidelity design, implementation partnership, and QA",
      "Maintain the design system, motion system, and shared UI Toolkit quality with developers",
      "Partner with Product Management on requirements, roadmap input, and product quality in production",
      "Translate customer feedback and product insight into prioritized UX improvements",
    ],
  },
  {
    title: "UX Engineer, Adtraction",
    years: "2022 - 2026",
    icon: "briefcase",
    items: [
      "Designed and improved internal staff, partner, and brand tools",
      "Worked closely with engineering on implementation details, QA, and design-to-code handoff",
      "Shipped YADL, a Figma plugin now used by 400+ teams globally, with 60+ frequent daily users, to standardize design-system QA",
      "Contributed to LeadPlatform product work after Adservice merged into Adtraction",
    ],
  },
  {
    title: "Lead UI/UX Designer, Adservice",
    years: "2020 - 2022",
    icon: "briefcase",
    badge: "merged",
    items: [
      "Built and maintained design systems for 4 products",
      "Designed and coded Angular web experiences",
      "Led LeadPlatform — gamified lead generation product (quizzes, contests, calendars) used by brands to capture marketing leads",
      "Wrote technical guides that help partners integrate with our platform",
      "Improved email engagement (+22%) and lead generation",
    ],
  },
  {
    title: "UI/UX Associate, No Zebra",
    years: "2019 - 2020",
    icon: "briefcase",
    items: [
      "Conducted benchmarks and UX reviews",
      "Provided IT/system support",
      "Improved client UX through audits and recommendations",
    ],
  },
];
