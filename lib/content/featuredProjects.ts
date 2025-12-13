import { getFeaturedProjects, type Project } from "./projects";

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

/**
 * Get featured projects from the actual project files
 * This ensures featuredProjects stays in sync with content/projects
 */
export async function getFeaturedProjectsList(): Promise<FeaturedProject[]> {
  const projects = await getFeaturedProjects();
  
  return projects.map((project: Project): FeaturedProject => ({
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    role: project.role,
    tags: project.tags,
    coverImage: project.coverImage,
    date: project.date,
    featured: project.featured,
  }));
}
