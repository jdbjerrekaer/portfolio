export interface FeaturedProject {
  slug: string;
  title: string;
  summary: string;
  role: string;
  tags: string[];
  coverImage?: string;
  date: string;
  featured: boolean;
}

export const featuredProjects: FeaturedProject[] = [
  {
    slug: "figma-component-library",
    title: "Figma Design Component Library",
    summary: "A comprehensive design system and component library built in Figma, establishing consistent design patterns and reusable components for scalable product development.",
    role: "Design Engineer",
    tags: ["Figma", "Design System", "Component Library", "UI Design", "Design Systems"],
    coverImage: undefined, // Placeholder will be used
    date: "2024-01-01",
    featured: true,
  },
  {
    slug: "yadl",
    title: "YADL",
    summary: "A Figma plugin that streamlines design workflow automation and enhances UI system consistency.",
    role: "Design Engineer",
    tags: ["Figma Plugin", "Workflow Automation", "UI Systems", "Design Tools"],
    coverImage: undefined, // Placeholder will be used
    date: "2024-01-01",
    featured: true,
  },
  {
    slug: "affiliate-marketing-mobile",
    title: "Affiliate Marketing on the Go",
    summary: "Mobile application for affiliate marketers to track campaigns, manage partnerships, and monitor performance on the go.",
    role: "UX/UI Designer",
    tags: ["Mobile App", "Marketing", "Analytics", "iOS", "Android"],
    coverImage: undefined,
    date: "2024-02-01",
    featured: true,
  },
  {
    slug: "affiliate-marketing-web",
    title: "Affiliate Marketing in the Office",
    summary: "Web-based dashboard for managing affiliate programs, tracking conversions, and analyzing marketing performance.",
    role: "Design Engineer",
    tags: ["Web App", "Dashboard", "Sales Operations", "Data Visualization"],
    coverImage: undefined,
    date: "2024-03-01",
    featured: true,
  },
];
