import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { z } from "zod";

// Define the project frontmatter schema
const projectSchema = z.object({
  title: z.string(),
  summary: z.string(),
  date: z.string(),
  role: z.string(),
  tags: z.array(z.string()),
  links: z.record(z.string(), z.string()).optional(),
  coverImage: z.string().optional(),
  featured: z.boolean().optional().default(false),
});

export type ProjectFrontmatter = z.infer<typeof projectSchema>;

export interface Project extends ProjectFrontmatter {
  slug: string;
  content: string;
}

const PROJECTS_DIR = path.join(process.cwd(), "content/projects");

/**
 * Get all project slugs for static generation
 */
export async function getProjectSlugs(): Promise<string[]> {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(PROJECTS_DIR);
  return files
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

/**
 * Get a single project by slug
 */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const filePath = path.join(PROJECTS_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  // Validate frontmatter
  const parseResult = projectSchema.safeParse(data);

  if (!parseResult.success) {
    console.error(`Invalid frontmatter in ${slug}.mdx:`, parseResult.error);
    return null;
  }

  return {
    ...parseResult.data,
    slug,
    content,
  };
}

/**
 * Get all projects, sorted by date (newest first)
 */
export async function getAllProjects(): Promise<Project[]> {
  const slugs = await getProjectSlugs();
  const projects: Project[] = [];

  for (const slug of slugs) {
    const project = await getProjectBySlug(slug);
    if (project) {
      projects.push(project);
    }
  }

  // Sort by date, newest first
  return projects.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * Get featured projects
 */
export async function getFeaturedProjects(): Promise<Project[]> {
  const projects = await getAllProjects();
  const featured = projects.filter((project) => project.featured);
  
  // Sort featured projects by date (newest first)
  return featured.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * Check if a project has a case study (has meaningful content)
 */
export function hasCaseStudy(project: Project): boolean {
  const trimmedContent = project.content.trim();
  // Consider it a case study if content exists and is more than just whitespace/newlines
  return trimmedContent.length > 0 && trimmedContent.length > 50;
}

