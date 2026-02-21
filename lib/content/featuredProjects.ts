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
  
  const mapped = projects.map((project: Project): FeaturedProject => ({
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    role: project.role,
    tags: project.tags,
    coverImage: project.coverImage,
    date: project.date,
    featured: project.featured,
  }));

  // Prioritize specific projects for the featured section
  const priorityOrder = ["yadl", "countdown", "iriz", "figma-component-library"];
  
  return mapped.sort((a, b) => {
    const indexA = priorityOrder.indexOf(a.slug);
    const indexB = priorityOrder.indexOf(b.slug);
    
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    return 0; // Maintain original date-based sorting for the rest
  });
}
