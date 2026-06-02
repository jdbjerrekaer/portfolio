import { MDXRemote } from "next-mdx-remote/rsc";
import { ComponentProps } from "react";
import type React from "react";
import Image from "next/image";
import { withBasePath } from "@/lib/utils/paths";

function getTextFromNode(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getTextFromNode).join("");
  }

  return "";
}

function slugifyHeading(children: React.ReactNode) {
  return getTextFromNode(children)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Custom components for MDX
const components = {
  // Override default elements with custom styling if needed
  h2: (props: ComponentProps<"h2">) => (
    <h2 {...props} id={props.id ?? slugifyHeading(props.children)} className="scroll-mt-20" />
  ),
  h3: (props: ComponentProps<"h3">) => (
    <h3 {...props} id={props.id ?? slugifyHeading(props.children)} className="scroll-mt-20" />
  ),
  a: (props: ComponentProps<"a">) => (
    <a {...props} target={props.href?.startsWith("http") ? "_blank" : undefined} rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined} />
  ),
  img: (props: ComponentProps<"img">) => {
    // Handle Next.js Image component for local images
    if (typeof props.src === "string" && props.src.startsWith("/")) {
      return (
        <div className="my-8 rounded-lg overflow-hidden">
          <Image
            src={withBasePath(props.src)}
            alt={props.alt || ""}
            width={1200}
            height={675}
            className="w-full h-auto"
          />
        </div>
      );
    }
    // Fallback to regular img for external images
    return <img {...props} alt={props.alt || ""} className="my-8 rounded-lg w-full h-auto" />;
  },
  // Use <ProjectVideo src="/projects/.../demo.mp4" /> in MDX rather than a raw
  // <video><source/></video>. Lowercase HTML elements written literally in MDX
  // compile to plain intrinsic tags and bypass this components map, so a custom
  // (capitalized) component is the only reliable way to apply withBasePath() —
  // required for assets to resolve under the GitHub Pages basePath (/portfolio).
  ProjectVideo: ({ src, className, ...props }: ComponentProps<"video">) => (
    <div className="my-8 rounded-lg overflow-hidden bg-[var(--color-background-secondary)] shadow-md">
      <video
        {...props}
        src={typeof src === "string" && src.startsWith("/") ? withBasePath(src) : src}
        className={`w-full h-auto ${className || ""}`}
        controls={props.controls ?? true}
        playsInline={props.playsInline ?? true}
        preload={props.preload ?? "metadata"}
      />
    </div>
  ),
};

interface MdxContentProps {
  source: string;
}

export function MdxContent({ source }: MdxContentProps) {
  return (
    <div className="prose">
      <MDXRemote source={source} components={components} />
    </div>
  );
}
